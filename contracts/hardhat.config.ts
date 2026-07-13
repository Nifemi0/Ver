import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
dotenv.config({ path: "../.env" });

const accounts = process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [];

const config: HardhatUserConfig = {
  solidity: { version: "0.8.20", settings: { optimizer: { enabled: true, runs: 200 } } },
  networks: {
    xlayer: {
      url:     process.env.XLAYER_RPC_URL ?? "https://rpc.xlayer.tech",
      chainId: 196,
      accounts,
    },
    xlayerTestnet: {
      url:     process.env.XLAYER_TESTNET_RPC_URL ?? "https://testrpc.xlayer.tech",
      chainId: 195,
      accounts,
    },
  },
};
export default config;
