import { VerCache, CURRENT_SCHEMA_VERSION } from "../engine/cache";
import { serializeAbiValue } from "../engine/serialize";
import { abiSignature } from "../engine/abi";
import { SemanticCache } from "../engine/enrichment/semantic.cache";
import { BlockscoutRepository } from "../engine/explorer/blockscout.repository";
import { XLayerExplorerRepository } from "../engine/explorer/xlayer.repository";
import { IExplorerRepository } from "../engine/explorer/repository.interface";
import { DataNormalizer } from "../engine/explorer/normalizer";
import { CompilerPipeline } from "../engine/compiler/pipeline";
import { SemanticEnricher, ILLMProvider } from "../engine/enrichment/enricher";
import { VerSchema } from "../types/schema";
import { decodeFunctionData, decodeFunctionResult, encodeFunctionData, createPublicClient, http, Address, parseAbi, parseUnits, formatUnits, isAddress, toFunctionSelector } from "viem";
import { GenericLLMProvider } from "../engine/enrichment/llm.provider";
import { getChainById, getExplorerApiUrlForChain, getExplorerUrlForChain } from "../chain/networks";
import { getRegistryAddressForChain, lookupGraph } from "../chain/registry";

// Chain parameters matching blockscout
export class VerClient {
  private cache: VerCache;
  private semanticCache: SemanticCache;
  private repo: IExplorerRepository;
  private normalizer: DataNormalizer;
  private compiler: CompilerPipeline;
  private enricher: SemanticEnricher;
  private client;
  private llmProvider: ILLMProvider;
  private readonly chain;
  private readonly cacheKeyPrefix: string;

  constructor(llmProvider?: ILLMProvider, chainId?: number, explorerRepository?: IExplorerRepository) {
    this.chain = getChainById(chainId);
    this.cacheKeyPrefix = `graph-${CURRENT_SCHEMA_VERSION}:${this.chain.id}:`;
    this.client = createPublicClient({ chain: this.chain, transport: http(undefined, { timeout: 10000, retryCount: 1 }) });
    this.cache = new VerCache();
    this.semanticCache = new SemanticCache();
    this.repo = explorerRepository ?? (this.chain.id === 196
      ? new XLayerExplorerRepository()
      : new BlockscoutRepository(getExplorerApiUrlForChain(this.chain.id), false));
    this.normalizer = new DataNormalizer(this.repo, this.chain);
    this.compiler = new CompilerPipeline();
    const provider = llmProvider || new GenericLLMProvider();
    this.llmProvider = provider;
    this.enricher = new SemanticEnricher(provider);
  }

  public async getProtocolGraph(address: string, forceRefresh = false): Promise<VerSchema> {
    if (!isAddress(address)) throw new Error("Invalid contract address");
    const cacheKey = `${this.cacheKeyPrefix}${address.toLowerCase()}`;
    let graph = this.cache.get(cacheKey);

    if (!graph || forceRefresh) {
        const normalized = await this.normalizer.normalize(address);
        const input: any = {
            address: normalized.address,
            abi: normalized.abi ? JSON.parse(normalized.abi) : [],
            source: normalized.sourceCode,
            isProxy: normalized.isProxy,
            implementation: normalized.implementationAddress,
            chainId: this.chain.id,
            sourceVerified: normalized.sourceVerified,
            facets: normalized.facets,
            metadata: {
                protocolName: normalized.contractName || "Unknown",
                compilerVersion: normalized.compilerVersion || "Unknown"
            },
            deploymentNetwork: this.chain.id === 968 ? "BOT Chain Testnet" : "X Layer Mainnet",
            depth: 0,
            maxDepth: 1,
            visited: new Set()
        };
        const { graph: compiledGraph } = await this.compiler.compile(input);
        graph = compiledGraph;
        this.cache.set(cacheKey, graph);
    }

    // Mutable authorization must never inherit the structural graph's cache TTL.
    // Work on a copy so overlapping callers cannot mutate one another's response.
    graph = structuredClone(graph);
    graph.registry = {
      ...graph.registry!, registered: false, verified: false, metadataURI: "",
      registryAddress: getRegistryAddressForChain(this.chain.id),
      lookupStatus: process.env.VER_REGISTRY_LOOKUP === "false" ? "disabled" : "unavailable",
    };
    if (process.env.VER_REGISTRY_LOOKUP !== "false") {
      try {
        const attestation = await lookupGraph(address, this.chain.id);
        graph.registry.checkedAt = new Date().toISOString();
        if (attestation) {
          const activeHash = attestation.graphHash.toLowerCase();
          graph.registry = {
            ...graph.registry,
            registered: activeHash !== `0x${"0".repeat(64)}`,
            verified: attestation.verified && activeHash === graph.registry.graphHash.toLowerCase(),
            metadataURI: attestation.metadataURI,
            registryAddress: attestation.registryAddress,
            lookupStatus: "checked",
          };
        }
      } catch (error) {
        graph.registry.checkedAt = new Date().toISOString();
        console.warn("[Registry] Attestation lookup unavailable", error);
      }
    }
    const promptVersion = this.enricher.promptVersion;
    const semanticKey = `${cacheKey}:${graph.registry.graphHash}`;
    const cachedSemantic = this.semanticCache.get(semanticKey, promptVersion);

    if (cachedSemantic) {
        graph.semantic = cachedSemantic.semantic;
        graph.security = cachedSemantic.security;
        graph.developer = cachedSemantic.developer;
        graph.semantic.semantic_status = "COMPLETE";
    } else {
        const { graph: enrichedGraph, diagnostics } = await this.enricher.enrich(graph);
        graph = enrichedGraph;
        if (diagnostics.status === "COMPLETE") {
            this.semanticCache.set(semanticKey, promptVersion, {
                semantic: graph.semantic,
                security: graph.security,
                developer: graph.developer
            });
        }
    }

    return graph;
  }

