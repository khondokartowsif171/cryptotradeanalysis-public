import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import watchlistRoutes from './routes/watchlist.js';
import portfolioRoutes from './routes/portfolio.js';
import subscribeRoutes from './routes/subscribe.js';
import newsRoutes from './routes/news.js';
import signalsRoutes from './routes/signals.js';
import { query } from './db/pool.js';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/debug/db', async (_req, res) => {
  try {
    const result = await query("SELECT NOW() as time, (SELECT count(*) FROM users) as users");
    res.json({
      connected: true,
      dbTime: result.rows[0].time,
      users: result.rows[0].users,
      dbUrl: (process.env.DATABASE_URL || '').replace(/\/\/.*@/, '//user:pass@'),
    });
  } catch (err: any) {
    res.json({
      connected: false,
      error: err.message,
      code: err.code,
      dbUrl: (process.env.DATABASE_URL || '').replace(/\/\/.*@/, '//user:pass@'),
    });
  }
});

app.use('/auth', authRoutes);
app.use('/watchlist', watchlistRoutes);
app.use('/portfolio', portfolioRoutes);
app.use('/subscribe', subscribeRoutes);
app.use('/news', newsRoutes);
app.use('/signals', signalsRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

async function start() {
  try {
    const db = await query("SELECT version()");
    console.log('PostgreSQL connected:', db.rows[0].version.slice(0, 40));
  } catch (err: any) {
    console.error('PostgreSQL connection FAILED:', err.message);
    console.error('DATABASE_URL:', (process.env.DATABASE_URL || '').replace(/\/\/.*@/, '//user:pass@'));
  }
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CryptoX API running on port ${PORT}`);
  });
}

start();

export default app;
