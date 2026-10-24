# Aura Crypto X installable app

The frontend supplies a web app manifest, desktop/Android install invitation and an iPhone/iPad Safari Add to Home Screen guide. Browser support and explicit user confirmation determine native installation availability.

Brand assets live under app/public. Static-only service worker caching excludes API, authentication and MCP requests. Offline navigation shows an offline notice, not cached market balances or prices.

Wallet permissions are scoped to each origin. Passive restore uses eth_accounts and eth_chainId; permission requests only follow a Connect action. Sign-in still requires an explicit identity signature. External trading links require review and approval in the destination wallet/exchange.

Run frontend validation with npm ci, npm test, npx tsc --noEmit -p tsconfig.app.json and npm run build from app/.
