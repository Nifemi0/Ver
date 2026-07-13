import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "OKB");

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

  // Persist inside deployments/mainnet.json as per instruction 6.2
  const deploymentData = {
      address: addr,
      transactionHash: txHash,
      blockNumber: blockNumber,
      timestamp: new Date().toISOString()
  };
  
  const deploymentsDir = path.join(__dirname, "../../deployments");
  if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  // Choose file name based on network
  const networkName = require("hardhat").network.name;
  const fileName = networkName === 'xlayer' ? 'mainnet.json' : `${networkName}.json`;
  
  fs.writeFileSync(
      path.join(deploymentsDir, fileName),
      JSON.stringify(deploymentData, null, 2)
  );

  console.log(`Deployment saved to deployments/${fileName}`);
  console.log("Add to .env:");
  console.log(`REGISTRY_ADDRESS=${addr}`);
  console.log(`NEXT_PUBLIC_REGISTRY_ADDRESS=${addr}`);
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
