import type { Chain } from "viem";

export type VerNetwork = "xlayer" | "botTestnet";

export const XLAYER_MAINNET: Chain = {
  id: 196,
  name: "X Layer Mainnet",
  nativeCurrency: { name: "OKB", symbol: "OKB", decimals: 18 },
  rpcUrls: {
    default: {
      http: [process.env.XLAYER_RPC_URL ?? process.env.RPC_URL ?? "https://rpc.xlayer.tech"],
    },
  },
};

export const BOT_TESTNET: Chain = {
  id: 968,
  name: "BOT Chain Testnet",
  nativeCurrency: { name: "BOT", symbol: "BOT", decimals: 18 },
  rpcUrls: {
    default: {
      http: [process.env.BOT_TESTNET_RPC_URL ?? "https://rpc.bohr.life"],
    },
  },
};

export function getActiveNetwork(): VerNetwork {
  const value = process.env.VER_NETWORK ?? "botTestnet";
  if (value !== "xlayer" && value !== "botTestnet") {
    throw new Error(`Unsupported VER_NETWORK '${value}'. Use 'xlayer' or 'botTestnet'.`);
  }
  return value;
}

export function getActiveChain(): Chain {
  return getActiveNetwork() === "botTestnet" ? BOT_TESTNET : XLAYER_MAINNET;
}

export function getChainById(chainId?: number): Chain {
  if (chainId === undefined) return getActiveChain();
  if (chainId === XLAYER_MAINNET.id) return XLAYER_MAINNET;
  if (chainId === BOT_TESTNET.id) return BOT_TESTNET;
  throw new Error(`Unsupported chainId '${chainId}'. Supported chains: 196 (X Layer), 968 (BOT Chain testnet).`);
}

export function getExplorerApiUrlForChain(chainId: number): string {
  if (chainId === BOT_TESTNET.id) return process.env.BOT_TESTNET_EXPLORER_API_URL ?? "https://scan.bohr.life/api";
  if (chainId === XLAYER_MAINNET.id) return "https://web3.okx.com/api/v5/xlayer/contract/verify-contract-info";
  throw new Error(`Unsupported chainId '${chainId}'.`);
}

export function getExplorerUrlForChain(chainId: number): string {
  if (chainId === BOT_TESTNET.id) return process.env.BOT_TESTNET_EXPLORER_URL ?? "https://scan.bohr.life";
  if (chainId === XLAYER_MAINNET.id) return process.env.XLAYER_EXPLORER_URL ?? "https://web3.okx.com/explorer/xlayer";
  throw new Error(`Unsupported chainId '${chainId}'.`);
}

export function getExplorerApiUrl(): string {
  return process.env.VER_EXPLORER_API_URL ??
    (getActiveNetwork() === "botTestnet"
      ? "https://scan.bohr.life/api"
      : "https://web3.okx.com/api/v5/xlayer/contract/verify-contract-info");
}

export function getExplorerUrl(): string {
  return process.env.VER_EXPLORER_URL ??
    (getActiveNetwork() === "botTestnet"
      ? "https://scan.bohr.life"
      : "https://web3.okx.com/explorer/xlayer");
}
