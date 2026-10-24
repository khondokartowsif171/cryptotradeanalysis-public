import { Router, Request, Response } from 'express';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { createCryptoMcpServer } from '../mcp/server.js';
import * as tools from '../mcp/tools.js';

const router = Router();

// Store active transports by sessionId
const transports = new Map<string, SSEServerTransport>();

// Dedicated MCP Server instance
const mcpServer = createCryptoMcpServer();

// GET /mcp/info - Documentation & complete tool registry
router.get('/info', async (req: Request, res: Response) => {
  res.json({
    name: 'aura-cryptox-mcp',
    version: '1.2.0',
    description: 'Universal Model Context Protocol (MCP) Server for real-time cryptocurrency intelligence, quantitative trading signals, on-chain portfolio checks, DEX swap routing, and autonomous AI trading.',
    protocol: 'Model Context Protocol (MCP) v2024-11-05',
    transport: {
      type: 'SSE (Server-Sent Events)',
      sseEndpoint: 'https://cryptox-api.auraajenticai.cloud/mcp',
      messagesEndpoint: 'https://cryptox-api.auraajenticai.cloud/mcp/messages',
    },
    clientConfigurations: {
      claudeDesktop: {
        mcpServers: {
          'aura-cryptox': {
            url: 'https://cryptox-api.auraajenticai.cloud/mcp',
          },
        },
      },
      cursorAndWindsurf: {
        mcpServers: {
          'aura-cryptox': {
            url: 'https://cryptox-api.auraajenticai.cloud/mcp',
          },
        },
      },
      n8nAutomation: {
        node: 'MCP Tool / HTTP Stream',
        url: 'https://cryptox-api.auraajenticai.cloud/mcp',
      },
    },
    tools: [
      { name: 'crypto_get_live_price', description: 'Get live crypto price, 24h change, high/low, and volume from Binance.', params: ['symbol'] },
      { name: 'crypto_get_market_overview', description: 'Global crypto market cap, volume, BTC dominance, and market sentiment.' },
      { name: 'crypto_get_trading_signals', description: 'Quantitative AI signals (BUY/SELL/HOLD), entry zones, targets, stop losses, and confidence.', params: ['symbol?'] },
      { name: 'crypto_get_latest_news', description: 'Real-time breaking crypto news from Cointelegraph and top media.', params: ['limit?'] },
      { name: 'crypto_check_wallet_portfolio', description: 'On-chain verified balances & USD portfolio valuation across EVM chains.', params: ['walletAddress'] },
      { name: 'crypto_get_token_metadata', description: 'Canonical contract address, block explorer, network, and official website.', params: ['symbol'] },
      { name: 'crypto_calculate_dex_swap', description: 'DEX swap output calculation, slippage impact, and Uniswap routing path.', params: ['fromToken', 'toToken', 'amount'] },
      // Autonomous Trading Tools
      { name: 'crypto_get_binance_account_balance', description: 'Check connected Binance account live spot balances and trading readiness.', params: [] },
      { name: 'crypto_execute_autonomous_trade', description: 'Autonomously execute a cryptocurrency trade (BUY/SELL) with algorithmic entry and 1:2.4 TP/SL on Binance live price.', params: ['symbol', 'side', 'amountUsd?', 'leverage?', 'mode?'] },
      { name: 'crypto_monitor_and_manage_trades', description: '24/7 Position Guardian: Scans all active positions, updates live PnL against Binance, and auto-closes on TP/SL.', params: [] },
      { name: 'crypto_get_trading_performance', description: 'Query aggregate win rate %, net realized profit, active unrealized PnL, and recent trade ledger.', params: [] },
      { name: 'crypto_close_autonomous_trade', description: 'Manually close an active trade position at the live market price.', params: ['tradeId'] },
    ],
    status: 'ONLINE',
    author: 'Aura Agentic AI (auraajenticai.cloud)',
  });
});

// GET /mcp - Establish SSE Stream
router.get('/', async (req: Request, res: Response) => {
  if (req.headers.accept && req.headers.accept.includes('application/json') && !req.headers.accept.includes('text/event-stream')) {
    return res.redirect('/mcp/info');
  }

  try {
    const transport = new SSEServerTransport('/mcp/messages', res);
    const sessionId = transport.sessionId;
    transports.set(sessionId, transport);

    transport.onclose = () => {
      transports.delete(sessionId);
    };

    await mcpServer.connect(transport);
  } catch (err: any) {
    console.error('Failed to establish MCP SSE connection:', err);
    if (!res.headersSent) {
      res.status(500).send(`MCP Connection Error: ${err.message}`);
    }
  }
});

// POST /mcp/messages - Client JSON-RPC communication
router.post('/messages', async (req: Request, res: Response) => {
  const sessionId = req.query.sessionId as string;
  const transport = transports.get(sessionId);

  if (!transport) {
    return res.status(404).json({ error: 'Session not found. Please establish an SSE connection first.' });
  }

  try {
    await transport.handlePostMessage(req, res);
  } catch (err: any) {
    console.error('Error handling MCP message:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    }
  }
});

// Direct REST execution for non-MCP callers / curl
router.post('/execute/:toolName', async (req: Request, res: Response) => {
  const { toolName } = req.params;
  const body = req.body || {};

  try {
    switch (toolName) {
      case 'crypto_get_live_price':
        return res.json(await tools.getLivePrice(body.symbol || 'BTC'));
      case 'crypto_get_market_overview':
        return res.json(await tools.getMarketOverview());
      case 'crypto_get_trading_signals':
        return res.json(await tools.getTradingSignals(body.symbol || 'BTC'));
      case 'crypto_get_latest_news':
        return res.json(await tools.getLatestNews(body.limit || 10));
      case 'crypto_check_wallet_portfolio':
        return res.json(await tools.checkWalletPortfolio(body.walletAddress));
      case 'crypto_get_token_metadata':
        return res.json(tools.getTokenMetadata(body.symbol || 'BTC'));
      case 'crypto_calculate_dex_swap':
        return res.json(await tools.calculateDexSwap(body.fromToken || 'USDT', body.toToken || 'BTC', body.amount || 100));
      // Autonomous Trading Tools Execution
      case 'crypto_get_binance_account_balance':
        return res.json(await tools.getBinanceAccountBalance());
      case 'crypto_execute_autonomous_trade':
        return res.json(await tools.executeAutonomousTrade(body));
      case 'crypto_monitor_and_manage_trades':
        return res.json(await tools.monitorAndManageTrades());
      case 'crypto_get_trading_performance':
        return res.json(await tools.getTradingPerformance());
      case 'crypto_close_autonomous_trade':
        return res.json(await tools.closeAutonomousTrade(body.tradeId));
      default:
        return res.status(404).json({ error: `Unknown tool: ${toolName}` });
    }
  } catch (err: any) {
    console.error(`MCP Execute error for ${toolName}:`, err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
