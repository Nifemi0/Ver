# Ver Demo Kit

**Length:** ~2:30–3:00  
**Hackathon track:** AI (On-Chain Horizon 2026)  
**Hero contract:** USDT `0x1E4a5963aBFD975d8c9021ce480b42188849D41d`  
**Mainnet registry:** `0x3776Cc9AEe3AFb005F9465e6B78079FCf4d16DA6`  
**Site:** https://xlayer-delta.vercel.app  
**MCP:** `npx -y aic-mcp`  
**Tagline:** *Deterministic by design. Explainable by AI.*

---

## Pre-flight checklist (before you hit record)

- [ ] Terminal font ≥ 16px, dark theme, hide personal paths if possible
- [ ] Never open `.env` or show `DEPLOYER_PRIVATE_KEY`
- [ ] MCP wired in Claude Desktop / Cursor:
  ```json
  {
    "mcpServers": {
      "ver": {
        "command": "npx",
        "args": ["-y", "aic-mcp"]
      }
    }
  }
  ```
- [ ] Warm cache: `npm run seed`  (expect 5/5 ✅)
- [ ] Smoke tools: `npm run demo:smoke` (expect 11/11 ✅)
- [ ] Browser tabs ready:
  1. Landing — https://xlayer-delta.vercel.app
  2. Explorer — https://xlayer-delta.vercel.app/explorer.html
  3. Claude / Cursor with Ver MCP connected
- [ ] Optional backup: local `npm run mcp` if npm registry is flaky
- [ ] Close Slack/email popups; Do Not Disturb on

### Demo contracts (all X Layer Mainnet, verified)

| Chip | Address | Why |
|------|---------|-----|
| **USDT** (hero) | `0x1E4a5963aBFD975d8c9021ce480b42188849D41d` | Tether USD — mint/burn/freeze privileged, transfer public |
| **USDC** | `0x74b7f16337b8972027f6196a17a631ac6de26d22` | USD Coin |
| **WETH** | `0x5a77f1443d16ee5761d310e38b62f77f726bc71c` | Wrapped Ether |

---

## Shot list (what’s on screen)

| # | Time | Screen | Action |
|---|------|--------|--------|
| 1 | 0:00–0:15 | Landing | Scroll hero + tagline |
| 2 | 0:15–0:35 | Explorer / Blockscout ABI | Show the pain (raw ABI wall) |
| 3 | 0:35–0:50 | MCP config JSON | 2-second flash of `npx -y aic-mcp` |
| 4 | 0:50–1:40 | Claude/Cursor chat | `get_protocol_graph` + summary |
| 5 | 1:40–2:10 | Same chat | `explain_transaction` safety beat |
| 6 | 2:10–2:30 | Same chat | Optional: simulate / search |
| 7 | 2:30–2:45 | Architecture one-liner | Docs or mermaid mental model |
| 8 | 2:45–3:00 | End card | npm · github · site |

---

## Word-for-word voiceover

### 0:00 — Hook
> “LLMs can read Solidity. They still don’t understand *protocols*.  
> Ver fixes that — deterministic by design, explainable by AI.”

### 0:15 — Problem
> “Today, if an AI agent wants to integrate a smart contract on X Layer, the workflow is: open an explorer, dump the ABI, read the source, and *guess* the architecture.  
> Roles, privileged functions, event surface — all tribal knowledge. That’s slow, and it’s wrong more often than we admit.”

### 0:35 — Setup
> “Ver is an MCP server. One command: `npx -y aic-mcp`.  
> Claude, Cursor, any MCP client — they get a protocol graph instead of a raw ABI.”

### 0:50 — Compile (hero moment)
**Paste prompt 1** (below). Wait for tool call.

> “I give it USDT on X Layer Mainnet.  
> Ver fetches verified artifacts from Blockscout, normalizes proxies, then runs a deterministic compiler: roles, events, functions, dependencies.  
> AI only *annotates* those facts — it never invents them. That’s ADR-015.”

Point at:
- events: `Transfer`, `Approval`, `Mint`, `Burn`
- privileged: `mint`, `burn`
- integrity score

### 1:20 — Summary
**Paste prompt 2.**

> “Same graph, lightweight summary — what a wallet or agent actually needs: intent, privileged surface, structural integrity.”

### 1:40 — Safety beat (judges love this)
**Paste prompt 3.**

> “Now the money shot for wallets: raw calldata in, human meaning out.  
> This is a `transfer` to `0x1111…` for amount 10 — classified as a *public mutator*, not an admin call.  
> If it had been `mint` or an owner-only function, Ver would flag it as privileged.”

### 2:10 — Optional flex (if time)
**Paste prompt 4 or 5.**

> “I can also dry-run the call. Without a sender it correctly reverts — transfer from the zero address.  
> Or search the protocol for anything named transfer, pause, admin…”

