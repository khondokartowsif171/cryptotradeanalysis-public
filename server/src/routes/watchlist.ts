import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { query } from '../db/pool.js';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT coin_ids FROM watchlists WHERE user_id = $1', [req.user!.userId]);
    const coinIds = result.rows[0]?.coin_ids || [];
    res.json({ watchlist: coinIds });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load watchlist' });
  }
});

router.put('/', async (req, res) => {
  try {
    const { coin_ids } = req.body;
    if (!Array.isArray(coin_ids)) {
      res.status(400).json({ error: 'coin_ids must be an array' });
      return;
    }
    await query(
      `INSERT INTO watchlists (user_id, coin_ids, updated_at)
       VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (user_id)
       DO UPDATE SET coin_ids = $2::jsonb, updated_at = NOW()`,
      [req.user!.userId, JSON.stringify(coin_ids)]
    );
    res.json({ watchlist: coin_ids });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to save watchlist' });
  }
});

export default router;
