import type { RequestHandler } from 'express';
import { database } from '../billing/database.js';
import { loadClientUser, type ClientUser, type Query } from '../billing/store.js';
import type { Tier } from '../billing/config.js';
declare global { namespace Express { interface Request { clientUser?: ClientUser; } } }
const rank = { free: 0, pro: 1, vip: 2 };
export function requireTier(tier: Tier, query: Query = database.query): RequestHandler {
  return async (req, res, next) => {
    try {
      if (!req.user) return void res.status(401).json({ error: 'Sign in to access your account' });
      const user = await loadClientUser(query, req.user.userId);
      if (!user) return void res.status(401).json({ error: 'Account not found' });
      req.clientUser = user;
      if (rank[user.tier] < rank[tier]) return void res.status(403).json({ error: `${tier.toUpperCase()} plan required`, code: 'PLAN_REQUIRED', requiredTier: tier, currentTier: user.tier });
      next();
    } catch { res.status(503).json({ error: 'Account access could not be verified. Retry later' }); }
  };
}
export const requireAdmin: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) return void res.status(401).json({ error: 'Sign in required' });
    const ids = (process.env.ADMIN_USER_IDS || '').split(',').map(id => id.trim()).filter(Boolean);
    if (!ids.includes(req.user.userId)) return void res.status(403).json({ error: 'Administrator access required' });
    next();
  } catch { res.status(403).json({ error: 'Administrator access required' }); }
};
