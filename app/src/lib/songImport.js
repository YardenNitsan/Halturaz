import { hasHebrew, titleMatch } from './text.js';
import { createLogger } from './logger.js';

const log = createLogger('client-import');

/** Client helpers for the song-import POC. */

/** iTunes serves the same cover at any square size — ask for the one we draw. */
export function artworkAt(url, px) {
  return typeof url === 'string' && url ? url.replace(/\/\d+x\d+bb/, `/${px}x${px}bb`) : null;
}

function rankHits(query, rows) {
  const qHe = hasHebrew(query);
  return rows
    .map((r, i) => ({
      r,
      i,
      score:
        (titleMatch(query, r.title) ? 10 : hasHebrew(r.title) && qHe ? 2 : 0) +
        (textOverlap(query, r.title) ? 1 : 0)
    }))
    .sort((a, b) => b.score - a.score || a.i - b.i)
    .map((x) => x.r);
}

function textOverlap(a, b) {
  const x = a.trim().toLowerCase();
  const y = b.trim().toLowerCase();
  return x && y && (x.includes(y) || y.includes(x));
}

export async function searchSongs(query, { locale, limit = 8 } = {}) {
  const q = query.trim();
  if (!q) return [];
  const params = new URLSearchParams({
    term: q,
    entity: 'song',
    limit: String(limit)
  });
  if (locale === 'he' || hasHebrew(q)) params.set('country', 'IL');

  log.info('itunes search', { q, locale, country: params.get('country') || 'default' });
  const done = log.time('itunes');

  const res = await fetch(`https://itunes.apple.com/search?${params}`);
  if (!res.ok) {
    log.error('itunes failed', { status: res.status });
    throw new Error('itunes search failed');
  }
  const data = await res.json();
  const rows = (data.results || []).map((r) => ({
    title: r.trackName,
    artist: r.artistName,
    sec: Math.max(1, Math.round((r.trackTimeMillis || 180000) / 1000)),
    artwork: r.artworkUrl100 || null,
    album: r.collectionName || ''
  }));
  const ranked = rankHits(q, rows).slice(0, limit);
  done('itunes results', {
    raw: rows.length,
    returned: ranked.length,
    hits: ranked.map((r) => ({ title: r.title, artist: r.artist }))
  });
  return ranked;
}

/** @deprecated use searchSongs */
export const searchItunes = searchSongs;

export async function importChart(title, artist) {
  const base = import.meta.env?.BASE_URL || '/';
  const url = `${base}api/songs/import?${new URLSearchParams({ title, artist: artist || '' })}`;
  log.info('chart import request', { title, artist: artist || '(none)', url });
  const done = log.time('chart');

  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    log.error('chart import failed', { status: res.status, error: data.error });
    throw new Error(data.error || 'import failed');
  }
  done('chart import ok', {
    source: data.source,
    tabId: data.tabId,
    key: data.key,
    capo: data.capo,
    sections: data.sections?.length
  });
  return data;
}
