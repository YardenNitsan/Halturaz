// Minimal browser stubs so the store's localStorage read doesn't throw.
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };

console.error = () => {}; // react-router's useLayoutEffect SSR noise
const { render } = await import('./dist/entry.js');

const routes = [
  ['/',                          ['August', 'Static Bloom', 'TONIGHT', 'Open rehearsal']],
  ['/songs',                     ['Songs', 'Copper Line', 'Collections', 'Come Together']],
  ['/rehearsal/2026-08-29',      ['Rehearsal — August 29', 'Setlist', '19:00', 'Studio 9', 'Half Past Nowhere']],
  ['/rehearsal/2026-09-05',      ['Show — September 5', 'Levontin 7', 'SHOW']],
  ['/rehearsal/2026-12-01',      ['Nothing is booked']],
  ['/song/copper-line?from=2026-08-29', ['Copper Line', 'TRANSPOSE', 'Hold the note', 'Structure', 'Band note']],
  ['/song/room-12',              ['Room 12', 'No chart for Room 12 yet']],
  ['/song/nope',                 ['isn']]
];

let fail = 0;
for (const [path, needles] of routes) {
  try {
    const html = render(path).replace(/<!-- -->/g, "");
    const missing = needles.filter((n) => !html.includes(n));
    if (missing.length) {
      fail++;
      console.log(`FAIL ${path}\n     missing: ${missing.join(' | ')}`);
    } else {
      console.log(`ok   ${path}  (${html.length} bytes)`);
    }
  } catch (err) {
    fail++;
    console.log(`THREW ${path}\n     ${err.message}`);
  }
}
console.log(fail ? `\n${fail} route(s) failed` : '\nall routes render');
process.exit(fail ? 1 : 0);
