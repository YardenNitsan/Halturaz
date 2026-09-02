import { importChords } from './import.js';
import { createLogger } from '../src/lib/logger.js';

const log = createLogger('api');

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function readQuery(req) {
  const url = new URL(req.url, 'http://localhost');
  return Object.fromEntries(url.searchParams.entries());
}

async function handle(req, res) {
  if (req.method !== 'GET') {
    log.warn('method not allowed', { method: req.method, url: req.url });
    json(res, 405, { error: 'method not allowed' });
    return;
  }

  const path = req.url.split('?')[0];

  if (path === '/api/songs/import') {
    const { title, artist = '' } = readQuery(req);
    if (!title?.trim()) {
      log.warn('import missing title');
      json(res, 400, { error: 'title required' });
      return;
    }

    const done = log.time('import');
    log.info('import request', { title: title.trim(), artist: artist.trim() || '(none)' });

    try {
      const chart = await importChords(title.trim(), artist.trim());
      done('import ok', {
        source: chart.source,
        tabId: chart.tabId,
        key: chart.key,
        capo: chart.capo || 0,
        sections: chart.sections?.length,
        lines: chart.sections?.reduce((n, s) => n + (s.lines?.length || 0), 0)
      });
      json(res, 200, {
        title: title.trim(),
        artist: artist.trim() || 'Unknown',
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
      log.error('import failed', { title: title.trim(), artist: artist.trim(), error: e.message });
      throw e;
    }
    return;
  }

  log.warn('not found', { path });
  json(res, 404, { error: 'not found' });
}

export function createApiMiddleware() {
  return (req, res, next) => {
    if (!req.url?.startsWith('/api/')) {
      next();
      return;
    }

    handle(req, res).catch((e) => {
      json(res, 502, { error: e.message || 'import failed' });
    });
  };
}
