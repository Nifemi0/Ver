# Ver Protocol

<!-- nuvixes-project-credit -->
Built by [Nifemi](https://github.com/Nifemi0), founder of [Nuvixes](https://nuvixes.studio/).
[Read the Ver build story at Nuvixes](https://nuvixes.studio/projects/ver) for the design decisions, development milestones, and current project status.
<!-- /nuvixes-project-credit -->


**Deterministic by design. Explainable by AI.**

Current repository candidate: `1.0.8`. BOT Chain testnet and mainnet V3 registries are deployed and source-verified, but the hosted API and npm package may still lag until a separate release. Graph schema/hash `2.1.0` requires fresh, separately approved attestations; none are written until supported BOT mainnet contract addresses are selected and reviewed. See [migration notes](docs/GRAPH_V2_MIGRATION.md), [wallet handoff](docs/WALLET_TEAM_HANDOFF.md) and [rollout plan](docs/BOT_CHAIN_WALLET_ROLLOUT_PLAN.md) before integration.

Ver is BOT Chain's deterministic semantic and wallet-safety layer. It compiles blockchain artifacts (ABIs, bytecode, state variables) into an AI-readable Protocol Graph that wallets, IDEs, AI agents, and developer tools can consume through HTTP or MCP.

Active BOT registries:

- BOT Chain mainnet `677`: `0x51e1BF60223ef60cec511eB1d423FC52b4fF05C7`
- BOT Chain testnet `968`: `0x1763B6958CdD3FF5CebF64c960382ECF3669fFF2`

These registries store reviewed graph hashes only. They do not sign, route, custody, or approve wallet transactions.

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

For BOT Chain mainnet, use:

```json
{
  "mcpServers": {
    "ver": {
      "command": "npx",
      "args": ["-y", "aic-mcp"],
      "env": {
        "VER_NETWORK": "botMainnet",
        "BOT_MAINNET_RPC_URL": "https://rpc.botchain.ai",
        "BOT_MAINNET_REGISTRY_ADDRESS": "0x51e1BF60223ef60cec511eB1d423FC52b4fF05C7"
      }
    }
  }
}
```

MCP tools also accept optional `chainId` per call: `677` for BOT Chain mainnet, `968` for BOT Chain testnet, and `196` for X Layer compatibility.

## Links

- **Website & Documentation**: [https://verprotocol.vercel.app](https://verprotocol.vercel.app)
- **Founder / Twitter**: [https://x.com/Love_Light_11](https://x.com/Love_Light_11)

---
*© 2026 Ver Protocol. Built for BOT Chain.*

## Current release boundary

Release candidate **1.0.8** adds graph/hash **2.1.0** trust corrections and BOT Chain mainnet configuration. The on-chain registries are live, but API redeployment, npm publication, wallet-team acceptance, and graph attestations remain separate steps. See [release boundaries and remaining work](docs/TRUST_FIXES_1_0_8.md).
