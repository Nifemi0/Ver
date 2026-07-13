# XLayer Programmatic SDK Guide

The `xlayer-mcp` package exports the `XLayerClient` class, allowing you to programmatically access all the compiler pipeline stages, semantic reasoning, transaction simulations, and decoding layers inside your Node.js/TypeScript applications.

---

## 1. Installation

First, install the library in your project:

```bash
npm install xlayer-mcp
```

Make sure your environment variables are configured (e.g., in a `.env` file):
```bash
# RPC URL for X Layer (Defaults to X Layer Mainnet)
RPC_URL=https://rpc.xlayer.tech

# Optional: LLM configuration for Semantic Layer Enrichment
OPENAI_API_KEY=your-api-key
```

---

## 2. Quick Start

Initialize the client and compile a protocol graph:

```typescript
import { XLayerClient } from "xlayer-mcp";

// Initialize client
const client = new XLayerClient();

async function main() {
  const address = "0x1E4a5963aBFD975d8c9021ce480b42188849D41d"; // Sample Contract
  
  // 1. Fetch and compile full protocol graph
  const graph = await client.getProtocolGraph(address);
  
  console.log("Protocol Name:", graph.metadata.protocol_name);
  console.log("Intent Summary:", graph.semantic.intent.value);
  console.log("Roles Found:", graph.structural.roles.map(r => r.name));
}

main().catch(console.error);
```

---

## 3. SDK API Reference

The `XLayerClient` class exposes the following methods:

### `getProtocolGraph(address: string, forceRefresh?: boolean): Promise<XLayerSchema>`
Compiles the target contract into a full structured JSON graph.

* **Parameters:**
  * `address`: The EVM address of the smart contract.
  * `forceRefresh` (Optional): Set to `true` to bypass cache and re-compile/re-fetch.
* **Returns:** An `XLayerSchema` object containing structural details, semantic intent, security guardrails, and developer integration notes.

### `getContractSummary(address: string): Promise<ContractSummary>`
A helper that extracts a lightweight, developer-friendly overview of the contract.

* **Returns:**
  ```typescript
  interface ContractSummary {
    protocol_name: string;
    intent: string;
    structural_integrity: number;
    roles: string[];
    dependencies: string[];
    privileged_functions: string[];
  }
  ```

### `explainTransaction(address: string, calldata: string): Promise<DecodedTx>`
Decodes raw transaction calldata using the contract's ABI, and returns security classification based on compiled privilege mappings.

* **Parameters:**
  * `address`: The target contract address.
  * `calldata`: The hex string of the transaction payload.
* **Returns:**
  ```typescript
  interface DecodedTx {
    function: string;         // e.g. "transfer"
    args: any[];              // Serialized function arguments
    classification: string;   // e.g. "privileged_admin" | "public mutator"
    reason: string;           // Rationale for classification
  }
  ```

### `simulateTransaction(to: string, data: string, from?: string, value?: string): Promise<SimulationResult>`
Dry-runs state-changing calls locally against the current block state using the simulator engine.

* **Parameters:**
  * `to`: Target contract address.
  * `data`: Transaction calldata.
  * `from` (Optional): Address initiating the call.
  * `value` (Optional): Ether/native value passed in wei.
* **Returns:**
  ```typescript
  interface SimulationResult {
    success: boolean;
    gasUsed: string;
    returnValue: string;
    logs: any[];
    error?: string;
  }
  ```

### `readContract(address: string, data: string): Promise<string>`
Executes view or pure functions directly against on-chain state.

### `getSourceCode(address: string): Promise<string | null>`
Helper to fetch fully resolved, unflattened Solidity source code for verified contracts from Blockscout.

### `searchProtocol(address: string, query: string): Promise<SearchMatch[]>`
Searches structural elements (roles, events, privileged functions) by a keyword query.

---

## 4. Integration Examples

### Example A: Wallet Transaction Safety Middleware
Verify that an outgoing transaction does not trigger a privileged or dangerous role method:

```typescript
import { XLayerClient } from "xlayer-mcp";

const client = new XLayerClient();

async function preSignCheck(targetContract: string, calldata: string) {
  try {
    const tx = await client.explainTransaction(targetContract, calldata);
    
    if (tx.classification === "privileged_admin" || tx.classification === "owner_only") {
      console.warn(`[WARNING] Dangerous call: Function "${tx.function}" requires privileged roles.`);
      console.warn(`Reason: ${tx.reason}`);
      return false; // Suggest warning user
    }
    
    console.log(`[SAFE] Function "${tx.function}" is classified as: ${tx.classification}`);
    return true;
  } catch (err) {
    console.error("Safety check failed:", err);
    return false;
  }
}
```

### Example B: Auto-indexing Protocol Roles & Owners
Gather structural permissions configuration across multiple contracts:

```typescript
import { XLayerClient } from "xlayer-mcp";

const client = new XLayerClient();

async function inspectPermissions(contracts: string[]) {
  for (const address of contracts) {
    const graph = await client.getProtocolGraph(address);
    
    console.log(`\n=== Permissions Map for ${graph.metadata.protocol_name} ===`);
    console.log("Address:", address);
    
    console.log("Defined Roles:");
    graph.structural.roles.forEach(role => {
      console.log(`  - Role: ${role.name}`);
    });
    
    console.log("Privileged Functions:");
    graph.security.privileged_functions.forEach(func => {
      console.log(`  - ${func.name}() classified as: ${func.classification}`);
    });
  }
}
```