  public async getContractSummary(address: string): Promise<any> {
     const graph = await this.getProtocolGraph(address);
     return {
         protocol_name: graph.metadata.protocol_name,
         intent: graph.semantic.intent?.value || "Unknown",
         structural_integrity: graph.semantic.structural_integrity_score,
         roles: graph.structural.roles.map(r => r.name),
         dependencies: graph.structural.dependencies.map(d => d.target),
         privileged_functions: graph.security.privileged_functions.map(f => f.name)
     };
  }

  public async explainTransaction(address: string, calldata: string): Promise<any> {
      const graph = await this.getProtocolGraph(address);
      if (!graph.metadata.contract_address) throw new Error("Invalid graph");

      const abiRaw = (await this.normalizer.normalize(address)).abi;
      if (!abiRaw) throw new Error("No ABI found for decoding");
      
      const abi = JSON.parse(abiRaw);

      try {
         const decoded = decodeFunctionData({ abi, data: calldata as any });
         const item = abi.find((f: any) => f.type === "function" && toFunctionSelector(abiSignature(f)) === calldata.slice(0, 10).toLowerCase());
         const signature = item ? abiSignature(item) : undefined;
         const readOnly = item?.stateMutability === "view" || item?.stateMutability === "pure";
         const funcInfo = graph.security.privileged_functions.find(f => f.signature === signature && signature !== undefined)
            || { classification: readOnly ? "read-only" : "unknown", reason: readOnly ? "ABI declares no state mutation" : "Access control has not been established" };

         return {
            function: decoded.functionName,
            signature,
            args: serializeAbiValue(decoded.args ?? []),
            classification: funcInfo.classification,
            reason: funcInfo.reason
         };
      } catch (e: any) {
         return { error: "Failed to decode transaction", details: e.message };
      }
  }

  public async simulateTransaction(to: string, data: string, from?: string, value?: string): Promise<any> {
      const { TransactionSimulator } = await import("../engine/simulator.js");
      const simulator = new TransactionSimulator(this.chain);
      return await simulator.simulate(to, data, from, value);
  }

  public async readContract(address: string, data: string): Promise<any> {
      const { TransactionSimulator } = await import("../engine/simulator.js");
      const simulator = new TransactionSimulator(this.chain);
      return await simulator.read(address, data);
  }

  public async getSourceCode(address: string): Promise<string | null> {
      const normalized = await this.normalizer.normalize(address);
      return normalized.sourceCode;
  }

