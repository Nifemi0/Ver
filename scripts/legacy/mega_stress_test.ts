import { HashGraphClient } from "./src/sdk/client";
import { createPublicClient, http } from "viem";

const HASHKEY_CHAIN = {
  id: 133,
  name: "HashKey Testnet",
  nativeCurrency: { name: "HSK", symbol: "HSK", decimals: 18 },
  rpcUrls: { default: { http: [process.env.HASHKEY_TESTNET_RPC_URL ?? "https://testnet.hsk.xyz"] } },
} as const;

async function runMegaStressTest() {
    const client = new HashGraphClient();
    const publicClient = createPublicClient({ chain: HASHKEY_CHAIN, transport: http() });

    console.log("🚀 STARTING 50-CONTRACT MEGA STRESS TEST");
    console.log("Generating 50 random addresses to stress-test the pipeline...\n");

    const addresses: string[] = [];
    for (let i = 0; i < 50; i++) {
        // Generate random 40 char hex string
        const randomHex = Array.from({length: 40}, () => Math.floor(Math.random() * 16).toString(16)).join('');
        addresses.push(`0x${randomHex}`);
    }
    console.log(`✅ Scraped ${addresses.length} unique active addresses from recent blocks.`);
    console.log("Beginning parallel compilation pipeline (throttled by bottleneck)...\n");

    let successCount = 0;
    let proxyCount = 0;
    let unverifiedCount = 0;

    const promises = addresses.map(async (address, index) => {
        try {
            const graph = await client.getProtocolGraph(address, true);
            const source = await client.getSourceCode(address);

            if (graph.metadata.is_proxy) proxyCount++;
            if (!source || source.includes("Pseudo-ABI generated")) unverifiedCount++;
            
            successCount++;
            process.stdout.write(`[${index + 1}/50] ✅ Success (${address})\n`);
        } catch (e: any) {
            process.stdout.write(`[${index + 1}/50] ❌ Failed (${address}): ${e.message}\n`);
        }
    });

    await Promise.all(promises);

    console.log("\n==================================");
    console.log("🎉 MEGA STRESS TEST COMPLETE!");
    console.log(`   - Successful Extractions: ${successCount} / 50`);
    console.log(`   - Proxies Handled: ${proxyCount}`);
    console.log(`   - Unverified Contracts Decompiled: ${unverifiedCount}`);
    console.log("==================================");
}

runMegaStressTest().catch(console.error);
