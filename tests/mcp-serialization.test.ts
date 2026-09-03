import { describe, expect, it, vi } from "vitest";
const { handlers } = vi.hoisted(() => ({ handlers: new Map<string, (args: any) => Promise<any>>() }));
vi.mock("@modelcontextprotocol/sdk/server/mcp.js", () => ({
  McpServer: class {
    tool(name: string, _description: string, _schema: unknown, handler: any) { handlers.set(name, handler); }
    async connect() {}
  },
}));
vi.mock("@modelcontextprotocol/sdk/server/stdio.js", () => ({ StdioServerTransport: class {} }));
vi.mock("../src/sdk/client", () => ({ VerClient: class {
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
});
