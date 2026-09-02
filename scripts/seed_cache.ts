import dotenv from "dotenv";
dotenv.config();

import { VerClient } from "../src/sdk/client";

const client = new VerClient();

// Verified BOT Chain contracts used by the wallet and registry demos.
const TARGET_ADDRESSES: Record<string, string> = {
  PRWA: "0x922835859623d6F3b99a2742D585E093bBA0a740",
  VER_REGISTRY_V2: "0xfEB4423E669a0e160b316a8Ca46D8Ca70eB2A4F5",
};

async function seed() {
  console.log("Seeding Ver cache for BOT Chain...");
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
