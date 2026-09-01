const SHARP = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const FLAT_NAME = { 'C#':'Db', 'D#':'Eb', 'F#':'Gb', 'G#':'Ab', 'A#':'Bb' };
const ALIAS = { Db:'C#', Eb:'D#', Gb:'F#', Ab:'G#', Bb:'A#', Cb:'B', Fb:'E', 'E#':'F', 'B#':'C' };

function shiftRoot(root, steps) {
  const norm = ALIAS[root] || root;
  const i = SHARP.indexOf(norm);
  if (i < 0) return root;
  const out = SHARP[(i + (steps % 12) + 12) % 12];
  // keep flat spelling if the source was flat
  return root.length > 1 && root[1] === 'b' && FLAT_NAME[out] ? FLAT_NAME[out] : out;
}

/** "Bm7" +2 -> "C#m7"; handles slash chords ("A/C#"). */
export function transpose(chord, steps) {
  if (!chord || !steps) return chord || '';
  return chord
    .split('/')
    .map((part) => {
      const m = /^([A-G][#b]?)(.*)$/.exec(part);
      return m ? shiftRoot(m[1], steps) + m[2] : part;
    })
    .join('/');
}

/** Distinct chords in a chart, in first-appearance order. */
export function chordsUsed(sections, steps = 0) {
  const seen = [];
  for (const sec of sections) {
    for (const line of sec.lines) {
      for (const seg of line) {
        if (!seg.c) continue;
        const c = transpose(seg.c, steps);
        if (!seen.includes(c)) seen.push(c);
      }
    }
  }
  return seen;
}

/** Pitch class of a root name, 0–11 from C ("Bb" -> 10). -1 if it isn't one. */
export function pitchClass(name) {
  const m = /^([A-G][#b]?)/.exec(name || '');
  if (!m) return -1;
  return SHARP.indexOf(ALIAS[m[1]] || m[1]);
}
