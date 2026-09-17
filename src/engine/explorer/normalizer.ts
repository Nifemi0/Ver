import { IExplorerRepository } from "./repository.interface";
import { createPublicClient, http, toFunctionSelector } from "viem";
import { abiSignature, hasAbi, hasSource, mergeAbis } from "../abi";
import { getActiveChain } from "../../chain/networks";
import { resolveLiveIdentity } from "./live-identity";
import { PreparationRejected } from "../errors";

export interface NormalizedContractData {
  address: string;
  isProxy: boolean;
  implementationAddress: string | null;
  abi: string | null;
  sourceCode: string | null;
  contractName?: string;
  compilerVersion?: string;
  sourceVerified: boolean;
  snapshotBlock: string;
  identityCheckedAt: string;
  runtimeCodeHash: string;
  implementationCodeHash?: string | undefined;
  facets?: { address: string; selectors: string[]; codeHash?: string }[] | undefined;
}

/** Explorer artifacts are reconciled with executable identity at a fixed block. */
export class DataNormalizer {
  private client;
  constructor(private repository: IExplorerRepository, private chain = getActiveChain()) {
    this.client = createPublicClient({ chain, transport: http(undefined, { timeout: 10000, retryCount: 1 }) });
  }

  public async normalize(address: string, snapshotBlock?: bigint): Promise<NormalizedContractData> {
    if (await this.client.getChainId() !== this.chain.id) throw new PreparationRejected("RPC_CHAIN_MISMATCH", "RPC network does not match requested graph chain.");
    const blockNumber = snapshotBlock ?? await this.client.getBlockNumber({ cacheTime: 0 });
    const [explorerImplementation, proxyAbi, proxySource] = await Promise.all([
      this.repository.resolveProxyImplementation(address), this.repository.fetchContractAbi(address), this.repository.fetchContractSource(address)
    ]);
    const identity = await resolveLiveIdentity(this.client, address, explorerImplementation, hasAbi(proxyAbi) ? JSON.parse(proxyAbi!) : [], blockNumber);
    let abi: string | null = proxyAbi;
    let sourceCode: string | null = proxySource;
    let sourceVerified = hasAbi(proxyAbi) && hasSource(proxySource);
    const implementationAddress = identity.facets ? "DiamondProxy" : identity.implementation;
    const target = identity.implementation ?? address;
    if (identity.facets) {
      const artifacts = await Promise.all(identity.facets.map(async facet => {
        const [rawAbi, source] = await Promise.all([this.repository.fetchContractAbi(facet.address), this.repository.fetchContractSource(facet.address)]);
        return { facet, rawAbi, source };
      }));
      const abis = artifacts.map(({ facet, rawAbi, source }) => {
        if (!hasAbi(rawAbi) || !hasSource(source)) sourceVerified = false;
        const selected = new Set(facet.selectors);
        const items = hasAbi(rawAbi) ? JSON.parse(rawAbi!) : [];
        const functions = items.filter((item: any) => item.type === "function" && selected.has(toFunctionSelector(abiSignature(item))));
        if (functions.length !== selected.size) sourceVerified = false;
        return items.filter((item: any) => item.type === "event" || item.type === "error").concat(functions);
      });
      abi = JSON.stringify(mergeAbis(...abis));
      sourceCode = [proxySource, ...artifacts.map(a => a.source ? "// Facet " + a.facet.address + "\n" + a.source : "")].filter(Boolean).join("\n");
    } else if (identity.implementation) {
      const [implAbi, implSource] = await Promise.all([this.repository.fetchContractAbi(target), this.repository.fetchContractSource(target)]);
      sourceVerified = sourceVerified && hasAbi(implAbi) && hasSource(implSource);
      abi = JSON.stringify(mergeAbis(hasAbi(proxyAbi) ? JSON.parse(proxyAbi!) : [], hasAbi(implAbi) ? JSON.parse(implAbi!) : []));
      sourceCode = [proxySource ? "// Proxy Contract (" + address.toLowerCase() + ")\n" + proxySource + "\n" : "", implSource ? "// Implementation Contract (" + target + ")\n" + implSource + "\n" : ""].join("\n").trim() || null;
    } else if (hasAbi(abi)) {
      abi = JSON.stringify(mergeAbis(JSON.parse(abi!)));
    }
    if (sourceCode?.startsWith("{") && sourceCode.endsWith("}")) {
      try {
        const parsed = JSON.parse(sourceCode.startsWith("{{") ? sourceCode.slice(1, -1) : sourceCode);
        if (parsed.sources) sourceCode = Object.entries(parsed.sources).sort(([a], [b]) => a.localeCompare(b)).map(([file, value]: any) => "// File: " + file + "\n" + value.content + "\n\n").join("");
      } catch { /* Preserve explorer text. */ }
    }
    if (!hasAbi(abi)) {
      const { BytecodeDecompiler } = await import("./bytecode.js");
      abi = await new BytecodeDecompiler(this.chain).generatePseudoAbi(target, blockNumber);
      if (abi) sourceCode = "// Unverified Contract: Pseudo-ABI generated from bytecode selectors";
      sourceVerified = false;
    }
    const [contractName, compilerVersion] = await Promise.all([this.repository.fetchContractName?.(target), this.repository.fetchCompilerVersion?.(target)]);
    return { address, isProxy: Boolean(implementationAddress), implementationAddress, abi, sourceCode, sourceVerified,
      contractName: contractName ?? "Unknown", compilerVersion: compilerVersion ?? "Unknown",
      snapshotBlock: blockNumber.toString(), identityCheckedAt: new Date().toISOString(), runtimeCodeHash: identity.runtimeCodeHash,
      implementationCodeHash: identity.implementationCodeHash, facets: identity.facets };
  }
}
