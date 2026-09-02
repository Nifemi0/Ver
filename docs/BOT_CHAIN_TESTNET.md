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
VER_EXPLORER_API_URL=https://scan.bohr.life/api
VER_EXPLORER_URL=https://scan.bohr.life
```

The BOT testnet registry v2 is deployed and source-verified at `0xfEB4423E669a0e160b316a8Ca46D8Ca70eB2A4F5`. It adds owner-controlled attester revocation. The original registry at `0x51e1BF60223ef60cec511eB1d423FC52b4fF05C7` remains on-chain but is superseded and recorded in `deployments/botTestnet-v1.json`. Keep BOT deployments separate from the X Layer registry and configure v2 as `BOT_TESTNET_REGISTRY_ADDRESS`.

Wallet/API requests should still pass `chainId` explicitly. The HTTP API accepts `chainId=968` for BOT Chain testnet and `chainId=196` only for compatibility; omitted values now select BOT Chain `968`.

Wallets should call `POST /api/wallet/prepare` with `chainId`, `contractAddress`, `sender`, and `intent`. The response includes `transaction.chainId`, `transaction.to`, `transaction.data`, `transaction.value`, `simulationStatus`, `risk`, and `explorer`. Treat `simulationStatus !== "success"` as non-signable and perform a final wallet-side chain check before signing.

## Safe deployment sequence

1. Obtain test BOT from the official faucet and confirm the deployer address and balance.
2. Run the contract build and local tests.
3. Run a read-only chain check that asserts chain ID `968`, RPC reachability, and no pre-existing code at the intended registry address (a new deployment has no predetermined address).
4. After explicit approval, deploy only with `npx hardhat run scripts/deploy.ts --network botTestnet` from `contracts/`.
5. Record the generated address and transaction in `deployments/botTestnet.json`, verify source on the BOT explorer if supported, and set `BOT_TESTNET_REGISTRY_ADDRESS` locally or in the test environment.
6. Exercise `lookupGraph`, graph compilation, and read-only `eth_call` intent verification against a known BOT testnet contract.

Deployment keys belong only in `contracts/.env.deployer`; they must not be present in the API/runtime `.env`. Runtime registry writes are disabled unless `VER_ENABLE_WRITES=true` and must use a separate `ATTESTER_PRIVATE_KEY`.
