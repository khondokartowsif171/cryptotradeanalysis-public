import { readFileSync } from 'node:fs';
import pool, { query } from '../db/pool.js';
import type { Database } from './store.js';
export const database: Database = {
  query,
  async transaction(work) {
    const client = await pool.connect();
    try { await client.query('BEGIN'); const result = await work((text, params) => client.query(text, params)); await client.query('COMMIT'); return result; }
    catch (error) { await client.query('ROLLBACK'); throw error; }
    finally { client.release(); }
  },
};
export async function ensureBillingSchema() {
  const sql = readFileSync(new URL('../../migrations/002_verified_billing.sql', import.meta.url), 'utf8');
  await database.transaction(async query => { await query(sql); });
}
