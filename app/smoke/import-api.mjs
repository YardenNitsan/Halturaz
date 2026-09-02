const BASE = process.env.SMOKE_URL || 'http://127.0.0.1:5174';
const TITLE = 'Wonderwall';
const ARTIST = 'Oasis';

let fail = 0;
const ok = (label) => console.log(`ok   ${label}`);
const bad = (label, detail) => {
  fail++;
  console.log(`FAIL ${label}${detail ? `: ${detail}` : ''}`);
};

// iTunes search (client path)
const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(`${TITLE} ${ARTIST}`)}&entity=song&limit=5`;
const itunesRes = await fetch(itunesUrl);
if (!itunesRes.ok) bad('itunes search', String(itunesRes.status));
else {
  const itunes = await itunesRes.json();
  const hit = (itunes.results || []).find((r) => r.trackName === TITLE && r.artistName === ARTIST);
  if (!hit) bad('itunes finds Wonderwall by Oasis');
  else ok(`itunes hit — ${hit.trackName} / ${hit.artistName} (${Math.round(hit.trackTimeMillis / 1000)}s)`);
}

// import API (server path)
const importUrl = `${BASE}/api/songs/import?title=${encodeURIComponent(TITLE)}&artist=${encodeURIComponent(ARTIST)}`;
const importRes = await fetch(importUrl);
const chart = await importRes.json().catch(() => ({}));
if (!importRes.ok) bad('import API', chart.error || importRes.status);
else {
  ok(`import API — key ${chart.key}${chart.capo ? ` (capo ${chart.capo})` : ''}, bpm ${chart.bpm}, ${chart.sections?.length || 0} sections`);
  /* The chart's chords and the capo are two facts, not one: UG tags Wonderwall
     F#m, which is the record — the shapes on the page are Em with a capo. */
  if (!chart.key) bad('import API returns a key');
  else ok('import API returns a key');
  if (!Number.isInteger(chart.capo)) bad('import API returns a capo', String(chart.capo));
  else ok(`import API returns a capo (${chart.capo})`);
  const hasLyrics = chart.sections?.some((s) => s.lines?.some((l) => l.some((seg) => /today is gonna/i.test(seg.t || ''))));
  if (!hasLyrics) bad('imported chart has Wonderwall lyrics');
  else ok('imported chart has Wonderwall lyrics');
  const hasChords = chart.sections?.some((s) => s.lines?.some((l) => l.some((seg) => seg.c)));
  if (!hasChords) bad('imported chart has chords');
  else ok('imported chart has chords');
}

// store path — song lands in library with sections intact
const { reducer } = await import('./dist/entry.js');
const song = {
  id: 'wonderwall',
  title: TITLE,
  artist: ARTIST,
  key: chart.key,
  capo: chart.capo || 0,
  bpm: chart.bpm || 100,
  sec: 259,
  sections: chart.sections || [],
  needsWork: false
};
const state = reducer({ events: {}, songs: [], toast: null }, { type: 'add-to-library', song });
const saved = state.songs.find((s) => s.id === 'wonderwall');
if (!saved) bad('reducer adds imported song');
else {
  ok('reducer adds imported song');
  if (!saved.custom) bad('imported song marked custom');
  else ok('imported song marked custom');
  if (!saved.sections?.length) bad('reducer keeps sections');
  else ok(`reducer keeps sections (${saved.sections.length})`);
  if (saved.needsWork) bad('imported song not flagged needsWork');
  else ok('imported song not flagged needsWork');
}

// SSR render — song page shows chart
const { render } = await import('./dist/entry.js');
const html = render('/song/wonderwall').replace(/<!-- -->/g, '');
for (const needle of [TITLE, ARTIST, 'Today is gonna', 'Em']) {
  if (!html.includes(needle)) bad(`song page renders "${needle}"`);
  else ok(`song page renders "${needle}"`);
}

console.log(fail ? `\n${fail} import check(s) failed` : '\nimport flow passes');
process.exit(fail ? 1 : 0);
