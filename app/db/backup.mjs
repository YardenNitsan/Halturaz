// Dumps every table to a timestamped JSON file under db/backups/.
// Run before anything destructive; db/restore.mjs puts it back.
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { withDb } from './client.mjs';

const TABLES = ['members', 'rooms', 'songs', 'events', 'event_songs', 'attendance'];
const here = dirname(fileURLToPath(import.meta.url));
const dir = resolve(here, 'backups');
mkdirSync(dir, { recursive: true });

const out = await withDb(async (db) => {
  const dump = {};
  for (const t of TABLES) dump[t] = (await db.query(`select * from ${t}`)).rows;
  return dump;
});

const name = process.argv[2] || `backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
const path = resolve(dir, name);
writeFileSync(path, JSON.stringify(out, null, 1));
console.log(`wrote ${path}`);
for (const t of TABLES) console.log(`  ${t.padEnd(12)} ${out[t].length}`);
