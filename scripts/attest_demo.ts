/**
 * Attest the CELA protocol graph on X Layer Mainnet VerRegistry.
 * Usage: VER_ENABLE_WRITES=true npx tsx scripts/attest_demo.ts
 */
import dotenv from "dotenv";
dotenv.config();

import crypto from "crypto";
import { VerClient } from "../src/sdk/client";
import { lookupGraph, registerGraph } from "../src/chain/registry";

const USDT = "0x1E4a5963aBFD975d8c9021ce480b42188849D41d";
const METADATA_URI =
  "https://xlayer-delta.vercel.app/explorer.html#0x1E4a5963aBFD975d8c9021ce480b42188849D41d";

function computeGraphHash(graph: any, address: string): string {
  const hashInput = JSON.stringify({
    address: address.toLowerCase(),
    roles: graph.structural.roles,
    events: graph.structural.events,
    dependencies: graph.structural.dependencies,
    functions: graph.security.privileged_functions,
  });
  return "0x" + crypto.createHash("sha256").update(hashInput).digest("hex");
}

async function main() {
  const client = new VerClient();
  console.log("Compiling USDT protocol graph…");
  const graph = await client.getProtocolGraph(USDT, true);
  const graphHash = computeGraphHash(graph, USDT);
  console.log("graphHash:", graphHash);

  const existing = await lookupGraph(USDT);
  console.log("existing attestation:", existing);

  const ZERO =
    "0x0000000000000000000000000000000000000000000000000000000000000000";
  if (
    existing?.verified &&
    existing.graphHash &&
    existing.graphHash !== ZERO
  ) {
    console.log("Already attested — skipping write.");
    return;
  }

  console.log("Registering attestation on X Layer Mainnet…");
  const txHash = await registerGraph(USDT, graphHash, METADATA_URI);
  if (!txHash) {
    console.error("registerGraph returned null — check DEPLOYER_PRIVATE_KEY / auth / gas");
    process.exit(1);
  }
  console.log("tx:", txHash);
  console.log("explorer:", `https://www.oklink.com/xlayer/tx/${txHash}`);

  // brief wait then re-read
  await new Promise((r) => setTimeout(r, 4000));
  const after = await lookupGraph(USDT);
  console.log("post-attest lookup:", after);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
