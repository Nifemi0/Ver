# BOT Chain wallet rollout plan

Latest repository candidate: 1.0.8, graph/hash 2.1.0. [Trust corrections and outstanding work](TRUST_FIXES_1_0_8.md) supersede the historical 1.0.7 status below. BOT Chain testnet and mainnet V3 registries are deployed and source-verified; API release and graph attestations are still separate steps.

## Current boundary

Release candidate 1.0.8 contains the current trust-path remediation. It is not a production-readiness guarantee and should not be treated as live API or published npm evidence until the matching build is deployed/released. BOT Chain testnet 968 remains the default development target, BOT Chain mainnet 677 is now configured for mainnet registry reads, and X Layer 196 remains explicitly selectable for compatibility.

Active registries:

- BOT Chain mainnet 677: `0x51e1BF60223ef60cec511eB1d423FC52b4fF05C7`
- BOT Chain testnet 968: `0x1763B6958CdD3FF5CebF64c960382ECF3669fFF2`

API deployment, npm publication and attestation writes are still separate approval gates. No mainnet graph attestations are written yet because the supported contract list is not available.

## Stage one: verify the release candidate

Owner: Ver team.

- Run root typecheck, full tests, build and dependency audit; run contract build/tests/audit in `contracts/`.
- Verify malformed, negated, conditional and compound requests cannot become signable.
- Verify exact decimals, symbol/target identity, RPC chain ID and false/malformed ERC-20 return handling.
- Verify all MCP tools, stdout protocol framing, proxy ABI decoding, public-function search and BOT gas fields.
- Review [graph format/hash 2.1.0 migration](GRAPH_V2_MIGRATION.md): versioned identity includes chain, implementation/facets, full ABI and source. Every old attestation requires replacement through a separately approved write.
- Require both Windows and Linux CI, using Node 22 and npm 11.6.2. Automatic Git deployment is disabled; see [CI-gated staging process](STAGING_RELEASE.md). Production promotion remains separate.
- Review the handoff and OpenAPI together. Publish only the tested package/build.

## Stage two: deploy approved API build to staging

Owner: Ver operator; requires release approval.

For testnet staging, set `VER_NETWORK=botTestnet`, `BOT_TESTNET_RPC_URL=https://rpc.bohr.life`, `BOT_TESTNET_EXPLORER_API_URL=https://scan.bohr.life/api`, `BOT_TESTNET_REGISTRY_ADDRESS=0x1763B6958CdD3FF5CebF64c960382ECF3669fFF2`, `VER_REGISTRY_LOOKUP=true`, `VER_ENABLE_WRITES=false`, and `ALLOWED_ORIGINS` to the wallet staging origin. Never install deployer/attester keys in the API environment.

For a mainnet environment, set `VER_NETWORK=botMainnet`, `BOT_MAINNET_RPC_URL=https://rpc.botchain.ai`, `BOT_MAINNET_EXPLORER_API_URL=https://scan.botchain.ai/api`, `BOT_MAINNET_REGISTRY_ADDRESS=0x51e1BF60223ef60cec511eB1d423FC52b4fF05C7`, `VER_REGISTRY_LOOKUP=true`, and `VER_ENABLE_WRITES=false`.

Check health reports chain 968 and the expected release version. Run hosted positive/negative probes, CORS checks and dependency-failure tests. A local passing test is not hosted evidence. Roll back the API build/environment on failure; do not bypass simulation to restore signing availability.

## Stage three: wallet integration and joint acceptance

Owner: wallet team with Ver support.

Follow [wallet handoff](WALLET_TEAM_HANDOFF.md). Require signable plus successful simulation; validate chain/account/target/decoded arguments; enforce 60-second expiry and invalidate on input changes. Require final wallet-side simulation and explicit confirmation. The wallet alone signs, broadcasts and tracks receipts.

Test supported approval and transfer, wrong token symbol, excessive precision, unsafe text, ERC-20 false, wrong chain, account changes, stale/replayed responses, RPC/explorer outages, user rejection, token pauses, insufficient balance, proxy changes and concurrency. Use an unpaused fixture to distinguish insufficient balance from pause failures. No public-chain transaction tests without explicit approval and an agreed test-fund budget.

## Stage four: registry decision and attestation rollout

Owner: registry/multisig operators; separate explicit approval required.

Review V3's two-step ownership and epoch-based invalidation policy. Reauthorization does not revive revoked graphs; ownership acceptance revokes the former owner's graphs. Validate governance tests and obtain independent review before treating the registry as production governance.

Before any new deployment, recheck official BOT configuration, signer identity, nonce, balance and estimated cost. Deployment requires the explicit environment gates documented in [network guide](BOT_CHAIN_TESTNET.md). Verify new source/bytecode and read-only calls, archive old metadata, then approve environment changes. Do not switch X Layer records.

Define canonical graph-hash and metadata storage policy before publishing attestations. Use a separate attester process and multisig owner. Require fresh attestations for changed graph hashes and test revocation behavior end-to-end. Since the supported BOT mainnet contracts are not known yet, this stage is paused at contract selection.

## Stage five: production readiness

Owner: both teams and security reviewers.

- Provision shared rate limiting for multiple API instances; the current bounded limiter is per-instance only.
- Establish RPC/explorer capacity, timeouts, load tests and failover behavior.
- Add request IDs, privacy-conscious structured logs, metrics, alerts and an incident/rollback runbook.
- Review remaining development-tool dependency advisories and update exceptions as fixes ship.
- Complete independent contract and wallet-flow security review, multisig key management and release signoff.

Payment billing remains out of scope. No claim of production readiness until these operational gates and the real wallet confirmation flow have been exercised.
