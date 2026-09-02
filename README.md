# Ver Protocol

**Deterministic by design. Explainable by AI.**

Ver is BOT Chain's deterministic semantic and wallet-safety layer. It compiles blockchain artifacts (ABIs, bytecode, state variables) into an AI-readable Protocol Graph that wallets, IDEs, AI agents, and developer tools can consume through HTTP or MCP.

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
MCP Server / API Endpoint
      ↓
Cursor / Claude / Onchain OS Agents
```

## Core Features

1. **Deterministic Protocol Graph**: Transforms raw unflattened bytecode and ABIs into standard semantic schemas.
2. **Agentic Intent Compiler (AIC)**: Maps natural language user goals (e.g. "Transfer 10 USDT") into exact EVM calldata, verified by static `eth_call` simulations.
4. **LLM Fallback Routing**: If the deterministic AIC cannot map a complex semantic intent, it securely prompts an LLM via Anthropic/Gemini APIs using the verified protocol graph as context.

## Usage

### 1. Compile a Protocol Graph

```bash
curl -s "https://verprotocol.vercel.app/api/compile?chainId=968&address=0x922835859623d6F3b99a2742D585E093bBA0a740"
```

### 2. Compile an Intent to Calldata

```bash
curl -X POST https://verprotocol.vercel.app/api/compile-intent \
  -H "Content-Type: application/json" \
  -d '{
    "chainId": 968,
    "contractAddress": "0x922835859623d6F3b99a2742D585E093bBA0a740",
    "intent": "Approve 1 PRWA to 0x1111111111111111111111111111111111111111"
  }'
```

### 3. Model Context Protocol (MCP)

Provide AI tools with native understanding of BOT Chain contracts. Add Ver to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "ver": {
      "command": "npx",
      "args": ["-y", "aic-mcp"],
      "env": {
        "VER_NETWORK": "botTestnet",
        "BOT_TESTNET_RPC_URL": "https://rpc.bohr.life"
      }
    }
  }
}
```

## Links

- **Website & Documentation**: [https://verprotocol.vercel.app](https://verprotocol.vercel.app)
- **Founder / Twitter**: [https://x.com/Love_Light_11](https://x.com/Love_Light_11)

---
*© 2026 Ver Protocol. Built for BOT Chain.*
