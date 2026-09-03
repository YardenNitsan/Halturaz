// The chart importer, as it runs away from a Node process.
//
// GitHub Pages serves files and nothing else, so the browser cannot be the one
// to read Tab4U: the site sends no `Access-Control-Allow-Origin`, and the
// scrape needs a User-Agent and an Accept-Language the browser will not let
// page code set. This handler is that hop — the same `importChords` the dev
// middleware calls, wrapped in web Request/Response so a Supabase Edge
// Function can host it.
import { importChords } from './import.js';
import { createLogger } from '../src/lib/logger.js';

const log = createLogger('edge');

/* The published site and the dev server are different origins from the
   function's point of view, and neither is worth pinning down here: the
   answer is a public chord chart either way. */
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Max-Age': '86400'
};

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8' }
  });
}

/** One request in, one Response out. The only route is the import itself. */
export async function handleRequest(request) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (request.method !== 'GET') {
    log.warn('method not allowed', { method: request.method });
    return json(405, { error: 'method not allowed' });
  }

  const url = new URL(request.url);
  const title = (url.searchParams.get('title') || '').trim();
  const artist = (url.searchParams.get('artist') || '').trim();

  if (!title) {
    log.warn('import missing title');
    return json(400, { error: 'title required' });
  }

  const done = log.time('import');
  log.info('import request', { title, artist: artist || '(none)' });

  try {
    const chart = await importChords(title, artist);
    done('import ok', { source: chart.source, tabId: chart.tabId, sections: chart.sections?.length });
    return json(200, {
      title,
      artist: artist || 'Unknown',
      key: chart.key,
      keyGuessed: chart.keyGuessed || false,
      capo: chart.capo || 0,
      bpm: chart.bpm || 100,
      sections: chart.sections,
      source: chart.source,
      sourceUrl: chart.sourceUrl,
      tabId: chart.tabId
    });
  } catch (e) {
    log.error('import failed', { title, artist, error: e.message });
    return json(502, { error: e.message || 'import failed' });
  }
}
