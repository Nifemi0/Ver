# BOT Chain Wallet Integration Rollout Plan

## Current state

The BOT Chain testnet integration is implemented in the repository and the wallet preparation release blocker is fixed. BOT Chain testnet is chain ID `968`, uses `https://rpc.bohr.life`, and the deployed VerRegistry v2 is `0xfEB4423E669a0e160b316a8Ca46D8Ca70eB2A4F5`.

Completed gates:

- Valid `POST /api/wallet/prepare` requests route to the requested chain client.
- Successful preparation returns HTTP `200` and `signable: true` only after simulation succeeds.
- Reverted or unsimulated preparations remain non-signable.
- Registry results use the chain-specific registry address and compare active attestations with the compiled graph hash when an attestation exists.
- External intent LLM use is opt-in through `VER_ALLOW_EXTERNAL_INTENT_LLM=true`.
- Rate limiting is bounded and uses the trusted Express proxy address rather than a caller-supplied header.
- Raw internal errors are logged server-side and replaced with stable API errors.
- CI now runs typecheck, tests, build, audit, Hardhat compilation, and contract tests.

Validation currently passes: 108 application tests, 3 contract tests, typecheck, build, dependency audit, BOT RPC chain check, and source verification.

## Staging plan

### 1. Deploy the API to staging

Configure the staging environment with:

```dotenv
VER_NETWORK=botTestnet
VER_REGISTRY_LOOKUP=true
BOT_TESTNET_RPC_URL=https://rpc.bohr.life
BOT_TESTNET_EXPLORER_API_URL=https://scan.bohr.life/api
BOT_TESTNET_EXPLORER_URL=https://scan.bohr.life
BOT_TESTNET_REGISTRY_ADDRESS=0xfEB4423E669a0e160b316a8Ca46D8Ca70eB2A4F5
ALLOWED_ORIGINS=https://<wallet-staging-origin>
VER_ALLOW_EXTERNAL_INTENT_LLM=false
VER_ENABLE_WRITES=false
```

Do not add `DEPLOYER_PRIVATE_KEY` or `ATTESTER_PRIVATE_KEY` to the API environment.

Acceptance checks:

- `GET /api/health` reports `primaryChainId: 968`.
- `POST /api/wallet/prepare` with a known BOT Chain test contract returns a prepared result.
- Unknown fields, wrong chain IDs, invalid addresses, and oversized intents return `400`.
- Reverted simulations return `422` and `signable: false`.
- The wallet staging origin is the only browser origin allowed.

### 2. Integrate the wallet confirmation flow

The wallet should send `chainId`, `contractAddress`, `sender`, `intent`, and optional native `value` to `/api/wallet/prepare`.

The wallet must:

- Require `response.signable === true`.
- Require `response.simulationStatus === "success"`.
- Recheck `response.transaction.chainId === 968`.
- Display the target, function, decoded arguments, native value, risk, and explorer link.
- Ask for explicit user confirmation.
- Sign locally with the user’s wallet provider.
- Broadcast directly to BOT Chain.
- Never send private keys, seed phrases, or wallet signing authority to Ver.

### 3. Run joint test cases

The wallet and Ver teams should test:

- ERC-20 approval with exact six-decimal PRWA amount.
- Successful simulation from a funded test wallet.
- Insufficient-balance transfer blocked by simulation.
- Wrong-network request rejected.
- Unverified contract rejected for wallet preparation.
- Proxy contract implementation resolution.
- User rejection in the wallet.
- RPC timeout and explorer outage behavior.
- Replay of an old prepared response after the wallet changes chain or account.

### 4. Activate graph attestations

The registry is deployed but currently has no production attestations. Before writing any attestation:

- Create a dedicated BOT Chain attester key.
- Keep it outside the API runtime.
- Confirm the graph hashing and metadata storage policy.
- Attest only approved Protocol Graphs.
- Verify the resulting hash with `verifyHash`.
- Move registry ownership from the deployer EOA to a multisig before production.
- Obtain explicit approval before sending any attestation transaction.

The current registry contract remains unchanged and verified on-chain. Zero-address input validation should be added only as part of a separately approved registry deployment, because changing the Solidity source requires a new deployment to preserve source/bytecode consistency.

### 5. Production hardening

Before mainnet or high-volume wallet use:

- Replace the per-instance limiter with a shared Redis/Upstash or equivalent store.
- Add structured logs, request IDs, RPC latency metrics, and alerting.
- Set upstream RPC and explorer timeouts at the application boundary.
- Establish a provider privacy policy before enabling external LLM intent parsing.
- Add dependency update automation and review CI results on every pull request.
- Perform an independent smart-contract and wallet-flow security review.
- Define rollback and registry-attester revocation procedures.

Payment billing is intentionally out of scope until a real BOT Chain payment verifier is selected and tested. The old unauthenticated header-based x402 bypass is not part of the active API.

## Go/no-go criteria

Go to wallet-team staging only when the hosted wallet endpoint returns a successful prepared transaction and the wallet rejects all non-signable responses. Go to production only after shared rate limiting, monitoring, secrets management, multisig registry ownership, and an independent security review are complete.
