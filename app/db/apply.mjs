// Applies db/schema.sql. Idempotent — safe to re-run after editing the schema.
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { withDb } from './client.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(resolve(here, 'schema.sql'), 'utf8');

await withDb(async (db) => {
  await db.query(sql);
  const { rows } = await db.query(
    `select table_name,
            (select count(*) from information_schema.columns c
              where c.table_schema = 'public' and c.table_name = t.table_name)::int as cols
       from information_schema.tables t
      where table_schema = 'public' order by table_name`
  );
  console.log('applied. public schema now holds:');
  for (const r of rows) console.log(`  ${r.table_name.padEnd(14)} ${r.cols} columns`);
});