  public async searchProtocol(address: string, query: string): Promise<any[]> {
      const graph = await this.getProtocolGraph(address);
      const results: any[] = [];
      const q = query.toLowerCase();

      for (const func of graph.security.privileged_functions) {
          if (func.name.toLowerCase().includes(q)) results.push({ type: "privileged_function", ...func });
      }
      const normalized = await this.normalizer.normalize(address);
      const privileged = new Set(graph.security.privileged_functions.map(f => f.signature));
      for (const func of JSON.parse(normalized.abi || "[]")) {
          if (func.type === "function" && !privileged.has(abiSignature(func)) && func.name.toLowerCase().includes(q)) {
              results.push({ type: "public_function", name: func.name, signature: abiSignature(func), inputs: func.inputs, stateMutability: func.stateMutability,
                classification: func.stateMutability === "view" || func.stateMutability === "pure" ? "read-only" : "unknown" });
          }
      }
      for (const role of graph.structural.roles) {
          if (role.name.toLowerCase().includes(q)) results.push({ type: "role", ...role });
      }
      for (const event of graph.structural.events) {
          if (event.name.toLowerCase().includes(q)) results.push({ type: "event", ...event });
      }

      return results;
  }

  /**
   * Fetches standardized ERC metadata (name, symbol, decimals, type) in one-shot
   */
  public async getTokenMetadata(address: string): Promise<any> {
      const results: any = {
          name: "Unknown",
          symbol: "Unknown",
          decimals: null,
          totalSupply: null,
          isERC20: false,
          isERC721: false
      };

      try {
          const namePromise = this.client.readContract({
              address: address as Address,
              abi: parseAbi(["function name() external view returns (string)"]),
              functionName: "name"
          }).catch(() => null);

          const symbolPromise = this.client.readContract({
              address: address as Address,
              abi: parseAbi(["function symbol() external view returns (string)"]),
              functionName: "symbol"
          }).catch(() => null);

          const decimalsPromise = this.client.readContract({
              address: address as Address,
              abi: parseAbi(["function decimals() external view returns (uint8)"]),
              functionName: "decimals"
          }).catch(() => null);

          const totalSupplyPromise = this.client.readContract({
              address: address as Address,
              abi: parseAbi(["function totalSupply() external view returns (uint256)"]),
              functionName: "totalSupply"
          }).catch(() => null);

          const supportsInterfacePromise = this.client.readContract({
              address: address as Address,
              abi: parseAbi(["function supportsInterface(bytes4) external view returns (bool)"]),
              functionName: "supportsInterface",
              args: ["0x80ac58cd"] // ERC721 interface ID
          }).catch(() => false);

          const [nameVal, symbolVal, decimalsVal, totalSupplyVal, isErc721] = await Promise.all([
              namePromise,
              symbolPromise,
              decimalsPromise,
              totalSupplyPromise,
              supportsInterfacePromise
          ]);

          if (nameVal) results.name = nameVal;
          if (symbolVal) results.symbol = symbolVal;
          if (decimalsVal !== null) {
              results.decimals = Number(decimalsVal);
              results.isERC20 = true;
          }
          if (totalSupplyVal !== null) {
              results.totalSupply = totalSupplyVal.toString();
          }
          if (isErc721) {
              results.isERC721 = true;
              results.isERC20 = false;
          }
      } catch (e) {
          // ignore
      }

      return results;
  }

  /**
   * Decodes a raw transaction event log from topics and data
   */
  public async decodeEventLog(address: string, topics: string[], data: string): Promise<any> {
      const abiRaw = (await this.normalizer.normalize(address)).abi;
      if (!abiRaw) throw new Error("No ABI found for event decoding");
      
      const abi = JSON.parse(abiRaw);
      const { decodeEventLog } = await import("viem");

      try {
          const decoded = decodeEventLog({
              abi,
              topics: topics as any,
              data: data as any
          }) as any;

          return {
              eventName: decoded.eventName,
              args: serializeAbiValue(decoded.args ?? {})
          };
      } catch (e: any) {
          return { error: "Failed to decode event log", details: e.message };
      }
  }

  /**
   * Estimates gas and returns exact base units with the selected native currency.
   */
  public async getGasEstimate(to: string, data: string, from?: string, value?: string): Promise<any> {
      try {
          const parsedValue = value ? BigInt(value) : undefined;
          const gasEstimate = await this.client.estimateGas({
              to: to as Address,
              data: data as `0x${string}`,
              account: from ? (from as Address) : undefined,
              value: parsedValue
          });

          const gasPrice = await this.client.getGasPrice();
          const totalCost = gasEstimate * gasPrice;

          return {
              gasEstimate: gasEstimate.toString(),
              gasPrice: gasPrice.toString(),
              chainId: this.chain.id,
              nativeCurrency: this.chain.nativeCurrency.symbol,
              estimatedCostWei: totalCost.toString(),
              estimatedCostNative: formatUnits(totalCost, this.chain.nativeCurrency.decimals)
          };
      } catch (e: any) {
          return { error: "Failed to estimate gas", details: e.message };
      }
  }

