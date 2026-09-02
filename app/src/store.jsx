import React, { createContext, useContext, useReducer, useEffect, useRef, useCallback, useMemo } from 'react';
import { EVENTS, SONGS, TODAY, ROOMS } from './data.js';
import { isDeletableSong } from './lib/songs.js';
import { freezeUndo } from './lib/undo.js';
import { createLogger } from './lib/logger.js';

const log = createLogger('store');

const TOAST_MS = 5000;
const TOAST_UNDO_MS = 12000;
import { DEFAULT_LOCALE } from './i18n/constants.js';
import { applyDocumentLocale } from './i18n/translate.js';
import { DEFAULT_THEME, applyDocumentTheme } from './theme.js';

const KEY = 'static-bloom.v1';
const StoreCtx = createContext(null);

const initial = (locale = DEFAULT_LOCALE, theme = DEFAULT_THEME) => ({
  events: EVENTS,
  songs: SONGS,
  rooms: [],
  toast: null,
  locale,
  theme
});

/** A room the band typed in. Trimmed, and only if it isn't already on the list. */
const isNewRoom = (name, rooms) => {
  const v = String(name || '').trim();
  if (!v) return false;
  return !ROOMS.concat(rooms).some((r) => r.toLowerCase() === v.toLowerCase());
};

/** Enough of a chart to draw without printing `undefined` over a lyric. */
const isSections = (v) =>
  Array.isArray(v) &&
  v.every(
    (sec) =>
      !!sec &&
      typeof sec.label === 'string' &&
      Array.isArray(sec.lines) &&
      sec.lines.every(
        (line) =>
          Array.isArray(line) &&
          line.every((seg) => !!seg && (typeof seg.c === 'string' || typeof seg.t === 'string'))
      )
  );

/** Enough of a song to render a row without printing NaN at anyone. */
const isSong = (s) =>
  !!s &&
  typeof s.id === 'string' &&
  typeof s.title === 'string' &&
  typeof s.artist === 'string' &&
  typeof s.key === 'string' &&
  Number.isFinite(s.sec) &&
  Number.isFinite(s.bpm);

function load(initialLocale) {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return initial(initialLocale || DEFAULT_LOCALE);
    const saved = JSON.parse(raw);
    const locale = initialLocale || (saved.locale === 'en' ? 'en' : DEFAULT_LOCALE);
    const theme = saved.theme === 'light' ? 'light' : DEFAULT_THEME;
    // Charts stay code-owned; scheduling state and songs the band added are restored.
    const custom = (Array.isArray(saved.custom) ? saved.custom : [])
      .filter(isSong)
      .filter((s) => !SONGS.some((o) => o.id === s.id))
      .map((s) => ({
        ...s,
        sections: Array.isArray(s.sections) ? s.sections : [],
        custom: true
      }));
    /* Charts are code-owned, but a chart the band has re-aligned is theirs —
       keep the edit and lay it back over the shipped song on the next load. */
    const charts = saved.charts && typeof saved.charts === 'object' ? saved.charts : {};
    // Rooms the band added themselves; the three shipped ones always stay.
    const rooms = (Array.isArray(saved.rooms) ? saved.rooms : [])
      .map((r) => String(r).trim())
      .filter((r, i, all) => r && all.indexOf(r) === i && !ROOMS.includes(r));
    const edited = SONGS.map((s) =>
      isSections(charts[s.id]) ? { ...s, sections: charts[s.id], chartEdited: true } : s
    );
    log.info('loaded from localStorage', {
      custom: custom.length,
      titles: custom.map((s) => s.title),
      charts: edited.filter((s) => s.chartEdited).length
    });
    return {
      events: saved.events && typeof saved.events === 'object' ? saved.events : EVENTS,
      songs: edited.concat(custom),
      rooms,
      toast: null,
      locale,
      theme
    };
  } catch (e) {
    log.warn('load failed, using defaults', { error: e.message });
    return initial(initialLocale || DEFAULT_LOCALE);
  }
}

