/** Turn Ultimate Guitar chordpro-ish text into the app's section format. */

import { alignByColumns } from './chordAlign.js';

const CHORD_TAG = /\[ch\]([^\[]*?)\[\/ch\]/g;
const SECTION_TAG = /^\[([^\]]+)\]$/;
const FINGERING = /^[A-G#b][^\n]{0,24}\s+x?\d{3,}/;

function chordsIn(line) {
  return [...line.matchAll(CHORD_TAG)].map((m) => m[1].trim()).filter(Boolean);
}

function expandChordLine(line) {
  const chords = [];
  let plain = '';
  let last = 0;

  for (const m of line.matchAll(CHORD_TAG)) {
    plain += line.slice(last, m.index);
    chords.push({ c: m[1].trim(), start: plain.length });
    plain += m[1].trim();
    last = m.index + m[0].length;
  }

  plain += line.slice(last);
  return { plain, chords };
}

function alignChordLyric(chordLine, lyricLine) {
  const { plain, chords } = expandChordLine(chordLine);
  const lyric = lyricLine.replace(CHORD_TAG, '');
  return alignByColumns(chords, plain.length, lyric);
}

function parseTabBlock(block) {
  const inner = block.replace(/^\[tab\]/, '').replace(/\[\/tab\]$/, '');
  const parts = inner.split('\n');
  if (!parts.length) return null;

  const chordLine = parts[0];
  const lyricLines = parts.slice(1).filter((l) => l.trim());
  if (!lyricLines.length) {
    const chords = chordsIn(chordLine);
    return chords.length ? chords.map((c) => ({ c })) : null;
  }

  return alignChordLyric(chordLine, lyricLines.join('\n'));
}

function isSectionHeader(label) {
  const lower = label.toLowerCase();
  return lower !== 'ch' && lower !== 'tab' && lower !== '/tab' && !lower.startsWith('ch]');
}

export function parseChordPro(content) {
  const sections = [];
  let current = { label: 'Chart', bars: '', lines: [] };

  const push = () => {
    if (current.lines.length) sections.push(current);
  };

  const lines = String(content || '').replace(/\r\n/g, '\n').split('\n');
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();
    if (!line || line.startsWith('***')) continue;

    const sec = SECTION_TAG.exec(line);
    if (sec && isSectionHeader(sec[1])) {
      push();
      current = { label: sec[1], bars: '', lines: [] };
      continue;
    }

    if (line.startsWith('[tab]')) {
      let block = raw;
      while (!block.includes('[/tab]') && i + 1 < lines.length) {
        i += 1;
        block += `\n${lines[i]}`;
      }
      const parsed = parseTabBlock(block.trim());
      if (parsed) current.lines.push(parsed);
      continue;
    }

    if (line.includes('[ch]')) {
      const chords = chordsIn(line);
      if (chords.length) current.lines.push(chords.map((c) => ({ c })));
      continue;
    }

    if (FINGERING.test(line)) continue;

    current.lines.push([{ t: line }]);
  }

  push();
  return sections.filter((s) => s.lines.length);
}
