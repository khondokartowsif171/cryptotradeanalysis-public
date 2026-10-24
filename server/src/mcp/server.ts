import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import * as tools from './tools.js';

export function createCryptoMcpServer() {
  const server = new McpServer({
    name: 'aura-cryptox-mcp',
    version: '1.2.0',
  });

  server.tool(
    'crypto_get_live_price',
    'Get real-time cryptocurrency price, 24h change, high, low, volume, and quotes from Binance.',
    {
      symbol: z.string().describe('The coin symbol, e.g. BTC, ETH, SOL, BNB, XRP, LINK'),
    },
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
    'Get global crypto market metrics, top gainers, top losers, and Bitcoin/Ethereum sentiment.',
    {},
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
    'Get institutional quantitative trading signals (BUY/SELL/HOLD), entry zones, targets, stop-losses, and confidence scores.',
    {
      symbol: z.string().optional().describe('Coin symbol, defaults to BTC'),
    },
    async ({ symbol }) => {
      try {
        const data = await tools.getTradingSignals(symbol || 'BTC');
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
    'Query on-chain verified balances and estimated USD portfolio valuation for any EVM wallet address.',
    {
      walletAddress: z.string().describe('EVM wallet address (0x...)'),
    },
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
    'Calculate decentralized swap output, slippage tolerance, estimated fees, and Uniswap routing path.',
    {
      fromToken: z.string().describe('Source token symbol, e.g. USDT, ETH, BTC'),
      toToken: z.string().describe('Target token symbol, e.g. BTC, ETH, SOL'),
      amount: z.number().describe('Amount of fromToken to swap'),
    },
    async ({ fromToken, toToken, amount }) => {
      try {
        const data = await tools.calculateDexSwap(fromToken, toToken, amount);
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      } catch (err: any) {
        return { content: [{ type: 'text', text: `Error: ${err.message}` }], isError: true };
      }
    }
  );

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
