# cryptotradeanalysis

Advanced crypto trading analytics platform with real-time market data, AI-powered signals, and on-chain staking.

## Features

- Real-time crypto prices via Binance WebSocket
- Interactive price charts with technical indicators
- Market overview with Fear & Greed Index
- Trading signals with confidence scoring
- Portfolio tracking with live valuation
- CRX token staking (Smart Contract)
- Watchlist management
- Live news feed

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Data**: Binance REST + WebSocket APIs, CoinGecko API
- **Blockchain**: ethers.js, Solidity (Hardhat)
- **State**: TanStack Query, React Context
- **Charts**: Recharts
- **Deploy**: Vercel

## Getting Started

```bash
# Frontend
cd app
npm install
npm run dev

# Smart Contracts (Hardhat)
npm install
npx hardhat compile
npx hardhat test
```

## Live Demo

[https://cryptotradeanalysis.vercel.app](https://cryptotradeanalysis.vercel.app)
