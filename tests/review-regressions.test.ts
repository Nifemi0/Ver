import { afterEach, describe, expect, it, vi } from "vitest";
import { parseAbi, encodeFunctionData, encodeAbiParameters, encodeEventTopics, toFunctionSelector } from "viem";
import { DataNormalizer } from "../src/engine/explorer/normalizer";
import { BlockscoutRepository } from "../src/engine/explorer/blockscout.repository";
import { CompilerPipeline } from "../src/engine/compiler/pipeline";
import { FunctionExtractor } from "../src/engine/compiler/extractors/function.extractor";
import { VerClient } from "../src/sdk/client";
import { abiSignature, mergeAbis } from "../src/engine/abi";
import { lookupGraph } from "../src/chain/registry";
import { VerZodSchema } from "../src/types/schema";

vi.mock("../src/chain/registry", () => ({
  getRegistryAddressForChain: () => process.env.BOT_TESTNET_REGISTRY_ADDRESS || registry,
  lookupGraph: vi.fn(),
}));
const address = "0x1111111111111111111111111111111111111111";
const implementation = "0x2222222222222222222222222222222222222222";
const registry = "0x3333333333333333333333333333333333333333";
const abi = parseAbi(["function approve(address spender,uint256 amount) returns (bool)"]);
const source = "contract Token { function approve(address,uint256) external returns(bool) { return true; } }";
const input = () => ({ address, chainId: 968, abi: [...abi], source, sourceVerified: true, isProxy: true, implementation,
  metadata: { protocolName: "Token", compilerVersion: "0.8.20" }, depth: 0, maxDepth: 1, visited: new Set<string>() });
const repo = (proxySource: string | null = source, implSource: string | null = source) => ({
  resolveProxyImplementation: vi.fn().mockResolvedValue(implementation),
  fetchContractAbi: vi.fn().mockResolvedValue(JSON.stringify(abi)),
  fetchContractSource: vi.fn().mockImplementation((a: string) => Promise.resolve(a === address ? proxySource : implSource)),
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.clearAllMocks(); });

describe("verified source gate", () => {
  it.each([[null, null], ["\n ", source], [source, null], ["// placeholder", source]])("rejects incomplete proxy artifacts (%s)", async (proxySource, implSource) => {
    const repository = repo(proxySource, implSource);
    const normalized = await new DataNormalizer(repository).normalize(address);
    expect(normalized.sourceVerified).toBe(false);
    const client = new VerClient(undefined, 968, repository);
    (client as any).client = { getChainId: async () => 968, getBytecode: async () => "0x6000" };
    vi.spyOn((client as any).normalizer, "normalize").mockResolvedValue(normalized);
    await expect(client.compileAgentIntent(address, `approve 1 TOKEN to ${implementation}`, registry)).rejects.toThrow("verified ABI");
  });
  it("requires both ABIs, not just source", async () => {
    const repository = repo();
    repository.fetchContractAbi.mockImplementation((a: string) => Promise.resolve(a === address ? null : JSON.stringify(abi)));
    expect((await new DataNormalizer(repository).normalize(address)).sourceVerified).toBe(false);
  });
  it("accepts complete source and ABI provenance", async () => {
    expect((await new DataNormalizer(repo()).normalize(address)).sourceVerified).toBe(true);
  });
});

