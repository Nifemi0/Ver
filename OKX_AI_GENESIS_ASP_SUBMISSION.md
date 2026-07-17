# OKX.AI Genesis Hackathon — Ver Protocol ASP Submission Pack

**Deadline:** July 17, 2026 · 23:59 UTC  
**Prize pool:** ~$100k (up to ~10k USDT single awards)  
**Project:** Ver Protocol  
**ASP type:** **A2MCP** (Agent-to-MCP) — free MCP/API now; paid x402 later  
**Builder:** Sky · [@Love_Light_11](https://x.com/Love_Light_11)

---

## Hard requirements (checklist)

| # | Requirement | Ver status | Action left |
|---|-------------|------------|-------------|
| 1 | Build ASP with clear real-world use case | ✅ Live product | — |
| 2 | Submit ASP for listing via OKX.AI / Onchain OS · **must go live** | ⚠️ Product live; **OKX.AI marketplace listing may still be pending** | Register + list ASP via agent prompts (see below) |
| 3 | X post with **#OKXAI** + intro + demo ≤90s | ⬜ | Post draft below on main |
| 4 | Google form before deadline + ASP details + X post link | ⬜ | [Form](https://forms.gle/mddEUagmDbyV37ws8) |

**Rule:** If ASP listing is not approved / cannot go live → submission invalid.

---

## One-liner (paste everywhere)

**Ver** turns X Layer smart contracts into deterministic Protocol Graphs that AI agents and IDEs consume via MCP — facts from chain, AI only annotates. Intent → verified calldata without hallucinated ABIs.

---

## Official links (form + X)

| Field | Value |
|-------|--------|
| **Product name** | Ver Protocol |
| **Live site** | https://verprotocol.vercel.app |
| **Docs** | https://verprotocol.vercel.app/docs.html |
| **GitHub** | https://github.com/Nifemi0/Ver |
| **npm / MCP** | https://www.npmjs.com/package/aic-mcp · `npx -y aic-mcp` |
| **X** | https://x.com/Love_Light_11 |
| **Chain** | X Layer Mainnet · chainId **196** |
| **Sample contract (USDT)** | `0x1E4a5963aBFD975d8c9021ce480b42188849D41d` |

---

## Real-world use case (judges)

**Problem:** Agents and IDEs treat contract ABIs as free-text → hallucinated functions, wrong decimals, unsafe calldata.

**Solution (A2MCP service):**
1. Compile contract → deterministic Protocol Graph (roles, events, privileges, structure).
2. Map natural language intent → exact EVM calldata with static simulation.
3. Expose the whole pipeline as **MCP** so Hermes / Claude Code / Cursor / Onchain OS agents call it as a skill, not a chat toy.

**Who pays later:** wallets, agent runtimes, audit tools, builder IDEs — free tier for graph/read; paid x402 for high-rate intent compile.

**Crypto + non-crypto angle:** Works on any verified EVM contract surface; primary demo chain is **X Layer** (OKX).

---

## How to install / call (demo path)

### MCP (primary ASP surface)

```json
{
  "mcpServers": {
    "ver": {
      "command": "npx",
      "args": ["-y", "aic-mcp"],
      "env": {
        "XLAYER_RPC_URL": "https://rpc.xlayer.tech"
      }
    }
  }
}
```

### HTTP

```bash
# Compile graph
curl -s "https://verprotocol.vercel.app/api/compile?address=0x1E4a5963aBFD975d8c9021ce480b42188849D41d"

# Intent → calldata
curl -X POST https://verprotocol.vercel.app/api/compile-intent \
  -H "Content-Type: application/json" \
  -d '{
    "contractAddress": "0x1E4a5963aBFD975d8c9021ce480b42188849D41d",
    "intent": "Transfer 10 USDT to 0x1111111111111111111111111111111111111111"
  }'
```

---

## OKX.AI listing steps (A2MCP)

From [Become an ASP](https://www.okx.ai/tutorial/asp) — run in Hermes / Claude Code / OpenClaw with Onchain OS:

1. Install agent runtime (you already have Hermes).
2. Install Onchain OS skills:
   ```text
   npx skills add okx/onchainos-skills --yes -g
   ```
3. Log in Agentic Wallet:
   ```text
   Log in to Agentic Wallet on Onchain OS with my email
   ```
4. Register **A2MCP** (not A2A):
   ```text
   Help me register an A2MCP ASP on OKX.AI using OKX Agent Identity from Onchain OS
   ```
   Use fields from this pack (name Ver, free MCP endpoint, X Layer).
5. List ASP:
   ```text
   Help me list my ASP on OKX.AI using Onchain OS
   ```
6. Review ~24h → email + agent chat. **Must show as live/listable for eligibility.**

**Suggested free A2MCP endpoint description:**  
`MCP: npx -y aic-mcp` · HTTP: `https://verprotocol.vercel.app/api/compile` + `/api/compile-intent`  
Pricing: free for hackathon; x402 planned.

---

## Google form — paste blocks

**Project / ASP name**  
Ver Protocol

**One-line description**  
Deterministic Protocol Graphs + intent→calldata for X Layer contracts, served as MCP so agents don’t hallucinate ABIs.

**Long description**  
Ver is a semantic compiler and agent service for X Layer. It fetches verified contract artifacts, builds a deterministic Protocol Graph, and exposes compile + natural-language intent compilation through MCP (`aic-mcp`) and HTTP. Agents (Hermes, Claude Code, Cursor, Onchain OS) get chain-grounded structure and calldata instead of free-text ABI guesses. Built for OKX’s agent stack on X Layer. The compile/MCP path is live today at verprotocol.vercel.app.

**Category / type**  
A2MCP · Developer infrastructure · AI × On-chain

**Demo link**  
https://verprotocol.vercel.app  
**Repo**  
https://github.com/Nifemi0/Ver

**npm**  
https://www.npmjs.com/package/aic-mcp

**X post URL**  
*(paste after you post)*

**Contact / team**  
Solo · Sky · @Love_Light_11

---

## X post draft (#OKXAI) — main account

**Text (keep under ~90s demo promise):**

```text
Shipping Ver Protocol as an ASP for #OKXAI

Problem: agents hallucinate contract ABIs and calldata.
Ver: compile X Layer contracts → deterministic Protocol Graphs + intent→calldata via MCP.

One command:
npx -y aic-mcp

Live:
https://verprotocol.vercel.app

GitHub: https://github.com/Nifemi0/Ver
npm: aic-mcp

Built for agents on X Layer — facts from chain, AI only annotates.

#OKXAI #XLayer #MCP
```

**Media:** 30–90s screen recording  
1. Landing (10s)  
2. `npx -y aic-mcp` / MCP config flash (10s)  
3. Compile USDT graph on site or explorer (25s)  
4. Intent compile example (25s)  
5. End card: site · npm · GitHub (10s)

Use `DEMO.md` timing if you already cut a reel. Cap **≤90 seconds**.

---

## 90s demo script (voiceover)

1. “Ver makes X Layer contracts safe for agents.”  
2. “One install: `npx -y aic-mcp`.”  
3. “Here’s USDT compiled into a Protocol Graph — structure from chain, not LLM guesswork.”  
4. “Intent: transfer 10 USDT → exact calldata + simulation path.”  
5. “Live ASP surface for OKX.AI agents. #OKXAI”

---

## What is NOT ready (don’t claim)

- Any HashGraph / HashKey mainnet traction as Ver metrics.  
- Fake user counts or revenue without proof.

---

## Ship order (today)

1. [ ] Confirm site + compile API still up (browser).  
2. [ ] Run Onchain OS ASP register + list prompts (A2MCP).  
3. [ ] Record ≤90s demo if not already.  
4. [ ] Post X with **#OKXAI** + demo.  
5. [ ] Submit [Google form](https://forms.gle/mddEUagmDbyV37ws8) with form blocks + X link.  
6. [ ] Keep ASP online through review.

---

## Tagline bank

- Deterministic by design. Explainable by AI.  
- Facts from chain. AI only annotates.  
- Protocol Graphs for agents on X Layer.

---

*Pack generated for Sky · Ver = X Layer · do not mix with HashGraph/HashKey submission.*
