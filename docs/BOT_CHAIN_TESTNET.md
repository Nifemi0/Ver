# BOT Chain testnet integration

Ver targets BOT Chain testnet by default through `VER_NETWORK=botTestnet`. X Layer remains available only as an explicit compatibility profile and retains separate configuration and deployment records.

## Verified network parameters

| Setting | Value | Source/status |
| --- | --- | --- |
| Network | BOT Chain Testnet / Bohr Testnet | Official BOT Chain developer docs |
| Chain ID | `968` (`0x3c8`) | Official docs and read-only `eth_chainId` probe |
| RPC | `https://rpc.bohr.life` | Official docs; probe returned `0x3c8` |
| Native gas token | BOT / test BOT | Official docs |
| Explorer | `https://scan.bohr.life` | Official docs; HTTP/API probe succeeded |
| Explorer API | `https://scan.bohr.life/api` | Blockscout-compatible read-only API response verified |

Official references: [BOT Chain Quick Guide](https://dev-docs.botchain.ai/docs/Developers/quick-guide/), [JSON-RPC endpoint](https://dev-docs.bohr.life/docs/Developers/json-rpc-endpoint/), and [environment acceptance guidance](https://dev-docs.bohr.life/docs/RWA/testnet-practice/).

## Local configuration

Copy `.env.example` to `.env`, then set:

```dotenv
VER_NETWORK=botTestnet
BOT_TESTNET_RPC_URL=https://rpc.bohr.life
BOT_TESTNET_EXPLORER_API_URL=https://scan.bohr.life/api
BOT_TESTNET_EXPLORER_URL=https://scan.bohr.life
```

The BOT testnet registry v2 is deployed and source-verified at `0xfEB4423E669a0e160b316a8Ca46D8Ca70eB2A4F5`. It adds owner-controlled attester revocation. The original registry at `0x51e1BF60223ef60cec511eB1d423FC52b4fF05C7` remains on-chain but is superseded and recorded in `deployments/botTestnet-v1.json`. Keep BOT deployments separate from the X Layer registry and configure v2 as `BOT_TESTNET_REGISTRY_ADDRESS`.

Wallet/API requests should still pass `chainId` explicitly. The HTTP API accepts `chainId=968` for BOT Chain testnet and `chainId=196` only for compatibility; omitted values now select BOT Chain `968`.

Wallets should call `POST /api/wallet/prepare` with explicit `chainId`, `contractAddress`, `sender`, and one supported `intent`. Require `signable === true` AND `simulationStatus === "success"`, enforce `expiresAt`, verify the active chain/account and independently decode the transaction. See [wallet-team handoff](WALLET_TEAM_HANDOFF.md). Repository fixes are not a claim that the hosted API has been redeployed.

## Safe deployment sequence

1. Obtain test BOT from the official faucet and confirm the deployer address and balance.
2. Run the contract build and local tests.
3. Recheck official network parameters, RPC chain ID `968`, the public deployer address, test BOT balance, nonce and estimated deployment cost. Confirm no unexpected deployment is pending. Do not print the private key.
4. After explicit approval, the deployment process requires `VER_ENABLE_DEPLOYMENT=true`, `VER_DEPLOYMENT_CONFIRM_CHAIN_ID=968`, and an explicit `VER_REGISTRY_CONTRACT` selection, then `npx hardhat run scripts/deploy.ts --network botTestnet` from `contracts/`. V3 is a separate candidate requiring governance-policy review; it is not yet deployed.
5. The script creates a new address-qualified file in `deployments/`, never overwriting the active record. Verify source and read-only behavior on the BOT explorer. Only after acceptance and approval update the active deployment record and environment registry address; preserve the V2 record for rollback/history.
6. Exercise `lookupGraph`, graph compilation, and read-only `eth_call` intent verification against a known BOT testnet contract.

Deployment keys belong only in `contracts/.env.deployer`; they must not be present in the API/runtime `.env`. Runtime registry writes are disabled unless `VER_ENABLE_WRITES=true` and must use a separate `ATTESTER_PRIVATE_KEY`.
Payment billing is not enforced by the current API; add a verified BOT Chain payment adapter before enabling x402 billing.
Transaction preparation never uses external LLM intent parsing; the former `VER_ALLOW_EXTERNAL_INTENT_LLM` flag cannot enable it. AI may explain facts outside the signing path.

## Graph and registry migration

Graph schema/parser/hash 2.0.0 uses a new cache namespace and a versioned hash domain covering chain, proxy implementation/facets, full ABI, source identity and structural facts. All 1.x hashes are incompatible; fresh attestations require explicit approval. Custom errors remain separate from emitted events. See [migration details](GRAPH_V2_MIGRATION.md).

V3 retains the V2 read ABI but adds zero-address rejection, two-step ownership transfer, and attester epochs. Revoking an attester invalidates its existing graphs; reauthorization does not revive them. Accepting ownership also revokes the old owner's attester role and its graphs. Use a dedicated attester rather than the owner for normal publishing. Review this policy with the wallet team and multisig operators before deployment. V2 source and deployed behavior remain unchanged.

Contract tooling uses Hardhat 3 and Node >=22.13. Run `npx hardhat build` and `npm test`. Dependency audits are part of CI; remaining upstream advisory exceptions must be reviewed, not hidden by a passing threshold.
