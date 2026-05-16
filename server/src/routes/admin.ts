import { Router } from 'express';
import { query } from '../db/pool.js';
import { getMongo } from '../db/mongo.js';

const router = Router();

router.get('/stats', async (_req, res) => {
  try {
    const userCount = await query('SELECT COUNT(*) as count FROM users');
    const watchlistCount = await query('SELECT COUNT(*) as count FROM watchlists');
    const portfolioCount = await query('SELECT COUNT(*) as count FROM portfolios');
    const subscriberCount = await query('SELECT COUNT(*) as count FROM subscribers');

    let mongoStats = { news: 0, signals: 0, alerts: 0 };
    try {
      const db = await getMongo();
      mongoStats.news = await db.collection('news').countDocuments();
      mongoStats.signals = await db.collection('signals').countDocuments();
      mongoStats.alerts = await db.collection('alerts').countDocuments();
    } catch {}

    res.json({
      users: parseInt(userCount.rows[0].count),
      watchlists: parseInt(watchlistCount.rows[0].count),
      portfolios: parseInt(portfolioCount.rows[0].count),
      subscribers: parseInt(subscriberCount.rows[0].count),
      mongo: mongoStats,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/users', async (_req, res) => {
  try {
    const result = await query('SELECT id, email, created_at FROM users ORDER BY created_at DESC LIMIT 50');
    res.json({ users: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/subscribers', async (_req, res) => {
  try {
    const result = await query('SELECT id, email, subscribed_at FROM subscribers ORDER BY subscribed_at DESC LIMIT 50');
    res.json({ subscribers: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
