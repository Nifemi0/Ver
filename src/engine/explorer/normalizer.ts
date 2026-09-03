import { IExplorerRepository } from "./repository.interface";
import { createPublicClient, http, Address, parseAbi, toFunctionSelector } from "viem";
import { abiSignature, hasAbi, hasSource, mergeAbis } from "../abi";
import { getActiveChain } from "../../chain/networks";

export interface NormalizedContractData {
  address: string;
  isProxy: boolean;
  implementationAddress: string | null;
  abi: string | null;
  sourceCode: string | null;
  contractName?: string;
  compilerVersion?: string;
  /** True only when every resolved contract has explorer ABI and real source. */
  sourceVerified: boolean;
  facets?: { address: string; selectors: string[] }[];
}

export class DataNormalizer {
  private repository: IExplorerRepository;
  private client = createPublicClient({ chain: getActiveChain(), transport: http(undefined, { timeout: 10000, retryCount: 1 }) });

  // Dependency Inversion: Compiler doesn't know about Blockscout
  constructor(repository: IExplorerRepository, chain = getActiveChain()) {
    this.repository = repository;
    this.client = createPublicClient({ chain, transport: http(undefined, { timeout: 10000, retryCount: 1 }) });
  }

  /**
   * Normalizes explorer data for the compiler.
   * Resolves standard proxy implementations and Diamond proxies automatically.
   * Merges proxy and implementation ABIs together to prevent missing interfaces.
   */
  public async normalize(address: string): Promise<NormalizedContractData> {
    // 1. Try standard proxy resolution from explorer
    let implementationAddress = await this.repository.resolveProxyImplementation(address);
    let isProxy = !!implementationAddress;
    
    // 1.5 Try raw EIP-1967 storage slot read if explorer failed
    if (!isProxy) {
        try {
            // EIP-1967 Implementation Slot: bytes32(uint256(keccak256('eip1967.proxy.implementation')) - 1)
            const EIP1967_SLOT = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
            const slotData = await this.client.getStorageAt({
                address: address as Address,
                slot: EIP1967_SLOT
            });
            // The slot returns a 32-byte hex. An address is the last 20 bytes (40 hex chars).
            if (slotData && slotData !== "0x" && slotData !== "0x0000000000000000000000000000000000000000000000000000000000000000") {
                const extractedAddress = "0x" + slotData.slice(26); // slice off the '0x' + 24 zeros
                isProxy = true;
                implementationAddress = extractedAddress;
                console.error(`[Normalizer] EIP-1967 Proxy detected via raw storage slot! Implementation: ${extractedAddress}`);
            } else {
                // Try Beacon Slot: bytes32(uint256(keccak256('eip1967.proxy.beacon')) - 1)
                const BEACON_SLOT = "0xa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d50";
                const beaconSlotData = await this.client.getStorageAt({
                    address: address as Address,
                    slot: BEACON_SLOT
                });
                if (beaconSlotData && beaconSlotData !== "0x" && beaconSlotData !== "0x0000000000000000000000000000000000000000000000000000000000000000") {
                    const beaconAddress = "0x" + beaconSlotData.slice(26);
                    // Now ask the beacon for the implementation
                    const implData = await this.client.readContract({
                        address: beaconAddress as Address,
                        abi: parseAbi(["function implementation() external view returns (address)"]),
                        functionName: 'implementation'
                    });
                    isProxy = true;
                    implementationAddress = implData as string;
                    console.error(`[Normalizer] EIP-1967 Beacon Proxy detected! Beacon: ${beaconAddress}, Implementation: ${implementationAddress}`);
                }
            }
        } catch (e) {
            // Ignore storage read failures
        }
    }
    
    // 1.75 Try EIP-1167 Minimal Proxy clone detection
    if (!isProxy) {
        try {
            const bytecode = await this.client.getBytecode({ address: address as Address });
            if (bytecode && bytecode.startsWith("0x363d3d373d3d3d363d73")) {
                // EIP-1167 minimal proxy bytecode pattern:
                // 363d3d373d3d3d363d73 <20 bytes> 5af43d82803e903d91602b57fd5bf3
                const extractedAddress = "0x" + bytecode.slice(22, 62);
                isProxy = true;
                implementationAddress = extractedAddress;
                console.error(`[Normalizer] EIP-1167 Minimal Clone detected! Implementation: ${extractedAddress}`);
            }
        } catch (e) {
            // Ignore bytecode read failures
        }
    }

    // 1.7 Resolve implementation-authority proxies (used by ERC-3643/TREX).
    if (!isProxy) {
        try {
            const authority = await this.client.readContract({
                address: address as Address,
                abi: parseAbi(["function getImplementationAuthority() view returns (address)"]),
                functionName: "getImplementationAuthority"
            });
            const implementation = await this.client.readContract({
                address: authority as Address,
                abi: parseAbi(["function getTokenImplementation() view returns (address)"]),
                functionName: "getTokenImplementation"
            });
            if (implementation && implementation !== "0x0000000000000000000000000000000000000000") {
                isProxy = true;
                implementationAddress = implementation as string;
            }
        } catch {
            // Not an implementation-authority token proxy.
        }
    }

    // 1.8 Try ABI signature proxy detection (checks if ABI exposes 'implementation()')
    if (!isProxy) {
        try {
            const rawAbi = await this.repository.fetchContractAbi(address);
            if (rawAbi) {
                const parsed = JSON.parse(rawAbi) as any[];
                const hasImplementationFn = parsed.some(item => 
                    item.type === "function" && 
                    item.name === "implementation" && 
                    (item.stateMutability === "view" || item.stateMutability === "pure" || item.constant === true) &&
                    item.outputs && item.outputs.length === 1 && item.outputs[0].type === "address"
                );
                if (hasImplementationFn) {
                    const implAddress = await this.client.readContract({
                        address: address as Address,
                        abi: parseAbi(["function implementation() external view returns (address)"]),
                        functionName: 'implementation'
                    });
                    if (implAddress && implAddress !== "0x0000000000000000000000000000000000000000") {
                        isProxy = true;
                        implementationAddress = implAddress as string;
                        console.error(`[Normalizer] Proxy detected via ABI inspection & on-chain implementation() call! Implementation: ${implAddress}`);
                    }
                }
            }
        } catch (e) {
            // Ignore failure to call implementation()
        }
    }
    
    // 2. Try Diamond Proxy resolution if no standard implementation was found
    let combinedAbi = "";
    let combinedSource = "";
    
    if (!isProxy) {
        try {
            // EIP-2535 Loupe function
            const facets = await this.client.readContract({
                address: address as Address,
                abi: parseAbi(["function facets() external view returns ((address facetAddress, bytes4[] functionSelectors)[])"]),
                functionName: 'facets'
            });
            
            const facetsArray = facets as any[];
            if (facetsArray && facetsArray.length > 0) {
                isProxy = true;
                implementationAddress = "DiamondProxy";
                console.error(`[Normalizer] Detected Diamond Proxy with ${facetsArray.length} facets.`);
                
                // Resolve every selected facet; partial explorer data must fail closed.
                const facetData = await Promise.all(
                    facetsArray.map(async (f: any) => ({
                        facet: f,
                        abi: await this.repository.fetchContractAbi(f.facetAddress),
                        source: await this.repository.fetchContractSource(f.facetAddress)
                    }))
                );
                const proxySource = await this.repository.fetchContractSource(address);
                const proxyAbi = await this.repository.fetchContractAbi(address);
                facetData.sort((a, b) => a.facet.facetAddress.toLowerCase().localeCompare(b.facet.facetAddress.toLowerCase()));
                let complete = hasSource(proxySource) && hasAbi(proxyAbi);
                const abis = facetData.map(({ facet, abi: raw, source }) => {
                    if (!hasAbi(raw) || !hasSource(source)) complete = false;
                    const items = hasAbi(raw) ? JSON.parse(raw!) : [];
                    const selected = new Set(facet.functionSelectors.map((s: string) => s.toLowerCase()));
                    const functions = items.filter((item: any) => item.type === "function" && selected.has(toFunctionSelector(abiSignature(item))));
                    if (functions.length !== selected.size) complete = false;
                    return items.filter((item: any) => item.type === "event" || item.type === "error").concat(functions);
                });
                const uniqueAbi = mergeAbis(...abis);
                combinedAbi = JSON.stringify(uniqueAbi);
                combinedSource = [proxySource, ...facetData
                    .map(d => d.source ? `// Facet ${d.facet.facetAddress.toLowerCase()}\n${d.source}` : "")].filter(Boolean).join("\n");
                
                // Try to resolve name & compiler version for the proxy itself
                let name = "DiamondProxy";
                let compiler = "Unknown";
                if (this.repository.fetchContractName) {
                    name = (await this.repository.fetchContractName(address)) || "DiamondProxy";
                }
                if (this.repository.fetchCompilerVersion) {
                    compiler = (await this.repository.fetchCompilerVersion(address)) || "Unknown";
                }

                return {
                    address,
                    isProxy,
                    implementationAddress,
                    abi: combinedAbi,
                    sourceCode: combinedSource,
                    contractName: name,
                    compilerVersion: compiler,
                    sourceVerified: complete,
                    facets: facetsArray.map(f => ({ address: f.facetAddress.toLowerCase(), selectors: [...f.functionSelectors].map((s: string) => s.toLowerCase()).sort() }))
                };
            }
        } catch (e) {
            // Once a diamond was detected, never downgrade incomplete resolution to a base contract.
            if (implementationAddress === "DiamondProxy") throw e;
        }
    }

    // 3. Retrieve ABIs and Source Codes
    let abi: string | null = null;
    let sourceCode: string | null = null;
    let name: string = "Unknown";
    let compiler: string = "Unknown";
    let sourceVerified = false;

    const targetAddress = implementationAddress && implementationAddress !== "DiamondProxy" ? implementationAddress : address;

    // Fetch metadata (name, compiler) from Blockscout for target implementation or base contract
    if (this.repository.fetchContractName) {
        name = (await this.repository.fetchContractName(targetAddress)) || "Unknown";
    }
    if (this.repository.fetchCompilerVersion) {
        compiler = (await this.repository.fetchCompilerVersion(targetAddress)) || "Unknown";
    }

    if (isProxy && implementationAddress && implementationAddress !== "DiamondProxy") {
        console.error(`[Normalizer] Fetching and merging proxy (${address}) and implementation (${implementationAddress}) ABIs...`);
        const [proxyAbiRaw, implAbiRaw, proxySourceRaw, implSourceRaw] = await Promise.all([
            this.repository.fetchContractAbi(address),
            this.repository.fetchContractAbi(implementationAddress),
            this.repository.fetchContractSource(address),
            this.repository.fetchContractSource(implementationAddress)
        ]);

        let proxyAbi: any[] = [];
        let implAbi: any[] = [];

        try {
            if (proxyAbiRaw) proxyAbi = JSON.parse(proxyAbiRaw);
        } catch (e) {
            // ignore
        }

        try {
            if (implAbiRaw) implAbi = JSON.parse(implAbiRaw);
        } catch (e) {
            // ignore
        }

        sourceVerified = hasAbi(proxyAbiRaw) && hasAbi(implAbiRaw) && hasSource(proxySourceRaw) && hasSource(implSourceRaw);
        const mergedAbiArray = mergeAbis(Array.isArray(proxyAbi) ? proxyAbi : [], Array.isArray(implAbi) ? implAbi : []);
        abi = JSON.stringify(mergedAbiArray);

        // Combine source codes cleanly
        const proxySource = proxySourceRaw ? `// Proxy Contract (${address.toLowerCase()})\n${proxySourceRaw}\n` : "";
        const implSource = implSourceRaw ? `// Implementation Contract (${implementationAddress.toLowerCase()})\n${implSourceRaw}\n` : "";
        sourceCode = (proxySource + "\n" + implSource).trim() || null;
    } else {
        const [fetchedAbi, fetchedSource] = await Promise.all([
            this.repository.fetchContractAbi(targetAddress),
            this.repository.fetchContractSource(targetAddress)
        ]);
        abi = fetchedAbi;
        sourceCode = fetchedSource;
        sourceVerified = hasAbi(fetchedAbi) && hasSource(fetchedSource);
    }

    // Fix 2: Unflatten JSON source code (Blockscout specific quirk)
    if (sourceCode && sourceCode.startsWith("{") && sourceCode.endsWith("}")) {
        try {
            let cleanJson = sourceCode;
            if (cleanJson.startsWith("{{") && cleanJson.endsWith("}}")) {
                cleanJson = cleanJson.slice(1, -1);
            }
            const parsed = JSON.parse(cleanJson);
            if (parsed.sources) {
                let combined = "";
                for (const [filePath, content] of Object.entries(parsed.sources).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0) as any) {
                    combined += `// File: ${filePath}\n${content.content}\n\n`;
                }
                sourceCode = combined;
                console.error(`[Normalizer] Successfully unflattened ${Object.keys(parsed.sources).length} files from JSON source.`);
            }
        } catch (e) {
            console.error(`[Normalizer] JSON parsing failed for source code, keeping as text.`);
        }
    }

    // Fallback for unverified contracts (Decompilation Pipeline)
    if (!abi || abi === "[]") {
        console.error(`[Normalizer] Contract unverified. Falling back to bytecode decompilation...`);
        const { BytecodeDecompiler } = await import("./bytecode.js");
        const decompiler = new BytecodeDecompiler();
        const pseudoAbi = await decompiler.generatePseudoAbi(targetAddress);
        if (pseudoAbi) {
            abi = pseudoAbi;
            sourceCode = "// Unverified Contract: Pseudo-ABI generated from bytecode selectors";
            sourceVerified = false;
        }
    }

    return {
      address,
      isProxy,
      implementationAddress,
      abi,
      sourceCode,
      contractName: name,
      compilerVersion: compiler,
      sourceVerified
    };
  }
}