export function reducer(state, action) {
  switch (action.type) {
    case 'create-rehearsal': {
      const { date, time, end, place, kind } = action;
      if (!date || state.events[date]) return state;
      return {
        ...state,
        events: {
          ...state.events,
          [date]: { kind: kind || 'r', time, end: end || '', place, songs: [], done: [] }
        }
      };
    }

    case 'delete-rehearsal': {
      const events = { ...state.events };
      delete events[action.date];
      return { ...state, events };
    }

    case 'update-rehearsal': {
      const ev = state.events[action.date];
      if (!ev) return state;
      return { ...state, events: { ...state.events, [action.date]: { ...ev, ...action.patch } } };
    }

    /* The list of rooms is the band's, not the app's — anywhere they play
       once is somewhere they can book again. */
    case 'add-room': {
      if (!isNewRoom(action.name, state.rooms)) return state;
      return { ...state, rooms: [...state.rooms, String(action.name).trim()] };
    }

    case 'set-attendance': {
      const ev = state.events[action.date];
      if (!ev) return state;
      const att = { ...(ev.att || {}) };
      if (action.status) att[action.member] = action.status;
      else delete att[action.member];
      return { ...state, events: { ...state.events, [action.date]: { ...ev, att } } };
    }

    case 'add-song': {
      const ev = state.events[action.date];
      if (!ev || ev.songs.includes(action.songId)) return state;
      return {
        ...state,
        events: { ...state.events, [action.date]: { ...ev, songs: [...ev.songs, action.songId] } }
      };
    }

    case 'remove-song': {
      const ev = state.events[action.date];
      if (!ev) return state;
      return {
        ...state,
        events: {
          ...state.events,
          [action.date]: {
            ...ev,
            songs: ev.songs.filter((id) => id !== action.songId),
            done: ev.done.filter((id) => id !== action.songId)
          }
        }
      };
    }

    /** Move `from` so it lands in the slot the drop indicator points at. */
    case 'reorder': {
      const ev = state.events[action.date];
      if (!ev) return state;
      const { from, to } = action;
      if (from === to) return state;
      const songs = ev.songs.slice();
      const [moved] = songs.splice(from, 1);
      songs.splice(from < to ? to - 1 : to, 0, moved);
      return { ...state, events: { ...state.events, [action.date]: { ...ev, songs } } };
    }

    case 'add-to-library': {
      if (!isSong(action.song)) {
        log.warn('add-to-library rejected: invalid song', action.song);
        return state;
      }
      if (state.songs.some((s) => s.id === action.song.id)) {
        log.warn('add-to-library rejected: duplicate id', { id: action.song.id });
        return state;
      }
      const sections = Array.isArray(action.song.sections) ? action.song.sections : [];
      log.info('add-to-library', {
        id: action.song.id,
        title: action.song.title,
        artist: action.song.artist,
        sections: sections.length,
        source: action.song.importSource
      });
      return {
        ...state,
        songs: [...state.songs, { ...action.song, sections, custom: true, needsWork: action.song.needsWork ?? !sections.length }]
      };
    }

    /** Only songs the band added here can be deleted — code-owned ones stay. */
    case 'remove-from-library': {
      const song = state.songs.find((s) => s.id === action.songId);
      if (!isDeletableSong(song)) {
        log.warn('remove-from-library rejected', { songId: action.songId, found: !!song });
        return state;
      }
      log.info('remove-from-library', { id: song.id, title: song.title, artist: song.artist });
      const events = {};
      for (const [date, ev] of Object.entries(state.events)) {
        events[date] = ev.songs.includes(action.songId)
          ? {
              ...ev,
              songs: ev.songs.filter((id) => id !== action.songId),
              done: ev.done.filter((id) => id !== action.songId)
            }
          : ev;
      }
      return { ...state, songs: state.songs.filter((s) => s.id !== action.songId), events };
    }

    /* Only the chord anchors move — the words, the sections and the bar counts
       are the ones the chart was written with. */
    case 'edit-chart': {
      if (!isSections(action.sections)) {
        log.warn('edit-chart rejected: invalid sections', { songId: action.songId });
        return state;
      }
      if (!state.songs.some((s) => s.id === action.songId)) {
        log.warn('edit-chart rejected: unknown song', { songId: action.songId });
        return state;
      }
      log.info('edit-chart', { id: action.songId, sections: action.sections.length });
      return {
        ...state,
        songs: state.songs.map((s) =>
          s.id === action.songId ? { ...s, sections: action.sections, chartEdited: true } : s
        )
      };
    }

    case 'restore': {
      const nextEvents = action.events ?? state.events;
      const nextSongs = (action.songs ?? state.songs).map((s) =>
        isDeletableSong(s) ? { ...s, custom: true } : s
      );
      log.info('restore undo', {
        songs: nextSongs.length,
        custom: nextSongs.filter((s) => s.custom).length,
        hadEvents: !!action.events
      });
      return { ...state, events: nextEvents, songs: nextSongs };
    }

    case 'toast':
      return { ...state, toast: action.toast };

    case 'set-locale':
      return action.locale === 'en' || action.locale === 'he'
        ? { ...state, locale: action.locale }
        : state;

    case 'set-theme':
      return action.theme === 'light' || action.theme === 'dark'
        ? { ...state, theme: action.theme }
        : state;

    case 'reset':
      return { ...initial(state.locale, state.theme) };

    default:
      return state;
  }
}

