import { network } from "hardhat";
import { fileURLToPath } from "node:url";
import * as fs from "fs";
import * as path from "path";

async function main() {
  if (process.env.VER_ENABLE_DEPLOYMENT !== "true") throw new Error("Deployment disabled. Explicit approval and VER_ENABLE_DEPLOYMENT=true are required.");
  const connection = await network.create();
  const { ethers } = connection;
  const networkName = connection.networkName;
  const actualChainId = (await ethers.provider.getNetwork()).chainId.toString();
  if (process.env.VER_DEPLOYMENT_CONFIRM_CHAIN_ID !== actualChainId) throw new Error("Confirm the exact target chain with VER_DEPLOYMENT_CONFIRM_CHAIN_ID before deployment.");
  const contractName = process.env.VER_REGISTRY_CONTRACT;
  if (contractName !== "VerRegistry" && contractName !== "VerRegistryV3") throw new Error("Explicitly select VER_REGISTRY_CONTRACT=VerRegistry or VerRegistryV3.");
  const [deployer] = await ethers.getSigners();
  if (!deployer) throw new Error("No deployment signer configured for the selected network.");
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Deploying with:", deployer.address);
  const nativeSymbol = networkName === "botTestnet" || networkName === "botMainnet" ? "BOT" : "OKB";
  console.log("Balance:", ethers.formatEther(balance), nativeSymbol);

  const Registry = await ethers.getContractFactory(contractName);
  const deploymentTx = await Registry.getDeployTransaction();
  const estimatedGas = await ethers.provider.estimateGas({ ...deploymentTx, from: deployer.address });
  const fee = await ethers.provider.getFeeData();
  const gasPrice = fee.gasPrice ?? 0n;
  const estimatedCost = estimatedGas * gasPrice;
  console.log("Estimated gas:", estimatedGas.toString());
  console.log("Gas price:", gasPrice.toString());
  console.log("Estimated deploy cost:", ethers.formatEther(estimatedCost), nativeSymbol);
  if (gasPrice > 0n && balance < estimatedCost) throw new Error("Insufficient deployer balance for estimated deployment cost.");

  const registry = await Registry.deploy();
  await registry.waitForDeployment();
  const addr = await registry.getAddress();
  
  const txHash = registry.deploymentTransaction()?.hash || "";
  const txReceipt = await ethers.provider.getTransactionReceipt(txHash);
  const blockNumber = txReceipt?.blockNumber || 0;

  console.log("\n✅ VerRegistry deployed:", addr);
  console.log("Transaction Hash:", txHash);
  console.log("Block Number:", blockNumber);

  // Persist a network-specific record; this script never overwrites X Layer
  // metadata when run against BOT Chain.
  const isBot = networkName === "botTestnet" || networkName === "botMainnet";
  const deploymentData = {
      network: networkName === "botTestnet" ? "BOT Chain Testnet" : networkName === "botMainnet" ? "BOT Chain Mainnet" : networkName,
      contract: contractName,
      version: contractName === "VerRegistryV3" ? 3 : 2,
      chainId: (await ethers.provider.getNetwork()).chainId.toString(),
      rpc: networkName === "botTestnet" ? (process.env.BOT_TESTNET_RPC_URL ?? "https://rpc.bohr.life") : networkName === "botMainnet" ? (process.env.BOT_MAINNET_RPC_URL ?? "https://rpc.botchain.ai") : networkName === "xlayer" ? (process.env.XLAYER_RPC_URL ?? "https://rpc.xlayer.tech") : networkName === "xlayerTestnet" ? (process.env.XLAYER_TESTNET_RPC_URL ?? "https://testrpc.xlayer.tech") : null,
      explorer: networkName === "botTestnet" ? "https://scan.bohr.life" : networkName === "botMainnet" ? "https://scan.botchain.ai" : networkName === "xlayer" ? "https://web3.okx.com/explorer/xlayer" : null,
      deployer: deployer.address,
      address: addr,
      transactionHash: txHash,
      blockNumber: blockNumber,
      verified: false,
      status: "DEPLOYED_PENDING_SOURCE_VERIFICATION",
      timestamp: new Date().toISOString()
  };
  
  const deploymentsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "../../deployments");
  if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  const fileName = `${networkName}-${contractName}-${addr}.json`;
  
  fs.writeFileSync(
      path.join(deploymentsDir, fileName),
      JSON.stringify(deploymentData, null, 2)
  );

  console.log(`Deployment saved to deployments/${fileName}`);
  console.log("Add to .env:");
  const prefix = networkName === "botTestnet" ? "BOT_TESTNET_REGISTRY_ADDRESS" : networkName === "botMainnet" ? "BOT_MAINNET_REGISTRY_ADDRESS" : "REGISTRY_ADDRESS";
  console.log(`${prefix}=${addr}`);
  if (!isBot) console.log(`NEXT_PUBLIC_REGISTRY_ADDRESS=${addr}`);
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
