import { registerGraph, lookupGraph } from "./src/chain/registry";
import dotenv from "dotenv";
dotenv.config();

async function main() {
    const address = "0xB210D2120d57b758EE163cFfb43e73728c471Cf1";
    // We use a dummy graph hash for testing
    const graphHash = "0xdf276e64f49c2badb8bd8f8c4f9d23115eb30cb976392e98638c58d9af9e5210"; 
    const metadataURI = "ipfs://QmDummyHash";

    console.log(`Attesting WHSK Token...`);
    try {
        const txHash = await registerGraph(address, graphHash, metadataURI);
        console.log("Tx hash:", txHash);

        console.log("Waiting 5 seconds for confirmation...");
        await new Promise(r => setTimeout(r, 5000));

        const res = await lookupGraph(address);
        console.log("Lookup result:", res);
    } catch(e: any) {
        console.error("Error:", e.message);
    }
}

main();
