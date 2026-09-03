# Ver Protocol

**Deterministic by design. Explainable by AI.**

Release candidate: `1.0.7`. These are repository capabilities, not a claim that the hosted API or npm package has been updated. Graph schema/hash `2.0.0` requires fresh attestations; see [migration notes](docs/GRAPH_V2_MIGRATION.md), [wallet handoff](docs/WALLET_TEAM_HANDOFF.md) and [rollout plan](docs/BOT_CHAIN_WALLET_ROLLOUT_PLAN.md) before integration.

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
Wallet review → user confirmation → wallet-local signing
      or
Developer tools / MCP clients (read-only intelligence)
```

## Core Features

1. **Protocol Graphs**: Resolve verified source, ABI and proxy structure into machine-readable contract facts. Unverified graphs must not be treated as verified contracts.
2. **Wallet preparation**: Accept one complete `approve AMOUNT SYMBOL to ADDRESS` or `transfer AMOUNT SYMBOL to ADDRESS` request. Validate token identity and exact precision, encode unsigned calldata, and simulate from the supplied sender.
3. **Fail-closed signing gate**: Negated, conditional and compound instructions are unsupported. False token returns, failed simulations and provider failures cannot become signable. No external LLM fallback is permitted in transaction preparation.

A successful simulation is not a security audit or a promise of transaction success. The wallet must independently check chain, account, target and decoded calldata, enforce response expiry, and obtain user confirmation. Ver never needs the user's signing key.

## Usage

### 1. Compile a Protocol Graph

```bash
curl -s "https://verprotocol.vercel.app/api/compile?chainId=968&address=0x922835859623d6F3b99a2742D585E093bBA0a740"
```

### 2. Prepare a Wallet Transaction

```bash
curl -X POST https://verprotocol.vercel.app/api/wallet/prepare \
  -H "Content-Type: application/json" \
  -d '{
    "chainId": 968,
    "contractAddress": "0x922835859623d6F3b99a2742D585E093bBA0a740",
    "sender": "0x1111111111111111111111111111111111111111",
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
