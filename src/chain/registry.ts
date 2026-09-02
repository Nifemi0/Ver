import { createPublicClient, createWalletClient, http, Address } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { getActiveChain, getActiveNetwork } from './networks';

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

const DEFAULT_BOT_REGISTRY_ADDRESS =
  "0xfEB4423E669a0e160b316a8Ca46D8Ca70eB2A4F5" as const;
const LEGACY_XLAYER_REGISTRY_ADDRESS =
  "0x2061045fE42d789a12887D77EBAed26687a49c21" as const;

export interface RegistryAttestation {
  graphHash: string;
  metadataURI: string;
  attester: string;
  timestamp: number;
  verified: boolean;
}

function getPublicClient() {
  return createPublicClient({
    chain: getActiveChain(),
    transport: http()
  });
}

function getRegistryAddress(): Address {
  const addr = getActiveNetwork() === "botTestnet"
    ? (process.env.BOT_TESTNET_REGISTRY_ADDRESS || DEFAULT_BOT_REGISTRY_ADDRESS)
    : (process.env.REGISTRY_ADDRESS || process.env.NEXT_PUBLIC_REGISTRY_ADDRESS || LEGACY_XLAYER_REGISTRY_ADDRESS);
  return addr as Address;
}

export async function lookupGraph(protocolAddress: string): Promise<RegistryAttestation | null> {
  const publicClient = getPublicClient();
  const registryAddress = getRegistryAddress();
  
  if (registryAddress === '0x0000000000000000000000000000000000000000') return null;

  try {
    // Soft-fail when registry not deployed / empty bytecode
    const code = await publicClient.getBytecode({ address: registryAddress });
    if (!code || code === '0x') {
      console.warn(`[Registry] No bytecode at ${registryAddress} — attestation unavailable`);
      return null;
    }

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
  if (process.env.VER_ENABLE_WRITES !== "true") {
      console.error("[Registry] Writes disabled; set VER_ENABLE_WRITES=true in the dedicated signer process");
      return null;
  }
  const pk = process.env.ATTESTER_PRIVATE_KEY;
  if (!pk) {
      console.error("[Registry] Missing ATTESTER_PRIVATE_KEY in signer environment");
      return null;
  }

  const account = privateKeyToAccount(pk as `0x${string}`);
  const walletClient = createWalletClient({
    account,
    chain: getActiveChain(),
    transport: http()
  });
  const publicClient = getPublicClient();
  
  try {
    const registryAddress = getRegistryAddress();
    const code = await publicClient.getBytecode({ address: registryAddress });
    if (!code || code === '0x') {
      console.error(`[Registry] Cannot attest — no bytecode at ${registryAddress}`);
      return null;
    }

    const { request } = await publicClient.simulateContract({
      account,
      address: registryAddress,
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
