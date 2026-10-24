import type { RequestHandler } from 'express';
export function rateLimit(limit: number, intervalMs: number, key: (req: any) => string): RequestHandler {
  const buckets = new Map<string, { count: number; reset: number }>();
  return (req, res, next) => {
    const now = Date.now();
    if (buckets.size >= 10000) for (const [id, value] of buckets) if (value.reset <= now) buckets.delete(id);
    const id = key(req);
    let bucket = buckets.get(id);
    if (!bucket || bucket.reset <= now) { bucket = { count: 0, reset: now + intervalMs }; if (buckets.size >= 10000) return void res.status(429).json({ error: 'Server busy. Retry later' }); buckets.set(id, bucket); }
    if (++bucket.count > limit) { res.setHeader('Retry-After', String(Math.ceil((bucket.reset - now) / 1000))); return void res.status(429).json({ error: 'Too many requests. Please wait and try again' }); }
    next();
  };
}
