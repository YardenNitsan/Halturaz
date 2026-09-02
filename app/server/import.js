import { detectKey } from '../src/lib/chords.js';
import { hasHebrew } from '../src/lib/text.js';
import { createLogger } from '../src/lib/logger.js';
import { importChords as importFromUG } from './ug.js';
import { importChords as importFromTab4u } from './tab4u.js';

const log = createLogger('import');

/* Not every chart prints its key — Tab4U prints none at all, and UG only
   carries one when the tab was tagged. Read it off the chords rather than
   guessing a default: a wrong C sends the whole band transposing. */
function withKey(chart, source) {
  const read = detectKey(chart.sections);
  if (!chart.key) {
    log.info('key read from the chords', { source, tabId: chart.tabId, key: read || '(none)' });
    return { ...chart, key: read, keyGuessed: Boolean(read), source };
  }
  /* Worth knowing when the two disagree: the site's key describes the record,
     the chords are what the band will actually play. */
  if (read && read !== chart.key) {
    log.warn('site key and chords disagree', { source, tabId: chart.tabId, site: chart.key, chords: read });
  }
  return { ...chart, source };
}

async function importHebrew(title, artist) {
  const attempts = artist ? [[title, artist], [title, '']] : [[title, '']];
  log.info('hebrew import attempts', { title, artist: artist || '(none)', attempts: attempts.length });

  let lastErr;
  for (const [t, a] of attempts) {
    log.debug('tab4u try', { title: t, artist: a || '(none)' });
    try {
      const chart = await importFromTab4u(t, a);
      log.info('tab4u hit', { title: t, artist: a || '(none)', tabId: chart.tabId });
      return chart;
    } catch (e) {
      log.warn('tab4u attempt failed', { title: t, artist: a || '(none)', error: e.message });
      lastErr = e;
    }
  }
  throw lastErr || new Error('no Hebrew chord tab found on Tab4U');
}

export async function importChords(title, artist = '') {
  const he = hasHebrew(title) || hasHebrew(artist);
  log.info('route', { title, artist: artist || '(none)', hebrew: he });

  if (he) {
    const chart = await importHebrew(title, artist);
    return withKey(chart, 'tab4u');
  }

  try {
    log.debug('trying ultimate-guitar');
    const chart = await importFromUG(title, artist);
    log.info('ug ok', { tabId: chart.tabId });
    return withKey(chart, 'ultimate-guitar');
  } catch (ugErr) {
    log.warn('ug failed, tab4u fallback', { error: ugErr.message });
    try {
      const chart = await importFromTab4u(title, artist);
      log.info('tab4u fallback ok', { tabId: chart.tabId });
      return withKey(chart, 'tab4u');
    } catch (tabErr) {
      log.error('all sources failed', { ug: ugErr.message, tab4u: tabErr.message });
      throw ugErr;
    }
  }
}
