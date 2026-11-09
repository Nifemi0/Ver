# Trust corrections for release candidate 1.0.8

This is the current repository release candidate. BOT Chain testnet and mainnet V3 registries are deployed and source-verified, but hosted API deployment and npm publication remain separate release steps. npm latest was 1.0.5 when checked on September 5, 2026; re-check npm before assuming an unversioned install contains this candidate.

Graph schema/hash version is now 2.1.0. The hash domain is `ver.protocol-graph/v2.1`; runtime code hashes, implementation/facet identities and stable heuristic role evidence affect the hash. Old 2.0 attestations intentionally do not match. No new graph attestation has been approved or written because the supported BOT mainnet contract list is not available yet.

Every graph request reconciles explorer metadata against chain identity and rechecks the structural hash before using a cached graph. Storage/transport failures cannot establish that a proxy is absent. A disagreement between explorer and chain is blocked until artifacts agree. Supported resolution includes ERC-1967 implementations/beacons, exact standard ERC-1167 clones, implementation-authority tokens, the explicit implementation getter and diamond loupe facets. Nonstandard/custom proxies require separate support; this does not establish complete program semantics.

Graph metadata includes `snapshot_block`, `identity_checked_at` and `runtime_code_hash`. Wallet preparation uses the normalized snapshot block for metadata reads and eth_call and returns `snapshotBlock`, `runtimeCodeHash` and `implementationAddress`. These describe a past snapshot; the wallet must still invalidate on account/input/network changes and re-simulate with its own provider before confirmation. Successful simulation is not a trust certification.

Semantic/security/developer `verified` fields remain false when analysis is absent. Role inference is labelled heuristic with reduced confidence and full ABI signature evidence. Structural scores measure available evidence only. `registry.verified` remains a separate active matching attestation check; `/api/wallet/prepare` does not itself require an attestation. Wallet policy must explicitly require its trusted token list and any desired attestation.

OpenAPI uses the serving origin rather than directing staging clients to production. Early dependency failures are non-signable HTTP 503; known proxy/artifact rejections are HTTP 422 with a specific blocking reason.

## Remaining work

The credit-limited pass prioritizes correctness. Shared rate limiting, bounded total request/queue latency, artifact-fetch deduplication, a browser wallet adapter, partner origin/access and joint acceptance remain follow-up work. Rechecking identity increases RPC/explorer work; measure capacity before scaling. The new candidate needs CI and hosted acceptance before being handed off as the deployed API build.

The V2 registry's old-attestation revocation and former-owner authorization limitations remain on that historical contract, but BOT Chain testnet and mainnet now have V3 deployed and source-verified. New hashes require separately approved attestations after contract selection and graph review. A successful funded transfer, wallet rejection/signing/receipt flow and production operational acceptance remain unproven.
