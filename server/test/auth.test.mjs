import assert from 'node:assert/strict';
import { once } from 'node:events';
import test from 'node:test';
import express from 'express';
import authRouter from '../dist/routes/auth.js';

test('malformed password sign-in and registration return validation errors before database access', async (t) => {
  const app = express();
  app.use(express.json({ limit: '1mb' }));
  app.use('/auth', authRouter);
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise(resolve => server.close(resolve)));
  for (const path of ['/auth/register', '/auth/login']) {
    const response = await fetch(`http://127.0.0.1:${server.address().port}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'invalid-email', password: 12 }),
    });
    assert.equal(response.status, 400);
    const body = await response.json();
    assert.equal(typeof body.error, 'string');
    assert.ok(body.error.length > 0);
  }
});
