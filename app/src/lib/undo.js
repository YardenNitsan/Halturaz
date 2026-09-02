/** Deep-copy undo payloads so later state updates cannot mutate them. */
export function freezeUndo(undo) {
  if (!undo) return undefined;
  const out = {};
  if (undo.events !== undefined) out.events = structuredClone(undo.events);
  if (undo.songs !== undefined) out.songs = structuredClone(undo.songs);
  return Object.keys(out).length ? out : undefined;
}
