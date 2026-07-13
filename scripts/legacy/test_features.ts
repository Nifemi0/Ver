import { HashGraphClient } from "./src/sdk/client";
import { TransactionSimulator } from "./src/engine/simulator";
import { BytecodeDecompiler } from "./src/engine/explorer/bytecode";
import { encodeFunctionData, parseAbi } from "viem";

async function runTests() {
    console.log("=== 1. Testing Transaction Simulator ===");
    const simulator = new TransactionSimulator();
    
    // Simulate an ERC20 transfer on an arbitrary address that probably has no balance
    // WHSK on HashKey testnet: 0xB210D2120d57b758EE163cFfb43e73728c471Cf1
    const WHSK = "0xB210D2120d57b758EE163cFfb43e73728c471Cf1";
    const data = encodeFunctionData({
        abi: parseAbi(["function transfer(address to, uint256 amount) returns (bool)"]),
        functionName: "transfer",
        args: ["0x000000000000000000000000000000000000dEaD", 1000000n]
    });
    
    const simResult = await simulator.simulate(WHSK, data);
    console.log("Simulation Result:", simResult);

    console.log("\n=== 2. Testing Bytecode Decompiler ===");
    const decompiler = new BytecodeDecompiler();
    // Test on L1Block contract to see if we can extract its selectors
    const pseudoAbi = await decompiler.generatePseudoAbi("0x4200000000000000000000000000000000000015");
    if (pseudoAbi) {
        console.log(`Decompiled ABI items found: ${JSON.parse(pseudoAbi).length}`);
        console.log("Sample of decompiled ABI:");
        console.log(JSON.stringify(JSON.parse(pseudoAbi).slice(0, 3), null, 2));
    } else {
        console.log("No pseudo ABI could be generated.");
    }

    console.log("\n=== 3. Testing Normalizer (Diamond/Standard fallback) ===");
    const client = new HashGraphClient();
    // Use the getProtocolGraph which triggers normalizer
    const graph = await client.getProtocolGraph("0x4200000000000000000000000000000000000015", true);
    console.log(`Normalizer executed. Proxy detected: ${graph.metadata.is_proxy}`);
}

runTests().catch(console.error);
