# Static Bloom — rehearsal manager

A band's rehearsals, setlists and chord charts in one place.
React + Vite, no backend — scheduling state persists to `localStorage`.

```bash
npm install
npm run dev      # http://127.0.0.1:5174
npm run build    # production bundle into dist/
npm test         # renders every route + checks the chord/date/reducer logic
```

## The one path

`Calendar → Rehearsal → Song`. There are only two nav destinations; rehearsals
live inside the calendar and setlists live inside a rehearsal, so nothing needs
a page of its own.

| Route | Screen |
| --- | --- |
| `/` | Month calendar. Pick a day to see its rehearsal, or book one in the side panel. |
| `/rehearsal/:date` | The setlist — drag to reorder, tick off what you've run, pull songs in from the library. |
| `/song/:id?from=:date` | Chords over lyrics, with transpose, text sizing and stage mode. |
| `/songs` | The library, filtered by collection and key. |

## Layout

```
src/
  data.js               demo content (band, songs, charts, schedule)
  store.jsx             one reducer + context; scheduling state persists
  lib/chords.js         transpose, including slash chords and flat spellings
  lib/dates.js          month grids, formatting, relative dates
  components/           Shell (nav), Icon, Wave, Toast
  screens/              Calendar, Rehearsal, Song, Library
  styles.css            the design system — tokens, components, responsive rules
```

## Design notes

Warm paper, ink, and an editorial serif — a printed setlist rather than a dark
dashboard. Instrument Serif for display, Schibsted Grotesk for UI, JetBrains
Mono for anything you read as a number.

**Colour is information, not decoration.** Every musical key owns a hue, placed
around the wheel in circle-of-fifths order (`lib/keys.js`), so neighbouring hues
are neighbouring keys and a tritone lands opposite. Minor keys sit a shade
deeper than their major counterpart. That one rule colours the key badges, the
library sleeves, the setlist rows, the chords in a chart, and the calendar —
where each rehearsal shows the *colour chord* of its setlist, one dot per song.
The chrome stays neutral so the keys can speak; gigs are the one thing that
gets a colour outright.

Chords sit above the exact syllable they land on: each line is a run of
inline-block segments, chord stacked over its lyric fragment, so alignment
survives any font size and wraps cleanly on a phone. Monospace column alignment
would not.

Below 900px the nav rail becomes a bottom tab bar and every screen goes single
column. The song screen is the one that matters on a phone — it keeps transpose,
text size and the next song within thumb reach.

## Keyboard (song screen)

| Key | |
| --- | --- |
| `+` `-` | transpose · `0` back to the original key |
| `[` `]` | text size |
| `C` | chords on/off |
| `F` | stage mode |
| `J` `K` | next / previous song in the set |
| `Esc` | leave stage mode, then back to the rehearsal |

## Demo content

The band is fictional. Covers carry real title/artist metadata as a real setlist
would; every full lyric sheet is an original written for this project, so no
copyrighted lyrics ship here. Songs without a chart are deliberate — they
exercise the empty state.
