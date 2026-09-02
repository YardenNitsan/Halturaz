// Admin-side Postgres connection, for schema and seed work only.
// Reads .env.admin from the repo root — that file is gitignored and holds the
// credentials that must never reach the browser bundle.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import pg from 'pg';

/* node-postgres turns a DATE into a JS Date at local midnight, which in any
   timezone east or west of UTC reads back as the day before or after. These
   are calendar days, not instants — keep them as the 'YYYY-MM-DD' strings the
   app and PostgREST both use. */
pg.types.setTypeParser(1082, (v) => v);

const here = dirname(fileURLToPath(import.meta.url));
export const ROOT = resolve(here, '..', '..');

export function adminEnv() {
  const env = {};
  try {
    for (const line of readFileSync(resolve(ROOT, '.env.admin'), 'utf8').split('\n')) {
      const m = line.match(/^([A-Z_]+)=(.*)$/);
      if (m) env[m[1]] = m[2];
    }
  } catch {
    throw new Error('.env.admin not found at the repo root — see app/.env.example');
  }
  if (!env.SUPABASE_DB_URL) throw new Error('SUPABASE_DB_URL missing from .env.admin');
  return env;
}

/** Run `fn` against the database, always closing the socket afterwards. */
export async function withDb(fn) {
  const client = new pg.Client({
    connectionString: adminEnv().SUPABASE_DB_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}