export function StoreProvider({ children, initialLocale }) {
  const [state, dispatch] = useReducer(reducer, initialLocale, load);
  const timer = useRef(null);

  useEffect(() => {
    applyDocumentLocale(state.locale);
  }, [state.locale]);

  useEffect(() => {
    applyDocumentTheme(state.theme);
  }, [state.theme]);

  useEffect(() => {
    try {
      const custom = state.songs.filter((s) => isDeletableSong(s));
      // A custom song carries its own chart; a shipped one only needs the diff.
      const charts = {};
      for (const s of state.songs) {
        if (s.chartEdited && !isDeletableSong(s)) charts[s.id] = s.sections;
      }
      localStorage.setItem(
        KEY,
        JSON.stringify({
          events: state.events,
          custom,
          charts,
          rooms: state.rooms,
          locale: state.locale,
          theme: state.theme
        })
      );
      log.debug('persisted', {
        custom: custom.length,
        charts: Object.keys(charts).length,
        total: state.songs.length
      });
    } catch {
      /* private mode — the session still works, it just won't persist */
    }
  }, [state.events, state.songs, state.rooms, state.locale, state.theme]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const toastRef = useRef(null);

  // Named `notify`, not `toast`: the context also carries the toast *state*.
  const armToastTimer = useCallback((ms) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => dispatch({ type: 'toast', toast: null }), ms);
  }, []);

  const notify = useCallback((message, undo) => {
    const frozen = freezeUndo(undo);
    const payload = { message, undo: frozen, id: Date.now() };
    toastRef.current = payload;
    dispatch({ type: 'toast', toast: payload });
    armToastTimer(frozen ? TOAST_UNDO_MS : TOAST_MS);
  }, [armToastTimer]);

  const dismissToast = useCallback(() => {
    clearTimeout(timer.current);
    toastRef.current = null;
    dispatch({ type: 'toast', toast: null });
  }, []);

  const holdToast = useCallback(() => clearTimeout(timer.current), []);

  const releaseToast = useCallback(() => {
    if (!toastRef.current) return;
    armToastTimer(toastRef.current.undo ? TOAST_UNDO_MS : TOAST_MS);
  }, [armToastTimer]);

  useEffect(() => {
    toastRef.current = state.toast;
  }, [state.toast]);

  return (
    <StoreCtx.Provider value={{ ...state, dispatch, notify, dismissToast, holdToast, releaseToast, today: TODAY }}>
      {children}
    </StoreCtx.Provider>
  );
}

export const useStore = () => {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>');
  return ctx;
};

export function useSong(id) {
  const { songs } = useStore();
  return songs.find((s) => s.id === id) || null;
}

/** The three shipped rooms, then whatever the band added. */
export function useRooms() {
  const { rooms } = useStore();
  return useMemo(() => ROOMS.concat(rooms), [rooms]);
}

/** Sorted [date, event] pairs. */
export function useEventList() {
  const { events } = useStore();
  return Object.entries(events).sort((a, b) => a[0].localeCompare(b[0]));
}
