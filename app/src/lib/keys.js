/**
 * Colour by musical key.
 *
 * The twelve keys are laid around the hue wheel in circle-of-fifths order, so
 * neighbouring hues are neighbouring keys: C and G sit next to each other,
 * a tritone lands opposite. Chroma and lightness are fixed, so no key shouts
 * louder than another — only the hue changes.
 */

const FIFTHS = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#', 'G#', 'D#', 'A#', 'F'];
const ENHARMONIC = { Db: 'C#', Eb: 'D#', Gb: 'F#', Ab: 'G#', Bb: 'A#', Cb: 'B', Fb: 'E' };

export function keyRoot(key) {
  const m = /^([A-G][#b]?)/.exec(key || '');
  if (!m) return null;
  const r = m[1];
  return r.length === 2 && r[1] === 'b' ? ENHARMONIC[r] || r : r;
}

export function keyHue(key) {
  const i = FIFTHS.indexOf(keyRoot(key));
  return i < 0 ? null : (i * 30 + 18) % 360;
}

export const isMinor = (key) => /m$/.test(key || '') && !/maj/i.test(key || '');

/** CSS custom properties any keyed element can consume. */
export function keyStyle(key) {
  const h = keyHue(key);
  if (h === null) return {};
  // Minor keys sit a touch deeper and less saturated than their major counterpart.
  const minor = isMinor(key);
  return {
    '--k': `oklch(${minor ? 0.5 : 0.58} ${minor ? 0.13 : 0.15} ${h})`,
    '--k-ink': `oklch(${minor ? 0.38 : 0.42} ${minor ? 0.11 : 0.13} ${h})`,
    '--k-soft': `oklch(${minor ? 0.94 : 0.95} 0.045 ${h})`,
    '--k-line': `oklch(0.84 0.075 ${h})`
  };
}
