import { describe, expect, it, vi } from "vitest";
const { handlers } = vi.hoisted(() => ({ handlers: new Map<string, (args: any) => Promise<any>>() }));
const { constructedChainIds } = vi.hoisted(() => ({ constructedChainIds: [] as Array<number | undefined> }));
vi.mock("@modelcontextprotocol/sdk/server/mcp.js", () => ({
  McpServer: class {
    tool(name: string, _description: string, _schema: unknown, handler: any) { handlers.set(name, handler); }
    async connect() {}
  },
}));
vi.mock("@modelcontextprotocol/sdk/server/stdio.js", () => ({ StdioServerTransport: class {} }));
vi.mock("../src/sdk/client", () => ({ VerClient: class {
  constructor(_llm?: unknown, chainId?: number) { constructedChainIds.push(chainId); }
  async getGasEstimate() { return { chainId: constructedChainIds.at(-1), nativeCurrency: "BOT", estimatedCostWei: "1" }; }
  async explainTransaction() { return { args: [[{ amount: 42n, ids: [1n, 2n] }]] }; }
  async decodeEventLog() { return { args: { values: [{ amount: 42n }] } }; }
} }));
import "../src/server/mcp";
describe("MCP JSON serialization boundary", () => {
  it.each(["explain_transaction", "decode_event_log"])("serializes nested bigint from %s without returning an MCP error", async name => {
    const result = await handlers.get(name)!({ address: "0x1", calldata: "0x", topics: [], data: "0x" });
    expect(result.isError).not.toBe(true);
    expect(result.content[0].text).toContain('"42"');
    expect(() => JSON.parse(result.content[0].text)).not.toThrow();
  });

  it("routes a tool call to BOT Chain mainnet when chainId 677 is supplied", async () => {
    const result = await handlers.get("get_gas_estimate")!({ to: "0x1", data: "0x", chainId: 677 });
    expect(result.isError).not.toBe(true);
    expect(JSON.parse(result.content[0].text)).toMatchObject({ chainId: 677, nativeCurrency: "BOT" });
  });
});
