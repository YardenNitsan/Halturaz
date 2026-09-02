/* A chord landing anywhere inside a word is sung from that word's first
   letter, so snap back to the space before it (kept, so the fragment carries
   its own gap). A chord landing in the gap between words is left exactly where
   the chart put it — the spacing is preserved either way, and in a long
   instrumental gap that column is the timing. */
function snapToWord(text, index) {
  if (index <= 0 || index >= text.length || text[index] === ' ') return index;
  const before = text.lastIndexOf(' ', index);
  return before === -1 ? 0 : before;
}

/**
 * Split lyrics under chord column starts.
 *
 * `rescale` stretches the chord columns onto the lyric's length, which helps
 * when the two rows were not typed on one grid. Sources that do share a
 * monospace grid (a column is a character) pass false and keep it exact.
 */
export function alignByColumns(chords, chordLen, lyric, { rescale = true } = {}) {
  if (!chords.length) return lyric.trim() ? [{ t: lyric }] : null;
  if (!lyric.trim()) return chords.map(({ c }) => ({ c }));

  const len = Math.max(chordLen, 1);
  const column = (start) => (rescale ? Math.round((start / len) * lyric.length) : start);

  const bounds = [];
  for (const { start } of chords) {
    const raw = column(start);
    const at = snapToWord(lyric, raw);
    const prev = bounds[bounds.length - 1];
    /* Two chords inside one word both snap to its first letter, which would
       leave the earlier one with no lyric at all. Keep that one where it
       really falls and let the word break at the change, like the chart does. */
    const collapsed = bounds.length > 0 && at <= prev;
    bounds.push(collapsed ? Math.min(Math.max(raw, prev + 1), lyric.length) : at);
  }
  bounds.push(lyric.length);

  const segs = chords.map(({ c }, i) => {
    const text = lyric.slice(bounds[i], bounds[i + 1]);
    return text ? { c, t: text } : { c };
  });

  /* Words sung before the first chord belong to no chord — giving them to it
     would print that chord a word early. */
  const lead = lyric.slice(0, bounds[0]);
  return lead ? [{ t: lead }, ...segs] : segs;
}
