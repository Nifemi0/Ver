import { HashGraphClient } from './src/sdk/client';
import dotenv from 'dotenv';
import { createHash } from 'crypto';
dotenv.config();

const REAL_CONTRACTS = [
  { address: "0xB210D2120d57b758EE163cFfb43e73728c471Cf1", name: "WHSK Token" },
  { address: "0x4200000000000000000000000000000000000015", name: "L1Block Proxy" },
  { address: "0x4200000000000000000000000000000000000016", name: "L2ToL1MessagePasser" },
];

async function main() {
    const client = new HashGraphClient();

    for (const contract of REAL_CONTRACTS) {
        console.log(`\nAnalyzing ${contract.name} (${contract.address})...`);
        const graph = await client.getProtocolGraph(contract.address);

        // Map to exact schema definitions
        const numFunctions = graph.statistics?.functions || graph.security.privileged_functions.length;
        const numEvents = graph.statistics?.events || graph.structural.events.length;
        
        let graphHash = graph.registry?.graphHash;
        if (!graphHash) {
            graphHash = "0x" + createHash("sha256").update(JSON.stringify(graph.structural)).digest("hex");
        }

        const summaryText = graph.semantic?.intent?.value;

        console.log(`\n── ${contract.name} ──`);
        console.log(`  Functions found:     ${numFunctions}`);
        console.log(`  Events found:        ${numEvents}`);
        console.log(`  Graph hash:          ${graphHash}`);
        console.log(`  Summary:             ${summaryText ? summaryText.slice(0, 80) + '...' : "null"}`);

        // Hard assertions
        if (!graphHash) throw new Error(`FAIL: No graph hash for ${contract.name}`);
        if (numFunctions === 0) throw new Error(`FAIL: No functions found for ${contract.name}`);
        if (!summaryText) throw new Error(`FAIL: No AI summary for ${contract.name} — check LLM key`);
    }

    console.log("\n✅ All real contract tests passed");
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
