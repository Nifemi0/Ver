import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const networkName = require("hardhat").network.name;
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), networkName === "botTestnet" ? "BOT" : "OKB");

  const Registry = await ethers.getContractFactory("VerRegistry");
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
  // metadata when run against BOT Chain testnet.
  const deploymentData = {
      network: networkName === "botTestnet" ? "BOT Chain Testnet" : networkName,
      version: networkName === "botTestnet" ? 2 : 1,
      chainId: (await ethers.provider.getNetwork()).chainId.toString(),
      rpc: networkName === "botTestnet" ? "https://rpc.bohr.life" : "https://rpc.xlayer.tech",
      explorer: networkName === "botTestnet" ? "https://scan.bohr.life" : "https://web3.okx.com/explorer/xlayer",
      deployer: deployer.address,
      address: addr,
      transactionHash: txHash,
      blockNumber: blockNumber,
      verified: false,
      status: "DEPLOYED_PENDING_SOURCE_VERIFICATION",
      timestamp: new Date().toISOString()
  };
  
  const deploymentsDir = path.join(__dirname, "../../deployments");
  if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  const fileName = networkName === 'xlayer' ? 'mainnet.json' : `${networkName}.json`;
  
  fs.writeFileSync(
      path.join(deploymentsDir, fileName),
      JSON.stringify(deploymentData, null, 2)
  );

  console.log(`Deployment saved to deployments/${fileName}`);
  console.log("Add to .env:");
  const prefix = networkName === "botTestnet" ? "BOT_TESTNET_REGISTRY_ADDRESS" : "REGISTRY_ADDRESS";
  console.log(`${prefix}=${addr}`);
  if (networkName !== "botTestnet") console.log(`NEXT_PUBLIC_REGISTRY_ADDRESS=${addr}`);
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
