# Graph 2.0 migration and review remediation

Applies to repository release candidate 1.0.7. No deployment, npm publication, registry migration or attestation write is performed by this change.

## Identity contract

`registry.hashVersion`, `metadata.schema_version`, and compiler parser version are `2.0.0`. SHA-256 uses the domain `ver.protocol-graph/v2` and canonical JSON: recursively sorted object keys; outer ABI/fact collections sorted; parameter, output and tuple component order preserved. Inputs include chain ID, lowercased contract and implementation addresses, proxy flag, facet address/selector mappings, the complete ABI, source text (CRLF normalized to LF), verified-source evidence, compiler version, roles, events, dependencies and all classified functions. Timing, cache status, semantic prose and registry state are excluded.

Pure offline compiler callers must supply chain ID and source verification explicitly for on-chain use. Missing chain ID hashes into a separate `null` offline identity; absent source verification is false. Explorer adapters must return only verified source/ABI, or null. `source_verified` reflects that provenance contract and is not an independent bytecode equivalence proof.

Every 1.x hash is incompatible. Old SQLite graph entries are invalidated by the schema version and chain-scoped `graph-2.0.0` namespace. Semantic cache keys additionally include the graph hash. Recompile from fresh artifacts and obtain a newly reviewed attestation; do not rewrite historical attestations automatically. The deployed V2 registry can store the new bytes32 hash without changing its contract.

## Registry freshness

Every graph request reads registry state independently of the structural cache. Revocation, new registration and changed registry configuration therefore do not wait for the graph TTL. Disabled or unavailable reads return `verified:false`, never a previously cached true. `lookupStatus` distinguishes checked/unavailable/disabled; `checkedAt` records the lookup attempt's completion time. An unavailable `registered:false` is not proof that no registration exists.

Structural graphs are cached snapshots, not a continuous monitor of proxy upgrades. Use a forced fresh compilation before issuing attestations or making a current-code trust decision. State can change after either lookup or simulation; wallets must enforce their own policy and re-simulate immediately before signing.

## Decoder and classification compatibility

Proxy ABIs merge by full signature, including tuple and array types. The implementation takes precedence only for an identical signature. Diamond functions are restricted to loupe-advertised selectors; every selected facet and the proxy need real source and ABI before preparation can proceed. Incomplete diamond resolution cannot silently fall back to a verified base-contract claim.

Decoded integers are decimal strings at any nesting depth. Arrays and named tuple objects retain their shape. MCP serialization applies the same recursive conversion.

Writes without established access control are `unknown`, not `public mutator`. Name heuristics are `potentially privileged`, never proven authorization. ABI view/pure functions are `read-only`. External visibility and search result category `public_function` describe an ABI surface, not unrestricted access. No classification is signing permission.

## CI and operator gates

The repaired lockfile includes the two missing platform-dependent emnapi entries; it preserves existing dependency versions. CI now tests Ubuntu and Windows with npm 11.6.2 on Node 22. Explorer request deadlines cover response body consumption and validation, not headers alone.

Before release: require green CI, deploy the approved build to staging using the [CI-gated staging process](STAGING_RELEASE.md), run wallet-team acceptance, then approve publication. Automatic Git deployments and automatic production alias assignment are disabled for this rollout. The deployed V2 registry, separate undeployed V3 candidate, and low-severity contract-tooling advisory remain as previously documented.
