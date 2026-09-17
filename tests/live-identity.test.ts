import { describe, it, expect, vi, afterEach } from "vitest";
import { parseAbi } from "viem";
import { resolveLiveIdentity, IMPLEMENTATION_SLOT } from "../src/engine/explorer/live-identity";
import { CompilerPipeline } from "../src/engine/compiler/pipeline";
import { VerClient } from "../src/sdk/client";
import { lookupGraph } from "../src/chain/registry";
vi.mock("../src/chain/registry", () => ({getRegistryAddressForChain: () => a, lookupGraph: vi.fn()}));
const a = "0x1111111111111111111111111111111111111111";
const b = "0x2222222222222222222222222222222222222222";
const c = "0x3333333333333333333333333333333333333333";
const absent = {shortMessage:"Execution reverted"};
function rpc(impl: string | null = b) {
  return {getBytecode: vi.fn().mockResolvedValue("0x6000"), getStorageAt: vi.fn().mockImplementation(({slot}) => Promise.resolve(slot === IMPLEMENTATION_SLOT && impl ? `0x${impl.slice(2).padStart(64,"0")}` : "0x")), readContract: vi.fn().mockRejectedValue(absent)};
}
afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });
describe("live identity safety", () => {
  it("rejects stale explorer metadata and checks the requested block", async () => {
    const client = rpc(c);
    await expect(resolveLiveIdentity(client,a,b,[],100n)).rejects.toMatchObject({code:"PROXY_IDENTITY_MISMATCH"});
    expect(client.getStorageAt).toHaveBeenCalledWith(expect.objectContaining({blockNumber:100n}));
  });
  it("resolves matching live implementation and its runtime hash", async () => {
    const client = rpc();
    const result = await resolveLiveIdentity(client,a,b,[],100n);
    expect(result.implementation).toBe(b);
    expect(result.implementationCodeHash).toMatch(/^0x[0-9a-f]{64}$/);
    expect(client.getBytecode).toHaveBeenCalledWith({address:b,blockNumber:100n});
  });
  it("fails closed when storage or optional-method transport is unavailable", async () => {
    const client = rpc(null); client.getStorageAt.mockRejectedValueOnce(new Error("offline"));
    await expect(resolveLiveIdentity(client,a,null,[],100n)).rejects.toThrow("offline");
    client.readContract.mockRejectedValue(new Error("offline"));
    await expect(resolveLiveIdentity(client,a,null,[],100n)).rejects.toThrow("offline");
  });
  it("accepts absent optional methods on an ordinary contract", async () => {
    expect((await resolveLiveIdentity(rpc(null),a,null,[],100n)).implementation).toBeNull();
  });
  it("resolves an implementation-authority token", async () => {
    const client=rpc(null); client.readContract.mockImplementation(({functionName})=>Promise.resolve(functionName === "getImplementationAuthority" ? c : b));
    expect((await resolveLiveIdentity(client,a,b,[],100n)).implementation).toBe(b);
  });
});
describe("graph freshness and honest evidence", () => {
  const abi = parseAbi(["function owner() view returns(address)","function transferOwnership(address newOwner)","event Changed()"]);
  const input = () => ({address:a,chainId:968,abi:[...abi],source:"// @openzeppelin\ncontract Example {}",sourceVerified:true,isProxy:true,implementation:b,metadata:{protocolName:"Example",compilerVersion:"0.8.20"},depth:0,maxDepth:1,visited:new Set<string>()});
  it("hashes role evidence consistently across ABI permutations", async () => {
    const pipeline = new CompilerPipeline();
    const first=await pipeline.compile(input());
    const reversed=await pipeline.compile({...input(),abi:[...abi].reverse()});
    expect(first.graph.registry!.graphHash).toBe(reversed.graph.registry!.graphHash);
    expect(first.graph.semantic.verified).toBe(false);
    expect(first.graph.security.verified).toBe(false);
    expect(first.graph.structural.roles[0]).toMatchObject({source:"ABI heuristic",confidence:0.5});
  });
  it("invalidates an old attested hash when the implementation changes", async () => {
    vi.stubEnv("VER_REGISTRY_LOOKUP","true");
    vi.mocked(lookupGraph).mockResolvedValue(null);
    const client = new VerClient(undefined,968);
    const normalized = {address:a,abi:JSON.stringify(abi),sourceCode:"contract Example {}",sourceVerified:true,isProxy:true,implementationAddress:b,snapshotBlock:"100",runtimeCodeHash:`0x${"a".repeat(64)}`};
    const normalize = vi.spyOn((client as any).normalizer,"normalize").mockResolvedValue(normalized);
    const first = await client.getProtocolGraph(a);
    vi.mocked(lookupGraph).mockResolvedValue({graphHash:first.registry!.graphHash,verified:true,registryAddress:a,metadataURI:"ipfs://fixture",attester:a,timestamp:1});
    expect((await client.getProtocolGraph(a)).registry!.verified).toBe(true);
    normalize.mockResolvedValue({...normalized,implementationAddress:c,snapshotBlock:"101"});
    const updated = await client.getProtocolGraph(a);
    expect(updated.registry!.verified).toBe(false);
    expect(updated.registry!.graphHash).not.toBe(first.registry!.graphHash);
    expect(updated.metadata).toMatchObject({implementation_address:c,snapshot_block:"101",cache_status:"MISS"});
    normalize.mockRejectedValue(new Error("RPC unavailable"));
    await expect(client.getProtocolGraph(a)).rejects.toThrow("RPC unavailable");
  });
});
