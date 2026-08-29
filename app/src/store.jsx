import React, { createContext, useContext, useReducer, useEffect, useRef, useCallback } from 'react';
import { EVENTS, SONGS, TODAY } from './data.js';

const KEY = 'static-bloom.v1';
const StoreCtx = createContext(null);

const initial = () => ({ events: EVENTS, songs: SONGS, toast: null });

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return initial();
    const saved = JSON.parse(raw);
    // Songs (with their charts) stay code-owned; only scheduling state is restored.
    return { events: saved.events || EVENTS, songs: SONGS, toast: null };
  } catch {
    return initial();
  }
}

export function reducer(state, action) {
  switch (action.type) {
    case 'create-rehearsal': {
      const { date, time, place, note, kind } = action;
      if (state.events[date]) return state;
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

    case 'toggle-done': {
      const ev = state.events[action.date];
      if (!ev) return state;
      const done = ev.done.includes(action.songId)
        ? ev.done.filter((id) => id !== action.songId)
        : [...ev.done, action.songId];
      return { ...state, events: { ...state.events, [action.date]: { ...ev, done } } };
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

    case 'restore':
      return { ...state, events: action.events };

    case 'toast':
      return { ...state, toast: action.toast };

    case 'reset':
      return { ...initial() };

    default:
      return state;
  }
}

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, load);
  const timer = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ events: state.events }));
    } catch {
      /* private mode — the session still works, it just won't persist */
    }
  }, [state.events]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const toast = useCallback((message, undo) => {
    clearTimeout(timer.current);
    dispatch({ type: 'toast', toast: { message, undo, id: Date.now() } });
    timer.current = setTimeout(() => dispatch({ type: 'toast', toast: null }), 4500);
  }, []);

  const dismissToast = useCallback(() => {
    clearTimeout(timer.current);
    dispatch({ type: 'toast', toast: null });
  }, []);

  return (
    <StoreCtx.Provider value={{ ...state, dispatch, toast, dismissToast, today: TODAY }}>
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
