# BOT Chain SDK integration

Release candidate `1.0.7` exports `VerClient` from `aic-mcp`. This SDK runs in Node.js (Node 22), not directly inside a wallet extension: use the HTTP endpoint from the wallet, or run the SDK on your backend. Package publication is a separate release step; do not assume the npm latest version contains these fixes.

```typescript
import { VerClient } from "aic-mcp";
const client = new VerClient(undefined, 968);
const result = await client.compileAgentIntent(
  "0x922835859623d6F3b99a2742D585E093bBA0a740",
  "approve 1 PRWA to 0x2222222222222222222222222222222222222222",
  "0x1111111111111111111111111111111111111111"
);
// Preparation only. This example never signs or broadcasts.
if (result.signable !== true || result.simulationStatus !== "success") {
  throw new Error("Preparation blocked");
}
console.log(result.transaction);
```

The historical `compileAgentIntent` method name is retained for compatibility. Its signing path is deterministic: no external LLM fallback, even if `VER_ALLOW_EXTERNAL_INTENT_LLM=true` is inherited from an old environment.

## Wallet contract

Prefer `POST /api/wallet/prepare` with explicit `chainId`, `contractAddress`, `sender`, `intent` and optional decimal-string `value` (only zero is supported). Exact grammar:

- `approve AMOUNT SYMBOL to ADDRESS` (`for` is also accepted).
- `transfer AMOUNT SYMBOL to ADDRESS`.

Match the symbol to the selected contract; symbols alone are not unique token identities. Excess fractional precision is rejected, never rounded. Unsupported text is rejected in full rather than partially interpreted. No swaps, conditions, batches, native transfers, ENS resolution, or arbitrary model-generated calls are supported.

Prepared responses include `sender`, `preparedAt`, `expiresAt` (60-second lifetime), `transaction.from/to/data/value/chainId`, `signable`, `simulationStatus`, `risk`, `blockingReasons`, and `requiresUserConfirmation`. `success: true` means compilation completed; it is NOT signing permission. Statuses are `success`, `reverted`, `skipped`, `failed`, or `unavailable`. `risk: review` is not a safe-contract certification.

The wallet must reject stale responses, require matching active account and chain, independently decode and compare the target/arguments/value to the user's request, re-simulate before signing, and obtain confirmation. Only the wallet signs and broadcasts. See [complete handoff checklist](docs/WALLET_TEAM_HANDOFF.md).

## Other methods

| Method | Purpose and limitation |
| --- | --- |
| `getProtocolGraph(address, forceRefresh?)` | Graph format/hash 2.0.0 binds chain, implementation/facets, full ABI and source. Registry authorization is re-read even on structural cache hits. |
| `getContractSummary(address)` | Lightweight summary; completeness scores are not security guarantees. |
| `explainTransaction(address, calldata)` | Proxy-resolved ABI decoding and privilege classification; not an authorization decision. |
| `decodeEventLog(address, topics, data)` | Decode emitted logs with the resolved ABI. |
| `searchProtocol(address, query)` | Search roles, events, privileged and public functions. |
| `simulateTransaction(to, data, from?, value?)` | Generic `eth_call`; use wallet preparation for the stricter token-return/signing gate. |
| `readContract(address, data)` | Read-only call, no broadcast. |
| `getSourceCode(address)` | Resolved explorer source, when available. |
| `getTokenMetadata(address)` | Token metadata from chain. |
| `getGasEstimate(to, data, from?, value?)` | `chainId`, `nativeCurrency`, `gasEstimate`, `gasPrice`, `estimatedCostWei`, `estimatedCostNative`. BOT estimates are not labeled OKB. |
| `diffProtocolGraphs(addressA, addressB)` | Compare graph structure. |

`estimatedCostOKB` was removed; consumers must migrate to the explicit currency and exact decimal-string fields. Providers can fail or state can change; handle rejected promises as blocked preparation, never as permission to bypass checks.

## Configuration

Set `VER_NETWORK=botTestnet`, `BOT_TESTNET_RPC_URL=https://rpc.bohr.life`, and `VER_ENABLE_WRITES=false`. No wallet keys or deployer keys belong in this service. X Layer 196 remains explicitly selectable for compatibility, not as the BOT integration default.

Graph attestations and wallet preparation are different checks. `registry.verified` is an active matching hash, not an audit. A missing attestation is not silently upgraded into trust by a high structural score. Wallet teams must decide whether their policy additionally requires an allowlisted token, matching registry attestation, or both.

## Graph 2.0 migration

See [migration contract](docs/GRAPH_V2_MIGRATION.md). Never reuse a 1.x attestation for a 2.0 graph. `registry.lookupStatus` distinguishes `checked`, `unavailable`, and `disabled`; lookup failure always returns `verified:false`. `checkedAt` timestamps the lookup attempt, not transaction inclusion. Structural cache entries remain snapshots; use `forceRefresh:true` to rebuild artifacts before attestation decisions.

Decoding returns recursive decimal strings for integers, including nested arrays and tuple objects. `classification: "unknown"` means access control is not established. `potentially privileged` is only a name-based heuristic; `read-only` reflects ABI mutability, not permission to read or proof of safety. Function signatures preserve overloads.

Wallet preparation requires explorer-provided source and ABI for every resolved proxy/implementation or diamond facet. Empty, comment-only, pseudo-source and partial resolutions are blocked. This relies on the configured explorer/repository's verified-artifact contract, not an independent source-to-bytecode audit.
