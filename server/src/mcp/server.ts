import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import * as tools from './tools.js';

export function createCryptoMcpServer({ publicOnly = false } = {}) {
  const server = new McpServer({
    name: 'aura-cryptox-mcp',
    version: publicOnly ? '1.3.0' : '1.2.0',
  });

  server.tool(
    'crypto_get_live_price',
    'Get real-time cryptocurrency price, 24h change, high, low, volume, and quotes from Binance.',
    {
      symbol: z.string().describe('The coin symbol, e.g. BTC, ETH, SOL, BNB, XRP, LINK'),
    },
    { readOnlyHint: true, destructiveHint: false, openWorldHint: true },
    async ({ symbol }) => {
      try {
        const data = await tools.getLivePrice(symbol);
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      } catch (err: any) {
        return { content: [{ type: 'text', text: `Error: ${err.message}` }], isError: true };
      }
    }
  );

  server.tool(
    'crypto_get_market_overview',
    'Get a snapshot of ten tracked Binance USDT markets, their combined volume and price-change-based sentiment. Not total global market capitalization or dominance.',
    {},
    { readOnlyHint: true, destructiveHint: false, openWorldHint: true },
    async () => {
      try {
        const data = await tools.getMarketOverview();
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      } catch (err: any) {
        return { content: [{ type: 'text', text: `Error: ${err.message}` }], isError: true };
      }
    }
  );

  server.tool(
    'crypto_get_trading_signals',
    'Get a simple BUY/SELL/HOLD heuristic based on 24-hour price change and illustrative risk levels. Not a calibrated forecast or validated trading strategy.',
    {
      symbol: z.string().optional().describe('Coin symbol, defaults to BTC'),
    },
    { readOnlyHint: true, destructiveHint: false, openWorldHint: true },
    async ({ symbol }) => {
      try {
        const data = await tools.getTradingSignals(symbol || 'BTC');
        if (publicOnly) {
          const { confidence, indicator, timeframe, riskRewardRatio, disclaimer, ...quote } = data;
          return { content: [{ type: 'text', text: JSON.stringify({
            ...quote,
            method: '24-hour price change: BUY above +2%, SELL below -2%, otherwise HOLD',
            calibratedProbability: null,
            disclaimer: 'Unvalidated price-change heuristic. Targets are illustrative; no measured win rate, predictive probability or guarantee is available.',
          }, null, 2) }] };
        }
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      } catch (err: any) {
        return { content: [{ type: 'text', text: `Error: ${err.message}` }], isError: true };
      }
    }
  );

  server.tool(
    'crypto_get_latest_news',
    'Get real-time breaking cryptocurrency news from Cointelegraph and top publishers.',
    {
      limit: z.number().optional().describe('Number of news items to fetch (default 10)'),
    },
    { readOnlyHint: true, destructiveHint: false, openWorldHint: true },
    async ({ limit }) => {
      try {
        const data = await tools.getLatestNews(limit || 10);
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      } catch (err: any) {
        return { content: [{ type: 'text', text: `Error: ${err.message}` }], isError: true };
      }
    }
  );

  server.tool(
    'crypto_check_wallet_portfolio',
    'Query the native ETH balance of a public Ethereum mainnet address and estimate its USD value. Excludes token holdings and other chains.',
    {
      walletAddress: z.string().describe('EVM wallet address (0x...)'),
    },
    { readOnlyHint: true, destructiveHint: false, openWorldHint: true },
    async ({ walletAddress }) => {
      try {
        const data = await tools.checkWalletPortfolio(walletAddress);
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      } catch (err: any) {
        return { content: [{ type: 'text', text: `Error: ${err.message}` }], isError: true };
      }
    }
  );

  server.tool(
    'crypto_get_token_metadata',
    'Get canonical contract address, blockchain network, official explorer URL, and foundation website for a token.',
    {
      symbol: z.string().describe('Coin symbol, e.g. BTC, ETH, SOL, LINK, UNI'),
    },
    { readOnlyHint: true, destructiveHint: false, openWorldHint: true },
    async ({ symbol }) => {
      try {
        const data = tools.getTokenMetadata(symbol);
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      } catch (err: any) {
        return { content: [{ type: 'text', text: `Error: ${err.message}` }], isError: true };
      }
    }
  );

  server.tool(
    'crypto_calculate_dex_swap',
    'Estimate token conversion using public exchange prices and an assumed slippage tolerance. Not an executable DEX quote or live gas estimate.',
    {
      fromToken: z.string().describe('Source token symbol, e.g. USDT, ETH, BTC'),
      toToken: z.string().describe('Target token symbol, e.g. BTC, ETH, SOL'),
      amount: z.number().describe('Amount of fromToken to swap'),
    },
    { readOnlyHint: true, destructiveHint: false, openWorldHint: true },
    async ({ fromToken, toToken, amount }) => {
      try {
        const data = await tools.calculateDexSwap(fromToken, toToken, amount);
        if (publicOnly) {
          const { estimatedGasUsd, uniswapDeepLink, ...estimate } = data;
          return { content: [{ type: 'text', text: JSON.stringify({
            ...estimate, quoteType: 'PRICE_CONVERSION_ESTIMATE', executable: false,
            estimatedGasUsd: null,
            disclaimer: 'Based on Binance market prices; stablecoins assumed at USD 1 and slippage assumed at 0.5%. No liquidity pool, gas, bridge or execution route was quoted.',
          }, null, 2) }] };
        }
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      } catch (err: any) {
        return { content: [{ type: 'text', text: `Error: ${err.message}` }], isError: true };
      }
    }
  );

  // Public connectors must never inherit the host's exchange account access.
  if (publicOnly) {
    server.registerTool('crypto_simulate_trade', {
      title: 'Simulate a trade',
      description: 'Calculate a hypothetical paper trade using a current Binance quote. Returns quantity, hypothetical profit/loss and risk levels. Never places orders, accesses private accounts, or writes to the trade ledger. An exit price is a user-provided scenario, not a forecast.',
      inputSchema: {
        symbol: z.string().regex(/^[A-Za-z0-9]{2,20}$/),
        side: z.enum(['BUY', 'SELL']),
        amountUsd: z.number().finite().positive().max(1000000),
        leverage: z.number().finite().min(1).max(10).default(1),
        hypotheticalExitPrice: z.number().finite().positive().optional(),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: false, openWorldHint: true },
      _meta: { securitySchemes: [{ type: 'noauth' }] },
    }, async ({ symbol, side, amountUsd, leverage, hypotheticalExitPrice }) => {
      try {
        const quote = await tools.getLivePrice(symbol);
        if (!Number.isFinite(quote.price) || quote.price <= 0) throw new Error('Invalid market quote');
        const direction = side === 'BUY' ? 1 : -1;
        const notionalUsd = amountUsd * leverage;
        const quantity = notionalUsd / quote.price;
        const pnl = hypotheticalExitPrice === undefined ? null : direction * (hypotheticalExitPrice - quote.price) * quantity;
        const result = {
          mode: 'SIMULATION', persisted: false, exchangeOrderPlaced: false,
          symbol: quote.symbol, side, marginUsd: amountUsd, leverage, notionalUsd,
          entryPrice: quote.price, quantity, hypotheticalExitPrice: hypotheticalExitPrice ?? null,
          hypotheticalPnlUsd: pnl, hypotheticalReturnOnMarginPct: pnl === null ? null : pnl / amountUsd * 100,
          exampleTakeProfit: quote.price * (1 + direction * 0.055),
          exampleStopLoss: quote.price * (1 - direction * 0.023),
          quoteSource: 'Binance public ticker', quotedAt: quote.timestamp,
          limitations: 'Illustrative paper calculation; excludes fees, funding, slippage, liquidation and exchange execution constraints. No forecast or guarantee.',
        };
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (err: any) {
        return { content: [{ type: 'text', text: `Error: ${err.message}` }], isError: true };
      }
    });
    return server;
  }

  // === AUTONOMOUS AI TRADING TOOLS ===

  server.tool(
    'crypto_get_binance_account_balance',
    'Check connected Binance account live spot balances, trading permissions, and trade readiness.',
    {},
    async () => {
      try {
        const data = await tools.getBinanceAccountBalance();
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      } catch (err: any) {
        return { content: [{ type: 'text', text: `Error: ${err.message}` }], isError: true };
      }
    }
  );

  server.tool(
    'crypto_execute_autonomous_trade',
    'Autonomously execute a cryptocurrency trade (BUY/Long or SELL/Short) with algorithmic entry, 1:2.4 TP/SL, and live Binance tick price.',
    {
      symbol: z.string().describe('Asset symbol to trade (e.g. SOL, BTC, ETH, BNB)'),
      side: z.enum(['BUY', 'SELL']).describe('Trade direction: BUY (Long) or SELL (Short)'),
      amountUsd: z.number().optional().describe('USD position size (default $5.00)'),
      leverage: z.number().optional().describe('Leverage multiplier 1-10x (default 3x)'),
      takeProfitPrice: z.number().optional().describe('Custom TP price (optional, auto-calculated if omitted)'),
      stopLossPrice: z.number().optional().describe('Custom SL price (optional, auto-calculated if omitted)'),
      strategy: z.string().optional().describe('Strategy name (e.g. Bearish Distribution Breakdown)'),
      mode: z.enum(['SIMULATION', 'LIVE_BINANCE', 'LIVE_DEX']).optional().describe('Execution mode (default SIMULATION)'),
    },
    async (params) => {
      try {
        const data = await tools.executeAutonomousTrade(params as any);
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      } catch (err: any) {
        return { content: [{ type: 'text', text: `Error: ${err.message}` }], isError: true };
      }
    }
  );

  server.tool(
    'crypto_monitor_and_manage_trades',
    '24/7 Autonomous Position Guardian: Inspects all active open trades, updates real-time PnL against Binance, and auto-closes on TP or SL.',
    {},
    async () => {
      try {
        const data = await tools.monitorAndManageTrades();
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      } catch (err: any) {
        return { content: [{ type: 'text', text: `Error: ${err.message}` }], isError: true };
      }
    }
  );

  server.tool(
    'crypto_get_trading_performance',
    'Query aggregate autonomous trading performance, win rate %, net realized profit, active unrealized PnL, and recent trade ledger.',
    {},
    async () => {
      try {
        const data = await tools.getTradingPerformance();
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      } catch (err: any) {
        return { content: [{ type: 'text', text: `Error: ${err.message}` }], isError: true };
      }
    }
  );

  server.tool(
    'crypto_close_autonomous_trade',
    'Manually or emergency close an active trade position at the live Binance market price.',
    {
      tradeId: z.string().describe('The UUID of the trade to close'),
    },
    async ({ tradeId }) => {
      try {
        const data = await tools.closeAutonomousTrade(tradeId);
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      } catch (err: any) {
        return { content: [{ type: 'text', text: `Error: ${err.message}` }], isError: true };
      }
    }
  );

  return server;
}
