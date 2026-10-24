import { Router, RequestHandler } from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createCryptoMcpServer } from '../mcp/server.js';

const router = Router();
const endpoint = 'https://crypto.auraajenticai.cloud/mcp';
const allowedOrigins = new Set([
  'https://crypto.auraajenticai.cloud', 'https://cryptox-api.auraajenticai.cloud',
  'https://chatgpt.com', 'https://chat.openai.com',
]);

router.use((req, res, next) => {
  const origin = req.get('Origin');
  if (origin && !allowedOrigins.has(origin)) {
    return res.status(403).json({ error: 'Origin not allowed' });
  }
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});

router.get('/info', (_req, res) => {
  // Keep documentation explicit about the anonymous connector's boundary.
  res.json({
    name: 'Aura CryptoX', version: '1.3.0', endpoint,
    transport: 'Streamable HTTP', authentication: 'none',
    capabilities: ['live prices', 'market overview', 'signals', 'news', 'public wallet lookup', 'token metadata', 'swap estimates', 'paper trade simulation'],
    privateAccountAccess: false, liveTrading: false,
    setup: { name: 'Aura CryptoX', serverUrl: endpoint, authentication: 'No authentication' },
    testPrompt: 'Use Aura CryptoX to fetch BTC price and simulate a $10 BUY at 1x leverage. Do not place a real order.',
  });
});

router.post('/', async (req, res) => {
  // Stateless JSON responses avoid sticky sessions during rolling deployments.
  const server = createCryptoMcpServer({ publicOnly: true });
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  res.on('close', () => { void server.close().catch(console.error); });
  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    console.error('Public MCP request failed:', err);
    if (!res.headersSent) res.status(500).json({ jsonrpc: '2.0', id: req.body?.id ?? null, error: { code: -32603, message: 'Internal server error' } });
  }
});

router.all('/', (req, res) => {
  if (req.method === 'GET' && req.accepts('html') && !req.get('Accept')?.includes('text/event-stream')) {
    return res.redirect('/mcp/info');
  }
  res.setHeader('Allow', 'POST');
  return res.status(405).json({ jsonrpc: '2.0', id: null, error: { code: -32000, message: 'Use HTTP POST for the stateless MCP endpoint. Documentation: /mcp/info' } });
});

export default router;

// Support a path-based reverse proxy with either preserved or stripped /mcp.
export const canonicalConnector: RequestHandler = (req, res, next) => {
  if (req.hostname !== 'crypto.auraajenticai.cloud') return next();
  if (req.path === '/mcp' || req.path.startsWith('/mcp/')) {
    req.url = req.url.slice('/mcp'.length) || '/';
  }
  return router(req, res, next);
};
