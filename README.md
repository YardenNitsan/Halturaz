# Halturaz — Static Bloom rehearsal manager

A band's rehearsals, setlists and chord charts in one place.

`Calendar → Rehearsal → Song`. Two nav destinations only: rehearsals live inside
the calendar, setlists live inside a rehearsal.

## Run it

```bash
cd app
npm install
npm run dev      # http://127.0.0.1:5174
npm run build
npm test         # renders every route + 30 logic checks
```

React 18 + Vite + React Router, no backend — scheduling state persists to
`localStorage`.

## What's here

```
app/        the application (see app/README.md for the full tour)
design/     the design canvas sources — one .dc.html per artboard, laid out by canvas.json
```

The design canvas came first: seven artboards (four desktop, three phone) used
to settle layout, colour and typography before any of it was built for real.
The generated canvas bundle itself is not committed — reseed it from `design/`.

## Screens

| Route | |
| --- | --- |
| `/` | Month calendar; pick a day, or book a rehearsal in the side panel |
| `/rehearsal/:date` | The setlist — drag to reorder, tick off what you've run |
| `/song/:id` | Chords over lyrics, with transpose, text sizing and stage mode |
| `/songs` | The library, filtered by collection and key |

## Demo content

The band is fictional. Covers carry real title/artist metadata as a real setlist
would; every full lyric sheet is an original written for this project, so no
copyrighted lyrics ship here.
