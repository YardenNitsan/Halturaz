/* A chart line is stored as the fragments the chords cut it into — a chord and
   the words sung under it. That shape is right for printing and wrong for
   moving: nudging one chord one letter means rewriting two fragments.

   So editing reads a line back into the thing it really is — one lyric, and a
   list of chords each anchored at a character of it — moves an anchor, and
   writes the fragments out again. The words never change; only where a chord
   sits over them. */

/** Fragments → { text, chords: [{ c, at }] }, `at` being an index into text. */
export function readLine(line) {
  let text = '';
  const chords = [];
  for (const seg of line || []) {
    if (seg.c) chords.push({ c: seg.c, at: text.length });
    text += seg.t || '';
  }
  return { text, chords };
}

/**
 * Cut the lyric at the chord anchors.
 *
 * Chords are kept in the order the line holds them so a selection survives a
 * move; they are only sorted here, where the reading order is what matters.
 * `ci` points back at that held order, `from` is where the fragment starts in
 * the lyric — between them a screen can name every character it draws.
 */
export function splitLine({ text, chords }) {
  const len = text.length;
  if (!chords.length) return text ? [{ ci: -1, t: text, from: 0 }] : [];

  const order = chords
    .map((ch, i) => ({ c: ch.c, at: Math.min(Math.max(ch.at | 0, 0), len), ci: i }))
    .sort((a, b) => a.at - b.at || a.ci - b.ci);

  const out = [];
  /* Words sung before the first chord belong to no chord — the same rule the
     importer follows when it splits a line for the first time. */
  if (order[0].at > 0) out.push({ ci: -1, t: text.slice(0, order[0].at), from: 0 });
  order.forEach((ch, k) => {
    const to = k + 1 < order.length ? order[k + 1].at : len;
    out.push({ c: ch.c, ci: ch.ci, t: text.slice(ch.at, to), from: ch.at });
  });
  return out;
}

/** { text, chords } → the fragments a chart is stored as. */
export function writeLine(model) {
  return splitLine(model).map(({ c, t }) => (c ? (t ? { c, t } : { c }) : { t }));
}

/** A line with no lyric — an intro or a turnaround — has nothing to align to. */
export const isAlignable = (model) => !!model.text.trim();

/** Put chord `ci` on character `at`, clamped to the lyric it belongs to. */
export function moveChord(model, ci, at) {
  const chord = model.chords[ci];
  const next = Math.min(Math.max(at, 0), model.text.length);
  if (!chord || chord.at === next) return model;
  return {
    ...model,
    chords: model.chords.map((ch, i) => (i === ci ? { ...ch, at: next } : ch))
  };
}

/** One character earlier (-1) or later (+1) in the lyric. */
export function nudgeChord(model, ci, delta) {
  const chord = model.chords[ci];
  return chord ? moveChord(model, ci, chord.at + delta) : model;
}

/** Sections as models, for editing — and back again, for storing. */
export const readSections = (sections) =>
  sections.map((sec) => ({ ...sec, lines: sec.lines.map(readLine) }));

export const writeSections = (draft) =>
  draft.map((sec) => ({ ...sec, lines: sec.lines.map(writeLine) }));
