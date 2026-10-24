# Aura CryptoX connector

Connect a custom MCP client to **https://crypto.auraajenticai.cloud/mcp** using Streamable HTTP and no authentication.

The anonymous connector exposes seven public market/on-chain tools and `crypto_simulate_trade`. Simulation uses a public Binance quote and returns a hypothetical calculation. It never sends an exchange order, reads the server's private Binance balance, or writes to the autonomous trade ledger. Private account and live execution tools are excluded; they require a separate authenticated integration before exposure to ChatGPT.

Example prompt: “Use Aura CryptoX to get BTC price, then simulate a $10 BUY with 1x leverage. Do not place any real order.”

## Deployment

Deploy `server/` from this repository. Add `https://crypto.auraajenticai.cloud:3001/mcp` as a path-specific domain to the existing CryptoX API application in Coolify; retain the existing API domain. Keep the website's root route. The canonical-host middleware handles preserved and stripped `/mcp` paths. The old API-domain `/mcp` SSE interface remains compatible with existing clients.

Alternatively, the frontend Dockerfile installs an Nginx configuration that proxies `/mcp` to the backend `/connector` router and `/api/` to existing API routes. Deploying that frontend makes the website, frontend API requests and MCP available on the same public domain. It excludes legacy MCP execution paths under `/api/`.

The new endpoint is stateless: initialize, discovery and calls each work without a process-local session or sticky routing. It returns JSON responses and validates browser Origin headers. Browser navigation leads to `/mcp/info`. Streamable HTTP GET streams are not enabled; a stream request receives HTTP 405.

## Verification

```sh
cd server
npm ci
npm run build
node --test test/*.test.mjs
```

Tests cover legacy SSE clients, Streamable HTTP discovery, concurrent clients, metadata, BUY/SELL paper calculations, argument validation, excluded private/live tools, cross-origin rejection, canonical-host path routing and documentation. Tests mock Binance quotes; a separate live test is required after deployment. Protocol tests do not establish that a connector was installed or used inside ChatGPT.
