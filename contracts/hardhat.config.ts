import { defineConfig } from "hardhat/config";
import hardhatEthers from "@nomicfoundation/hardhat-ethers";
import hardhatMatchers from "@nomicfoundation/hardhat-ethers-chai-matchers";
import hardhatMocha from "@nomicfoundation/hardhat-mocha";
import hardhatVerify from "@nomicfoundation/hardhat-verify";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
const directory = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(directory, "../.env"), quiet: true });
// Test/compile processes never load a deployment key. Dedicated deployments opt in.
if (process.env.VER_ENABLE_DEPLOYMENT === "true") {
  dotenv.config({ path: path.resolve(directory, ".env.deployer"), override: true, quiet: true });
}

const accounts = process.env.VER_ENABLE_DEPLOYMENT === "true" && process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [];

export default defineConfig({
  plugins: [hardhatEthers, hardhatMatchers, hardhatMocha, hardhatVerify],
  solidity: { version: "0.8.20", settings: { optimizer: { enabled: true, runs: 200 }, evmVersion: "paris" } },
  networks: {
    hardhat: { type: "edr-simulated", chainType: "l1" },
    xlayer: {
      type: "http", chainType: "generic",
      url:     process.env.XLAYER_RPC_URL ?? "https://rpc.xlayer.tech",
      chainId: 196,
      accounts,
    },
    xlayerTestnet: {
      type: "http", chainType: "generic",
      url:     process.env.XLAYER_TESTNET_RPC_URL ?? "https://testrpc.xlayer.tech",
      chainId: 1952,  // X Layer testnet (testrpc.xlayer.tech)
      accounts,
    },
    botTestnet: {
      type: "http", chainType: "generic",
      url: process.env.BOT_TESTNET_RPC_URL ?? "https://rpc.bohr.life",
      chainId: 968,
      accounts,
    },
  },
});
