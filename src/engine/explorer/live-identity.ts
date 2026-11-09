import { isAddress, keccak256, parseAbi, type Address } from "viem";
import { PreparationRejected, isMissingContractMethod } from "../errors";

const ZERO = "0x0000000000000000000000000000000000000000";
export const IMPLEMENTATION_SLOT = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
const BEACON_SLOT = "0xa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d50";
export interface LiveIdentity {
  blockNumber: bigint;
  runtimeCodeHash: string;
  implementation: string | null;
  implementationCodeHash?: string;
  facets?: { address: string; selectors: string[]; codeHash: string }[];
}

/** Missing optional methods are normal; transport failures are not proof of absence. */
async function optionalRead(client: any, request: any): Promise<any | null> {
  try { return await client.readContract(request); }
  catch (error) { if (isMissingContractMethod(error)) return null; throw error; }
}
function addressOrNull(value: unknown): string | null {
  if (value === null || value === undefined || value === ZERO) return null;
  if (typeof value !== "string" || !isAddress(value)) throw new PreparationRejected("INVALID_PROXY_IDENTITY", "Invalid proxy identity returned by chain or explorer.");
  return value.toLowerCase();
}
function slotAddress(data: string | undefined): string | null {
  if (!data || data === "0x" || /^0x0{64}$/.test(data)) return null;
  if (!/^0x0{24}[a-fA-F0-9]{40}$/.test(data)) throw new PreparationRejected("INVALID_PROXY_IDENTITY", "Malformed implementation slot.");
  return addressOrNull(`0x${data.slice(-40)}`);
}
async function codeHash(client: any, address: string, blockNumber: bigint): Promise<string> {
  const code = await client.getBytecode({ address: address as Address, blockNumber });
  if (!code || code === "0x") throw new PreparationRejected("NO_CONTRACT_CODE", "Resolved contract has no bytecode at the snapshot block.");
  return keccak256(code);
}

/** Resolve executable identity from RPC at one block, then reconcile the explorer. */
export async function resolveLiveIdentity(client: any, address: string, explorerImplementation: string | null, abi: any[], blockNumber: bigint): Promise<LiveIdentity> {
  const bytecode = await client.getBytecode({ address, blockNumber });
  if (!bytecode || bytecode === "0x") throw new PreparationRejected("NO_CONTRACT_CODE", "Target has no bytecode at the snapshot block.");
  const result: LiveIdentity = { blockNumber, runtimeCodeHash: keccak256(bytecode), implementation: null };
  result.implementation = slotAddress(await client.getStorageAt({ address, slot: IMPLEMENTATION_SLOT, blockNumber }));
  if (!result.implementation) {
    const beacon = slotAddress(await client.getStorageAt({ address, slot: BEACON_SLOT, blockNumber }));
    if (beacon) {
      result.implementation = addressOrNull(await client.readContract({ address: beacon, abi: parseAbi(["function implementation() view returns(address)"]), functionName: "implementation", blockNumber }));
      if (!result.implementation) throw new PreparationRejected("INVALID_PROXY_IDENTITY", "Beacon has no implementation.");
    }
  }
  if (!result.implementation) {
    const clone = bytecode.match(/^0x363d3d373d3d3d363d73([a-fA-F0-9]{40})5af43d82803e903d91602b57fd5bf3$/);
    if (clone) result.implementation = addressOrNull(`0x${clone[1]}`);
  }
  if (!result.implementation) {
    const authority = addressOrNull(await optionalRead(client, { address, abi: parseAbi(["function getImplementationAuthority() view returns(address)"]), functionName: "getImplementationAuthority", blockNumber }));
    if (authority) {
      result.implementation = addressOrNull(await client.readContract({ address: authority, abi: parseAbi(["function getTokenImplementation() view returns(address)"]), functionName: "getTokenImplementation", blockNumber }));
      if (!result.implementation) throw new PreparationRejected("INVALID_PROXY_IDENTITY", "Authority has no implementation.");
    }
  }
  if (!result.implementation && abi.some(f => f.type === "function" && f.name === "implementation" && f.inputs?.length === 0 && f.outputs?.length === 1 && f.outputs[0].type === "address")) {
    result.implementation = addressOrNull(await optionalRead(client, { address, abi: parseAbi(["function implementation() view returns(address)"]), functionName: "implementation", blockNumber }));
  }
  if (!result.implementation) {
    const facets = await optionalRead(client, { address, abi: parseAbi(["function facets() view returns ((address facetAddress, bytes4[] functionSelectors)[])" ]), functionName: "facets", blockNumber });
    if (Array.isArray(facets) && facets.length) {
      if (facets.length > 64) throw new PreparationRejected("GRAPH_CAPACITY", "Diamond exceeds the supported facet limit.");
      const selectors = new Set<string>();
      result.facets = await Promise.all(facets.map(async (facet: any) => {
        const facetAddress = addressOrNull(facet.facetAddress);
        if (!facetAddress || !Array.isArray(facet.functionSelectors) || facet.functionSelectors.length > 1024) throw new PreparationRejected("INVALID_PROXY_IDENTITY", "Invalid diamond facet.");
        const selected = facet.functionSelectors.map((s: string) => {
          if (!/^0x[0-9a-fA-F]{8}$/.test(s) || selectors.has(s.toLowerCase())) throw new PreparationRejected("INVALID_PROXY_IDENTITY", "Invalid or duplicate diamond selector.");
          selectors.add(s.toLowerCase()); return s.toLowerCase();
        }).sort();
        return { address: facetAddress, selectors: selected, codeHash: await codeHash(client, facetAddress, blockNumber) };
      }));
      result.facets.sort((a, b) => a.address.localeCompare(b.address));
    }
  }
  const explorer = addressOrNull(explorerImplementation);
  if (explorer && explorer !== result.implementation) throw new PreparationRejected("PROXY_IDENTITY_MISMATCH", "Explorer and live proxy implementation disagree. Retry after verified artifacts are updated.");
  if (result.implementation) result.implementationCodeHash = await codeHash(client, result.implementation, blockNumber);
  return result;
}
