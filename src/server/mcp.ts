#!/usr/bin/env node

import dotenv from 'dotenv';
dotenv.config({ quiet: true });

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { VerClient } from "../sdk/client";
import { VERSION } from "../version";
import { serializeAbiValue } from "../engine/serialize";
import { getChainById } from "../chain/networks";

function toolResult(value: any) {
  const failed = Boolean(value?.error) || value?.signable === false || value?.status === "reverted" || value?.status === "failed";
  return { content: [{ type: "text" as const, text: JSON.stringify(serializeAbiValue(value), null, 2) }], ...(failed ? { isError: true } : {}) };
}

const chainIdSchema = z.union([z.literal(196), z.literal(677), z.literal(968)]).optional().describe("Optional target chain: 677 BOT Chain mainnet, 968 BOT Chain testnet, 196 X Layer compatibility. Defaults to VER_NETWORK.");
const clients = new Map<number | "default", VerClient>();
function getClient(chainId?: number) {
  if (chainId !== undefined) getChainById(chainId);
  const key = chainId ?? "default";
  let client = clients.get(key);
  if (!client) {
    client = new VerClient(undefined, chainId);
    clients.set(key, client);
  }
  return client;
}

const server = new McpServer({
  name: "aic-mcp",
  version: VERSION
});

server.tool(
    "get_protocol_graph",
    "Returns the full deterministic + semantic graph for a contract on BOT Chain mainnet/testnet or X Layer compatibility",
    { address: z.string(), chainId: chainIdSchema },
    async ({ address, chainId }) => {
        try {
            const graph = await getClient(chainId).getProtocolGraph(address);
            return { content: [{ type: "text", text: JSON.stringify(graph, null, 2) }] };
        } catch (e: any) {
            return { content: [{ type: "text", text: JSON.stringify({ error: e.message }) }], isError: true };
        }
    }
);

server.tool(
    "get_contract_summary",
    "Returns a lightweight overview of a contract",
    { address: z.string(), chainId: chainIdSchema },
    async ({ address, chainId }) => {
        try {
            const summary = await getClient(chainId).getContractSummary(address);
            return { content: [{ type: "text", text: JSON.stringify(summary, null, 2) }] };
        } catch (e: any) {
            return { content: [{ type: "text", text: JSON.stringify({ error: e.message }) }], isError: true };
        }
    }
);

server.tool(
    "explain_transaction",
    "Explains what a transaction does using calldata",
    { address: z.string(), calldata: z.string(), chainId: chainIdSchema },
    async ({ address, calldata, chainId }) => {
        try {
            const exp = await getClient(chainId).explainTransaction(address, calldata);
            return toolResult(exp);
        } catch (e: any) {
            return { content: [{ type: "text", text: JSON.stringify({ error: e.message }) }], isError: true };
        }
    }
);

server.tool(
    "search_protocol",
    "Search the protocol for specific functions, events, or roles",
    { address: z.string(), query: z.string(), chainId: chainIdSchema },
    async ({ address, query, chainId }) => {
        try {
            const res = await getClient(chainId).searchProtocol(address, query);
            return toolResult(res);
        } catch (e: any) {
            return { content: [{ type: "text", text: JSON.stringify({ error: e.message }) }], isError: true };
        }
    }
);

server.tool(
    "simulate_transaction",
    "Simulate a transaction against the blockchain to see its outcome",
    { to: z.string(), data: z.string(), from: z.string().optional(), value: z.string().optional(), chainId: chainIdSchema },
    async ({ to, data, from, value, chainId }) => {
        try {
            const res = await getClient(chainId).simulateTransaction(to, data, from, value);
            return toolResult(res);
        } catch (e: any) {
            return { content: [{ type: "text", text: JSON.stringify({ error: e.message }) }], isError: true };
        }
    }
);

server.tool(
    "read_contract",
    "Read a state variable or view function from a contract",
    { address: z.string(), data: z.string(), chainId: chainIdSchema },
    async ({ address, data, chainId }) => {
        try {
            const res = await getClient(chainId).readContract(address, data);
            return toolResult(res);
        } catch (e: any) {
            return { content: [{ type: "text", text: JSON.stringify({ error: e.message }) }], isError: true };
        }
    }
);

server.tool(
    "get_source_code",
    "Fetch the fully resolved, unflattened Solidity source code for a contract",
    { address: z.string(), chainId: chainIdSchema },
    async ({ address, chainId }) => {
        try {
            const source = await getClient(chainId).getSourceCode(address);
            return { content: [{ type: "text", text: JSON.stringify({ source: source || "No source code available" }, null, 2) }] };
        } catch (e: any) {
            return { content: [{ type: "text", text: JSON.stringify({ error: e.message }) }], isError: true };
        }
    }
);

server.tool(
    "get_token_metadata",
    "Fetches standardized ERC20/ERC721 token metadata (name, symbol, decimals, type)",
    { address: z.string(), chainId: chainIdSchema },
    async ({ address, chainId }) => {
        try {
            const metadata = await getClient(chainId).getTokenMetadata(address);
            return { content: [{ type: "text", text: JSON.stringify(metadata, null, 2) }] };
        } catch (e: any) {
            return { content: [{ type: "text", text: JSON.stringify({ error: e.message }) }], isError: true };
        }
    }
);

server.tool(
    "decode_event_log",
    "Decodes a raw transaction event log from topics and data using the contract ABI",
    { address: z.string(), topics: z.array(z.string()), data: z.string(), chainId: chainIdSchema },
    async ({ address, topics, data, chainId }) => {
        try {
            const decoded = await getClient(chainId).decodeEventLog(address, topics, data);
            return toolResult(decoded);
        } catch (e: any) {
            return { content: [{ type: "text", text: JSON.stringify({ error: e.message }) }], isError: true };
        }
    }
);

server.tool(
    "get_gas_estimate",
    "Estimates gas and returns exact wei costs and the selected chain's native currency (BOT on BOT Chain)",
    { to: z.string(), data: z.string(), from: z.string().optional(), value: z.string().optional(), chainId: chainIdSchema },
    async ({ to, data, from, value, chainId }) => {
        try {
            const estimate = await getClient(chainId).getGasEstimate(to, data, from, value);
            return toolResult(estimate);
        } catch (e: any) {
            return { content: [{ type: "text", text: JSON.stringify({ error: e.message }) }], isError: true };
        }
    }
);

server.tool(
    "diff_protocol_graphs",
    "Compares two protocol graphs to highlight structural, role, dependency, and privileged function changes",
    { addressA: z.string(), addressB: z.string(), chainId: chainIdSchema },
    async ({ addressA, addressB, chainId }) => {
        try {
            const diff = await getClient(chainId).diffProtocolGraphs(addressA, addressB);
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
        chainId: chainIdSchema,
        intent: z.string().min(1).max(1000).describe("One complete action: 'approve 1 PRWA to 0x...' or 'transfer 1 PRWA to 0x...'. Symbol must match the target; conditions, negations, compound actions and AI-generated signing payloads are not supported."),
        sender: z.string().optional().describe("Optional: The sender address (0x...) for eth_call simulation"),
        value: z.string().optional().describe("Optional: The value to send in wei (as string)")
    },
    async ({ address, chainId, intent, sender, value }) => {
        try {
            const result = await getClient(chainId).compileAgentIntent(address, intent, sender, value);
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
