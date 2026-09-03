// Runs the deployable bundle — supabase/functions/import/index.ts — the way
// the edge runtime will: hand it a Request, read the Response. Node 20+ has
// every web API the bundle touches, so the only thing to stand in for is
// Deno.serve, which we use to catch the handler the entry registers.
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const bundle = resolve(here, '../supabase/functions/import/index.ts');
if (!existsSync(bundle)) throw new Error('bundle missing — run `npm run fn:build` first');

let handler = null;
globalThis.Deno = { serve: (h) => { handler = h; }, env: { get: () => undefined } };
await import(pathToFileURL(bundle).href + '?ext=.mjs');
if (typeof handler !== 'function') throw new Error('the bundle never called Deno.serve');

let failed = 0;
function ok(label, got, want) {
  const good = want === undefined ? Boolean(got) : JSON.stringify(got) === JSON.stringify(want);
  if (!good) failed++;
  console.log(`${good ? 'ok  ' : 'FAIL'} ${label} = ${JSON.stringify(got)}`);
}

const call = (path) => handler(new Request(`https://fn.local${path}`));

/* The shape of the contract, before any network is touched. */
const pre = await call('/?title=');
ok('no title → 400', pre.status, 400);
ok('CORS on the error too', pre.headers.get('access-control-allow-origin'), '*');

const preflight = await handler(new Request('https://fn.local/', { method: 'OPTIONS' }));
ok('preflight → 204', preflight.status, 204);
ok('preflight allows GET', preflight.headers.get('access-control-allow-methods'), 'GET, OPTIONS');

const post = await handler(new Request('https://fn.local/', { method: 'POST' }));
ok('POST → 405', post.status, 405);

/* And then the real thing, against the live sites the scrapers read. */
for (const [title, artist] of [['הכל דבש', 'משינה'], ['Wonderwall', 'Oasis']]) {
  const res = await call(`/?${new URLSearchParams({ title, artist })}`);
  const body = await res.json();
  ok(`${title} → 200`, res.status, 200);
  ok(`${title} source`, body.source);
  ok(`${title} sections`, body.sections?.length > 0);
  ok(`${title} has chords`, body.sections?.some((s) => s.lines?.some((l) => l.some((c) => c.c))));
  console.log(`     ↳ ${body.source} · key ${body.key} · ${body.sections?.length} sections`);
}

console.log(failed ? `\n${failed} check(s) failed` : '\nthe deployable bundle answers');
process.exit(failed ? 1 : 0);
