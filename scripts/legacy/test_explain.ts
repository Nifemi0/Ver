import { HashGraphClient } from './src/sdk/client';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    const client = new HashGraphClient();
    const address = "0xB210D2120d57b758EE163cFfb43e73728c471Cf1";
    const calldata = "0xa9059cbb000000000000000000000000000000000000000000000000000000000000dead000000000000000000000000000000000000000000000000000000000000000000000000000000000000000de0b6b3a7640000";

    try {
        console.log("Explaining transaction...");
        const result = await client.explainTransaction(address, calldata);
        console.log(JSON.stringify(result, null, 2));
    } catch (e: any) {
        console.error("Error:", e.message);
    }
}

main();
