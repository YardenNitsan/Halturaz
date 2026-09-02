/* Tab4U prints a Hebrew chart mirrored — the chord row is ltr but flush right,
   over a lyric that reads right to left off the same margin. Rather than trust
   our reading of that, open the real page and measure where each chord sits in
   characters, then ask both sides the same question: which word is it on?
   Usage: node smoke/align-audit.mjs [--verbose] */
import { chromium } from 'playwright-core';
import { searchTab4u, parseTab4uHtml } from '../server/tab4u.js';

const chrome = process.env.CHROME || '/home/yaliby/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome';
const verbose = process.argv.includes('--verbose');

const SONGS = [
  ['הכוכבים דולקים על אש קטנה', 'משינה'],
  ['מחכים למשיח', 'שלום חנוך'],
  ['אין לי ארץ אחרת', 'גלי עטרי'],
  ['Wonderwall', 'Oasis']
];

/* A column inside a word means that word; a column in the gap between words
   means the word that follows; past the last word means no word at all. */
function wordAt(lyric, col) {
  for (const m of lyric.matchAll(/\S+/g)) if (col < m.index + m[0].length) return m[0];
  return '-';
}

function ourChords(html) {
  const lines = [];
  for (const sec of parseTab4uHtml(html)) {
    for (const line of sec.lines) {
      if (!line.some((s) => s.c) || !line.some((s) => s.t)) continue;
      let col = 0;
      const chords = [];
      for (const seg of line) {
        if (seg.c) chords.push({ c: seg.c, col });
        col += (seg.t || '').length;
      }
      lines.push({ lyric: line.map((s) => s.t || '').join('').trim(), chords });
    }
  }
  return lines;
}

const measure = (page) => page.evaluate(() => {
  const rows = [...document.querySelectorAll('#songContentTPL tr, .song_block tr')];
  const out = [];
  for (let i = 0; i < rows.length; i++) {
    const chordTd = rows[i].querySelector('td.chords, td.chords_en');
    const lyricTd = rows[i + 1] && rows[i + 1].querySelector('td.song');
    if (!chordTd || !lyricTd || !chordTd.querySelector('.c_C')) continue;
    const mirrored = chordTd.classList.contains('chords'); // a Hebrew chart hangs off the right
    const node = [...lyricTd.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim());
    if (!node) continue;

    const raw = node.textContent.replace(/ /g, ' ');
    const lyric = raw.trim();
    const lead = raw.length - raw.replace(/^\s+/, '').length;
    const range = document.createRange();
    range.setStart(node, lead);
    range.setEnd(node, lead + lyric.length);
    const box = range.getBoundingClientRect();
    const anchor = mirrored ? box.right : box.left; // where the first character sits
    const width = box.width / lyric.length;         // monospace: one character

    const chords = [...chordTd.querySelectorAll('.c_C')].map((s) => {
      const b = s.getBoundingClientRect();
      // 3px of the box is the chord pill's padding, not a column
      const edge = mirrored ? anchor - (b.right - 3) : (b.left + 3) - anchor;
      return { c: s.textContent.trim(), col: Math.round(edge / width) };
    }).sort((a, b) => a.col - b.col);
    out.push({ lyric, chords });
  }
  return out;
});

const browser = await chromium.launch({ executablePath: chrome, headless: true, args: ['--no-sandbox', '--disable-gpu'] });
const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
let total = 0, diff = 0, missing = 0;

for (const [title, artist] of SONGS) {
  const hits = await searchTab4u(title, artist).catch(() => []);
  if (!hits.length) { console.log(`no hit: ${title}`); continue; }

  const url = `https://www.tab4u.com/${hits[0].path}`;
  const html = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }).then((r) => r.text());
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);

  const theirs = await measure(page);
  const ours = ourChords(html);
  let ok = 0, bad = 0, gone = 0, from = 0;

  for (const line of theirs) {
    let at = -1;
    for (let i = from; i < ours.length; i++) if (ours[i].lyric === line.lyric) { at = i; break; }
    if (at === -1) { gone++; console.log(`  MISSING  ${line.lyric}`); continue; }
    from = at + 1;

    const want = line.chords.map((x) => [x.c, wordAt(line.lyric, x.col)]);
    const got = ours[at].chords.map((x) => [x.c, wordAt(ours[at].lyric, x.col)]);
    if (JSON.stringify(want) === JSON.stringify(got)) {
      ok++;
      if (verbose) console.log(`  ok  ${line.lyric}`);
    } else {
      bad++;
      console.log(`  DIFF  ${line.lyric}\n    tab4u: ${JSON.stringify(want)}\n    ours : ${JSON.stringify(got)}`);
    }
  }

  console.log(`${title}: ${ok} ok, ${bad} diff, ${gone} missing (of ${theirs.length})`);
  total += ok; diff += bad; missing += gone;
}

await browser.close();
console.log(diff + missing
  ? `\n${diff} line(s) differ, ${missing} missing — ${total} match`
  : `\nall ${total} chord lines land where tab4u puts them`);
process.exit(diff + missing ? 1 : 0);
