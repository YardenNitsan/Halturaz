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
| `/` | Month calendar. Pick a day; the day panel is where it gets booked, opened or looked at. |
| `/rehearsal/:date` | The setlist — drag to reorder, tick off what you've run, pull songs in from the library. Time, room, note and attendance are edited here; the booking can be deleted (with undo). |
| `/song/:id?from=:date` | Chords over lyrics, with transpose, text sizing, stage mode and a reviewed toggle that writes back to the set. |
| `/songs` | The library, filtered by collection and key. New songs are added here and persist. |

## Layout

```
src/
  data.js               demo content (band, songs, charts, schedule)
  store.jsx             one reducer + context; the schedule and any songs the
                        band adds persist to localStorage — charts stay code-owned
  lib/chords.js         transpose, including slash chords and flat spellings
  lib/dates.js          month grids, formatting, relative dates
  components/           Shell (nav), Icon, Toast
  screens/              Calendar, Rehearsal, Song, Library
  styles.css            the design system — tokens, components, responsive rules
```

## Design notes

Warm near-black surfaces; **amber** is the chrome — rehearsals, buttons, today.
Everything the music owns carries a hue of its own: a key and a chord root take
their colour from the chromatic circle laid over the colour wheel (a semitone
every 30°, C landing on the accent's amber), tempo runs from blue to hot, and
each of the five members has a colour they keep across avatars, notes and the
attendance list. Only the hue moves — lightness and chroma are pinned to the
accent's own in `--hue-lc`, so a green key badge and an amber one weigh the same
on the page, in both themes. `lib/hues.js` maps data to the angle. Bricolage
Grotesque for display, Instrument Sans for UI, JetBrains Mono for anything you
read as a number — chords, tempos, times.

Every action has exactly one button on the page it lives on. Booking belongs to
the day panel, not also to the calendar header; the key is printed by the
transpose control, not also by a card beside it; the library's tile is the key,
so the row has no second key column. The phone and the desktop run the same
controls — the layout moves, the affordances do not.

Chords sit above the exact syllable they land on: each line is a run of
inline-block segments, chord stacked over its lyric fragment, so alignment
survives any font size and wraps cleanly on a phone. Monospace column alignment
would not.

Below 900px the nav rail becomes a bottom tab bar and every screen goes single
column. Every aside becomes a bottom sheet there — dimmed behind, tap outside to
close. The day sheet has no chevron: its header is a handle, dragged up to open
the day and down to shut it, with the height following the finger and snapping
to whichever end it was nearest on release. The handle is only where the sheet
looks grabbable — the whole month behind it takes the same up-and-down swipe,
and so do the dimmed backdrop and the day's own text once it is scrolled back
to the top, so the day can be pulled open or pushed shut from wherever the
thumb is resting. Sideways on the same grid still means the month: the first
few pixels decide which axis the finger is on, and the one it picks keeps the
gesture to the end. Each setlist row grows its own reorder arrows down there,
since dragging is a mouse gesture. The song screen is the one that matters on a
phone: key, tempo, capo, transpose, text size and the next song all stay within
thumb reach.

The sheet lands the way a month does. Both settle on one curve — `--settle`,
the same value in the stylesheet and in the screen's script — and the sheet is
given a pace that carries on from the finger, so a flick lands quickly and a
slow release glides. The dimming behind it is not a state that appears: it
rides the drag, as far up as the finger has pulled the day and back down on the
same clock. And a sheet still on its way can be caught, stopped where it stands
and taken over, exactly as a month in mid-flight can. The height is moved from
JavaScript rather than transitioned by the stylesheet — a height that has to
cross from a finger's own value to a stylesheet's flinches on the way, and the
day is measured after it has been re-rendered, so what it opens to is its true
height and not the shape it had a moment ago.

The page itself never scrolls — the app is a fixed frame with its own scrollers
inside it, each keeping its overscroll to itself — so a swipe is never taken
away mid-gesture and turned into a pull-to-refresh. Where the browser would
otherwise claim a direction before knowing where the finger is going, it is
told not to: the month and the sheet take both axes outright, and inside the
open day the first move downward is refused while the scroll sits at its top.

Months are a three-page strip — previous, current, next — that rides the finger
1:1 and settles onto whichever page the swipe was pulling in, so a month reads
as one sheet being dragged aside rather than a grid that redraws. The header
month rides the same offset as the grid. Hebrew reads right to left, so next
month sits to the *left* there and the gesture stays natural in both languages.
Today is the one date wearing a filled amber disc.

The strip is never out of reach: a finger on a month in mid-flight stops it
where it stands and takes it over, so you can catch, reverse or chain months
before, during or after a change. Landing mid-air works because the strip
adopts the month it was heading for and restates its position against it — the
transform moves by a whole page, the pixels do not move at all.

## Keyboard (song screen)

| Key | |
| --- | --- |
| `+` `-` | transpose · `0` back to the original key |
| `[` `]` | text size |
| `C` | chords on/off |
| `F` | stage mode |
| `J` `K` | next / previous song in the set |
| `D` | mark the song reviewed in the set it came from |
| `Esc` | leave stage mode, then back to the rehearsal |

Shift and caps lock don't matter — the letter keys are matched case-insensitively.

## Demo content

The band is fictional. Covers carry real title/artist metadata as a real setlist
would; every full lyric sheet is an original written for this project, so no
copyrighted lyrics ship here. Songs without a chart are deliberate — they
exercise the empty state.
