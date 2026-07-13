import { HashGraphClient } from "./src/sdk/client";

const ADDRESSES = [
    { name: "WHSK Token (Standard)", address: "0xB210D2120d57b758EE163cFfb43e73728c471Cf1" },
    { name: "L1Block (EIP-1967 Proxy)", address: "0x4200000000000000000000000000000000000015" },
    { name: "L2ToL1MessagePasser", address: "0x4200000000000000000000000000000000000016" },
    { name: "Zero Address (Empty EOA)", address: "0x0000000000000000000000000000000000000000" },
    { name: "Random Hex (Unverified)", address: "0x1234567890123456789012345678901234567890" }
];

async function stressTest() {
    const client = new HashGraphClient();
    console.log("🚀 STARTING HASHGRAPH STRESS TEST");
    console.log("==================================\n");

    for (const target of ADDRESSES) {
        console.log(`\n⏳ Testing: ${target.name} [${target.address}]`);
        try {
            const startGraph = performance.now();
            const graph = await client.getProtocolGraph(target.address, true);
            const graphTime = (performance.now() - startGraph).toFixed(2);
            
            console.log(`✅ [GRAPH] Success in ${graphTime}ms`);
            console.log(`   - Is Proxy: ${graph.metadata.is_proxy}`);
            console.log(`   - Functions found: ${graph.statistics.functions}`);
            console.log(`   - Events found: ${graph.statistics.events}`);

            const startSource = performance.now();
            const source = await client.getSourceCode(target.address);
            const sourceTime = (performance.now() - startSource).toFixed(2);
            
            if (source) {
                console.log(`✅ [SOURCE] Success in ${sourceTime}ms. Length: ${source.length} bytes`);
            } else {
                console.log(`⚠️ [SOURCE] Returned NULL (Expected if completely empty)`);
            }

        } catch (e: any) {
            console.error(`❌ [FAILED] ${target.name} crashed the pipeline!`);
            console.error(e);
        }
        console.log("----------------------------------");
    }
    
    console.log("\n🎉 STRESS TEST COMPLETE!");
}

stressTest().catch(console.error);
