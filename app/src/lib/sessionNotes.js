/* Auto-open a band note once per tab session. sessionStorage survives a
 * refresh and dies when the tab does, which is the line between "still here"
 * and "came back later". */

const PREFIX = 'halturaz:note-auto:';
/* React Strict Mode remounts in the same tick. Treat a second consume of the
 * same key within this window as the same visit, not a later one. */
const STRICT_REMOUNT_MS = 100;
const lastConsumeAt = new Map();

function storageKey(kind, id) {
  return `${PREFIX}${kind}:${id}`;
}

export function consumeNoteAutoShow(kind, id) {
  if (!id) return false;
  const k = storageKey(kind, id);
  const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const last = lastConsumeAt.get(k);
  if (last != null && now - last < STRICT_REMOUNT_MS) return true;

  try {
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(k) === '1') return false;
    if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(k, '1');
  } catch {
    /* private mode — the session still works, it just won't persist */
  }

  lastConsumeAt.set(k, now);
  return true;
}
