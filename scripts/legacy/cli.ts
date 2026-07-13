#!/usr/bin/env node
import { HashGraphClient } from './src/sdk/client';

async function main() {
    const args = process.argv.slice(2);
    const command = args[0];
    const address = args[1];

    if (!command || command === '--help' || command === '-h') {
        console.log(`
HashGraph CLI - The Semantic Layer for HashKey Chain

Usage:
  npx @hashkey/hashgraph-cli <command> [options]

Commands:
  analyze <address>   Compiles a contract into a deterministic Protocol Graph

Example:
  npx @hashkey/hashgraph-cli analyze 0x4200000000000000000000000000000000000015
`);
        process.exit(0);
    }

    if (command === 'analyze') {
        if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
            console.error("Error: Please provide a valid 0x smart contract address.");
            process.exit(1);
        }

        console.log(`\n> Initializing HashGraph Engine...`);
        console.log(`> Target: ${address}\n`);

        try {
            const client = new HashGraphClient();
            
            // Artificial delay for visual terminal effect
            console.log(`[1/4] Fetching verified ABI and bytecode...`);
            await new Promise(r => setTimeout(r, 600));
            console.log(`[2/4] Resolving proxy implementations...`);
            await new Promise(r => setTimeout(r, 600));
            console.log(`[3/4] Extracting deterministic structural facts...`);
            await new Promise(r => setTimeout(r, 800));
            console.log(`[4/4] Applying semantic enrichment layer...`);
            
            const graph = await client.getProtocolGraph(address);
            
            console.log(`\n==== PROTOCOL GRAPH BUILT ====\n`);
            console.log(JSON.stringify(graph, null, 2));
            console.log(`\n==============================\n`);
            process.exit(0);
        } catch (error: any) {
            console.error(`\n[!] Compilation Failed: ${error.message}`);
            process.exit(1);
        }
    } else {
        console.error(`Unknown command: ${command}`);
        console.error(`Run with --help for usage.`);
        process.exit(1);
    }
}

main();
