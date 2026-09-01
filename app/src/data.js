// Demo content for a five-piece called Static Bloom.
// Covers carry real title/artist metadata; every full lyric sheet is an original.

export const TODAY = '2026-08-29';

export const BAND = {
  name: 'Static Bloom',
  city: 'Tel Aviv',
  members: [
    // `hue` is the colour each member carries — avatars, their notes, the
    // attendance list. Spread far enough apart to tell five initials apart.
    { id: 'maya', initials: 'M', name: 'Maya', role: 'Vocals', hue: 348 },
    { id: 'ori', initials: 'O', name: 'Ori', role: 'Guitar', hue: 45 },
    { id: 'dana', initials: 'D', name: 'Dana', role: 'Bass', hue: 152 },
    { id: 'tal', initials: 'T', name: 'Tal', role: 'Drums', hue: 208 },
    { id: 'noam', initials: 'N', name: 'Noam', role: 'Keys', hue: 285 }
  ]
};

const copperLine = [
  { label: 'Intro', bars: '4 bars', lines: [[{ c: 'D' }, { c: 'A' }, { c: 'Bm' }, { c: 'G' }]] },
  {
    label: 'Verse 1',
    bars: '8 bars',
    lines: [
      [{ c: 'D', t: 'Six on the ' }, { c: 'A', t: 'copper line,' }],
      [{ c: 'Bm', t: 'counting the streetlights ' }, { c: 'G', t: 'home' }],
      [{ c: 'D', t: 'You said you’d wait ' }, { c: 'A', t: 'outside,' }],
      [{ c: 'Bm', t: 'I showed up on my ' }, { c: 'G', t: 'own' }],
      [{ c: 'D', t: 'Radio half a ' }, { c: 'A', t: 'station,' }],
      [{ c: 'Bm', t: 'half a song we ' }, { c: 'G', t: 'know' }],
      [{ c: 'D', t: 'Some things you carry ' }, { c: 'A', t: 'quiet,' }],
      [{ c: 'Bm', t: 'some things you let ' }, { c: 'G', t: 'go' }]
    ]
  },
  {
    label: 'Pre-chorus',
    bars: '4 bars',
    lines: [
      [{ c: 'Em', t: 'And the room is ' }, { c: 'A', t: 'louder' }],
      [{ c: 'Em', t: 'than it needs to ' }, { c: 'A/C#', t: 'be' }]
    ]
  },
  {
    label: 'Chorus',
    bars: '8 bars',
    accent: true,
    lines: [
      [{ c: 'G', t: 'Hold the note ' }, { c: 'D', t: 'till the room lets go' }],
      [{ c: 'A', t: 'we were never quiet, ' }, { c: 'Bm', t: 'we just learned to sing it low' }],
      [{ c: 'G', t: 'Hold the note ' }, { c: 'D', t: 'till the ceiling shakes' }],
      [{ c: 'A', t: 'everything worth keeping ' }, { c: 'Bm', t: 'is the part that breaks' }]
    ]
  },
  {
    label: 'Verse 2',
    bars: '8 bars',
    lines: [
      [{ c: 'D', t: 'Ori found the ending ' }, { c: 'A', t: 'somewhere around four' }],
      [{ c: 'Bm', t: 'Dana kept the bassline ' }, { c: 'G', t: 'walking out the door' }],
      [{ c: 'D', t: 'Tal was counting nothing, ' }, { c: 'A', t: 'just the way he does' }],
      [{ c: 'Bm', t: 'and none of us admitted ' }, { c: 'G', t: 'how good the quiet was' }]
    ]
  },
  {
    label: 'Bridge',
    bars: '6 bars',
    lines: [
      [{ c: 'F#m', t: 'One more time from the top,' }],
      [{ c: 'Em', t: 'one more time' }],
      [{ c: 'G', t: 'till the tape runs out ' }, { c: 'A', t: 'and the lights come up' }]
    ]
  },
  {
    label: 'Chorus',
    bars: '×2',
    accent: true,
    lines: [
      [{ c: 'G', t: 'Hold the note ' }, { c: 'D', t: 'till the room lets go' }],
      [{ c: 'A', t: 'we were never quiet, ' }, { c: 'Bm', t: 'we just learned to sing it low' }]
    ]
  },
  { label: 'Outro', bars: 'fade', lines: [[{ c: 'D' }, { c: 'A' }, { c: 'Bm' }, { c: 'G' }]] }
];

