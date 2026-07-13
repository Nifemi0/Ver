# HashGraph MVP v1.0 --- GEMINI.md

> **Mission**
>
> **Deterministic by design. Explainable by AI.**
>
> Build the semantic layer for HashKey Chain. HashGraph compiles
> deterministic blockchain artifacts into an AI-readable Protocol Graph
> that IDEs, wallets, AI agents and developer tools can consume through
> MCP.

------------------------------------------------------------------------

# Core Principles

-   Deterministic first.
-   AI augments, never replaces deterministic facts.
-   Read-only infrastructure.
-   MVP over feature creep.
-   Infrastructure before application.

# Product Philosophy

HashGraph is not: - a wallet - a scanner - a documentation generator -
an auditor

HashGraph is: - a semantic compiler - a protocol graph builder - an AI
context provider - an MCP server

# MVP Scope

## Included

-   ABI Fetcher
-   Verified source fetcher
-   Data normalizer
-   Deterministic compiler
-   Semantic enrichment
-   SQLite cache
-   MCP server
-   get_protocol_graph()

## Deferred

-   Multi-chain
-   Semantic diff
-   Upgrade tracking
-   Transaction intent engine
-   Dashboard analytics

------------------------------------------------------------------------

# Repository Structure

``` text
src/
  engine/
    fetcher.ts
    normalizer.ts
    compiler.ts
    enrich.ts
    cache.ts
  server/
    index.ts
    tools.ts
  types/
    schema.ts
```

# Architecture

Input Contract ↓ Blockscout Fetcher ↓ Normalizer ↓ Deterministic
Compiler ↓ HashGraph Schema ↓ Semantic Enrichment ↓ Cache ↓ MCP Server ↓
Cursor / Gemini / Claude

# Schema Overview
export interface HashGraphSchema {
  metadata: {
    protocol_name: string;
    contract_address: string;
    compiler_version: string;
    cache_status: "HIT" | "MISS";
  };
  structural: {
    roles: string[];
    dependencies: { target_address_or_interface: string; type: string }[];
    events: string[];
  };
  semantic: {
    intent: string;
    user_goal: string;
    confidence: number;
    verified: boolean;
  };
  security: {
    guardrails: string[];
    privileged_functions: string[];
    confidence: number;
    verified: boolean;
  };
  developer: {
    integration_notes: string[];
    confidence: number;
    verified: boolean;
  };
}

metadata structural semantic security developer

Only structural data is deterministic.

# Confidence Rules

Confidence is computed deterministically.

Evidence examples:

-   Verified ABI
-   Verified source
-   ERC detection
-   OpenZeppelin detection
-   Constructor dependency resolution

LLM never computes confidence.

------------------------------------------------------------------------

# Coding Standards

-   Strict TypeScript
-   No any
-   Zod validation
-   viem for ABI parsing
-   console.error for MCP logs
-   Modular architecture

------------------------------------------------------------------------

# Security

Read-only.

Never: - sign transactions - request private keys - execute contracts

------------------------------------------------------------------------

# Testing

Fixture contracts:

-   ERC20
-   ERC721
-   Ownable
-   AccessControl
-   Proxy
-   Lending Vault
-   Oracle

Golden output snapshots required.

------------------------------------------------------------------------

# Demo

1.  Paste contract.
2.  Compile.
3.  Build graph.
4.  Cache.
5.  MCP returns graph.
6.  Cursor consumes graph.

Pitch:

"ABIs tell computers how to call contracts. HashGraph tells AI how to
understand them."

------------------------------------------------------------------------

# Architecture Decision Records

## ADR-001

Deterministic compiler first.

## ADR-002

ABI is primary source of truth.

Priority: ABI → Source → Constructor → Public Variables → Events →
Metadata → Regex.

## ADR-003

Normalizer isolates compiler from explorer.

## ADR-004

Confidence is deterministic.

## ADR-005

AI only writes semantic fields.

## ADR-006

Independent cache layers.

## ADR-007

MCP is primary interface.

## ADR-008

Read-only infrastructure.

## ADR-009

SQLite for MVP.

## ADR-010

Fixture-driven testing.

## ADR-011

Protocol Graph is the product.

## ADR-012

MVP before innovation.

## ADR-013

Compiler Stages Are Pure. Every compiler stage must behave as a pure function. No extractors may perform network requests, invoke an LLM, or mutate shared state.

## ADR-014

Explainability First. Every deterministic fact emitted by the compiler must contain enough metadata for an engineer to independently verify how it was derived. No black-box extraction.

## ADR-015

AI Never Creates Facts. The LLM is restricted exclusively to summarizing, grouping, and explaining existing deterministic structural facts. Any structural metadata emitted by the LLM is discarded.

## ADR-016

HashGraph Is Infrastructure. HashGraph does not execute transactions. HashGraph does not modify contracts. HashGraph does not perform audits. HashGraph does not make trust decisions. HashGraph provides deterministic protocol intelligence for AI systems and developers.

## ADR-017

Browser-Compatible Favicons. All inline SVG favicon data URIs in HTML headers must be fully URL-encoded (using `%3C`, `%3E`, and single quotes `%27`) to guarantee rendering safety in strict browsers.

## ADR-018

Automatic Cache Invalidation. Any structural, normalizer, or compiler logic updates must increment the cache version (`CURRENT_ENRICHMENT_VERSION` or `CURRENT_SCHEMA_VERSION` in `src/engine/cache.ts`) to immediately invalidate stale cache entries.

## ADR-019

Multi-Tier Proxy Resolution. Proxy implementation checks must handle case-insensitive keys (`Implementation`/`implementation`) and fallback to on-chain `implementation()` signature checks if explorer data is unverified or missing.

------------------------------------------------------------------------

# Roadmap

Step 1 Scaffold Schema Cache

Step 2 Fetcher Normalizer

Step 3 Compiler

Step 4 Semantic enrichment

Step 5 MCP integration

------------------------------------------------------------------------

# Gemini Rules

-   Never violate ADRs.
-   Never exceed MVP scope.
-   Never invent blockchain facts.
-   Stop after each roadmap milestone.
-   Explain conflicts before changing architecture.
