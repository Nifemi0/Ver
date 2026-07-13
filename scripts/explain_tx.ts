import dotenv from "dotenv";
dotenv.config();

import { VerClient } from "../src/sdk/client";

const CELA = "0xF1B50eD67A9e2CC94Ad3c477779E2d4cBfFf9029";
const CALLDATA = "0xa9059cbb0000000000000000000000001111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000a";

async function main() {
  const client = new VerClient();
  console.log("Explaining transaction calldata...");
  const result = await client.explainTransaction(CELA, CALLDATA);
  console.log(JSON.stringify(result, null, 2));
}

main().catch(console.error);
