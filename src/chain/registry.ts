import { createPublicClient, createWalletClient, http, custom, Address } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const REGISTRY_ABI = [
  {
    name: "getAttestation",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "protocol", type: "address" }],
    outputs: [
      { name: "graphHash",    type: "bytes32" },
      { name: "metadataURI",  type: "string"  },
      { name: "attester",     type: "address" },
      { name: "timestamp",    type: "uint256" },
      { name: "verified",     type: "bool"    },
    ],
  },
  {
    name: "attest",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "protocol",     type: "address" },
      { name: "graphHash",    type: "bytes32" },
      { name: "metadataURI",  type: "string"  },
    ],
    outputs: [],
  },
] as const;

// VerRegistry on X Layer Mainnet (see deployments/mainnet.json).
// Override with REGISTRY_CHAIN_ID / REGISTRY_RPC_URL for testnet or custom RPCs.
const DEFAULT_REGISTRY_ADDRESS =
  "0x3776Cc9AEe3AFb005F9465e6B78079FCf4d16DA6" as const;

const XLAYER_CHAIN = {
  id: Number(process.env.REGISTRY_CHAIN_ID ?? 196),
  name: process.env.REGISTRY_CHAIN_NAME ?? "X Layer Mainnet",
  nativeCurrency: { name: "OKB", symbol: "OKB", decimals: 18 },
  rpcUrls: {
    default: {
      http: [
        process.env.REGISTRY_RPC_URL ??
          process.env.XLAYER_RPC_URL ??
          process.env.RPC_URL ??
          "https://rpc.xlayer.tech",
      ],
    },
  },
} as const;

export interface RegistryAttestation {
  graphHash: string;
  metadataURI: string;
  attester: string;
  timestamp: number;
  verified: boolean;
}

function getPublicClient() {
  return createPublicClient({
    chain: XLAYER_CHAIN,
    transport: http()
  });
}

function getRegistryAddress(): Address {
  const addr =
    process.env.REGISTRY_ADDRESS ||
    process.env.NEXT_PUBLIC_REGISTRY_ADDRESS ||
    DEFAULT_REGISTRY_ADDRESS;
  return addr as Address;
}

export async function lookupGraph(protocolAddress: string): Promise<RegistryAttestation | null> {
  const publicClient = getPublicClient();
  const registryAddress = getRegistryAddress();
  
  if (registryAddress === '0x0000000000000000000000000000000000000000') return null;

  try {
    const data = await publicClient.readContract({
      address: registryAddress,
      abi: REGISTRY_ABI,
      functionName: 'getAttestation',
      args: [protocolAddress as Address],
    });

    return {
      graphHash: data[0],
      metadataURI: data[1],
      attester: data[2],
      timestamp: Number(data[3]),
      verified: data[4],
    };
  } catch (err) {
    console.error(`[Registry] Failed to lookup graph for ${protocolAddress}`, err);
    return null;
  }
}

export async function registerGraph(protocolAddress: string, graphHash: string, metadataURI: string): Promise<string | null> {
  const pk = process.env.DEPLOYER_PRIVATE_KEY;
  if (!pk) {
      console.error("[Registry] Missing DEPLOYER_PRIVATE_KEY in .env");
      return null;
  }

  const account = privateKeyToAccount(pk as `0x${string}`);
  const walletClient = createWalletClient({
    account,
    chain: XLAYER_CHAIN,
    transport: http()
  });
  const publicClient = getPublicClient();
  
  try {
    const { request } = await publicClient.simulateContract({
      account,
      address: getRegistryAddress(),
      abi: REGISTRY_ABI,
      functionName: 'attest',
      args: [protocolAddress as Address, graphHash as `0x${string}`, metadataURI],
    });
    
    const txHash = await walletClient.writeContract(request);
    return txHash;
  } catch (error) {
    console.error("[Registry] Failed to register graph", error);
    return null;
  }
}
