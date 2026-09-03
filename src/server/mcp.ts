#!/usr/bin/env node

import dotenv from 'dotenv';
dotenv.config({ quiet: true });

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { VerClient } from "../sdk/client";
import { VERSION } from "../version";

function toolResult(value: any) {
  const failed = Boolean(value?.error) || value?.signable === false || value?.status === "reverted" || value?.status === "failed";
  return { content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }], ...(failed ? { isError: true } : {}) };
}

const client = new VerClient();
const server = new McpServer({
  name: "aic-mcp",
  version: VERSION
});

server.tool(
    "get_protocol_graph",
    "Returns the full deterministic + semantic graph for a contract",
    { address: z.string() },
    async ({ address }) => {
        try {
            const graph = await client.getProtocolGraph(address);
            return { content: [{ type: "text", text: JSON.stringify(graph, null, 2) }] };
        } catch (e: any) {
            return { content: [{ type: "text", text: JSON.stringify({ error: e.message }) }], isError: true };
        }
    }
);

server.tool(
    "get_contract_summary",
    "Returns a lightweight overview of a contract",
    { address: z.string() },
    async ({ address }) => {
        try {
            const summary = await client.getContractSummary(address);
            return { content: [{ type: "text", text: JSON.stringify(summary, null, 2) }] };
        } catch (e: any) {
            return { content: [{ type: "text", text: JSON.stringify({ error: e.message }) }], isError: true };
        }
    }
);

server.tool(
    "explain_transaction",
    "Explains what a transaction does using calldata",
    { address: z.string(), calldata: z.string() },
    async ({ address, calldata }) => {
        try {
            const exp = await client.explainTransaction(address, calldata);
            return toolResult(exp);
        } catch (e: any) {
            return { content: [{ type: "text", text: JSON.stringify({ error: e.message }) }], isError: true };
        }
    }
);

server.tool(
    "search_protocol",
    "Search the protocol for specific functions, events, or roles",
    { address: z.string(), query: z.string() },
    async ({ address, query }) => {
        try {
            const res = await client.searchProtocol(address, query);
            return toolResult(res);
        } catch (e: any) {
            return { content: [{ type: "text", text: JSON.stringify({ error: e.message }) }], isError: true };
        }
    }
);

server.tool(
    "simulate_transaction",
    "Simulate a transaction against the blockchain to see its outcome",
    { to: z.string(), data: z.string(), from: z.string().optional(), value: z.string().optional() },
    async ({ to, data, from, value }) => {
        try {
            const res = await client.simulateTransaction(to, data, from, value);
            return toolResult(res);
        } catch (e: any) {
            return { content: [{ type: "text", text: JSON.stringify({ error: e.message }) }], isError: true };
        }
    }
);

server.tool(
    "read_contract",
    "Read a state variable or view function from a contract",
    { address: z.string(), data: z.string() },
    async ({ address, data }) => {
        try {
            const res = await client.readContract(address, data);
            return toolResult(res);
        } catch (e: any) {
            return { content: [{ type: "text", text: JSON.stringify({ error: e.message }) }], isError: true };
        }
    }
);

server.tool(
    "get_source_code",
    "Fetch the fully resolved, unflattened Solidity source code for a contract",
    { address: z.string() },
    async ({ address }) => {
        try {
            const source = await client.getSourceCode(address);
            return { content: [{ type: "text", text: JSON.stringify({ source: source || "No source code available" }, null, 2) }] };
        } catch (e: any) {
            return { content: [{ type: "text", text: JSON.stringify({ error: e.message }) }], isError: true };
        }
    }
);

server.tool(
    "get_token_metadata",
    "Fetches standardized ERC20/ERC721 token metadata (name, symbol, decimals, type)",
    { address: z.string() },
    async ({ address }) => {
        try {
            const metadata = await client.getTokenMetadata(address);
            return { content: [{ type: "text", text: JSON.stringify(metadata, null, 2) }] };
        } catch (e: any) {
            return { content: [{ type: "text", text: JSON.stringify({ error: e.message }) }], isError: true };
        }
    }
);

server.tool(
    "decode_event_log",
    "Decodes a raw transaction event log from topics and data using the contract ABI",
    { address: z.string(), topics: z.array(z.string()), data: z.string() },
    async ({ address, topics, data }) => {
        try {
            const decoded = await client.decodeEventLog(address, topics, data);
            return toolResult(decoded);
        } catch (e: any) {
            return { content: [{ type: "text", text: JSON.stringify({ error: e.message }) }], isError: true };
        }
    }
);

server.tool(
    "get_gas_estimate",
    "Estimates gas and returns exact wei costs and the selected chain's native currency (BOT on BOT Chain)",
    { to: z.string(), data: z.string(), from: z.string().optional(), value: z.string().optional() },
    async ({ to, data, from, value }) => {
        try {
            const estimate = await client.getGasEstimate(to, data, from, value);
            return toolResult(estimate);
        } catch (e: any) {
            return { content: [{ type: "text", text: JSON.stringify({ error: e.message }) }], isError: true };
        }
    }
);

server.tool(
    "diff_protocol_graphs",
    "Compares two protocol graphs to highlight structural, role, dependency, and privileged function changes",
    { addressA: z.string(), addressB: z.string() },
    async ({ addressA, addressB }) => {
        try {
            const diff = await client.diffProtocolGraphs(addressA, addressB);
            return { content: [{ type: "text", text: JSON.stringify(diff, null, 2) }] };
        } catch (e: any) {
            return { content: [{ type: "text", text: JSON.stringify({ error: e.message }) }], isError: true };
        }
    }
);

server.tool(
    "compile_agent_intent",
    "Prepares one exact ERC-20 approval or transfer on BOT Chain; returns unsigned calldata gated by simulation, never a safety guarantee",
    {
        address: z.string().describe("The target contract address (0x...)"),
        intent: z.string().min(1).max(1000).describe("One complete action: 'approve 1 PRWA to 0x...' or 'transfer 1 PRWA to 0x...'. Symbol must match the target; conditions, negations, compound actions and AI-generated signing payloads are not supported."),
        sender: z.string().optional().describe("Optional: The sender address (0x...) for eth_call simulation"),
        value: z.string().optional().describe("Optional: The value to send in wei (as string)")
    },
    async ({ address, intent, sender, value }) => {
        try {
            const result = await client.compileAgentIntent(address, intent, sender, value);
            return toolResult(result);
        } catch (e: any) {
            return { content: [{ type: "text", text: JSON.stringify({ error: e.message }) }], isError: true };
        }
    }
);

async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Ver MCP Server running on stdio");
}

run().catch(console.error);