const halfPastNowhere = [
  { label: 'Intro', bars: '4 bars', lines: [[{ c: 'Am' }, { c: 'F' }, { c: 'C' }, { c: 'G' }]] },
  {
    label: 'Verse 1',
    bars: '8 bars',
    lines: [
      [{ c: 'Am', t: 'Half past nowhere, ' }, { c: 'F', t: 'quarter to fine' }],
      [{ c: 'C', t: 'the kettle’s going ' }, { c: 'G', t: 'and nobody’s mine' }],
      [{ c: 'Am', t: 'You keep a jacket ' }, { c: 'F', t: 'on the back of the chair' }],
      [{ c: 'C', t: 'like the shape of a person ' }, { c: 'G', t: 'still living there' }]
    ]
  },
  {
    label: 'Chorus',
    bars: '8 bars',
    accent: true,
    lines: [
      [{ c: 'F', t: 'So play it slower, ' }, { c: 'C', t: 'play it long' }],
      [{ c: 'Am', t: 'nobody’s waiting ' }, { c: 'G', t: 'on the end of the song' }],
      [{ c: 'F', t: 'and if the morning ' }, { c: 'C', t: 'takes its time' }],
      [{ c: 'Am', t: 'we’ll be half past nowhere, ' }, { c: 'G', t: 'quarter to fine' }]
    ]
  },
  {
    label: 'Verse 2',
    bars: '8 bars',
    lines: [
      [{ c: 'Am', t: 'Sirens on Allenby, ' }, { c: 'F', t: 'someone’s guitar' }],
      [{ c: 'C', t: 'a window open ' }, { c: 'G', t: 'somewhere not far' }],
      [{ c: 'Am', t: 'I like the city ' }, { c: 'F', t: 'best when it’s tired' }],
      [{ c: 'C', t: 'everything honest, ' }, { c: 'G', t: 'nothing on fire' }]
    ]
  },
  { label: 'Outro', bars: 'fade', lines: [[{ c: 'Am' }, { c: 'F' }, { c: 'C' }, { c: 'G' }]] }
];

const northbound = [
  { label: 'Intro', bars: '2 bars', lines: [[{ c: 'G' }, { c: 'D' }]] },
  {
    label: 'Verse',
    bars: '8 bars',
    lines: [
      [{ c: 'G', t: 'Northbound, ' }, { c: 'D', t: 'window down' }],
      [{ c: 'Em', t: 'nothing behind us ' }, { c: 'C', t: 'worth turning around' }],
      [{ c: 'G', t: 'Tal’s got the tempo ' }, { c: 'D', t: 'up past the sign' }],
      [{ c: 'Em', t: 'we’ll get there early ' }, { c: 'C', t: 'or we’ll get there fine' }]
    ]
  },
  {
    label: 'Chorus',
    bars: '8 bars',
    accent: true,
    lines: [
      [{ c: 'C', t: 'Go, go, ' }, { c: 'G', t: 'don’t let it settle' }],
      [{ c: 'D', t: 'every good thing ' }, { c: 'Em', t: 'started this loud' }]
    ]
  }
];

