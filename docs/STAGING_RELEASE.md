# CI-gated staging releases

BOT Chain testnet remains the target. Production aliases are not promoted by this release process, and no registry attestations are written.

## Deployment controls

- `vercel.json` disables automatic Git deployments. The Vercel project also has automatic production alias assignment disabled; the existing live site remains in place.
- `.github/workflows/ci.yml` requires application tests/typechecks/builds/audits on Ubuntu and Windows and contract build/tests/typecheck/audit.
- Automated staging deployment has `needs: [app, contracts]`, runs only on a main-branch push, and uses the GitHub `staging` environment. It is opt-in: set repository variable `VER_STAGING_AUTODEPLOY=true` only after storing a project-scoped Vercel token as environment secret `VERCEL_TOKEN`. Never place that token in source or chat.
- Until that credential is provisioned, authenticated operators use `pwsh -File scripts/deploy-staging.ps1`. It refuses a dirty checkout, an unpublished SHA, a non-successful latest CI run, or a missing required job. It deploys preview only, never production.

The connected Vercel CLI account can deploy, but its app credential is not permitted to mint new API tokens. No personal token was copied into GitHub. Direct administrator deployments remain an administrative override and should not be used to bypass this process.

## Preview configuration

Preview uses chain 968, the verified BOT RPC/explorer and existing V2 registry. `VER_ENABLE_WRITES=false`, `VER_REGISTRY_LOOKUP=true`, and external intent LLM use is disabled. Preview protection stays enabled. Wallet-team origin/CORS configuration must be set once the team supplies its staging wallet URL. Do not broaden CORS to all origins.

## Acceptance and approvals

After deployment, check the release version, successful exact PRWA approval simulation, blocked malformed/unsupported requests, graph schema/hash 2.0, and protected preview access. These are read-only tests; they do not sign or broadcast.

Joint acceptance is not complete until the wallet team provides its staging wallet and validates account/chain changes, expiry, independent decoding, re-simulation, user rejection, signing UX, and receipt handling. Signing/broadcast tests need a separately agreed test-fund budget. New graph attestations require separate explicit approval. Production promotion and npm publication are not included in staging deployment.
