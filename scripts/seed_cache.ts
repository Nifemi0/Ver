import dotenv from "dotenv";
dotenv.config();

import { VerClient } from "../src/sdk/client";

const client = new VerClient();

// X Layer Mainnet verified contracts for the demo.
// Warm these so live MCP / dashboard queries do not depend on a cold Blockscout round-trip on stage.
const TARGET_ADDRESSES: Record<string, string> = {
  USDT: "0x1E4a5963aBFD975d8c9021ce480b42188849D41d",
  USDC: "0x74b7f16337b8972027f6196a17a631ac6de26d22",
  WETH: "0x5a77f1443d16ee5761d310e38b62f77f726bc71c",
};

async function seed() {
  console.log("Seeding Ver Cache for X Layer Demo...");
  console.log(`Contracts: ${Object.keys(TARGET_ADDRESSES).join(", ")}\n`);

  let ok = 0;
  let failed = 0;

  for (const [name, address] of Object.entries(TARGET_ADDRESSES)) {
    try {
      console.log(`Compiling ${name} (${address})...`);
      const graph = await client.getProtocolGraph(address, true); // forceRefresh=true
      const roles = graph.structural?.roles?.length ?? 0;
      const events = graph.structural?.events?.length ?? 0;
      const priv = graph.security?.privileged_functions?.length ?? 0;
      console.log(
        `✅ Cached ${name} — roles=${roles} events=${events} privileged=${priv} integrity=${graph.semantic?.structural_integrity_score ?? "?"}`
      );
      ok++;
    } catch (e: any) {
      console.error(`❌ Failed to cache ${name}: ${e.message}`);
      failed++;
    }
  }

  console.log(`\nSeeding complete. ok=${ok} failed=${failed}. Cache is warm.`);
  if (failed > 0) process.exitCode = 1;
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