describe("canonical ABI and graph identity", () => {
  it("preserves overloaded functions, errors, events and tuple-array signatures", () => {
    const a = parseAbi(["function foo(uint256)", "event Changed(uint256)", "error Bad(uint256)"]);
    const b = parseAbi(["function foo(uint128)", "event Changed(address)", "error Bad(address)", "function nested((uint256,address)[] values)"]);
    const merged = mergeAbis(a as any, b as any);
    expect(merged).toHaveLength(7);
    expect(merged.map(abiSignature)).toContain("nested((uint256,address)[])");
    expect(mergeAbis(b as any, a as any)).toEqual(merged);
    expect(mergeAbis(a as any, a as any)).toHaveLength(3);
  });
  it("preserves actual proxy overloads", async () => {
    const repository = repo();
    repository.fetchContractAbi.mockImplementation((a: string) => Promise.resolve(JSON.stringify(parseAbi([a === address ? "function foo(uint256)" : "function foo(uint128)"]))));
    const normalized = await new DataNormalizer(repository).normalize(address);
    expect(JSON.parse(normalized.abi!).map(abiSignature)).toEqual(["foo(uint128)", "foo(uint256)"]);
  });
  it.each([
    { implementation: registry }, { chainId: 196 }, { source: source + "\ncontract Extra {}" },
    { abi: parseAbi(["function approve(address spender,uint128 amount) returns (bool)"]) },
    { abi: parseAbi(["function approve(address spender,uint256 amount) returns (uint256)"]) },
    { facets: [{ address: registry, selectors: ["0x12345678"] }] }, { sourceVerified: false },
  ])("changes hash when executable identity changes: %j", async change => {
    const compiler = new CompilerPipeline();
    const original = await compiler.compile(input());
    const changed = await compiler.compile({ ...input(), ...change } as any);
    expect(changed.graph.registry!.graphHash).not.toBe(original.graph.registry!.graphHash);
    expect(original.graph.registry!.hashVersion).toBe("2.0.0");
    expect(VerZodSchema.parse(original.graph).registry!.hashVersion).toBe("2.0.0");
  });
  it("is stable across ABI ordering and object key ordering", async () => {
    const compiler = new CompilerPipeline();
    const functions = [...abi, ...parseAbi(["function balanceOf(address) view returns(uint256)"])];
    const a = await compiler.compile({ ...input(), abi: functions });
    const b = await compiler.compile({ ...input(), abi: [...functions].reverse().map(f => Object.fromEntries(Object.entries(f).reverse())) });
    expect(a.graph.registry!.graphHash).toBe(b.graph.registry!.graphHash);
  });
});

describe("diamond completeness and selectors", () => {
  const setup = (facetSource: string | null = source) => {
    const repository = repo(source, facetSource);
    repository.resolveProxyImplementation.mockResolvedValue(null);
    repository.fetchContractAbi.mockResolvedValue(JSON.stringify(parseAbi(["function foo(uint256)", "function foo(uint128)"])));
    const normalizer = new DataNormalizer(repository);
    (normalizer as any).client = {
      getStorageAt: vi.fn().mockResolvedValue("0x"), getBytecode: vi.fn().mockResolvedValue("0x"),
      readContract: vi.fn().mockImplementation(({ functionName }) => functionName === "facets"
        ? Promise.resolve([{ facetAddress: implementation, functionSelectors: [toFunctionSelector("foo(uint256)")] }]) : Promise.reject(new Error("not supported"))),
    };
    return { normalizer, repository };
  };
  it("includes only selectors exposed by the loupe", async () => {
    const normalized = await setup().normalizer.normalize(address);
    expect(JSON.parse(normalized.abi!).map(abiSignature)).toEqual(["foo(uint256)"]);
    expect(normalized.sourceVerified).toBe(true);
    expect(normalized.facets?.[0]?.address).toBe(implementation);
  });
  it("never labels a placeholder or partial facet response as verified", async () => {
    const normalized = await setup(null).normalizer.normalize(address);
    expect(normalized.sourceVerified).toBe(false);
  });
});

