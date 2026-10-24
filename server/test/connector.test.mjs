import assert from 'node:assert/strict';
import { once } from 'node:events';
import { request } from 'node:http';
import test from 'node:test';
import express from 'express';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import router, { canonicalConnector } from '../dist/routes/connector.js';

test('public connector supports discovery, isolated requests, safe paper trading and origin validation', { timeout: 15000 }, async (t) => {
  const nativeFetch = globalThis.fetch;
  const exchangeRequests = [];
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    if (url.startsWith('https://api.binance.com/')) {
      exchangeRequests.push({ url, method: init?.method || 'GET' });
      assert.match(url, /\/api\/v3\/ticker\/24hr\?symbol=BTCUSDT$/);
      return Response.json({ lastPrice: '100', priceChangePercent: '2', highPrice: '103', lowPrice: '95', volume: '200', quoteVolume: '20000' });
    }
    return nativeFetch(input, init);
  };
  t.after(() => { globalThis.fetch = nativeFetch; });
  const app = express();
  app.use(express.json({ limit: '1mb' }));
  app.use(canonicalConnector);
  app.use('/mcp', router);
  const http = app.listen(0, '127.0.0.1');
  await once(http, 'listening');
  const url = new URL(`http://127.0.0.1:${http.address().port}/mcp`);
  const clients = [];
  t.after(async () => {
    await Promise.all(clients.map(client => client.close()));
    await new Promise(resolve => http.close(resolve));
  });
  for (let i = 0; i < 2; i++) {
    const client = new Client({ name: 'connector-test', version: '1.0' });
    clients.push(client);
    await client.connect(new StreamableHTTPClientTransport(url));
  }
  const results = await Promise.all(clients.map(client => client.listTools()));
  for (const { tools } of results) {
    assert.equal(tools.length, 8);
    assert.ok(tools.some(tool => tool.name === 'crypto_simulate_trade'));
    assert.ok(!tools.some(tool => /autonomous|binance_account|trading_performance/.test(tool.name)));
    assert.ok(tools.every(tool => tool.annotations?.readOnlyHint === true));
  }
  const paper = async (side, exit) => {
    const result = await clients[0].callTool({ name: 'crypto_simulate_trade', arguments: {
      symbol: 'BTC', side, amountUsd: 10, leverage: 2, hypotheticalExitPrice: exit,
    } });
    assert.ok(!result.isError);
    const data = JSON.parse(result.content[0].text);
    assert.equal(data.mode, 'SIMULATION');
    assert.equal(data.exchangeOrderPlaced, false);
    assert.equal(data.persisted, false);
    assert.equal(data.quantity, 0.2);
    assert.equal(data.hypotheticalPnlUsd, 2);
    return data;
  };
  await paper('BUY', 110);
  await paper('SELL', 90);
  const signal = await clients[0].callTool({ name: 'crypto_get_trading_signals', arguments: { symbol: 'BTC' } });
  const signalData = JSON.parse(signal.content[0].text);
  assert.equal(signalData.calibratedProbability, null);
  assert.ok(!('confidence' in signalData));
  const swap = await clients[0].callTool({ name: 'crypto_calculate_dex_swap', arguments: { fromToken: 'USDT', toToken: 'BTC', amount: 10 } });
  const swapData = JSON.parse(swap.content[0].text);
  assert.equal(swapData.executable, false);
  assert.equal(swapData.estimatedGasUsd, null);
  assert.ok(!('uniswapDeepLink' in swapData));
  const invalid = await clients[0].callTool({ name: 'crypto_simulate_trade', arguments: { symbol: 'BTC', side: 'BUY', amountUsd: -1 } });
  assert.equal(invalid.isError, true);
  const hidden = await clients[0].callTool({ name: 'crypto_execute_autonomous_trade', arguments: { symbol: 'BTC', side: 'BUY', mode: 'LIVE_BINANCE' } });
  assert.equal(hidden.isError, true);
  assert.equal(exchangeRequests.length, 4);
  assert.ok(exchangeRequests.every(request => request.method === 'GET'));
  await clients[1].close();
  assert.equal((await clients[0].listTools()).tools.length, 8);
  const denied = await nativeFetch(url, { method: 'POST', headers: { Origin: 'https://untrusted.example', 'Content-Type': 'application/json' }, body: '{}' });
  assert.equal(denied.status, 403);
  const get = await nativeFetch(url, { headers: { Accept: 'text/event-stream' } });
  assert.equal(get.status, 405);
  const info = await nativeFetch(new URL('/mcp/info', url));
  assert.equal((await info.json()).endpoint, 'https://crypto.auraajenticai.cloud/mcp');
  for (const path of ['/mcp', '/']) {
    const routed = await new Promise((resolve, reject) => {
      const req = request(new URL(path, url), {
        method: 'POST', headers: { Host: 'crypto.auraajenticai.cloud', Accept: 'application/json, text/event-stream', 'Content-Type': 'application/json' },
      }, res => {
        let body = '';
        res.setEncoding('utf8');
        res.on('data', chunk => { body += chunk; });
        res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(body) }));
      });
      req.on('error', reject);
      req.end(JSON.stringify({ jsonrpc: '2.0', id: 99, method: 'tools/list' }));
    });
    assert.equal(routed.status, 200);
    assert.equal(routed.data.result.tools.length, 8);
  }
});
