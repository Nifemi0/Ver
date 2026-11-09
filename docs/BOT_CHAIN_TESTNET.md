# BOT Chain testnet integration

Ver targets BOT Chain testnet by default through `VER_NETWORK=botTestnet`. X Layer remains available only as an explicit compatibility profile and retains separate configuration and deployment records.
BOT Chain mainnet is a separate profile, `VER_NETWORK=botMainnet`, with chain ID `677`, RPC `https://rpc.botchain.ai`, and explorer `https://scan.botchain.ai`.

## Verified network parameters

| Setting | Value | Source/status |
| --- | --- | --- |
| Network | BOT Chain Testnet / Bohr Testnet | Official BOT Chain developer docs |
| Chain ID | `968` (`0x3c8`) | Official docs and read-only `eth_chainId` probe |
| RPC | `https://rpc.bohr.life` | Official docs; probe returned `0x3c8` |
| Native gas token | BOT / test BOT | Official docs |
| Explorer | `https://scan.bohr.life` | Official docs; HTTP/API probe succeeded |
| Explorer API | `https://scan.bohr.life/api` | Blockscout-compatible read-only API response verified |

BOT Chain mainnet parameters are chain ID `677`, RPC `https://rpc.botchain.ai`, explorer `https://scan.botchain.ai`, and explorer API `https://scan.botchain.ai/api`.

Official references: [BOT Chain Quick Guide](https://dev-docs.botchain.ai/docs/Developers/quick-guide/), [JSON-RPC endpoint](https://dev-docs.bohr.life/docs/Developers/json-rpc-endpoint/), and [environment acceptance guidance](https://dev-docs.bohr.life/docs/RWA/testnet-practice/).

## Local configuration

Copy `.env.example` to `.env`, then set:

```dotenv
VER_NETWORK=botTestnet
BOT_TESTNET_RPC_URL=https://rpc.bohr.life
BOT_TESTNET_EXPLORER_API_URL=https://scan.bohr.life/api
BOT_TESTNET_EXPLORER_URL=https://scan.bohr.life
```

The active BOT testnet registry is V3 at `0x1763B6958CdD3FF5CebF64c960382ECF3669fFF2`, deployed in transaction `0x34f53311a8b02dc4649f134a1bb728b7b062897a0a5b832f7b0e9f1efa20d05c` and source-verified on BOTScan. The V2 registry at `0xfEB4423E669a0e160b316a8Ca46D8Ca70eB2A4F5` and original registry at `0x51e1BF60223ef60cec511eB1d423FC52b4fF05C7` remain on-chain as history. Keep BOT deployments separate from the X Layer registry and configure V3 as `BOT_TESTNET_REGISTRY_ADDRESS`.
The active BOT mainnet registry is V3 at `0x51e1BF60223ef60cec511eB1d423FC52b4fF05C7`, deployed in transaction `0xbabdc93b54bc6e480ac6f3a288113e08d396232b3978106e0bcdfbcd1f9e2268` and source-verified on BOTScan. Configure it as `BOT_MAINNET_REGISTRY_ADDRESS`.

Wallet/API requests should still pass `chainId` explicitly. The HTTP API accepts `chainId=968` for BOT Chain testnet, `chainId=677` for BOT Chain mainnet, and `chainId=196` only for compatibility; omitted values now select BOT Chain testnet `968`.
For BOT Chain mainnet, wallet/API requests must pass `chainId=677` and use a deployment environment configured with `VER_NETWORK=botMainnet` and `BOT_MAINNET_REGISTRY_ADDRESS`.

Wallets should call `POST /api/wallet/prepare` with explicit `chainId`, `contractAddress`, `sender`, and one supported `intent`. Require `signable === true` AND `simulationStatus === "success"`, enforce `expiresAt`, verify the active chain/account and independently decode the transaction. See [wallet-team handoff](WALLET_TEAM_HANDOFF.md). Repository fixes are not a claim that the hosted API has been redeployed.

## Safe deployment sequence

1. Obtain test BOT for testnet, or real BOT for mainnet, and confirm the deployer address and balance.
2. Run the contract build and local tests.
3. Recheck official network parameters, RPC chain ID, the public deployer address, BOT balance, nonce and estimated deployment cost. Confirm no unexpected deployment is pending. Do not print the private key.
4. After explicit approval, the deployment process requires `VER_ENABLE_DEPLOYMENT=true`, `VER_DEPLOYMENT_CONFIRM_CHAIN_ID` set to the target chain, and an explicit `VER_REGISTRY_CONTRACT` selection, then `npx hardhat run scripts/deploy.ts --network botTestnet` or `--network botMainnet` from `contracts/`. V3 is now active on BOT testnet and mainnet.
5. The script creates a new address-qualified file in `deployments/`, never overwriting the active record. Verify source and read-only behavior on the BOT explorer. Only after acceptance and approval update the active deployment record and environment registry address; preserve the V2 record for rollback/history.
6. Exercise `lookupGraph`, graph compilation, and read-only `eth_call` intent verification against a known supported BOT contract before any wallet handoff.

Deployment keys belong only in `contracts/.env.deployer`; they must not be present in the API/runtime `.env`. Runtime registry writes are disabled unless `VER_ENABLE_WRITES=true` and must use a separate `ATTESTER_PRIVATE_KEY`.
Payment billing is not enforced by the current API; add a verified BOT Chain payment adapter before enabling x402 billing.
Transaction preparation never uses external LLM intent parsing; the former `VER_ALLOW_EXTERNAL_INTENT_LLM` flag cannot enable it. AI may explain facts outside the signing path.

## Graph and registry migration

Graph schema/parser/hash 2.1.0 uses a new cache namespace and a versioned hash domain covering chain, proxy implementation/facets, runtime code hash, full ABI, source identity and structural facts. All 1.x and 2.0 hashes are incompatible; fresh attestations require explicit approval after supported contract selection. Custom errors remain separate from emitted events. See [migration details](GRAPH_V2_MIGRATION.md).

V3 retains the V2 read ABI but adds zero-address rejection, two-step ownership transfer, and attester epochs. Revoking an attester invalidates its existing graphs; reauthorization does not revive them. Accepting ownership also revokes the old owner's attester role and its graphs. Use a dedicated attester rather than the owner for normal publishing. V2 source and deployed behavior remain unchanged.

Contract tooling uses Hardhat 3 and Node >=22.13. Run `npx hardhat build` and `npm test`. Dependency audits are part of CI; remaining upstream advisory exceptions must be reviewed, not hidden by a passing threshold.
