import React, { createContext, useContext, useReducer, useEffect, useRef, useCallback } from 'react';
import { EVENTS, SONGS, TODAY } from './data.js';
import { DEFAULT_LOCALE } from './i18n/constants.js';
import { applyDocumentLocale } from './i18n/translate.js';
import { DEFAULT_THEME, applyDocumentTheme } from './theme.js';

const KEY = 'static-bloom.v1';
const StoreCtx = createContext(null);

const initial = (locale = DEFAULT_LOCALE, theme = DEFAULT_THEME) => ({
  events: EVENTS,
  songs: SONGS,
  toast: null,
  locale,
  theme
});

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
      .map((s) => ({ ...s, sections: [], custom: true }));
    return {
      events: saved.events && typeof saved.events === 'object' ? saved.events : EVENTS,
      songs: SONGS.concat(custom),
      toast: null,
      locale,
      theme
    };
  } catch {
    return initial(initialLocale || DEFAULT_LOCALE);
  }
}

export function reducer(state, action) {
  switch (action.type) {
    case 'create-rehearsal': {
      const { date, time, place, note, kind } = action;
      if (!date || state.events[date]) return state;
      return {
        ...state,
        events: { ...state.events, [date]: { kind: kind || 'r', time, place, note: note || '', songs: [], done: [] } }
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
      if (!isSong(action.song) || state.songs.some((s) => s.id === action.song.id)) return state;
      return { ...state, songs: [...state.songs, { ...action.song, sections: [], custom: true }] };
    }

    /** Only songs the band added here can be deleted — code-owned ones stay. */
    case 'remove-from-library': {
      const song = state.songs.find((s) => s.id === action.songId);
      if (!song || !song.custom) return state;
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

    case 'restore':
      return {
        ...state,
        events: action.events || state.events,
        songs: action.songs || state.songs
      };

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
      localStorage.setItem(
        KEY,
        JSON.stringify({
          events: state.events,
          custom: state.songs.filter((s) => s.custom),
          locale: state.locale,
          theme: state.theme
        })
      );
    } catch {
      /* private mode — the session still works, it just won't persist */
    }
  }, [state.events, state.songs, state.locale, state.theme]);

  useEffect(() => () => clearTimeout(timer.current), []);

  // Named `notify`, not `toast`: the context also carries the toast *state*.
  const notify = useCallback((message, undo) => {
    clearTimeout(timer.current);
    dispatch({ type: 'toast', toast: { message, undo, id: Date.now() } });
    timer.current = setTimeout(() => dispatch({ type: 'toast', toast: null }), 4500);
  }, []);

  const dismissToast = useCallback(() => {
    clearTimeout(timer.current);
    dispatch({ type: 'toast', toast: null });
  }, []);

  return (
    <StoreCtx.Provider value={{ ...state, dispatch, notify, dismissToast, today: TODAY }}>
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

/** Sorted [date, event] pairs. */
export function useEventList() {
  const { events } = useStore();
  return Object.entries(events).sort((a, b) => a[0].localeCompare(b[0]));
}
