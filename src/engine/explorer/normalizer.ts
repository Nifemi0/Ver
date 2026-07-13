import { IExplorerRepository } from "./repository.interface";
import { createPublicClient, http, Address, parseAbi } from "viem";

export interface NormalizedContractData {
  address: string;
  isProxy: boolean;
  implementationAddress: string | null;
  abi: string | null;
  sourceCode: string | null;
  contractName?: string;
  compilerVersion?: string;
}

// Proxy slot reads must hit the same chain as X Layer Mainnet.
const XLAYER_CHAIN = {
  id: 196,
  name: "X Layer Mainnet",
  nativeCurrency: { name: "OKB", symbol: "OKB", decimals: 18 },
  rpcUrls: { default: { http: [process.env.XLAYER_RPC_URL ?? process.env.RPC_URL ?? "https://rpc.xlayer.tech"] } },
} as const;

export class DataNormalizer {
  private repository: IExplorerRepository;
  private client = createPublicClient({ chain: XLAYER_CHAIN, transport: http() });

  // Dependency Inversion: Compiler doesn't know about Blockscout
  constructor(repository: IExplorerRepository) {
    this.repository = repository;
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
                console.log(`[Normalizer] EIP-1967 Proxy detected via raw storage slot! Implementation: ${extractedAddress}`);
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
                    console.log(`[Normalizer] EIP-1967 Beacon Proxy detected! Beacon: ${beaconAddress}, Implementation: ${implementationAddress}`);
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
                console.log(`[Normalizer] EIP-1167 Minimal Clone detected! Implementation: ${extractedAddress}`);
            }
        } catch (e) {
            // Ignore bytecode read failures
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
                        console.log(`[Normalizer] Proxy detected via ABI inspection & on-chain implementation() call! Implementation: ${implAddress}`);
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
                abi: parseAbi(["function facets() external view returns (tuple(address facetAddress, bytes4[] functionSelectors)[])"]),
                functionName: 'facets'
            });
            
            const facetsArray = facets as any[];
            if (facetsArray && facetsArray.length > 0) {
                isProxy = true;
                implementationAddress = "DiamondProxy";
                console.log(`[Normalizer] Detected Diamond Proxy with ${facetsArray.length} facets.`);
                
                // Fetch ABIs for all facets in parallel
                const facetData = await Promise.all(
                    facetsArray.map((f: any) => this.repository.fetchContractAbi(f.facetAddress))
                );
                
                const abis = facetData.filter(Boolean).map((a: any) => JSON.parse(a as string));
                const flatAbi = abis.flat();
                
                // Deduplicate ABI items by name/type
                const uniqueAbi = Array.from(new Map(flatAbi.map((item: any) => 
                    [item.name + item.type, item]
                )).values());
                
                combinedAbi = JSON.stringify(uniqueAbi);
                combinedSource = "// Diamond Proxy Facets Combined Source";
                
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
                    compilerVersion: compiler
                };
            }
        } catch (e) {
            // Not a diamond proxy
        }
    }

    // 3. Retrieve ABIs and Source Codes
    let abi: string | null = null;
    let sourceCode: string | null = null;
    let name: string = "Unknown";
    let compiler: string = "Unknown";

    const targetAddress = implementationAddress && implementationAddress !== "DiamondProxy" ? implementationAddress : address;

    // Fetch metadata (name, compiler) from Blockscout for target implementation or base contract
    if (this.repository.fetchContractName) {
        name = (await this.repository.fetchContractName(targetAddress)) || "Unknown";
    }
    if (this.repository.fetchCompilerVersion) {
        compiler = (await this.repository.fetchCompilerVersion(targetAddress)) || "Unknown";
    }

    if (isProxy && implementationAddress && implementationAddress !== "DiamondProxy") {
        console.log(`[Normalizer] Fetching and merging proxy (${address}) and implementation (${implementationAddress}) ABIs...`);
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

        // Deduplicate functions, events, and custom errors by type/name.
        // Implementation overrides proxy parameters for matching signatures.
        const mergedMap = new Map<string, any>();
        const getKey = (item: any) => {
            if (!item || !item.type) return `unknown:${Math.random()}`;
            if (item.type === "function") return `function:${item.name || ""}`;
            if (item.type === "event") return `event:${item.name || ""}`;
            if (item.type === "error") return `error:${item.name || ""}`;
            return `${item.type}:${Math.random()}`;
        };

        for (const item of proxyAbi) {
            mergedMap.set(getKey(item), item);
        }
        for (const item of implAbi) {
            mergedMap.set(getKey(item), item);
        }

        const mergedAbiArray = Array.from(mergedMap.values());
        abi = JSON.stringify(mergedAbiArray);

        // Combine source codes cleanly
        const proxySource = proxySourceRaw ? `// Proxy Contract (${address})\n${proxySourceRaw}\n` : "";
        const implSource = implSourceRaw ? `// Implementation Contract (${implementationAddress})\n${implSourceRaw}\n` : "";
        sourceCode = proxySource + "\n" + implSource;
    } else {
        const [fetchedAbi, fetchedSource] = await Promise.all([
            this.repository.fetchContractAbi(targetAddress),
            this.repository.fetchContractSource(targetAddress)
        ]);
        abi = fetchedAbi;
        sourceCode = fetchedSource;
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
                for (const [filePath, content] of Object.entries(parsed.sources) as any) {
                    combined += `// File: ${filePath}\n${content.content}\n\n`;
                }
                sourceCode = combined;
                console.log(`[Normalizer] Successfully unflattened ${Object.keys(parsed.sources).length} files from JSON source.`);
            }
        } catch (e) {
            console.log(`[Normalizer] JSON parsing failed for source code, keeping as text.`);
        }
    }

    // Fallback for unverified contracts (Decompilation Pipeline)
    if (!abi || abi === "[]") {
        console.log(`[Normalizer] Contract unverified. Falling back to bytecode decompilation...`);
        const { BytecodeDecompiler } = await import("./bytecode.js");
        const decompiler = new BytecodeDecompiler();
        const pseudoAbi = await decompiler.generatePseudoAbi(targetAddress);
        if (pseudoAbi) {
            abi = pseudoAbi;
            sourceCode = "// Unverified Contract: Pseudo-ABI generated from bytecode selectors";
        }
    }

    return {
      address,
      isProxy,
      implementationAddress,
      abi,
      sourceCode,
      contractName: name,
      compilerVersion: compiler
    };
  }
}
