import dotenv from "dotenv";
dotenv.config();

import { VerClient } from "../src/sdk/client";

const CELA = "0xF1B50eD67A9e2CC94Ad3c477779E2d4cBfFf9029";

async function main() {
  const client = new VerClient();
  console.log("Fetching protocol graph for CELA...");
  const g = await client.getProtocolGraph(CELA, true);
  console.log(JSON.stringify(g, null, 2));
}

main().catch(console.error);
