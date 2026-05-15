import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import watchlistRoutes from './routes/watchlist.js';
import portfolioRoutes from './routes/portfolio.js';
import subscribeRoutes from './routes/subscribe.js';
import newsRoutes from './routes/news.js';
import signalsRoutes from './routes/signals.js';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/subscribe', subscribeRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/signals', signalsRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`CryptoX API running on port ${PORT}`);
  console.log(`Health: http://localhost:${PORT}/api/health`);
});

export default app;