  /**
   * Diffs two Protocol Graphs to detect structural changes, role additions/removals, 
   * new dependencies, and function privilege changes.
   */
  public async diffProtocolGraphs(addressA: string, addressB: string): Promise<any> {
      const [graphA, graphB] = await Promise.all([
          this.getProtocolGraph(addressA),
          this.getProtocolGraph(addressB)
      ]);

      const diff: any = {
          metadata: {
              addressA: graphA.metadata.contract_address,
              nameA: graphA.metadata.protocol_name,
              addressB: graphB.metadata.contract_address,
              nameB: graphB.metadata.protocol_name,
              schemaVersionA: graphA.metadata.schema_version,
              schemaVersionB: graphB.metadata.schema_version
          },
          structural: {
              roles: { added: [] as string[], removed: [] as string[] },
              dependencies: { added: [] as string[], removed: [] as string[] },
              events: { added: [] as string[], removed: [] as string[] }
          },
          security: {
              privileged_functions: { added: [] as any[], removed: [] as any[] }
          },
          integrityScore: {
              scoreA: graphA.semantic.structural_integrity_score,
              scoreB: graphB.semantic.structural_integrity_score,
              change: graphB.semantic.structural_integrity_score - graphA.semantic.structural_integrity_score
          }
      };

      const getDiff = (arrayA: string[], arrayB: string[]) => {
          const setA = new Set(arrayA.map(x => x.toLowerCase()));
          const setB = new Set(arrayB.map(x => x.toLowerCase()));
          const added = arrayB.filter(x => !setA.has(x.toLowerCase()));
          const removed = arrayA.filter(x => !setB.has(x.toLowerCase()));
          return { added, removed };
      };

      const roleDiff = getDiff(
          graphA.structural.roles.map(r => r.name),
          graphB.structural.roles.map(r => r.name)
      );
      diff.structural.roles = roleDiff;

      const depDiff = getDiff(
          graphA.structural.dependencies.map(d => d.target),
          graphB.structural.dependencies.map(d => d.target)
      );
      diff.structural.dependencies = depDiff;

      const eventDiff = getDiff(
          graphA.structural.events.map(e => e.name),
          graphB.structural.events.map(e => e.name)
      );
      diff.structural.events = eventDiff;

      const funcNameA = graphA.security.privileged_functions.map(f => f.name.toLowerCase());
      const funcNameB = graphB.security.privileged_functions.map(f => f.name.toLowerCase());

      const addedFuncs = graphB.security.privileged_functions.filter(f => !funcNameA.includes(f.name.toLowerCase()));
      const removedFuncs = graphA.security.privileged_functions.filter(f => !funcNameB.includes(f.name.toLowerCase()));

      diff.security.privileged_functions = {
          added: addedFuncs,
          removed: removedFuncs
      };

      return diff;
  }

  private tryDeterministicIntentParser(intent: string): any | null {
      const cleanIntent = intent.trim().replace(/\s+/g, " ");
      
      // 1. Matches "Transfer 1.5 USDT to 0x1111..."
      const transferRegex = /^transfer\s+(\d+(?:\.\d+)?)\s+([A-Za-z0-9._-]+)\s+to\s+(0x[a-fA-F0-9]{40})$/i;
      const transferMatch = cleanIntent.match(transferRegex);
      if (transferMatch) {
          return {
              functionName: "transfer",
              assetSymbol: transferMatch[2],
              args: {
                  recipient: { value: transferMatch[3], isUnscaledTokenAmount: false },
                  amount: { value: transferMatch[1], isUnscaledTokenAmount: true }
              }
          };
      }

      // 2. Matches "Approve 500 USDC to/for 0x2222..."
      const approveRegex = /^approve\s+(\d+(?:\.\d+)?)\s+([A-Za-z0-9._-]+)\s+(?:to|for)\s+(0x[a-fA-F0-9]{40})$/i;
      const approveMatch = cleanIntent.match(approveRegex);
      if (approveMatch) {
          return {
              functionName: "approve",
              assetSymbol: approveMatch[2],
              args: {
                  spender: { value: approveMatch[3], isUnscaledTokenAmount: false },
                  amount: { value: approveMatch[1], isUnscaledTokenAmount: true }
              }
          };
      }

      return null;
  }

