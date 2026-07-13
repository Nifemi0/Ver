import { createPublicClient, http, formatEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  if (!process.env.DEPLOYER_PRIVATE_KEY) throw new Error("No private key");
  const account = privateKeyToAccount(process.env.DEPLOYER_PRIVATE_KEY as any);
  
  const client = createPublicClient({
    chain: { 
      id: 177, 
      name: "HashKey Chain", 
      nativeCurrency: { name: "HSK", symbol: "HSK", decimals: 18 }, 
      rpcUrls: { default: { http: ["https://mainnet.hsk.xyz"] } } 
    } as any,
    transport: http(),
  });

  const balance = await client.getBalance({ address: account.address });
  console.log(`Address: ${account.address}`);
  console.log(`Balance: ${formatEther(balance)} HSK`);
}

main().catch(console.error);
