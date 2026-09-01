globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
console.error = () => {};

const { transpose, chordsUsed } = await import('../src/lib/chords.js');
const { monthGrid, monthWeekStart, weekOffset, cellsFromWeekStart, iso, runtime, mmss, relative, isISODate } = await import('../src/lib/dates.js');

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
eq('Aug to Sep is 5 Sunday-weeks', weekOffset(2026, 7, 2026, 8), 5);
eq('Sep 1 stays in the Tuesday column on the continuous strip',
  cellsFromWeekStart(monthWeekStart(2026, 7), 11, 2026, 8).findIndex((c) => c.key === '2026-09-01') % 7, 2);

// --- formatting
eq('mmss', mmss(252), '4:12');
eq('runtime short', runtime(2319, 'en'), '39 min');
eq('runtime long', runtime(4200, 'en'), '1h 10m');
eq('relative today', relative('2026-08-29', '2026-08-29', 'en'), 'Tonight');
eq('relative future', relative('2026-09-05', '2026-08-29', 'en'), 'in 7 days');
eq('relative past', relative('2026-08-22', '2026-08-29', 'en'), '7 days ago');

// --- date guards: a hand-typed URL must not reach the screens
eq('a real date passes', isISODate('2026-08-29'), true);
eq('junk is rejected', isISODate('nonsense'), false);
eq('Feb 30 is rejected', isISODate('2026-02-30'), false);
eq('month 13 is rejected', isISODate('2026-13-01'), false);

// --- reducer: reorder must land where the drop indicator points (above the hovered row)
const { reducer } = await import('./dist/entry.js');
const base = { events: { d: { kind: 'r', time: '19:00', place: 'X', songs: ['a','b','c','d'], done: ['a'] } }, songs: [], toast: null };
const order = (st) => st.events.d.songs.join('');

eq('drag 1 down onto 3', order(reducer(base, { type: 'reorder', date: 'd', from: 0, to: 2 })), 'bacd');
eq('drag 4 up onto 2',   order(reducer(base, { type: 'reorder', date: 'd', from: 3, to: 1 })), 'adbc');
eq('drop on itself is a no-op', order(reducer(base, { type: 'reorder', date: 'd', from: 1, to: 1 })), 'abcd');
eq('a song can move down one slot', order(reducer(base, { type: 'reorder', date: 'd', from: 0, to: 2 })), 'bacd');
eq('a song can land last', order(reducer(base, { type: 'reorder', date: 'd', from: 1, to: 4 })), 'acdb');
eq('a song can land first', order(reducer(base, { type: 'reorder', date: 'd', from: 2, to: 0 })), 'cabd');
eq('remove drops it from the set',
   JSON.stringify(reducer(base, { type: 'remove-song', date: 'd', songId: 'a' }).events.d),
   JSON.stringify({ kind: 'r', time: '19:00', place: 'X', songs: ['b','c','d'], done: [] }));
eq('add-song appends once',
   order(reducer(reducer(base, { type: 'add-song', date: 'd', songId: 'e' }), { type: 'add-song', date: 'd', songId: 'e' })), 'abcde');
eq('create-rehearsal will not clobber an existing day',
   reducer(base, { type: 'create-rehearsal', date: 'd', time: '09:00', place: 'Y' }).events.d.time, '19:00');
eq('original state is untouched', order(base), 'abcd');

// --- editing and deleting a booking
eq('update-rehearsal patches the day',
   JSON.stringify(reducer(base, { type: 'update-rehearsal', date: 'd', patch: { time: '21:00', place: 'Y' } }).events.d),
   JSON.stringify({ kind: 'r', time: '21:00', place: 'Y', songs: ['a','b','c','d'], done: ['a'] }));
eq('update-rehearsal ignores a day with nothing on it',
   reducer(base, { type: 'update-rehearsal', date: 'zzz', patch: { time: '21:00' } }).events.zzz, undefined);
eq('delete-rehearsal empties the day', Object.keys(reducer(base, { type: 'delete-rehearsal', date: 'd' }).events), []);
eq('restore brings the snapshot back',
   order(reducer(reducer(base, { type: 'delete-rehearsal', date: 'd' }), { type: 'restore', events: base.events })), 'abcd');

// --- attendance lives on the event and can be cleared again
const att1 = reducer(base, { type: 'set-attendance', date: 'd', member: 'tal', status: 'late' });
eq('attendance is recorded', att1.events.d.att, { tal: 'late' });
eq('attendance can be cleared',
   reducer(att1, { type: 'set-attendance', date: 'd', member: 'tal', status: '' }).events.d.att, {});
eq('attendance ignores an empty day',
   reducer(base, { type: 'set-attendance', date: 'zzz', member: 'tal', status: 'in' }).events.zzz, undefined);

// --- the library the band adds to
const newSong = { id: 'x', title: 'X', artist: 'Static Bloom', key: 'C', bpm: 100, sec: 210 };
const withSong = reducer(base, { type: 'add-to-library', song: newSong });
eq('add-to-library keeps the chart empty and marks it custom',
   [withSong.songs.length, withSong.songs[0].custom, withSong.songs[0].sections.length], [1, true, 0]);
eq('add-to-library will not add the same id twice',
   reducer(withSong, { type: 'add-to-library', song: newSong }).songs.length, 1);
eq('add-to-library rejects junk', reducer(base, { type: 'add-to-library', song: { id: 5 } }).songs.length, 0);

const booked = reducer(withSong, { type: 'add-song', date: 'd', songId: 'x' });
const dropped = reducer(booked, { type: 'remove-from-library', songId: 'x' });
eq('deleting a custom song pulls it out of every setlist', [dropped.songs.length, order(dropped)], [0, 'abcd']);
eq('code-owned songs cannot be deleted',
   reducer({ ...base, songs: [{ id: 'a', title: 'A' }] }, { type: 'remove-from-library', songId: 'a' }).songs.length, 1);

console.log(fail ? `\n${fail} check(s) failed` : '\nall logic checks pass');
process.exit(fail ? 1 : 0);
