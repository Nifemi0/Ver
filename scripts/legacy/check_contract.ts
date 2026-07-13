import { createPublicClient, http } from "viem";
async function main() {
  const client = createPublicClient({ transport: http("https://mainnet.hsk.xyz") });
  const code = await client.getBytecode({ address: "0x3776Cc9AEe3AFb005F9465e6B78079FCf4d16DA6" });
  console.log("Mainnet bytecode length:", code ? code.length : 0);
  const testnetClient = createPublicClient({ transport: http("https://testnet.hsk.xyz") });
  const testCode = await testnetClient.getBytecode({ address: "0x3776Cc9AEe3AFb005F9465e6B78079FCf4d16DA6" });
  console.log("Testnet bytecode length:", testCode ? testCode.length : 0);
}
main().catch(console.log);
