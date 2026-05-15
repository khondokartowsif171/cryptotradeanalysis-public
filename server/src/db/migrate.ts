import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { query } from './pool.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function migrate() {
  const sql = readFileSync(join(__dirname, '../../migrations/001_init.sql'), 'utf-8');
  const statements = sql.split(';').filter((s) => s.trim().length > 0);
  for (const stmt of statements) {
    try {
      await query(stmt);
      console.log('✓ migrated:', stmt.slice(0, 60));
    } catch (err: any) {
      if (err.code === '42P07') {
        console.log('→ already exists:', stmt.slice(0, 40));
      } else {
        throw err;
      }
    }
  }
  console.log('Migration complete');
  process.exit(0);
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