export const SONGS = [
  { id: 'copper-line', title: 'Copper Line', artist: 'Static Bloom', key: 'D', bpm: 96, sec: 252, capo: 2, timeSig: '4/4', own: true, sections: copperLine, note: 'Second chorus drops the kick — Dana carries it alone until the last two bars. Ori: keep the capo on, the open strings are the whole point.', noteBy: 'ori', noteAge: '2 days ago', lastPlayed: 'Aug 29' },
  { id: 'half-past-nowhere', title: 'Half Past Nowhere', artist: 'Static Bloom', key: 'Am', bpm: 84, sec: 324, capo: 0, timeSig: '4/4', own: true, sections: halfPastNowhere, note: 'Start on the ride, no count-in. Maya comes in a bar late on purpose.', noteBy: 'maya', noteAge: '1 week ago', lastPlayed: 'Aug 29' },
  { id: 'room-12', title: 'Room 12', artist: 'Static Bloom', key: 'F#m', bpm: 112, sec: 228, capo: 0, timeSig: '4/4', own: true, sections: [], needsWork: true, lastPlayed: 'Aug 22' },
  { id: 'dreams', title: 'Dreams', artist: 'Fleetwood Mac', key: 'F', bpm: 120, sec: 257, capo: 0, timeSig: '4/4', own: false, sections: [], lastPlayed: 'Aug 29' },
  { id: 'ember-and-ash', title: 'Ember & Ash', artist: 'Static Bloom', key: 'Em', bpm: 76, sec: 430, capo: 0, timeSig: '6/8', own: true, sections: [], needsWork: true, note: 'New outro — hold 76 until bar 40, then Noam opens it up.', noteBy: 'tal', noteAge: '3 days ago', lastPlayed: 'Aug 29' },
  { id: 'northbound', title: 'Northbound', artist: 'Static Bloom', key: 'G', bpm: 138, sec: 211, capo: 0, timeSig: '4/4', own: true, sections: northbound, lastPlayed: 'Aug 29' },
  { id: 'seven-nation-army', title: 'Seven Nation Army', artist: 'The White Stripes', key: 'Em', bpm: 124, sec: 232, capo: 0, timeSig: '4/4', own: false, sections: [], lastPlayed: 'Aug 29' },
  { id: 'static-bloom', title: 'Static Bloom', artist: 'Static Bloom', key: 'Bm', bpm: 92, sec: 385, capo: 0, timeSig: '4/4', own: true, sections: [], lastPlayed: 'Aug 22' },
  { id: 'slow-signal', title: 'Slow Signal', artist: 'Static Bloom', key: 'C', bpm: 104, sec: 245, capo: 0, timeSig: '4/4', own: true, sections: [], lastPlayed: 'Aug 18' },
  { id: 'kite-weather', title: 'Kite Weather', artist: 'Static Bloom', key: 'A', bpm: 132, sec: 202, capo: 0, timeSig: '4/4', own: true, sections: [], lastPlayed: 'Aug 11' },
  { id: 'hollow-bones', title: 'Hollow Bones', artist: 'Static Bloom', key: 'Dm', bpm: 88, sec: 312, capo: 0, timeSig: '4/4', own: true, sections: [], lastPlayed: 'Jul 28' },
  { id: 'talk-me-down', title: 'Talk Me Down', artist: 'Static Bloom', key: 'Bb', bpm: 118, sec: 280, capo: 0, timeSig: '4/4', own: true, sections: [], needsWork: true, lastPlayed: 'Jul 21' },
  { id: 'marmara', title: 'Marmara', artist: 'Static Bloom', key: 'Gm', bpm: 100, sec: 355, capo: 0, timeSig: '4/4', own: true, sections: [], lastPlayed: 'Jul 14' },
  { id: 'come-together', title: 'Come Together', artist: 'The Beatles', key: 'Dm', bpm: 82, sec: 260, capo: 0, timeSig: '4/4', own: false, sections: [], lastPlayed: 'Aug 18' }
];

const set8 = ['copper-line','half-past-nowhere','room-12','dreams','ember-and-ash','northbound','seven-nation-army','static-bloom'];

export const EVENTS = {
  '2026-07-21': { kind: 'r', time: '20:00', place: 'Studio 9', songs: set8.slice(0, 7), done: [], note: '' },
  '2026-07-28': { kind: 'r', time: '20:00', place: 'Studio 9', songs: set8, done: set8, note: '' },
  '2026-08-04': { kind: 'r', time: '20:00', place: 'Rehearsal Room B', songs: set8.slice(0, 6), done: set8.slice(0, 6), note: '' },
  '2026-08-11': { kind: 'r', time: '20:00', place: 'Rehearsal Room B', songs: set8.slice(0, 7), done: set8.slice(0, 5), note: '' },
  '2026-08-18': { kind: 'r', time: '20:00', place: 'Studio 9', songs: set8, done: set8.slice(0, 6), note: 'Recorded a room take of Copper Line.' },
  '2026-08-22': { kind: 'r', time: '14:00', place: 'Studio 9', songs: set8.concat(['slow-signal']), done: set8, note: 'Full run-through, no stopping.' },
  '2026-08-29': { kind: 'r', time: '19:00', place: 'Studio 9', songs: set8, done: ['copper-line','half-past-nowhere','dreams'], att: { maya: 'in', ori: 'in', dana: 'in', tal: 'late', noam: 'in' }, note: 'Levontin set is in 7 days. Run the whole thing twice, no stopping. Tal — the new outro on Ember & Ash stays at 76 until bar 40.' },
  '2026-09-01': { kind: 'r', time: '20:00', place: 'Rehearsal Room B', songs: set8.slice(0, 7), done: [], note: '' },
  '2026-09-05': { kind: 's', time: '21:30', place: 'Levontin 7', songs: set8.concat(['slow-signal','kite-weather','marmara']), done: [], note: 'Doors 20:30. Load in at 18:00, two other bands on the bill.' },
  '2026-09-08': { kind: 'r', time: '20:00', place: 'Studio 9', songs: set8, done: [], note: '' },
  '2026-09-15': { kind: 'r', time: '20:00', place: 'Studio 9', songs: set8, done: [], note: '' }
};

export const ROOMS = ['Studio 9', 'Rehearsal Room B', 'Levontin 7'];
export const TIMES = ['18:00', '19:00', '20:00', '21:00'];
