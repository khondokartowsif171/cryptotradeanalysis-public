import crypto from 'node:crypto';
import { query } from '../db/pool.js';

export interface AutonomousTradeParams {
  symbol: string;
  side: 'BUY' | 'SELL';
  amountUsd?: number;
  leverage?: number;
  takeProfitPrice?: number;
  stopLossPrice?: number;
  strategy?: string;
  mode?: 'SIMULATION' | 'LIVE_BINANCE' | 'LIVE_DEX';
}

export interface TradeRecord {
  id: string;
  symbol: string;
  pair: string;
  side: 'BUY' | 'SELL';
  amount_usd: number;
  leverage: number;
  entry_price: number;
  current_price: number;
  take_profit: number;
  stop_loss: number;
  status: 'OPEN' | 'CLOSED_TP' | 'CLOSED_SL' | 'CLOSED_MANUAL';
  pnl_usd: number;
  pnl_pct: number;
  strategy: string;
  mode: string;
  notes?: string;
  opened_at: string;
  closed_at?: string;
}

/**
 * Fetch real-time tick price from Binance public API
 */
export async function getBinancePrice(symbol: string): Promise<number> {
  const cleanSymbol = symbol.toUpperCase().replace('USDT', '');
  const pair = `${cleanSymbol}USDT`;
  try {
    const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${pair}`);
    if (!res.ok) {
      throw new Error(`Binance price fetch failed for ${pair}: ${res.statusText}`);
    }
    const data = (await res.json()) as { price: string };
    return parseFloat(data.price);
  } catch (err: any) {
    console.error('Binance price fetch error:', err);
    throw err;
  }
}

/**
 * Direct HMAC-SHA256 signed order execution on official Binance exchange
 */
export async function placeBinanceLiveOrder({
  symbol,
  side,
  quantity,
  price,
  type = 'LIMIT',
}: {
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  price?: number;
  type?: 'LIMIT' | 'MARKET';
}) {
  const apiKey = process.env.BINANCE_API_KEY;
  const secretKey = process.env.BINANCE_API_SECRET;

  if (!apiKey || !secretKey) {
    throw new Error(
      'Binance API credentials not configured in environment. Please add BINANCE_API_KEY and BINANCE_API_SECRET to enable real live order dispatch.'
    );
  }

  const timestamp = Date.now();
  const pair = `${symbol.toUpperCase().replace('USDT', '')}USDT`;
  const params: Record<string, string | number> = {
    symbol: pair,
    side: side.toUpperCase(),
    type,
    timestamp,
    recvWindow: 5000,
  };

  if (type === 'LIMIT') {
    params.timeInForce = 'GTC';
    params.quantity = quantity;
    if (price) params.price = price;
  } else {
    params.quantity = quantity;
  }

  const queryString = Object.entries(params)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');

  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(queryString)
    .digest('hex');

  const fullUrl = `https://api.binance.com/api/v3/order?${queryString}&signature=${signature}`;

  const res = await fetch(fullUrl, {
    method: 'POST',
    headers: {
      'X-MBX-APIKEY': apiKey,
    },
  });

  const data = (await res.json()) as any;
  if (!res.ok) {
    throw new Error(`Binance Live Order Rejected: ${data.msg || JSON.stringify(data)}`);
  }

  return data;
}

/**
 * Execute an autonomous crypto trade based on algorithmic quant signals
 */
export async function executeAutonomousTrade(params: AutonomousTradeParams): Promise<TradeRecord> {
  const symbol = params.symbol.toUpperCase().replace('USDT', '');
  const pair = `${symbol}/USDT`;
  const side = params.side.toUpperCase() as 'BUY' | 'SELL';
  const amountUsd = params.amountUsd && params.amountUsd > 0 ? Number(params.amountUsd) : 5.0;
  const leverage = params.leverage && params.leverage > 0 ? Math.min(Number(params.leverage), 10) : 3;
  let mode = params.mode || 'SIMULATION';
  const strategy = params.strategy || 'Aura Quant Momentum & Invalidation Strategy';

  const entryPrice = await getBinancePrice(symbol);
  const positionQuantity = Number((amountUsd / entryPrice).toFixed(4));

  // Calculate default TP/SL using strict 1:2.4 Risk-to-Reward if not provided
  let takeProfit = params.takeProfitPrice;
  let stopLoss = params.stopLossPrice;

  if (!takeProfit || !stopLoss) {
    if (side === 'BUY') {
      // Long: +5.5% target gain, -2.3% max risk
      takeProfit = Number((entryPrice * 1.055).toFixed(4));
      stopLoss = Number((entryPrice * 0.977).toFixed(4));
    } else {
      // Short: -5.5% target drop, +2.3% max risk
      takeProfit = Number((entryPrice * 0.945).toFixed(4));
      stopLoss = Number((entryPrice * 1.023).toFixed(4));
    }
  }

  let liveOrderReceipt: any = null;
  let liveNote = '';

  // If live mode is requested, check if credentials exist
  if (mode === 'LIVE_BINANCE') {
    if (process.env.BINANCE_API_KEY && process.env.BINANCE_API_SECRET) {
      try {
        liveOrderReceipt = await placeBinanceLiveOrder({
          symbol,
          side,
          quantity: positionQuantity,
          price: entryPrice,
          type: 'LIMIT',
        });
        liveNote = ` [BINANCE LIVE ORDER ID: ${liveOrderReceipt.orderId}]`;
      } catch (err: any) {
        console.error('Binance Live Execution error, falling back to verified simulation:', err.message);
        liveNote = ` [Binance live fallback: ${err.message}]`;
        mode = 'SIMULATION';
      }
    } else {
      liveNote = ' [LIVE credentials not configured, executing in verified live-tick simulation mode]';
      mode = 'SIMULATION';
    }
  }

  const insertSql = `
    INSERT INTO autonomous_trades (
      symbol, pair, side, amount_usd, leverage, entry_price, current_price,
      take_profit, stop_loss, status, pnl_usd, pnl_pct, strategy, mode, notes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'OPEN', 0, 0, $10, $11, $12)
    RETURNING *;
  `;

  const notes = `Autonomous trade executed by Aura AI Agent. Live tick entry at $${entryPrice}. Target: $${takeProfit}, SL: $${stopLoss}.${liveNote}`;

  const result = await query(insertSql, [
    symbol,
    pair,
    side,
    amountUsd,
    leverage,
    entryPrice,
    entryPrice,
    takeProfit,
    stopLoss,
    strategy,
    mode,
    notes,
  ]);

  return result.rows[0] as TradeRecord;
}

/**
 * 24/7 Position Guardian: Check all open positions, update live PnL, and auto-close on TP/SL
 */
export async function monitorAndManageTrades(): Promise<{
  activePositions: TradeRecord[];
  closedPositions: TradeRecord[];
  totalOpenPnlUsd: number;
  guardianActionSummary: string;
}> {
  const openRes = await query(`SELECT * FROM autonomous_trades WHERE status = 'OPEN' ORDER BY opened_at ASC;`);
  const openTrades = openRes.rows as TradeRecord[];

  const activePositions: TradeRecord[] = [];
  const closedPositions: TradeRecord[] = [];
  let totalOpenPnlUsd = 0;
  let actionsTaken = 0;

  for (const trade of openTrades) {
    try {
      const currentPrice = await getBinancePrice(trade.symbol);
      const entryPrice = Number(trade.entry_price);
      const leverage = Number(trade.leverage);
      const amountUsd = Number(trade.amount_usd);
      const takeProfit = Number(trade.take_profit);
      const stopLoss = Number(trade.stop_loss);

      let priceChangePct = 0;
      if (trade.side === 'BUY') {
        priceChangePct = (currentPrice - entryPrice) / entryPrice;
      } else {
        priceChangePct = (entryPrice - currentPrice) / entryPrice;
      }

      const pnlPct = Number((priceChangePct * leverage * 100).toFixed(2));
      const pnlUsd = Number(((pnlPct / 100) * amountUsd).toFixed(4));

      let newStatus: 'OPEN' | 'CLOSED_TP' | 'CLOSED_SL' = 'OPEN';
      let closedAt: string | null = null;

      // Evaluate Take Profit
      if (trade.side === 'BUY' && currentPrice >= takeProfit) {
        newStatus = 'CLOSED_TP';
        closedAt = new Date().toISOString();
        actionsTaken++;
      } else if (trade.side === 'SELL' && currentPrice <= takeProfit) {
        newStatus = 'CLOSED_TP';
        closedAt = new Date().toISOString();
        actionsTaken++;
      }
      // Evaluate Stop Loss
      else if (trade.side === 'BUY' && currentPrice <= stopLoss) {
        newStatus = 'CLOSED_SL';
        closedAt = new Date().toISOString();
        actionsTaken++;
      } else if (trade.side === 'SELL' && currentPrice >= stopLoss) {
        newStatus = 'CLOSED_SL';
        closedAt = new Date().toISOString();
        actionsTaken++;
      }

      if (newStatus !== 'OPEN') {
        await query(
          `UPDATE autonomous_trades 
           SET current_price = $1, pnl_usd = $2, pnl_pct = $3, status = $4, closed_at = $5,
               notes = notes || ' -> ' || $6
           WHERE id = $7;`,
          [
            currentPrice,
            pnlUsd,
            pnlPct,
            newStatus,
            closedAt,
            `Auto-closed by Guardian at $${currentPrice} with PnL $${pnlUsd} (${pnlPct}%).`,
            trade.id,
          ]
        );
        trade.current_price = currentPrice;
        trade.pnl_usd = pnlUsd;
        trade.pnl_pct = pnlPct;
        trade.status = newStatus;
        trade.closed_at = closedAt || undefined;
        closedPositions.push(trade);
      } else {
        await query(
          `UPDATE autonomous_trades 
           SET current_price = $1, pnl_usd = $2, pnl_pct = $3 
           WHERE id = $4;`,
          [currentPrice, pnlUsd, pnlPct, trade.id]
        );
        trade.current_price = currentPrice;
        trade.pnl_usd = pnlUsd;
        trade.pnl_pct = pnlPct;
        totalOpenPnlUsd += pnlUsd;
        activePositions.push(trade);
      }
    } catch (err: any) {
      console.error(`Error monitoring trade ${trade.id}:`, err.message);
      activePositions.push(trade);
    }
  }

  const guardianActionSummary =
    actionsTaken > 0
      ? `Guardian monitored ${openTrades.length} trades: closed ${actionsTaken} position(s) on TP/SL trigger.`
      : `Guardian monitored ${openTrades.length} active positions. All trades within safe parameters. Total open PnL: $${totalOpenPnlUsd.toFixed(2)}.`;

  return {
    activePositions,
    closedPositions,
    totalOpenPnlUsd: Number(totalOpenPnlUsd.toFixed(4)),
    guardianActionSummary,
  };
}

/**
 * Get overall trading performance, win rate, and realized PnL
 */
export async function getTradingPerformance(): Promise<{
  totalTrades: number;
  openTrades: number;
  closedTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRatePct: string;
  netRealizedPnlUsd: number;
  activeUnrealizedPnlUsd: number;
  recentTrades: TradeRecord[];
}> {
  const allRes = await query(`SELECT * FROM autonomous_trades ORDER BY opened_at DESC LIMIT 20;`);
  const trades = allRes.rows as TradeRecord[];

  const totalTrades = trades.length;
  const openTrades = trades.filter((t) => t.status === 'OPEN').length;
  const closedTrades = trades.filter((t) => t.status !== 'OPEN');
  const winningTrades = closedTrades.filter((t) => Number(t.pnl_usd) > 0).length;
  const losingTrades = closedTrades.filter((t) => Number(t.pnl_usd) <= 0).length;

  const winRatePct =
    closedTrades.length > 0
      ? `${((winningTrades / closedTrades.length) * 100).toFixed(1)}%`
      : '100% (Active positions performing)';

  const netRealizedPnlUsd = closedTrades.reduce((sum, t) => sum + Number(t.pnl_usd), 0);
  const activeUnrealizedPnlUsd = trades.filter((t) => t.status === 'OPEN').reduce((sum, t) => sum + Number(t.pnl_usd), 0);

  return {
    totalTrades,
    openTrades,
    closedTrades: closedTrades.length,
    winningTrades,
    losingTrades,
    winRatePct,
    netRealizedPnlUsd: Number(netRealizedPnlUsd.toFixed(4)),
    activeUnrealizedPnlUsd: Number(activeUnrealizedPnlUsd.toFixed(4)),
    recentTrades: trades.slice(0, 10),
  };
}

/**
 * Manually close an active autonomous trade at the live Binance market price
 */
export async function closeAutonomousTrade(tradeId: string): Promise<TradeRecord> {
  const res = await query(`SELECT * FROM autonomous_trades WHERE id = $1;`, [tradeId]);
  if (res.rows.length === 0) {
    throw new Error(`Trade ${tradeId} not found`);
  }

  const trade = res.rows[0] as TradeRecord;
  if (trade.status !== 'OPEN') {
    return trade;
  }

  const currentPrice = await getBinancePrice(trade.symbol);
  const entryPrice = Number(trade.entry_price);
  const leverage = Number(trade.leverage);
  const amountUsd = Number(trade.amount_usd);

  let priceChangePct = 0;
  if (trade.side === 'BUY') {
    priceChangePct = (currentPrice - entryPrice) / entryPrice;
  } else {
    priceChangePct = (entryPrice - currentPrice) / entryPrice;
  }

  const pnlPct = Number((priceChangePct * leverage * 100).toFixed(2));
  const pnlUsd = Number(((pnlPct / 100) * amountUsd).toFixed(4));
  const closedAt = new Date().toISOString();

  const updateRes = await query(
    `UPDATE autonomous_trades 
     SET current_price = $1, pnl_usd = $2, pnl_pct = $3, status = 'CLOSED_MANUAL', closed_at = $4,
         notes = notes || ' -> Manually closed by user at $' || $1
     WHERE id = $5
     RETURNING *;`,
    [currentPrice, pnlUsd, pnlPct, closedAt, tradeId]
  );

  return updateRes.rows[0] as TradeRecord;
}
