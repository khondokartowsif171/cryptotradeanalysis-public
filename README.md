# Aura CryptoX // Institutional Quant Terminal & Universal MCP Server

[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Production Platform](https://img.shields.io/badge/Production-Live%20Platform-emerald?style=flat&logo=safari)](https://crypto.auraajenticai.cloud)
[![Quant Terminal](https://img.shields.io/badge/Terminal-Quant%20Trading-blueviolet?style=flat&logo=tradingview)](https://trade.auraajenticai.cloud)
[![MCP Protocol](https://img.shields.io/badge/MCP-v2024--11--05-orange?style=flat&logo=openai)](https://cryptox-api.auraajenticai.cloud/mcp/info)
[![VPS Node](https://img.shields.io/badge/Host-Hostinger%20KVM%202%20(Coolify)-10b981)](https://crypto.auraajenticai.cloud)

Aura CryptoX is an institutional-grade cryptocurrency analytics suite, automated quantitative trading engine, and universal **Model Context Protocol (MCP)** server built for high-concurrency market operations and autonomous AI agents.

---

## 🌐 Official Production Deployments

| Component | Official Live URL | Infrastructure / Node |
| :--- | :--- | :--- |
| **Main Web Platform** | [crypto.auraajenticai.cloud](https://crypto.auraajenticai.cloud) | Vite React SPA + Nginx Container (Port 80) |
| **Quant Terminal** | [trade.auraajenticai.cloud](https://trade.auraajenticai.cloud) | High-Frequency Real-Time Trading Terminal |
| **Backend API Engine** | [cryptox-api.auraajenticai.cloud](https://cryptox-api.auraajenticai.cloud) | Node 22 / Express / PostgreSQL 17 / MongoDB |
| **Universal MCP SSE Stream** | `https://cryptox-api.auraajenticai.cloud/mcp` | Remote Server-Sent Events (SSE) Protocol |
| **MCP Server Metadata** | [cryptox-api.auraajenticai.cloud/mcp/info](https://cryptox-api.auraajenticai.cloud/mcp/info) | Live Tool Manifest & Client Schemas |

---

## ⚡ Key Capabilities & Architecture

- **Zero Mock Data Architecture**: Real-time ticker feeds from Binance direct streams and breaking news from Cointelegraph RSS ingestion.
- **Universal Model Context Protocol (MCP)**: Native integration enabling Claude Desktop, Cursor, Windsurf, n8n, and autonomous Telegram daemons to execute on-chain checks, price feeds, quant signals, and DEX swap routing.
- **Institutional Quant Signals**: Algorithmic entry zones, risk-reward ratios (1:2.4+), take-profit targets, and stop-loss levels for BTC, ETH, SOL, and top assets.
- **Enterprise Legal Suite**: Embedded portal dialogs for Terms of Service, Privacy Policy, Cookie Policy, Risk Disclosure, and AML Compliance.
- **Self-Custodial EVM Hub**: On-chain portfolio valuation and direct MetaMask/Web3 wallet integration.

---

## 🤖 Universal Model Context Protocol (MCP) Server

Connect any LLM client (Claude Desktop, Cursor IDE, Windsurf, n8n, or Python/TypeScript agents) to the Aura CryptoX MCP Server:

### 1. Claude Desktop Configuration
Add to `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "aura-cryptox": {
      "url": "https://cryptox-api.auraajenticai.cloud/mcp"
    }
  }
}
```

### 2. Cursor & Windsurf Configuration
Add to `.cursor/mcp.json` or your MCP server settings:
```json
{
  "mcpServers": {
    "aura-cryptox": {
      "url": "https://cryptox-api.auraajenticai.cloud/mcp"
    }
  }
}
```

### 3. n8n Automation Engine
Connect via HTTP Request or MCP Tool node:
- **Endpoint**: `https://cryptox-api.auraajenticai.cloud/mcp/execute/{{ $json.toolName }}`
- **Method**: `POST`
- **Headers**: `Content-Type: application/json`

### 4. Registered MCP Tools (7 Enterprise Tools)
| Tool Name | Parameters | Purpose |
| :--- | :--- | :--- |
| `crypto_get_live_price` | `symbol: string` | Real-time tick price, 24h high/low, and 24h USD volume from Binance. |
| `crypto_get_market_overview` | *none* | Global top 10 market cap, volume, and live market sentiment. |
| `crypto_get_trading_signals` | `symbol?: string` | Algorithmic quantitative entry zones, TP, SL, and confidence scoring. |
| `crypto_get_latest_news` | `limit?: number` | Real-time breaking crypto news from Cointelegraph. |
| `crypto_check_wallet_portfolio` | `walletAddress: string` | On-chain verified EVM balance and USD valuation via ethers.js. |
| `crypto_get_token_metadata` | `symbol: string` | Canonical contract address, network, block explorer, and official site. |
| `crypto_calculate_dex_swap` | `fromToken, toToken, amount` | Uniswap routing, slippage simulation, gas cost, and direct swap link. |

---

## 🛠️ Tech Stack & Topology

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Radix UI.
- **Backend**: Node.js 22, Express, `@modelcontextprotocol/sdk`, Ethers.js v6, Zod, PostgreSQL 17, MongoDB.
- **Data Ingestion**: Binance REST/WebSocket Streams, Cointelegraph RSS Feed.
- **Deployment**: Docker Compose on Hostinger KVM 2 (`195.35.7.154`), Coolify PaaS, Traefik Reverse Proxy, Let's Encrypt SSL.

---

## 🚀 Local Development

```bash
# 1. Clone the repository
git clone https://github.com/khondokartowsif171/cryptotradeanalysis-public.git
cd cryptotradeanalysis-public

# 2. Frontend setup
cd app
npm install
npm run dev

# 3. Backend API & MCP Server setup
cd ../server
npm install
npm run build
npm start
```

---

## 📄 License & Intellectual Property

Licensed under the **Apache License, Version 2.0** (the "License").  
See the [`LICENSE`](./LICENSE) file for complete terms.

```text
Copyright 2026 Amirul Islam Redwan / Aura Agentic AI (auraajenticai.cloud)

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```
