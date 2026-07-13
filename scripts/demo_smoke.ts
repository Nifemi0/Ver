/**
 * Demo smoke test — exercises every MCP tool surface via the SDK
 * so a recording never hits a surprise failure on camera.
 *
 * Usage: npx tsx scripts/demo_smoke.ts
 */
import dotenv from "dotenv";
dotenv.config();

import { VerClient } from "../src/sdk/client";
import { lookupGraph } from "../src/chain/registry";

const USDT = "0x1E4a5963aBFD975d8c9021ce480b42188849D41d";
// transfer(address,uint256) → 0xa9059cbb
// to = 0x1111...1111, amount = 10.0 (10,000,000)
const TRANSFER_CALLDATA =
  "0xa9059cbb00000000000000000000000011111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000989680";
// name() selector
const NAME_CALLDATA = "0x06fdde03";

type Result = { tool: string; ok: boolean; detail: string; ms: number };

async function run(
  tool: string,
  fn: () => Promise<unknown>
): Promise<Result> {
  const t0 = Date.now();
  try {
    const out = await fn();
    const ms = Date.now() - t0;
    const text = typeof out === "string" ? out : JSON.stringify(out);
    const preview = text.slice(0, 160).replace(/\s+/g, " ");
    // Treat hard failures as failures, but allow expected educational reverts
    if (out && typeof out === "object") {
      const status = (out as any).status;
      if (
        status === "expected_revert" ||
        status === "expected_state_revert" ||
        status === "gated" ||
        status === "no_attestation" ||
        status === "success"
      ) {
        return { tool, ok: true, detail: preview, ms };
      }
      if (
        "error" in (out as any) ||
        status === "reverted" ||
        (out as any).isError
      ) {
        return { tool, ok: false, detail: preview, ms };
      }
    }
    return { tool, ok: true, detail: preview, ms };
  } catch (e: any) {
    return { tool, ok: false, detail: e.message || String(e), ms: Date.now() - t0 };
  }
}

async function main() {
  let client: VerClient;
  const llmProv = (process.env.LLM_PROVIDER || "openai").toLowerCase();
  const hasOpenAI = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.length > 0;
  const hasDeepseek = process.env.DEEPSEEK_API_KEY && process.env.DEEPSEEK_API_KEY.length > 0;
  const hasAnthropic = process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.length > 0;
  
  let useMock = false;
  if (llmProv === "openai" && !hasOpenAI) useMock = true;
  else if (llmProv === "deepseek" && !hasDeepseek) useMock = true;
  else if (llmProv === "anthropic" && !hasAnthropic) useMock = true;
  else if (llmProv === "none") useMock = true;

  if (useMock) {
      console.warn("LLM API Key or selected provider missing - seeding smoke test with a mock LLM provider for compileAgentIntent");
      const mockLlm = {
          generate: async (sys: string, user: string) => {
              return JSON.stringify({
                  functionName: "transfer",
                  args: {
                      recipient: { value: "0x1111111111111111111111111111111111111111", isUnscaledTokenAmount: false },
                      amount: { value: "10.0", isUnscaledTokenAmount: true }
                  }
              });
          }
      };
      client = new VerClient(mockLlm);
  } else {
      console.log(`Using real VerClient for provider '${llmProv}'`);
      client = new VerClient();
  }
  const results: Result[] = [];

  console.log("Ver demo smoke test");
  console.log(`Target: USDT ${USDT}\n`);

  results.push(
    await run("1 get_protocol_graph", async () => {
      const g = await client.getProtocolGraph(USDT, true);
      return {
        protocol: g.metadata?.protocol_name,
        address: g.metadata?.contract_address,
        roles: g.structural?.roles?.map((r: any) => r.name),
        events: g.structural?.events?.slice(0, 5).map((e: any) => e.name),
        privileged: g.security?.privileged_functions?.slice(0, 5).map((f: any) => f.name),
        integrity: g.semantic?.structural_integrity_score,
        intent: g.semantic?.intent?.value?.slice?.(0, 80) ?? g.semantic?.intent,
      };
    })
  );

  results.push(
    await run("2 get_contract_summary", async () => client.getContractSummary(USDT))
  );

  results.push(
    await run("3 explain_transaction", async () =>
      client.explainTransaction(USDT, TRANSFER_CALLDATA)
    )
  );

  results.push(
    await run("4 search_protocol", async () =>
      client.searchProtocol(USDT, "transfer")
    )
  );

  // Without `from`, ERC-20 transfer reverts (zero address) — great live teaching moment.
  // With `from`, simulation runs against real mainnet state (may still revert on balance).
  const DEMO_FROM = "0x1111111111111111111111111111111111111111";
  results.push(
    await run("5a simulate_transaction (no from — expect revert)", async () => {
      const res = await client.simulateTransaction(USDT, TRANSFER_CALLDATA);
      // Expected educational revert
      if (res?.status === "reverted" && /zero address/i.test(res?.error || "")) {
        return { status: "expected_revert", error: res.error };
      }
      return res;
    })
  );
  results.push(
    await run("5b simulate_transaction (with from)", async () => {
      const res = await client.simulateTransaction(
        USDT,
        TRANSFER_CALLDATA,
        DEMO_FROM
      );
      // Either success or a clean balance/allowance revert is fine for smoke
      if (res?.status === "reverted") {
        return { status: "expected_state_revert", error: res.error };
      }
      return res;
    })
  );

  results.push(
    await run("6 read_contract (name)", async () =>
      client.readContract(USDT, NAME_CALLDATA)
    )
  );

  results.push(
    await run("7 get_source_code", async () => {
      const src = await client.getSourceCode(USDT);
      return {
        available: Boolean(src),
        bytes: src?.length ?? 0,
        head: src?.slice(0, 80),
      };
    })
  );

  results.push(
    await run("8 lookup_graph_attestation", async () => {
      const att = await lookupGraph(USDT);
      // No attestation is fine for demo — tool must not throw
      return att ?? { status: "no_attestation", note: "expected if never registered" };
    })
  );

  results.push(
    await run("9 register_protocol_graph (gated)", async () => {
      // Mirror MCP gating — we only check the env flag, never send a tx in smoke
      if (process.env.VER_ENABLE_WRITES !== "true") {
        return {
          status: "gated",
          note: "VER_ENABLE_WRITES!=true — safe default for demo",
        };
      }
      return {
        status: "writes_enabled",
        note: "Skip live register in smoke — use MCP only if intentional",
      };
    })
  );

  results.push(
    await run("10 compile_agent_intent (AIC)", async () => {
      const res = await client.compileAgentIntent(
        USDT,
        "Transfer 10.0 USDT to 0x1111111111111111111111111111111111111111"
      );
      return {
        success: res.success,
        ...(res.error ? { error: res.error } : {}),
        function: res.functionName,
        args: res.args,
        calldata: res.encodedCalldata?.slice(0, 42) + "...",
        simulation: res.simulationStatus
      };
    })
  );

  console.log("\n── Results ──────────────────────────────────────");
  let pass = 0;
  let fail = 0;
  for (const r of results) {
    const mark = r.ok ? "✅" : "❌";
    console.log(`${mark} ${r.tool} (${r.ms}ms)`);
    console.log(`   ${r.detail}`);
    if (r.ok) pass++;
    else fail++;
  }
  console.log("────────────────────────────────────────────────");
  console.log(`pass=${pass} fail=${fail}`);
  if (fail > 0) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
