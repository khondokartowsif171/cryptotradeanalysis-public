import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { query } from '../db/pool.js';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT holdings FROM portfolios WHERE user_id = $1', [req.user!.userId]);
    const holdings = result.rows[0]?.holdings || [];
    res.json({ portfolio: holdings });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load portfolio' });
  }
});

router.put('/', async (req, res) => {
  try {
    const { holdings } = req.body;
    if (!Array.isArray(holdings)) {
      res.status(400).json({ error: 'holdings must be an array' });
      return;
    }
    await query(
      `INSERT INTO portfolios (user_id, holdings, updated_at)
       VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (user_id)
       DO UPDATE SET holdings = $2::jsonb, updated_at = NOW()`,
      [req.user!.userId, JSON.stringify(holdings)]
    );
    res.json({ portfolio: holdings });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to save portfolio' });
  }
});

export default router;
