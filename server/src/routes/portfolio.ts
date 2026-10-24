import { Router, type RequestHandler } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { requireTier } from '../middleware/entitlements.js';
import { z } from 'zod';
import { query as productionQuery } from '../db/pool.js';
import type { Query } from '../billing/store.js';

export function createPortfolioRouter(query: Query = productionQuery, authenticate: RequestHandler = authMiddleware) {
const router = Router();
router.use(authenticate,requireTier('pro',query));

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
    const input = z.object({ holdings: z.array(z.object({ symbol: z.string().regex(/^[A-Z0-9]{1,20}$/), amount: z.number().finite().nonnegative().max(1e15), name: z.string().max(100).optional() })).max(1000) }).strict().safeParse(req.body);
    if (!input.success) { res.status(400).json({ error: 'Invalid portfolio holdings' }); return; }
    const holdings = input.data.holdings;
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

return router;
}
export default createPortfolioRouter();
