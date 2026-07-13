import { VerCache } from "../engine/cache";
import { SemanticCache } from "../engine/enrichment/semantic.cache";
import { BlockscoutRepository } from "../engine/explorer/blockscout.repository";
import { DataNormalizer } from "../engine/explorer/normalizer";
import { CompilerPipeline } from "../engine/compiler/pipeline";
import { SemanticEnricher, ILLMProvider } from "../engine/enrichment/enricher";
import { VerSchema } from "../types/schema";
import { decodeFunctionData, encodeFunctionData, createPublicClient, http, Address, parseAbi } from "viem";
import { GenericLLMProvider } from "../engine/enrichment/llm.provider";

// Chain parameters matching blockscout
const XLAYER_CHAIN = {
  id: 196,
  name: "X Layer Mainnet",
  nativeCurrency: { name: "OKB", symbol: "OKB", decimals: 18 },
  rpcUrls: { default: { http: [process.env.XLAYER_RPC_URL ?? process.env.RPC_URL ?? "https://rpc.xlayer.tech"] } },
} as const;

export class VerClient {
  private cache: VerCache;
  private semanticCache: SemanticCache;
  private repo: BlockscoutRepository;
  private normalizer: DataNormalizer;
  private compiler: CompilerPipeline;
  private enricher: SemanticEnricher;
  private client = createPublicClient({ chain: XLAYER_CHAIN, transport: http() });
  private llmProvider: ILLMProvider;

  constructor(llmProvider?: ILLMProvider) {
    this.cache = new VerCache();
    this.semanticCache = new SemanticCache();
    this.repo = new BlockscoutRepository();
    this.normalizer = new DataNormalizer(this.repo);
    this.compiler = new CompilerPipeline();
    const provider = llmProvider || new GenericLLMProvider();
    this.llmProvider = provider;
    this.enricher = new SemanticEnricher(provider);
  }

