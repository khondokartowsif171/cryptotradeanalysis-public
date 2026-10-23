import { Router } from 'express';
import { query } from '../db/pool.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

const TREASURY = {
  EVM: process.env.TREASURY_EVM_ADDRESS || '0x2C2891f4Fb5000e0E288D16DA3f1d780eE77714e',
  TRON: process.env.TREASURY_TRON_ADDRESS || 'TW2B3YwXfCqZ1m4YgHqJcM7z2pZ8k9X1aB',
  acceptedTokens: [
    { symbol: 'USDT', networks: ['Polygon', 'Arbitrum', 'BSC', 'Ethereum', 'TRC20'] },
    { symbol: 'USDC', networks: ['Polygon', 'Arbitrum', 'BSC', 'Ethereum'] },
    { symbol: 'ETH', networks: ['Arbitrum', 'Ethereum'] },
    { symbol: 'BNB', networks: ['BSC'] }
  ]
};

const PLANS = [
  {
    id: 'free',
    name: 'Free Explorer',
    priceUsd: 0,
    badge: 'FREE',
    features: [
      'Live Binance & TwelveData Tickers',
      'Public Candlestick Charts',
      'Market Movers & News Feed',
      'Standard Watchlist (5 coins)'
    ]
  },
  {
    id: 'pro',
    name: 'Pro Trader',
    priceUsd: 19,
    badge: 'PRO',
    period: 'monthly',
    yearlyPriceUsd: 149,
    features: [
      '⚡ Real-Time AI Trading Signals',
      'Multi-Timeframe Confluence (1m, 5m, 1h, 1d)',
      'Unlimited Watchlist & Portfolio Tracking',
      'Staking Multiplier Boost (2x)',
      'Priority Webhook Data Stream'
    ]
  },
  {
    id: 'vip',
    name: 'VIP Whale / Quant',
    priceUsd: 49,
    badge: 'VIP',
    period: 'monthly',
    yearlyPriceUsd: 399,
    features: [
      '👑 All Pro Features Included',
      'Instant Telegram Signal Push Alerts',
      'On-Chain Whale Movement Radar',
      'Direct API Access for Automated Bots',
      '1-on-1 VIP Quantitative Strategy Desk'
    ]
  }
];

router.get('/plans', (_req, res) => {
  res.json({ plans: PLANS, treasury: TREASURY });
});

router.post('/submit-tx', authenticate, async (req: any, res) => {
  try {
    const { plan, txHash, token, network } = req.body;
    const userId = req.user.userId;

    if (!plan || !txHash || !token || !network) {
      res.status(400).json({ error: 'Missing plan, txHash, token, or network' });
      return;
    }

    const selectedPlan = PLANS.find(p => p.id === plan);
    if (!selectedPlan || selectedPlan.priceUsd === 0) {
      res.status(400).json({ error: 'Invalid subscription plan selected' });
      return;
    }

    // Insert order record
    const orderResult = await query(
      `INSERT INTO crypto_orders (user_id, plan, amount_usd, crypto_amount, token, network, tx_hash, status, confirmed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'confirmed', NOW())
       RETURNING id, plan, amount_usd, token, network, tx_hash, status, confirmed_at`,
      [userId, plan, selectedPlan.priceUsd, selectedPlan.priceUsd, token, network, txHash]
    );

    // Update user tier for 30 days
    await query(
      `UPDATE users 
       SET tier = $1, tier_expires_at = NOW() + INTERVAL '30 days', updated_at = NOW() 
       WHERE id = $2`,
      [plan, userId]
    );

    res.json({
      success: true,
      message: `Successfully upgraded to ${selectedPlan.name}!`,
      tier: plan,
      order: orderResult.rows[0]
    });
  } catch (err: any) {
    console.error('Submit tx error:', err);
    res.status(500).json({ error: err.message || 'Payment processing failed' });
  }
});

router.get('/orders', authenticate, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const result = await query(
      'SELECT id, plan, amount_usd, token, network, tx_hash, status, created_at, confirmed_at FROM crypto_orders WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    res.json({ orders: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
