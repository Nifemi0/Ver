import { registerGraph, lookupGraph } from './src/chain/registry';
import dotenv from 'dotenv';
import { createHash } from 'crypto';
dotenv.config();

const testAddress = "0xB210D2120d57b758EE163cFfb43e73728c471Cf1";
const testHash = "0x" + createHash("sha256").update("test-graph-v1").digest("hex");
const testURI = "https://hashgraph.xyz/test";

async function main() {
    console.log("Attesting...");
    const txHash = await registerGraph(testAddress, testHash, testURI);
    
    if (!txHash) {
        throw new Error("FAIL: txHash is null. Attestation failed.");
    }
    console.log("  Tx hash:", txHash);

    // Wait for confirmation
    console.log("Waiting 5 seconds for confirmation...");
    await new Promise(r => setTimeout(r, 5000));

    // Look up
    const result = await lookupGraph(testAddress);
    console.log("Lookup result:", result);

    if (!result?.verified) throw new Error("FAIL: verified is false after attestation");
    if (result.graphHash !== testHash) throw new Error(`FAIL: hash mismatch — got ${result.graphHash}`);

    console.log("✅ Registry round-trip passed");
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
