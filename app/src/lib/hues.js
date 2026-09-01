// Colour comes from the music, not from decoration. A key, a chord root, a
// tempo and a person each own a hue; lightness and chroma are fixed in the
// stylesheet, so every one of them sits at exactly the weight of the amber
// accent and the room still reads as one room.
import { pitchClass } from './chords.js';

/** The chromatic circle laid over the colour wheel — C on the accent's amber,
 *  a semitone every 30°, so no two keys in a list look alike. */
export function keyHue(name) {
  const pc = pitchClass(name);
  return pc < 0 ? null : (40 + pc * 30) % 360;
}

/** Style object for anything carrying a key or a chord: `style={hue(s.key)}`. */
export function hue(name) {
  const h = keyHue(name);
  return h === null ? undefined : { '--h': h };
}

/** Tempo reads as temperature — a ballad sits blue, a fast one runs hot. The
 *  ramp climbs through violet rather than green, so it never collides with a
 *  key colour sitting next to it. */
export function bpmHue(bpm) {
  const t = Math.min(1, Math.max(0, (bpm - 72) / 66));
  return Math.round(240 + t * 150) % 360;
}

/** Style object for a tempo mark. */
export function tempoHue(bpm) {
  return { '--h': bpmHue(bpm) };
}

/** Style object for a band member's own colour. */
export function memberHue(member) {
  return member && member.hue != null ? { '--h': member.hue } : undefined;
}