  /**
   * Wallet intent preparation. The legacy method name remains compatible.
   * Prepares exact unsigned calldata; simulation is not a safety guarantee.
   */
  public async compileAgentIntent(
      address: string,
      intent: string,
      sender?: string,
      value?: string
  ): Promise<any> {
      const blocked = (code: string, error: string) => ({ success: false, signable: false, simulationStatus: "skipped", risk: "blocked", blockingReasons: [code], error });
      if (!isAddress(address) || (sender !== undefined && !isAddress(sender))) return blocked("INVALID_ADDRESS", "Valid contract and sender addresses are required.");
      if (typeof intent !== "string" || !intent.trim() || intent.length > 1000) return blocked("INVALID_INTENT", "Intent must be between 1 and 1000 characters.");
      if (value !== undefined && !/^\d+$/.test(value)) return blocked("INVALID_VALUE", "Value must be a base-10 wei integer.");
      if (value !== undefined && BigInt(value) !== 0n) return blocked("UNSUPPORTED_NATIVE_VALUE", "Token approvals and transfers must have zero native value.");
      // A model must never turn unsupported/negated/conditional text into signing authority.
      const parsed = this.tryDeterministicIntentParser(intent);
      if (!parsed) return blocked("UNSUPPORTED_INTENT", "Use a single complete 'approve AMOUNT SYMBOL to ADDRESS' or 'transfer AMOUNT SYMBOL to ADDRESS' request. Conditions, negations and compound actions are not supported.");
      if (await this.client.getChainId() !== this.chain.id) return blocked("RPC_CHAIN_MISMATCH", "RPC network does not match the requested chain.");
      const bytecode = await this.client.getBytecode({ address: address as Address });
      if (!bytecode || bytecode === "0x") throw new Error(`No contract bytecode at ${address} on chain ${this.chain.id}`);
      const normalized = await this.normalizer.normalize(address);
      const abiRaw = normalized.abi;
      if (!abiRaw || normalized.sourceVerified !== true || !normalized.sourceCode?.trim() || normalized.sourceCode.includes("Pseudo-ABI generated")) {
        throw new Error("A verified ABI and complete verified source are required for wallet transaction preparation");
      }
      const abi = JSON.parse(abiRaw);

      // Filter to write functions (non-view/pure functions)
      const writeFunctions = abi.filter((x: any) => 
          x.type === 'function' && 
          x.stateMutability !== 'view' && 
          x.stateMutability !== 'pure'
      );

      const symbol = await this.client.readContract({ address: address as Address, abi: parseAbi(["function symbol() view returns (string)"]), functionName: "symbol" });
      if (typeof symbol !== "string" || parsed.assetSymbol.toLowerCase() !== symbol.toLowerCase()) return blocked("TOKEN_SYMBOL_MISMATCH", "Intent token symbol does not match the target contract.");

      // Check if we need decimals and retrieve them
      let decimals: number | undefined;
      const hasUnscaled = Object.values(parsed.args || {}).some((a: any) => (a as any).isUnscaledTokenAmount);
      if (hasUnscaled) {
          const dec = await this.client.readContract({
                  address: address as Address,
                  abi: parseAbi(["function decimals() view returns (uint8)"]),
                  functionName: "decimals"
          });
          decimals = Number(dec);
          if (!Number.isInteger(decimals) || decimals < 0 || decimals > 255) throw new Error("Invalid token decimals");
      }

      const matchingFunctions = writeFunctions.filter((f: any) => f.name === parsed.functionName && f.inputs?.length === 2 && f.inputs[0].type === "address" && f.inputs[1].type === "uint256");
      const abiFunc = matchingFunctions[0];
      if (matchingFunctions.length !== 1) return blocked("UNSUPPORTED_FUNCTION", "An unambiguous standard token function is required.");
      const outputs = abiFunc.outputs ?? [];
      if (outputs.length > 1 || (outputs.length === 1 && outputs[0].type !== "bool")) return blocked("UNSUPPORTED_RETURN_TYPE", "This token return type is not supported.");

      const resolvedArgs: any[] = [];
      for (const input of abiFunc.inputs || []) {
          let parsedArg = parsed.args?.[input.name];
          if (parsedArg === undefined) {
              // Fallback to standard parameter name aliases
              if (input.type === "address") {
                  parsedArg = parsed.args?.recipient || parsed.args?.to || parsed.args?.spender;
              } else if (input.type.startsWith("uint") || input.type.startsWith("int")) {
                  parsedArg = parsed.args?.amount || parsed.args?.value || parsed.args?.wad || parsed.args?.assets;
              }
          }

          if (parsedArg === undefined) {
              throw new Error(`Missing argument ${input.name} in parsed intent`);
          }
          
          let val: any = parsedArg.value;
          if (parsedArg.isUnscaledTokenAmount) {
              if (decimals === undefined || typeof val !== "string" || !/^\d+(\.\d+)?$/.test(val)) {
                throw new Error(`Invalid exact token amount: ${val}`);
              }
              if ((val.split(".")[1]?.length ?? 0) > decimals) return blocked("AMOUNT_PRECISION_EXCEEDED", "Amount has more fractional digits than the token supports; rounding is not allowed.");
              val = parseUnits(val, decimals);
              if (val >= 2n ** 256n) return blocked("AMOUNT_OUT_OF_RANGE", "Amount exceeds uint256.");
          } else {
              if (input.type.startsWith("uint") || input.type.startsWith("int")) {
                  val = BigInt(val);
              } else if (input.type === "bool") {
                  val = val === "true" || val === true;
              }
          }
          if (input.type === "address" && (!isAddress(val) || /^0x0{40}$/i.test(val))) return blocked("INVALID_RECIPIENT", "A valid non-zero recipient or spender is required.");
          resolvedArgs.push(val);
      }

      const encodedCalldata = encodeFunctionData({
          abi: [abiFunc],
          functionName: parsed.functionName,
          args: resolvedArgs
      });

      // Simulation Guardrail — only run when a sender is provided.
      // Without a sender, eth_call runs from the zero address and every
      // transfer-like call reverts, which reads as a broken capability to
      // automated reviewers. Calldata is already ABI-verified at encode time.
      let simulationStatus: "success" | "reverted" | "skipped" | "failed" | "unavailable" = "skipped";
      let simulationCode = "SIMULATION_REQUIRED";
      let simulationError: string | undefined;
      let simulationResult: string | undefined;

      if (sender) {
        try {
          const simResult = await this.client.call({
            to: address as Address,
            data: encodedCalldata,
            account: sender as Address,
            value: value ? BigInt(value) : undefined,
          });
          simulationStatus = "success";
          simulationResult = simResult.data || "0x";
          if (outputs.length === 0) {
              if (simulationResult !== "0x") { simulationStatus = "failed"; simulationCode = "INVALID_SIMULATION_RESULT"; }
          } else {
              try {
                  const returned = decodeFunctionResult({ abi: [abiFunc], functionName: parsed.functionName, data: simulationResult as `0x${string}` });
                  if (simulationResult.length !== 66 || returned !== true) { simulationStatus = "failed"; simulationCode = "TOKEN_RETURNED_FALSE"; }
              } catch { simulationStatus = "failed"; simulationCode = "INVALID_SIMULATION_RESULT"; }
          }
        } catch (e: any) {
          const reverted = /revert/i.test(e.shortMessage ?? "") || Boolean(e.walk?.((cause: any) => /ExecutionReverted|ContractFunctionReverted/.test(cause.name)));
          simulationStatus = reverted ? "reverted" : "unavailable";
          simulationCode = reverted ? "SIMULATION_REVERTED" : "RPC_UNAVAILABLE";
          simulationError = reverted ? "Contract execution reverted." : "Simulation provider unavailable. Retry preparation.";
        }
      }

      const serializeValue = (val: any): any => {
          if (typeof val === "bigint") return val.toString();
          if (Array.isArray(val)) return val.map(serializeValue);
          return val;
      };

      // A successful simulation proves execution is possible, not that the
      // user should approve it. Keep every signable result review-gated.
      const signable = simulationStatus === "success";
      const blockingReasons = signable ? [] : [simulationCode];
      const risk = signable ? "review" : "blocked";
      const explorerBase = getExplorerUrlForChain(this.chain.id);

      return {
          success: true,
          chainId: this.chain.id,
          network: this.chain.name,
          to: address,
          value: value ?? "0",
          functionName: parsed.functionName,
          args: resolvedArgs.map(serializeValue),
          encodedCalldata,
          simulationStatus,
          simulationError,
          simulationResult,
          risk,
          signable,
          blockingReasons,
          requiresUserConfirmation: true,
          sender,
          preparedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 60000).toISOString(),
          explanation: `${parsed.functionName} call prepared for ${this.chain.name}. Review the target, arguments, value, and simulation before signing.`,
          transaction: {
            chainId: this.chain.id,
            ...(sender ? { from: sender } : {}),
            to: address,
            data: encodedCalldata,
            value: value ?? "0"
          },
          explorer: `${explorerBase}/address/${address}`
      };
  }
}
