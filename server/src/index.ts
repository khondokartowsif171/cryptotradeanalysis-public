import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import { createApiKeyRouter,createClientApiRouter } from './routes/clientApi.js';
import billingRoutes from './routes/billing.js';
import watchlistRoutes from './routes/watchlist.js';
import portfolioRoutes from './routes/portfolio.js';
import subscribeRoutes from './routes/subscribe.js';
import newsRoutes from './routes/news.js';
import signalsRoutes from './routes/signals.js';
import adminRoutes from './routes/admin.js';
import mcpRoutes from './routes/mcp.js';
import connectorRoutes, { canonicalConnector } from './routes/connector.js';
import { ensureBillingSchema } from './billing/database.js';
import { authMiddleware } from './middleware/auth.js';
import { requireAdmin } from './middleware/entitlements.js';
import { query } from './db/pool.js';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

const webOrigins = new Set(['https://crypto.auraajenticai.cloud','https://cryptox.auraajenticai.cloud','https://chatgpt.com','https://chat.openai.com',...(process.env.CORS_ORIGINS || '').split(',').map(origin => origin.trim()).filter(Boolean)]);
app.use(cors({ origin: (origin,callback) => callback(null,!origin || webOrigins.has(origin)),credentials: false }));
app.use(express.json({ limit: '1mb' }));
app.use(canonicalConnector);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/debug/db', authMiddleware, requireAdmin, async (_req, res) => {
  try {
    const result = await query("SELECT NOW() as time, (SELECT count(*) FROM users) as users");
    res.json({
      connected: true,
      dbTime: result.rows[0].time,
      users: result.rows[0].users,
    });
  } catch (err: any) {
    res.json({
      connected: false,
      error: err.message,
      code: err.code,
    });
  }
});

app.use('/auth', authRoutes);
app.use('/billing', billingRoutes);
app.use('/client-api/keys',createApiKeyRouter());
app.use('/client-api',createClientApiRouter());
app.use('/watchlist', watchlistRoutes);
app.use('/portfolio', portfolioRoutes);
app.use('/subscribe', subscribeRoutes);
app.use('/news', newsRoutes);
app.use('/signals', signalsRoutes);
app.use('/admin', authMiddleware, requireAdmin, adminRoutes);

// Mount Model Context Protocol (MCP) Router
app.use('/mcp', mcpRoutes);
app.use('/connector', connectorRoutes);
app.get('/api/mcp', (_req, res) => res.redirect('/mcp/info'));

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

async function start() {
  try {
    await ensureBillingSchema();
    const db = await query("SELECT version()");
    console.log('PostgreSQL connected:', db.rows[0].version.slice(0, 40));
  } catch (err: any) {
    console.error('PostgreSQL connection FAILED:', err.message);
    process.exitCode = 1;
    return;
  }
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CryptoX API running on port ${PORT} (with MCP Server at /mcp)`);
  });
}

start();

export default app;
