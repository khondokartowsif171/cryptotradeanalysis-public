import { Router, type RequestHandler } from 'express';
import { getMongo } from '../db/mongo.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireTier } from '../middleware/entitlements.js';
const router = Router();
export const signalsHandler: RequestHandler = async (_req,res) => {
  res.setHeader('Cache-Control','no-store');
  try {
    const db = await getMongo();
    const signals = await db.collection('signals').find({}).sort({ generated_at: -1 }).limit(20).toArray();
    res.json({ signals, fetchedAt: new Date().toISOString() });
  } catch { res.status(503).json({ error: 'The premium signal feed is temporarily unavailable', signals: [] }); }
};
router.get('/',authMiddleware,requireTier('pro'),signalsHandler);
export default router;