### 2:30 — Architecture close
> “Pipeline is simple: explorer → normalize → deterministic compile → optional semantic enrichment → SQLite cache → MCP.  
> Facts first. AI second. Agents ship faster.”

### 2:45 — End card
> “Ver — protocol intelligence for X Layer.  
> `npx -y aic-mcp` · npm · GitHub · aic-mcp.vercel.app”

---

## Copy-paste prompts (mid-recording)

### Prompt 1 — Protocol graph
```text
Using the Ver MCP server, get the full protocol graph for X Layer contract 0x1E4a5963aBFD975d8c9021ce480b42188849D41d.

Highlight: roles, events, privileged functions, dependencies, and structural integrity. Keep it scannable.
```

### Prompt 2 — Summary
```text
Now give me a lightweight contract summary for that same address — protocol name, intent, roles, privileged functions only.
```

### Prompt 3 — Explain calldata (safety)
```text
Explain this transaction calldata against the same contract using Ver:

0xa9059cbb0000000000000000000000001111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000a

What function is this, what are the args, and is it privileged or public?
```

### Prompt 4 — Simulate (educational revert)
```text
Simulate that same transfer calldata with Ver (no from address). What happens and why?
```

### Prompt 5 — Search
```text
Search the protocol graph for "transfer" and "mint". What matches?
```

### Prompt 6 — Source (optional)
```text
Fetch the verified source code head for this contract via Ver and tell me the Solidity version and token pattern.
```

---

## End card (hold 3–4 seconds)

```text
┌──────────────────────────────────────────────┐
│  Ver                                         │
│  Deterministic Protocol Intelligence for AI  │
│                                              │
│  npx -y aic-mcp                              │
│                                              │
│  npm      npmjs.com/package/aic-mcp          │
│  github   github.com/Nifemi0/Ver             │
│  site     xlayer-delta.vercel.app            │
│                                              │
│  Built for X Layer                           │
└──────────────────────────────────────────────┘
```

Fullscreen this block in a terminal or slide. Black background, green accent (`#10B981`).

---

## What NOT to show live

| Avoid | Why |
|-------|-----|
| `.env` / private keys | Security + looks sloppy |
| `register_protocol_graph` | Needs writes + gas; can fail mid-take |
| Cold compile on random unverified address | Empty graph, dead air |
| Multi-minute source dump | Loses the audience |
| Ethereum addresses (USDC/Uniswap) | Wrong chain for this pitch |

---

## Rehearsal commands

```bash
cd /root/xlayer

# 1) Warm cache (do this 5 min before recording)
npm run seed

# 2) Full tool smoke (must be 11/11)
npm run demo:smoke

# 3) Local MCP (backup if npx is slow)
npm run mcp

# 4) Optional local dashboard
npm run dashboard
```

### Known-good smoke outcomes (TetherToken)

| Tool | Expected |
|------|----------|
| `get_protocol_graph` | events Transfer/Approval/Mint/Burn; privileged mint/burn |
| `get_contract_summary` | integrity ~60; privileged_functions includes mint/burn |
| `explain_transaction` | `transfer` → public mutator |
| `search_protocol` "transfer" | Transfer event |
| `simulate_transaction` no from | revert: transfer from zero address |
| `read_contract` name() | success + ABI-encoded string |
| `get_source_code` | ~1.5KB verified Solidity |
| `lookup_graph_attestation` | empty / zero hash OK |
| `register_protocol_graph` | gated unless `VER_ENABLE_WRITES=true` |

---

## Backup plan if MCP flakes on camera

1. Open Explorer page → click **TetherToken** chip → show compiled graph UI  
2. Or run SDK one-liner in terminal:
   ```bash
   npx tsx -e "require('dotenv').config(); const {VerClient}=require('./src/sdk/client'); new VerClient().getContractSummary('0x1E4a5963aBFD975d8c9021ce480b42188849D41d').then(console.log)"
   ```
3. Keep talking: “Same graph the MCP serves — facts compiled once, reused by every agent.”

---

## One-line answers for judges

| Question | Answer |
|----------|--------|
| Why not just ask Claude? | Claude reads files. Ver compiles *protocols* with provenance and a reusable schema. |
| Why deterministic? | Every structural fact comes from verified ABI/source/events. AI only annotates. |
| Why MCP? | Agents already speak MCP — zero custom integration. |
| Why X Layer? | Better tooling → faster ecosystem integration for builders *and* AI agents. |

---

## Version / package

- npm: `aic-mcp@1.0.9-beta.0`
- Local path: `/root/xlayer`
- Registry (X Layer Mainnet): `0x3776Cc9AEe3AFb005F9465e6B78079FCf4d16DA6` · [explorer](https://www.oklink.com/xlayer/address/0x3776Cc9AEe3AFb005F9465e6B78079FCf4d16DA6)
