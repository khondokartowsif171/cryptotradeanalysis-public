import { createHash, randomBytes } from 'node:crypto';
import { Router, type RequestHandler } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { requireTier } from '../middleware/entitlements.js';
import { BillingError } from '../billing/config.js';
import { billingFailure } from '../billing/router.js';
import { database } from '../billing/database.js';
import { loadClientUser, type Database } from '../billing/store.js';
import { signalsHandler } from './signals.js';
const digest = (key: string) => createHash('sha256').update(key).digest('hex');
export function createApiKeyRouter(db: Database = database, authenticate: RequestHandler = authMiddleware) {
  const router = Router();
  router.use(authenticate, requireTier('free',db.query), rateLimit(20,60_000,req => req.user!.userId));
  router.use((_req,res,next) => { res.setHeader('Cache-Control','no-store'); next(); });
  router.get('/', async (req,res) => {
    try { res.json({ keys: (await db.query('SELECT id,name,suffix,created_at,expires_at,revoked_at,last_used_at FROM client_api_keys WHERE user_id=$1 ORDER BY created_at DESC LIMIT 25',[req.user!.userId])).rows }); }
    catch(error) { billingFailure(error,res); }
  });
  router.post('/', requireTier('vip',db.query), async (req,res) => {
    try {
      const { name } = z.object({ name: z.string().trim().min(1).max(60) }).strict().parse(req.body);
      const key = 'crx_live_' + randomBytes(32).toString('base64url');
      const item = await db.transaction(async query => {
        await query('SELECT id FROM users WHERE id=$1 FOR UPDATE',[req.user!.userId]);
        if ((await loadClientUser(query,req.user!.userId))?.tier !== 'vip') throw new BillingError(403,'PLAN_REQUIRED','An active VIP plan is required');
        const count = Number((await query('SELECT COUNT(*) AS count FROM client_api_keys WHERE user_id=$1 AND revoked_at IS NULL AND expires_at>NOW()',[req.user!.userId])).rows[0].count);
        if (count >= 5) throw new BillingError(409,'KEY_LIMIT','Revoke an existing key before creating another');
        return (await query('INSERT INTO client_api_keys(user_id,name,key_hash,suffix) VALUES($1,$2,$3,$4) RETURNING id,name,suffix,created_at,expires_at',[req.user!.userId,name,digest(key),key.slice(-4)])).rows[0];
      });
      res.status(201).json({ key, details: item, scope: 'read:own-watchlist read:own-portfolio read:premium-signals' });
    } catch(error) { billingFailure(error,res); }
  });
  router.delete('/:id', async (req,res) => {
    try {
      const id = z.string().uuid().parse(req.params.id);
      const result = await db.query('UPDATE client_api_keys SET revoked_at=COALESCE(revoked_at,NOW()) WHERE id=$1 AND user_id=$2 RETURNING id',[id,req.user!.userId]);
      if (!result.rows.length) return void res.status(404).json({ error: 'Key not found' });
      res.json({ revoked: true });
    } catch(error) { billingFailure(error,res); }
  });
  return router;
}
export function createClientApiRouter(db: Database = database) {
  const router = Router();
  router.use(async (req,res,next) => {
    res.setHeader('Cache-Control','no-store');
    const key = req.get('Authorization')?.replace(/^Bearer /,'') || '';
    if (!/^crx_live_[A-Za-z0-9_-]{43}$/.test(key)) return void res.status(401).json({ error: 'A client API key is required' });
    try {
      const item = (await db.query('SELECT id,user_id FROM client_api_keys WHERE key_hash=$1 AND revoked_at IS NULL AND expires_at>NOW()',[digest(key)])).rows[0];
      if (!item) return void res.status(401).json({ error: 'Invalid or expired API key' });
      const user = await loadClientUser(db.query,item.user_id);
      if (!user || user.tier !== 'vip') return void res.status(403).json({ error: 'An active VIP subscription is required', code: 'PLAN_REQUIRED' });
      req.clientUser = user;
      req.user = { userId: user.id,email: user.email };
      res.locals.apiKeyId = item.id;
      await db.query('UPDATE client_api_keys SET last_used_at=NOW() WHERE id=$1',[item.id]);
      next();
    } catch { res.status(503).json({ error: 'API access could not be verified' }); }
  });
  router.use(rateLimit(60,60_000,req => req.user!.userId));
  router.get('/signals',signalsHandler);
  router.get('/watchlist',async (req,res) => {
    try { res.json({ watchlist: (await db.query('SELECT coin_ids FROM watchlists WHERE user_id=$1',[req.user!.userId])).rows[0]?.coin_ids || [] }); }
    catch { res.status(503).json({ error: 'Watchlist unavailable' }); }
  });
  router.get('/portfolio',async (req,res) => {
    try { res.json({ portfolio: (await db.query('SELECT holdings FROM portfolios WHERE user_id=$1',[req.user!.userId])).rows[0]?.holdings || [] }); }
    catch { res.status(503).json({ error: 'Portfolio unavailable' }); }
  });
  return router;
}
