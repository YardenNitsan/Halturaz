globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
console.error = () => {};

const { transpose, chordsUsed } = await import('../src/lib/chords.js');
const { monthGrid, iso, runtime, mmss, relative } = await import('../src/lib/dates.js');

let fail = 0;
const eq = (label, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) { fail++; console.log(`FAIL ${label}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`); }
  else console.log(`ok   ${label} = ${JSON.stringify(got)}`);
};

// --- chords
eq('D +2', transpose('D', 2), 'E');
eq('Bm +2', transpose('Bm', 2), 'C#m');
eq('A/C# +1', transpose('A/C#', 1), 'A#/D');
eq('F#m -1', transpose('F#m', -1), 'Fm');
eq('Bb +1 keeps flats', transpose('Bb', 1), 'B');
eq('Eb -1 keeps flats', transpose('Eb', -1), 'D');
eq('Gsus4 +5', transpose('Gsus4', 5), 'Csus4');
eq('wrap G +5', transpose('G', 5), 'C');
eq('wrap C -1', transpose('C', -1), 'B');
eq('no steps is identity', transpose('F#m7', 0), 'F#m7');

// --- calendar math: Aug 1 2026 is a Saturday, Aug 29 a Saturday
const aug = monthGrid(2026, 7);
eq('Aug 1 sits in the SAT column', aug.findIndex((c) => c.date === '2026-08-01') % 7, 6);
eq('Aug 29 sits in the SAT column', aug.findIndex((c) => c.date === '2026-08-29') % 7, 6);
eq('Aug has 31 in-month cells', aug.filter((c) => c.inMonth).length, 31);
eq('grid is always 42 cells', aug.length, 42);
const feb = monthGrid(2028, 1);
eq('Feb 2028 is a leap month', feb.filter((c) => c.inMonth).length, 29);

// --- formatting
eq('mmss', mmss(252), '4:12');
eq('runtime short', runtime(2319), '39 min');
eq('runtime long', runtime(4200), '1h 10m');
eq('relative today', relative('2026-08-29', '2026-08-29'), 'Tonight');
eq('relative future', relative('2026-09-05', '2026-08-29'), 'in 7 days');
eq('relative past', relative('2026-08-22', '2026-08-29'), '7 days ago');

// --- reducer: reorder must land where the drop indicator points (above the hovered row)
const { reducer } = await import('./dist/entry.js');
const base = { events: { d: { kind: 'r', time: '19:00', place: 'X', songs: ['a','b','c','d'], done: ['a'] } }, songs: [], toast: null };
const order = (st) => st.events.d.songs.join('');

eq('drag 1 down onto 3', order(reducer(base, { type: 'reorder', date: 'd', from: 0, to: 2 })), 'bacd');
eq('drag 4 up onto 2',   order(reducer(base, { type: 'reorder', date: 'd', from: 3, to: 1 })), 'adbc');
eq('drop on itself is a no-op', order(reducer(base, { type: 'reorder', date: 'd', from: 1, to: 1 })), 'abcd');
eq('remove drops it from done too',
   JSON.stringify(reducer(base, { type: 'remove-song', date: 'd', songId: 'a' }).events.d),
   JSON.stringify({ kind: 'r', time: '19:00', place: 'X', songs: ['b','c','d'], done: [] }));
eq('toggle-done adds', reducer(base, { type: 'toggle-done', date: 'd', songId: 'b' }).events.d.done.join(''), 'ab');
eq('toggle-done removes', reducer(base, { type: 'toggle-done', date: 'd', songId: 'a' }).events.d.done.join(''), '');
eq('add-song appends once',
   order(reducer(reducer(base, { type: 'add-song', date: 'd', songId: 'e' }), { type: 'add-song', date: 'd', songId: 'e' })), 'abcde');
eq('create-rehearsal will not clobber an existing day',
   reducer(base, { type: 'create-rehearsal', date: 'd', time: '09:00', place: 'Y' }).events.d.time, '19:00');
eq('original state is untouched', order(base), 'abcd');

console.log(fail ? `\n${fail} check(s) failed` : '\nall logic checks pass');
process.exit(fail ? 1 : 0);
