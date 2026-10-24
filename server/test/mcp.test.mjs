import assert from 'node:assert/strict';
import { once } from 'node:events';
import test from 'node:test';
import express from 'express';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { generateToken } from '../dist/middleware/auth.js';
import router from '../dist/routes/mcp.js';

test('MCP works with parsed JSON and isolates simultaneous SSE clients', { timeout: 15000 }, async (t) => {
  const admin = '00000000-0000-4000-8000-000000000001';
  const previous = process.env.ADMIN_USER_IDS;
  process.env.ADMIN_USER_IDS = admin;
  t.after(() => { if (previous === undefined) delete process.env.ADMIN_USER_IDS; else process.env.ADMIN_USER_IDS=previous; });
  const session = generateToken({userId:admin,email:'operator@example.test'});
  const app = express();
  app.use((req,_res,next) => { if (req.query.public !== '1') req.headers.authorization='Bearer '+session; next(); });
  // Match production middleware: the SDK must not read this stream again.
  app.use(express.json({ limit: '1mb' }));
  app.use('/mcp', router);
  const http = app.listen(0, '127.0.0.1');
  await once(http, 'listening');
  const url = new URL(`http://127.0.0.1:${http.address().port}/mcp`);
  const clients = [];
  t.after(async () => {
    await Promise.all(clients.map((client) => client.close()));
    await new Promise((resolve) => http.close(resolve));
  });
  async function connect() {
    const client = new Client({ name: 'mcp-regression-test', version: '1.0.0' });
    clients.push(client);
    await client.connect(new SSEClientTransport(url));
    assert.equal(client.getServerVersion().name, 'aura-cryptox-mcp');
    return client;
  }
  async function check(client) {
    const { tools } = await client.listTools();
    assert.equal(tools.length, 12);
    assert.ok(tools.some(({ name }) => name === 'crypto_get_token_metadata'));
    // Static public metadata needs no database, network, wallet, or trade.
    const result = await client.callTool({ name: 'crypto_get_token_metadata', arguments: { symbol: 'BTC' } });
    assert.ok(!result.isError);
    assert.match(result.content[0].text, /bitcoin\.org/);
  }
  const unauthorized = await fetch(new URL('/mcp?public=1',url),{headers:{Accept:'text/event-stream'}});
  assert.equal(unauthorized.status,401);
  const first = await connect();
  await check(first);
  const second = await connect();
  await Promise.all([check(first), check(second)]);
  await second.close();
  await check(first);
  const missing = await fetch(new URL('/mcp/messages?sessionId=missing', url), {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
  });
  assert.equal(missing.status, 404);
});
