import { Router, type RequestHandler } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { requireTier } from '../middleware/entitlements.js';
import { z } from 'zod';
import { query as productionQuery } from '../db/pool.js';
import type { Query } from '../billing/store.js';

export function createWatchlistRouter(query: Query = productionQuery, authenticate: RequestHandler = authMiddleware) {
const router = Router();
router.use(authenticate,requireTier('free',query));

router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT coin_ids FROM watchlists WHERE user_id = $1', [req.user!.userId]);
    const coinIds = result.rows[0]?.coin_ids || [];
    res.json({ watchlist: req.clientUser!.tier === 'free' ? coinIds.slice(0,5) : coinIds });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load watchlist' });
  }
});

router.put('/', async (req, res) => {
  try {
    const parsed = z.object({ coin_ids: z.array(z.string().regex(/^[a-zA-Z0-9-]{1,24}$/)).max(1000) }).strict().safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: 'Provide up to 1,000 valid coin symbols' }); return; }
    const coin_ids = [...new Set(parsed.data.coin_ids.map(id => id.toLowerCase()))];
    if (req.clientUser!.tier === 'free' && coin_ids.length > 5) { res.status(403).json({ error: 'Free watchlists support 5 coins. Pro or VIP is required for more', code: 'PLAN_REQUIRED', requiredTier: 'pro' }); return; }
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

return router;
}
export default createWatchlistRouter();
