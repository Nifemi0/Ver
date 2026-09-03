# BOT Chain wallet-team handoff

## What Ver does

Ver is off-chain wallet middleware. The wallet sends a selected BOT Chain contract, connected account, chain ID and a single supported intent. Ver resolves verified contract source/ABI (including proxies), validates exact token units, constructs unsigned calldata and tests it with read-only `eth_call`. It returns a reviewable result; the wallet retains confirmation, signing, broadcast and receipt tracking.

The on-chain registry stores graph-hash attestations only. It never holds wallet funds or signs wallet transactions. BOT Chain testnet is chain 968; deployed V2 is `0xfEB4423E669a0e160b316a8Ca46D8Ca70eB2A4F5`. The separate V3 source is an undeployed candidate, not a live contract address.

## Team deliverables

- `swagger.json`: HTTP request and response contract.
- `SDK.md`: Node SDK and supported grammar; the wallet itself should use HTTP.
- `contracts/contracts/VerRegistry.sol`: deployed V2 source, deliberately unchanged.
- `contracts/contracts/VerRegistryV3.sol`: proposed replacement, pending independent review and deployment approval.
- `deployments/botTestnet.json`: existing deployment metadata. No migration has occurred.
- `tests/wallet-safety.test.ts` and API tests: executable signing-gate regression cases.
- `docs/BOT_CHAIN_WALLET_ROLLOUT_PLAN.md`: staged acceptance and release gates.
- `docs/GRAPH_V2_MIGRATION.md`: graph/hash 2.0.0 compatibility, registry freshness and classification semantics for release candidate 1.0.7.

## Integration sequence

1. Select BOT testnet and an allowlisted target contract; capture the connected account. Build a request to `POST /api/wallet/prepare`. Do not send keys or seed phrases.
2. Accept only HTTP 200, `signable === true`, `simulationStatus === "success"`, and an empty `blockingReasons` list. All timeouts, malformed responses and non-200 responses block this preparation.
3. Require top-level and transaction chain ID 968; `sender` and `transaction.from` must match the still-connected account. Require the requested contract, zero native value, valid calldata, valid timestamps, and an unexpired result. Discard on any input/account/network change; never reuse an old preparation.
4. Independently decode calldata with the trusted token ABI. Compare function, recipient/spender and exact base-unit amount against the user's selected token and request. A symbol is not a unique identity.
5. Display chain, token contract, action, amount, recipient/spender and approval allowance. Re-simulate using the wallet's provider immediately before requesting a signature. This reduces state drift; it cannot guarantee future inclusion or execution.
6. Ask the user to confirm, sign locally, broadcast through the wallet, track receipt/replacement/failure, and show explorer status. Ver does none of these signing or sending steps.

## Supported scope and errors

Only single standard ERC-20 approvals and transfers with an exact numeric amount and literal address are supported. Conditional, negated and compound instructions, swaps, native transfers, unlimited-keyword approvals and AI-generated calldata are blocked.

HTTP 400 = invalid request; 413 = oversized body; 422 = blocked preparation; 429 = rate limit (honor `Retry-After`); 503 = dependency/capacity unavailable. Errors contain `success:false`, `signable:false`, `risk:"blocked"`, `blockingReasons` and `error`. Never infer permission from `success` alone. `eth_call` success with ERC-20 false or malformed output is blocked.

## Acceptance responsibilities

Ver: endpoint correctness, strict parser, exact units, proxy decoding, stable blocked results, RPC chain check, no secrets/signing capability in the runtime.

Wallet: trusted token selection, active-chain/account binding, stale-response rejection, independent calldata review, final simulation, approval UX, user rejection, local signing and receipt handling.

Joint staging tests must include a genuinely funded, unpaused transfer fixture, insufficient balance independently of pause state, allowance changes, false-return token, wrong network/account, expiry, malicious text, RPC/explorer outage, proxy upgrades, concurrent requests and user rejection. Current PRWA transfer reverts while paused; that is not evidence of an independent insufficient-balance test.

## Release status

Local fixes are not hosted deployment or npm publication. Do not treat the public URL as passing this checklist until the same build is deployed and tested with the wallet team. There is no guarantee of zero issues. Production approval still needs shared rate limiting, monitoring, provider capacity, independent security review, multisig operations and rollback ownership.