describe("fresh registry authorization", () => {
  it("refreshes revocation, registration, registry changes, outage and disabled lookup on cache HIT", async () => {
    vi.stubEnv("VER_REGISTRY_LOOKUP", "true");
    const client = new VerClient(undefined, 968, repo());
    const normalized = { address, abi: JSON.stringify(abi), sourceCode: source, sourceVerified: true, isProxy: true, implementationAddress: implementation };
    const normalize = vi.spyOn((client as any).normalizer, "normalize").mockResolvedValue(normalized);
    vi.mocked(lookupGraph).mockResolvedValue(null);
    const first = await client.getProtocolGraph(address);
    const active = { graphHash: first.registry!.graphHash, metadataURI: "ipfs://fixture", attester: address, timestamp: 1, verified: true, registryAddress: registry };
    vi.mocked(lookupGraph).mockResolvedValue(active);
    const second = await client.getProtocolGraph(address);
    expect(second.registry!.verified).toBe(true);
    expect(second.metadata.cache_status).toBe("HIT");
    vi.mocked(lookupGraph).mockResolvedValue({ ...active, verified: false });
    expect((await client.getProtocolGraph(address)).registry!.verified).toBe(false);
    expect(second.registry!.verified).toBe(true); // Previous response was not mutated.
    vi.stubEnv("BOT_TESTNET_REGISTRY_ADDRESS", implementation);
    vi.mocked(lookupGraph).mockResolvedValue(null);
    const unavailable = await client.getProtocolGraph(address);
    expect(unavailable.registry).toMatchObject({ verified: false, registryAddress: implementation, lookupStatus: "unavailable" });
    vi.mocked(lookupGraph).mockRejectedValue(new Error("offline"));
    expect((await client.getProtocolGraph(address)).registry!.verified).toBe(false);
    expect(normalize).toHaveBeenCalledTimes(1);
    expect(lookupGraph).toHaveBeenCalledTimes(5);
    vi.stubEnv("VER_REGISTRY_LOOKUP", "false");
    expect((await client.getProtocolGraph(address)).registry).toMatchObject({ verified: false, lookupStatus: "disabled" });
    expect(lookupGraph).toHaveBeenCalledTimes(5);
  });
});

describe("recursive decoding and honest access classification", () => {
  it("serializes nested arrays and named tuples from real viem decoders", async () => {
    const nestedAbi = parseAbi(["function batch((uint256 amount,uint256[] ids)[] values)", "event Batch((uint256 amount,uint256[] ids) value)"]);
    const client = new VerClient(undefined, 968);
    vi.spyOn((client as any).normalizer, "normalize").mockResolvedValue({ abi: JSON.stringify(nestedAbi) });
    vi.spyOn(client, "getProtocolGraph").mockResolvedValue({ metadata: { contract_address: address }, security: { privileged_functions: [] } } as any);
    const value = { amount: 999999999999999999999n, ids: [1n, 2n] };
    const data = encodeFunctionData({ abi: nestedAbi, functionName: "batch", args: [[value]] });
    const decoded = await client.explainTransaction(address, data);
    expect(decoded.args).toEqual([[{ amount: value.amount.toString(), ids: ["1", "2"] }]]);
    expect(decoded.classification).toBe("unknown");
    expect(() => JSON.stringify(decoded)).not.toThrow();
    const topics = encodeEventTopics({ abi: nestedAbi, eventName: "Batch" });
    const log = await client.decodeEventLog(address, topics as string[], encodeAbiParameters(nestedAbi[1].inputs, [value]));
    expect(log.args.value).toEqual({ amount: value.amount.toString(), ids: ["1", "2"] });
    expect(() => JSON.stringify(log)).not.toThrow();
  });
  it("does not infer unrestricted access from ABI visibility", async () => {
    const result = await new FunctionExtractor().extract({ ...input(), abi: parseAbi(["function authorizeAttester(address)", "function revokeAttester(address)", "function owner() view returns(address)"]) as any });
    expect(result.public_functions.map(f => f.classification)).toEqual(["unknown", "unknown", "read-only"]);
  });
});

describe("explorer response body deadline", () => {
  it("aborts a body stalled after headers at ten seconds", async () => {
    vi.useFakeTimers();
    let signal: AbortSignal;
    vi.stubGlobal("fetch", vi.fn().mockImplementation((_url, options) => {
      signal = options.signal;
      return Promise.resolve({ ok: true, status: 200, json: () => new Promise((_resolve, reject) => signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")))) });
    }));
    const request = (new BlockscoutRepository("http://fixture") as any).makeRequest("http://fixture");
    const assertion = expect(request).rejects.toThrow(/timeout|timed out/i);
    await vi.advanceTimersByTimeAsync(10000);
    await assertion;
    expect(signal!.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });
  it.each([{ status: "1", message: "OK", result: "[]" }, { invalid: true }])("clears deadlines after body success or validation failure", async payload => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve(payload) }));
    await (new BlockscoutRepository("http://fixture") as any).makeRequest("http://fixture").catch(() => null);
    expect(vi.getTimerCount()).toBe(0);
  });
});
