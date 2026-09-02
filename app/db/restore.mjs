// Puts a db/backups/*.json dump back, in one transaction.
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { withDb } from './client.mjs';

// Parents before children; the truncate below runs in the reverse of this.
const TABLES = ['members', 'rooms', 'songs', 'events', 'event_songs', 'attendance'];
const here = dirname(fileURLToPath(import.meta.url));
const file = resolve(here, 'backups', process.argv[2] || 'pre-test-backup.json');
const dump = JSON.parse(readFileSync(file, 'utf8'));

await withDb(async (db) => {
  await db.query('begin');
  try {
    await db.query(`truncate ${TABLES.join(', ')} cascade`);
    for (const t of TABLES) {
      for (const row of dump[t]) {
        const cols = Object.keys(row);
        const vals = cols.map((c) => (row[c] !== null && typeof row[c] === 'object' ? JSON.stringify(row[c]) : row[c]));
        await db.query(
          `insert into ${t} (${cols.map((c) => `"${c}"`).join(',')})
           values (${cols.map((_, i) => `$${i + 1}`).join(',')})`,
          vals
        );
      }
    }
    await db.query('commit');
  } catch (e) {
    await db.query('rollback');
    throw e;
  }
  console.log(`restored ${file}`);
  for (const t of TABLES) {
    const { rows } = await db.query(`select count(*)::int c from ${t}`);
    const same = rows[0].c === dump[t].length;
    console.log(`  ${same ? 'ok  ' : 'FAIL'} ${t.padEnd(12)} ${rows[0].c}/${dump[t].length}`);
  }
});
