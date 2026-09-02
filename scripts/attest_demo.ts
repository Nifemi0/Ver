/**
 * Attest the PRWA protocol graph in the BOT Chain VerRegistry v2.
 * Usage: VER_ENABLE_WRITES=true npx tsx scripts/attest_demo.ts
 */
import dotenv from "dotenv";
dotenv.config();

import crypto from "crypto";
import { VerClient } from "../src/sdk/client";
import { lookupGraph, registerGraph } from "../src/chain/registry";

const PRWA = "0x922835859623d6F3b99a2742D585E093bBA0a740";
const METADATA_URI =
  "https://verprotocol.vercel.app/explorer.html#0x922835859623d6F3b99a2742D585E093bBA0a740";

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
  console.log("Compiling PRWA protocol graph on BOT Chain…");
  const graph = await client.getProtocolGraph(PRWA, true);
  const graphHash = computeGraphHash(graph, PRWA);
  console.log("graphHash:", graphHash);

  const existing = await lookupGraph(PRWA);
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

  console.log("Registering attestation on BOT Chain testnet…");
  const txHash = await registerGraph(PRWA, graphHash, METADATA_URI);
  if (!txHash) {
    console.error("registerGraph returned null — check VER_ENABLE_WRITES, ATTESTER_PRIVATE_KEY, authorization, and gas");
    process.exit(1);
  }
  console.log("tx:", txHash);
  console.log("explorer:", `https://scan.bohr.life/tx/${txHash}`);

  // brief wait then re-read
  await new Promise((r) => setTimeout(r, 4000));
  const after = await lookupGraph(PRWA);
  console.log("post-attest lookup:", after);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
