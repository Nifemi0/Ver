# Ver Protocol

**Deterministic by design. Explainable by AI.**

Ver is a semantic layer and cryptographic attestation protocol built specifically for **X Layer**. It compiles deterministic blockchain artifacts (ABIs, Bytecode, state variables) into an AI-readable Protocol Graph that IDEs, wallets, AI agents, and developer tools can consume natively via MCP.

---

## Architecture

```text
Input Contract
      ↓
Blockscout Fetcher
      ↓
Deterministic Parser
      ↓
Ver Protocol Schema
      ↓
VerRegistry (X Layer Anchor)
      ↓
MCP Server / API Endpoint
      ↓
Cursor / Claude / Onchain OS Agents
```

## Core Features

1. **Deterministic Protocol Graph**: Transforms raw unflattened bytecode and ABIs into standard semantic schemas.
2. **Agentic Intent Compiler (AIC)**: Maps natural language user goals (e.g. "Transfer 10 USDT") into exact EVM calldata, verified by static `eth_call` simulations.
3. **Registry Attestation**: Hashes the compiled graph (SHA-256) and stores the attestation permanently on X Layer's VerRegistry contract, preventing hallucinated contract integrations.
4. **LLM Fallback Routing**: If the deterministic AIC cannot map a complex semantic intent, it securely prompts an LLM via Anthropic/Gemini APIs using the verified protocol graph as context.

## Usage

### 1. Compile a Protocol Graph

```bash
curl -s "https://xlayer-delta.vercel.app/api/compile?address=0x1E4a5963aBFD975d8c9021ce480b42188849D41d"
```

### 2. Compile an Intent to Calldata

```bash
curl -X POST https://xlayer-delta.vercel.app/api/compile-intent \
  -H "Content-Type: application/json" \
  -d '{
    "contractAddress": "0x1E4a5963aBFD975d8c9021ce480b42188849D41d",
    "intent": "Transfer 10 USDT to 0x1111111111111111111111111111111111111111"
  }'
```

### 3. Model Context Protocol (MCP)

Provide AI tools with native understanding of X Layer smart contracts. Add Ver to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "ver": {
      "command": "npx",
      "args": ["-y", "ver-mcp"],
      "env": {
        "XLAYER_RPC_URL": "https://rpc.xlayer.tech"
      }
    }
  }
}
```

## Links

- **Website & Documentation**: [https://xlayer-delta.vercel.app](https://xlayer-delta.vercel.app)
- **Founder / Twitter**: [https://x.com/Love_Light_11](https://x.com/Love_Light_11)

---
*© 2026 Ver Protocol. Built for X Layer.*
