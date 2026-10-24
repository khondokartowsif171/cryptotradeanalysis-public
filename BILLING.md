# Aura Crypto X subscriptions

Free Explorer, Pro Trader ($19 per 30 days / $149 per 365 days) and VIP Whale / Quant ($49 per 30 days / $399 per 365 days) use per-account, server-authoritative access. They are prepaid terms, without automatic recurring debits.

## Payment flow

1. Sign in using a password or a fresh wallet ownership challenge. Password accounts can link a wallet by signing an account-bound challenge. Challenges expire after five minutes and are consumed atomically. A wallet already belonging to another account cannot be silently merged.
2. Create an authenticated invoice with `POST /billing/intents`: `{"plan":"pro","cycle":"monthly","method":"polygon-usdc"}`. The server fixes the amount, linked payer, recipient, token, chain and one-hour payment window. Client parameters cannot replace those fields.
3. Review the invoice, choose the correct wallet/network and approve a token `transfer` in MetaMask. The app never requests an unlimited allowance or substitutes a fixed native-coin payment. Network gas is additional.
4. Submit `{"intentId":"…","txHash":"0x…"}` to `POST /billing/submit-tx`. The server checks the receipt, chain, canonical block hash, transfer emitter, sender, recipient, amount, invoice window and configured block confirmations. RPC failures fail closed. A late verification is allowed for a transaction mined within its invoice window. Transfers mined outside that window require operator support.
5. The receipt claim and subscription grant commit in one PostgreSQL transaction. A chain/hash can fund one invoice only. Repeated verification is idempotent. A failed database operation rolls back the payment claim as well.

Accepted automatic verification: native USDC on Polygon, Arbitrum, Base and Ethereum; USDT on Ethereum. Contract addresses are allowlisted against [Circle](https://developers.circle.com/stablecoins/usdc-contract-addresses) and [Tether](https://tether.to/en/supported-protocols/). Bridged lookalikes, other networks, native ETH/BNB and exchange withdrawals are not automatically supported. Methods and confirmation counts are returned by `/billing/plans`; confirmations are not a guarantee against every possible chain reorganization.

Unresolved payment hashes are stored server-side and, when available, in browser storage scoped to the account as recovery metadata. A saved hash prevents the UI from requesting the same invoice payment again. No private wallet key or API key is persisted in browser storage.

## Access and expiry

- Free: public charts/news and up to five synced watchlist coins.
- Pro and VIP: up to 1,000 watchlist coins, private portfolio storage and the premium MongoDB signal feed when populated. Empty/unavailable feeds do not substitute mock trades or holdings.
- VIP: up to five read-only client API keys. Each key is returned once, stored as SHA-256, expires after 90 days and is checked against the account's current VIP entitlement on every request. Expiry or revocation denies access immediately.

Subscriptions use separate grants. Same-plan renewals extend the term. Other plans activate immediately without automatic proration; an annual Pro grant survives a shorter VIP upgrade and becomes effective again after VIP expires. Existing unexpired paid tiers are preserved by a one-time legacy grant during migration. Historical payment records are retained without reclassifying them as newly verified payments.

Routes for private API keys: `/client-api/keys` (JWT-authenticated list/create/revoke). Read-only bot routes: `/client-api/watchlist`, `/client-api/portfolio`, `/client-api/signals`, using `Authorization: Bearer YOUR_CLIENT_KEY`. On the canonical website these are under `/api/client-api/…`. Keys can be revoked even after VIP expires.

The public GPT connector at `/mcp` keeps its eight public data/paper tools. It does not expose clients' private account data. The separate legacy SSE transport can access operator resources and requires a JWT whose user ID is in `ADMIN_USER_IDS`. Admin/debug routes require the same explicit operator allowlist. No VIP key is authorized for operator trading tools.

Features without active integrations (staking multipliers, priority webhooks, Telegram push, whale radar and the strategy desk) are shown as planned, outside the current paid checkout benefits.

## Deployment

- Requires the existing PostgreSQL database and a private production `JWT_SECRET`. The runtime Docker image explicitly uses `NODE_ENV=production` and rejects the public development fallback. Keep the existing secret to preserve existing sessions; do not print or commit environment values.
- Run both frontend and backend checks before rollout. The API applies the additive `002_verified_billing.sql` migration transactionally before listening. Check for duplicate wallet addresses before deploying the new unique index. Never delete or merge conflicting client rows automatically.
- Keep `TREASURY_EVM_ADDRESS` set to the existing, owner-approved receiving address. Optional provider overrides: `ETH_RPC_URL`, `POLYGON_RPC_URL`, `ARBITRUM_RPC_URL`, `BASE_RPC_URL`. Overrides must refer to the intended mainnet. Public RPC fallbacks are rate limited by their providers.
- `SMTP_PASS` must be configured in the deployment environment for email recovery. There is no embedded SMTP credential. Optional `ADMIN_USER_IDS` is an explicit comma-separated list of operator UUIDs; an absent list leaves operator routes closed. `CORS_ORIGINS` can extend the canonical browser origins.
- Deploy the new frontend first: it refuses checkout against a backend lacking billing protocol version 2. Then deploy the backend, check health and schema, and reload the frontend. Existing old browser tabs must be refreshed before using checkout. There is no way for a server patch to retract a transaction already approved from an old JavaScript tab.
- Preserve the standalone frontend's scoped CA bundle, Nginx proxy configuration and `/mcp` route. Keep the prior frontend image/static files and the prior API deployment available for rollback. An API rollback requires keeping version-2 frontend checkout disabled; do not roll back into hash-only activation for customer payments.
- `ops/legacy-redirect/` contains the static, temporary redirect intended for the existing Vercel project serving `cryptox.auraajenticai.cloud`. Its team grant must be available before deploying it. This redirect does not migrate origin-bound browser sessions or wallet permissions.

Validation: `npm ci && npm test` in `server/`; `npm ci && npm test && npx tsc --noEmit -p tsconfig.app.json && npm run build` in `app/`. Database tests use PGlite/PostgreSQL; blockchain receipts, wallets and transfers in tests are synthetic. No real subscription charge or live trade is part of these checks. Production migration, provider connectivity and browser payment review must still be verified after deployment; actual wallet approval belongs to the customer.