  public async getProtocolGraph(address: string, forceRefresh = false): Promise<VerSchema> {
    let graph = this.cache.get(address);

    if (!graph || forceRefresh) {
        const normalized = await this.normalizer.normalize(address);
        const input: any = {
            address: normalized.address,
            abi: normalized.abi ? JSON.parse(normalized.abi) : [],
            source: normalized.sourceCode,
            isProxy: normalized.isProxy,
            implementation: normalized.implementationAddress,
            metadata: {
                protocolName: normalized.contractName || "Unknown",
                compilerVersion: normalized.compilerVersion || "Unknown"
            },
            depth: 0,
            maxDepth: 1,
            visited: new Set()
        };
        const { graph: compiledGraph } = await this.compiler.compile(input);
        graph = compiledGraph;
        this.cache.set(address, graph);
    }

    const promptVersion = this.enricher.promptVersion;
    const cachedSemantic = this.semanticCache.get(address, promptVersion);

    if (cachedSemantic) {
        graph.semantic = cachedSemantic.semantic;
        graph.security = cachedSemantic.security;
        graph.developer = cachedSemantic.developer;
        graph.semantic.semantic_status = "COMPLETE";
    } else {
        const { graph: enrichedGraph, diagnostics } = await this.enricher.enrich(graph);
        graph = enrichedGraph;
        if (diagnostics.status === "COMPLETE") {
            this.semanticCache.set(address, promptVersion, {
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

      const abiRaw = await this.repo.fetchContractAbi(address);
      if (!abiRaw) throw new Error("No ABI found for decoding");
      
      const abi = JSON.parse(abiRaw);

      try {
         const decoded = decodeFunctionData({ abi, data: calldata as any });
         const funcInfo = graph.security.privileged_functions.find(f => f.name === decoded.functionName) 
            || { classification: "public mutator", reason: "Standard public call" };

         const serializeArgs = (args: readonly unknown[] | undefined) => {
            if (!args) return [];
            return args.map(arg => typeof arg === 'bigint' ? arg.toString() : arg);
         };

         return {
            function: decoded.functionName,
            args: serializeArgs(decoded.args),
            classification: funcInfo.classification,
            reason: funcInfo.reason
         };
      } catch (e: any) {
         return { error: "Failed to decode transaction", details: e.message };
      }
  }

  public async simulateTransaction(to: string, data: string, from?: string, value?: string): Promise<any> {
      const { TransactionSimulator } = await import("../engine/simulator.js");
      const simulator = new TransactionSimulator();
      return await simulator.simulate(to, data, from, value);
  }

  public async readContract(address: string, data: string): Promise<any> {
      const { TransactionSimulator } = await import("../engine/simulator.js");
      const simulator = new TransactionSimulator();
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
      const abiRaw = await this.repo.fetchContractAbi(address);
      if (!abiRaw) throw new Error("No ABI found for event decoding");
      
      const abi = JSON.parse(abiRaw);
      const { decodeEventLog } = await import("viem");

      try {
          const decoded = decodeEventLog({
              abi,
              topics: topics as any,
              data: data as any
          }) as any;

          const serializeArgs = (args: any) => {
              if (!args) return {};
              const res: any = {};
              for (const [key, val] of Object.entries(args)) {
                  res[key] = typeof val === 'bigint' ? val.toString() : val;
              }
              return res;
          };

          return {
              eventName: decoded.eventName,
              args: serializeArgs(decoded.args)
          };
      } catch (e: any) {
          return { error: "Failed to decode event log", details: e.message };
      }
  }

  /**
   * Estimates transaction gas and calculates expected cost in OKB tokens
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
              estimatedCostOKB: (Number(totalCost) / 1e18).toString()
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
      const transferRegex = /transfer\s+([\d\.]+)\s+(\w+)\s+to\s+(0x[a-fA-F0-9]{40})/i;
      const transferMatch = cleanIntent.match(transferRegex);
      if (transferMatch) {
          return {
              functionName: "transfer",
              args: {
                  recipient: { value: transferMatch[3], isUnscaledTokenAmount: false },
                  amount: { value: transferMatch[1], isUnscaledTokenAmount: true }
              }
          };
      }

      // 2. Matches "Approve 500 USDC to/for 0x2222..."
      const approveRegex = /approve\s+([\d\.]+)\s+(\w+)\s+(?:to|for)\s+(0x[a-fA-F0-9]{40})/i;
      const approveMatch = cleanIntent.match(approveRegex);
      if (approveMatch) {
          return {
              functionName: "approve",
              args: {
                  spender: { value: approveMatch[3], isUnscaledTokenAmount: false },
                  amount: { value: approveMatch[1], isUnscaledTokenAmount: true }
              }
          };
      }

      return null;
  }

  /**
   * Agentic Intent Compiler (AIC) - MVP
   * Translates a natural language intent into verified, simulated, and safe calldata.
   */
  public async compileAgentIntent(
      address: string,
      intent: string,
      sender?: string,
      value?: string
  ): Promise<any> {
      const abiRaw = await this.repo.fetchContractAbi(address);
      if (!abiRaw) throw new Error("No ABI found for intent compiling");
      const abi = JSON.parse(abiRaw);

      // Filter to write functions (non-view/pure functions)
      const writeFunctions = abi.filter((x: any) => 
          x.type === 'function' && 
          x.stateMutability !== 'view' && 
          x.stateMutability !== 'pure'
      );

      const functionsList = writeFunctions.map((f: any) => {
          const inputs = (f.inputs || []).map((i: any) => `${i.name} (${i.type})`).join(", ");
          return `- ${f.name}(${inputs})`;
      }).join("\n");

      const systemPrompt = `You are the Agentic Intent Compiler (AIC) for X Layer.
Your task is to parse a natural language transaction intent and map it to a specific write function from the contract's ABI.

Available write functions:
${functionsList}

Output ONLY a JSON object matching this schema:
{
  "functionName": "the name of the matching ABI function",
  "args": {
    "parameterName1": {
      "value": "string representation of the value (e.g. '0x1234...', '1.5', '100')",
      "isUnscaledTokenAmount": true // Set true if this is a token/ether amount that needs decimal scaling (e.g. 1.5 USDT -> 1.5)
    }
  }
}
If no function matches the intent, or if the parameters cannot be mapped, return an empty JSON object.
Return ONLY valid JSON. No markdown, no explanations.`;

      // Try deterministic parser first for offline / zero-latency flow
      let parsed = this.tryDeterministicIntentParser(intent);
      
      if (!parsed) {
          const userPrompt = `Target Contract: ${address}\nIntent: "${intent}"`;
          const llmOutput = await this.llmProvider.generate(systemPrompt, userPrompt);
          
          try {
              let cleaned = llmOutput.trim();
              if (cleaned.startsWith("```json")) {
                  cleaned = cleaned.substring(7, cleaned.length - 3);
              } else if (cleaned.startsWith("```")) {
                  cleaned = cleaned.substring(3, cleaned.length - 3);
              }
              parsed = JSON.parse(cleaned.trim());
          } catch (e: any) {
              throw new Error(`LLM intent parsing failed: ${e.message}. Raw output: ${llmOutput}`);
          }
      }

      if (!parsed.functionName) {
          return {
              success: false,
              error: "Could not map intent to any available write function on the contract."
          };
      }

      // Check if we need decimals and retrieve them
      let decimals = 18;
      const hasUnscaled = Object.values(parsed.args || {}).some((a: any) => (a as any).isUnscaledTokenAmount);
      if (hasUnscaled) {
          try {
              const dec = await this.client.readContract({
                  address: address as Address,
                  abi: parseAbi(["function decimals() view returns (uint8)"]),
                  functionName: "decimals"
              });
              decimals = Number(dec);
          } catch (err) {
              console.warn(`Failed to fetch decimals for ${address}, defaulting to 18:`, err);
          }
      }

      const abiFunc = writeFunctions.find((f: any) => f.name === parsed.functionName);
      if (!abiFunc) {
          throw new Error(`Parsed function ${parsed.functionName} not found in ABI`);
      }

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
              const floatVal = parseFloat(val);
              if (!isNaN(floatVal)) {
                  const multiplier = Math.pow(10, decimals);
                  const integerPart = Math.floor(floatVal);
                  const fractionalPart = floatVal - integerPart;
                  val = BigInt(integerPart) * BigInt(multiplier) + BigInt(Math.floor(fractionalPart * multiplier));
              } else {
                  throw new Error(`Failed to parse float token amount: ${val}`);
              }
          } else {
              if (input.type.startsWith("uint") || input.type.startsWith("int")) {
                  val = BigInt(val);
              } else if (input.type === "bool") {
                  val = val === "true" || val === true;
              }
          }
          resolvedArgs.push(val);
      }

      const encodedCalldata = encodeFunctionData({
          abi,
          functionName: parsed.functionName,
          args: resolvedArgs
      });

      // Simulation Guardrail
      let simulationStatus: "success" | "reverted" = "success";
      let simulationError: string | undefined;
      let simulationResult: string | undefined;

      try {
          const simResult = await this.client.call({
              to: address as Address,
              data: encodedCalldata,
              account: sender ? (sender as Address) : undefined,
              value: value ? BigInt(value) : undefined
          });
          simulationResult = simResult.data || "0x";
      } catch (e: any) {
          simulationStatus = "reverted";
          simulationError = e.shortMessage || e.message;
      }

      const serializeValue = (val: any): any => {
          if (typeof val === "bigint") return val.toString();
          if (Array.isArray(val)) return val.map(serializeValue);
          return val;
      };

      return {
          success: true,
          functionName: parsed.functionName,
          args: resolvedArgs.map(serializeValue),
          encodedCalldata,
          simulationStatus,
          simulationError,
          simulationResult
      };
  }
}
