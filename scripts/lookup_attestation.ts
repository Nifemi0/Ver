import dotenv from "dotenv";
dotenv.config();

import { lookupGraph } from "../src/chain/registry";

const CELA = "0xF1B50eD67A9e2CC94Ad3c477779E2d4cBfFf9029";

async function main() {
  console.log("Looking up on-chain attestation for CELA...");
  const attestation = await lookupGraph(CELA);
  console.log(JSON.stringify(attestation, null, 2));
}

main().catch(console.error);
