import { createPublicClient, http } from "viem";

async function main() {
  const client = createPublicClient({
    chain: { 
      id: 177, 
      name: "HashKey Chain", 
      nativeCurrency: { name: "HSK", symbol: "HSK", decimals: 18 }, 
      rpcUrls: { default: { http: ["https://mainnet.hsk.xyz"] } } 
    } as any,
    transport: http(),
  });

  try {
    const block = await client.getBlockNumber();
    console.log("✅ Mainnet RPC OK — latest block:", block.toString());
  } catch (error: any) {
    console.error("❌ Mainnet RPC FAILED:");
    console.error(error.message);
  }
}

main();
