import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Icon } from '../components/Icon.jsx';
import { Wave } from '../components/Wave.jsx';
import { useStore } from '../store.jsx';
import { BAND } from '../data.js';
import { transpose, chordsUsed } from '../lib/chords.js';
import { keyStyle, keyHue } from '../lib/keys.js';
import { longDate, mmss } from '../lib/dates.js';

export default function SongScreen() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const from = params.get('from');
  const navigate = useNavigate();
  const { songs, events } = useStore();

  const [steps, setSteps] = useState(0);
  const [scale, setScale] = useState(1);
  const [stage, setStage] = useState(false);
  const [showChords, setShowChords] = useState(true);

  const song = songs.find((s) => s.id === id);
  const event = from ? events[from] : null;

  const setSongs = useMemo(
    () => (event ? event.songs.map((sid) => songs.find((s) => s.id === sid)).filter(Boolean) : []),
    [event, songs]
  );
  const position = setSongs.findIndex((s) => s.id === id);
  const next = position >= 0 ? setSongs[position + 1] : null;
  const prev = position > 0 ? setSongs[position - 1] : null;

  const go = useCallback(
    (target) => target && navigate(`/song/${target.id}${from ? `?from=${from}` : ''}`),
    [navigate, from]
  );

  // Reset per-song view state when the song changes.
  useEffect(() => { setSteps(0); }, [id]);

  // Rehearsal-room keyboard shortcuts.
  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      const map = {
        '+': () => setSteps((s) => Math.min(11, s + 1)),
        '=': () => setSteps((s) => Math.min(11, s + 1)),
        '-': () => setSteps((s) => Math.max(-11, s - 1)),
        '0': () => setSteps(0),
        ']': () => setScale((s) => Math.min(1.75, +(s + 0.12).toFixed(2))),
        '[': () => setScale((s) => Math.max(0.8, +(s - 0.12).toFixed(2))),
        f: () => setStage((v) => !v),
        c: () => setShowChords((v) => !v),
        j: () => go(next),
        k: () => go(prev),
        Escape: () => (stage ? setStage(false) : navigate(from ? `/rehearsal/${from}` : '/'))
      };
      const fn = map[e.key];
      if (fn) { e.preventDefault(); fn(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, next, prev, stage, from, navigate]);

  if (!song) {
    return (
      <main className="main">
        <div className="empty empty-plain">
          <p>That song isn&rsquo;t in the library.</p>
          <Link to="/songs" className="ghost">Back to songs</Link>
        </div>
      </main>
    );
  }

  const sc = scale * (stage ? 1.3 : 1);
  const chordRow = showChords ? 18 * sc : 0;
  const displayKey = transpose(song.key.replace(/m$/, ''), steps) + (song.key.endsWith('m') ? 'm' : '');
  const capo = song.capo - steps;
  const chords = chordsUsed(song.sections, steps);
  const hasChart = song.sections.length > 0;
  const noteAuthor = BAND.members.find((m) => m.id === song.noteBy);

  // The whole screen retints as you transpose.
  const chartVars = {
    ...keyStyle(displayKey),
    '--k-h': String(keyHue(displayKey) ?? 60),
    '--lyric-size': `${(20 * sc).toFixed(1)}px`,
    '--chord-size': `${(13.5 * sc).toFixed(1)}px`,
    '--chord-row': `${chordRow.toFixed(1)}px`,
    '--line-gap': `${(12 * sc).toFixed(1)}px`
  };

  return (
    <>
      <main className={'main' + (stage ? ' is-stage' : '')} style={{ ...keyStyle(displayKey), '--k-h': String(keyHue(displayKey) ?? 60) }}>
        <header className="song-head" style={stage ? { background: '#0c0c0b' } : undefined}>
          {!stage && (
            <Link to={from ? `/rehearsal/${from}` : '/songs'} className="back" style={{ marginBottom: 13 }}>
              <Icon name="left" size={13} />
              {from ? `Rehearsal — ${longDate(from)}` : 'Songs'}
            </Link>
          )}

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 22, flexWrap: 'wrap' }}>
            <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 7 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                {position >= 0 && <span className="track-num">{String(position + 1).padStart(2, '0')}</span>}
                <h1 className="song-title" style={stage ? { fontSize: 30 } : undefined}>{song.title}</h1>
              </div>
              <div className="meta-row" style={{ fontSize: 13.5, color: 'var(--ink-2)' }}>
                <span>{song.artist}</span>
                <span className="sep">·</span>
                <span className="mono">{mmss(song.sec)}</span>
                <span className="sep">·</span>
                <span className="mono">{song.timeSig}</span>
              </div>
            </div>

            <div className="hide-sm" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 9 }}>
              <div className="meta-card key">
                <small>KEY</small>
                <b>{displayKey}</b>
              </div>
              <div className="meta-card">
                <small>TEMPO</small>
                <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span className="tick" style={{ animationDuration: `${60 / song.bpm}s` }} />
                  <b>{song.bpm}</b>
                </span>
              </div>
              <div className="meta-card">
                <small>CAPO</small>
                <b>{capo === 0 ? 'None' : capo > 0 ? capo : '—'}</b>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
            <div className="seg">
              <button aria-label="Transpose down" onClick={() => setSteps((s) => Math.max(-11, s - 1))}>
                <Icon name="minus" size={14} />
              </button>
              <button className="seg-label" onClick={() => setSteps(0)} title="Reset to the original key">
                <small>TRANSPOSE</small>
                <strong className={steps ? 'is-set' : ''}>{steps === 0 ? 'Original' : steps > 0 ? `+${steps}` : steps}</strong>
              </button>
              <button aria-label="Transpose up" onClick={() => setSteps((s) => Math.min(11, s + 1))}>
                <Icon name="plus" size={14} />
              </button>
            </div>

            <div className="seg">
              <button aria-label="Smaller text" style={{ fontSize: 12, fontWeight: 600 }} onClick={() => setScale((s) => Math.max(0.8, +(s - 0.12).toFixed(2)))}>A</button>
              <button aria-label="Larger text" style={{ fontSize: 17, fontWeight: 600 }} onClick={() => setScale((s) => Math.min(1.75, +(s + 0.12).toFixed(2)))}>A</button>
            </div>

            <button className={'ghost' + (showChords ? ' is-on' : '')} style={{ height: 36 }} onClick={() => setShowChords((v) => !v)}>
              <Icon name="lines" size={14} />
              Chords
            </button>

            <button className={'ghost' + (stage ? ' is-on' : '')} style={{ height: 36 }} onClick={() => setStage((v) => !v)}>
              <Icon name="expand" size={14} />
              {stage ? 'Exit stage' : 'Stage mode'}
            </button>

            {chords.length > 0 && (
              <div className="hide-sm" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 7 }}>
                {chords.slice(0, 7).map((c) => (
                  <span
                    key={c}
                    style={keyStyle(c)}
                    className="key-badge mono"
                  >
                    {c}
                  </span>
                ))}
              </div>
            )}
          </div>
        </header>

        <div style={{ flex: 1, minHeight: 0, display: 'flex', overflow: 'hidden' }}>
          <div className="scroll">
            {hasChart ? (
              <div className="chart" style={chartVars}>
                {song.sections.map((sec, si) => (
                  <section key={si} className={'chart-section' + (sec.accent ? ' accent' : '')}>
                    <div className="chart-label">
                      <span>{sec.label}</span>
                      <small>{sec.bars}</small>
                    </div>
                    {sec.lines.map((line, li) => {
                      const chordsOnly = line.every((seg) => !seg.t);
                      return (
                        <p key={li} className={'line' + (chordsOnly ? ' chords-only' : '')}>
                          {line.map((seg, gi) => (
                            <span className="seg" key={gi}>
                              <span className="c">{showChords ? transpose(seg.c, steps) : ' '}</span>
                              <span className="t">{seg.t || ''}</span>
                            </span>
                          ))}
                        </p>
                      );
                    })}
                  </section>
                ))}
                <div className="chart-end">
                  <i /><span>END</span><i />
                </div>
              </div>
            ) : (
              <div className="empty empty-plain">
                <Icon name="lines" size={30} style={{ color: '#3f3833' }} />
                <p>
                  No chart for {song.title} yet. Key is {song.key} at {song.bpm} BPM — someone still has to write the rest down.
                </p>
                <button className="ghost">Add chords &amp; lyrics</button>
              </div>
            )}
          </div>

          {!stage && (
            <aside className="aside">
              {hasChart && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                  <div className="eyebrow">Structure</div>
                  <div>
                    {song.sections.map((sec, i) => (
                      <div key={i} className={'struct-row' + (sec.accent ? ' hot' : '')}>
                        <span className="dot" />
                        <span>{sec.label}</span>
                        <small>{sec.bars}</small>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {song.note && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                  <div className="eyebrow">Band note</div>
                  <div className="note">{song.note}</div>
                  {noteAuthor && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 2 }}>
                      <div className="avatar" style={{ width: 22, height: 22, marginLeft: 0, fontSize: 10, borderColor: 'transparent' }}>{noteAuthor.initials}</div>
                      <span style={{ fontSize: 11, color: 'var(--ink-4)' }}>
                        {noteAuthor.name} · updated {song.noteAge}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                <div className="eyebrow">Recording</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#0f0e0d', border: '1px solid var(--line)', borderRadius: 11, padding: '12px 13px' }}>
                  <button
                    aria-label="Play room take"
                    style={{ width: 30, height: 30, borderRadius: 99, background: '#221e1b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gig)', flex: '0 0 auto' }}
                  >
                    <Icon name="play" size={12} />
                  </button>
                  <div className="grow">
                    <div style={{ fontSize: 12, fontWeight: 500, color: '#d9d2cb' }}>Room take · Aug 18</div>
                    <Wave lit={14} height={16} />
                  </div>
                  <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-4)' }}>4:31</span>
                </div>
              </div>

              <p className="hide-sm" style={{ margin: 'auto 0 0', fontSize: 10.5, color: 'var(--ink-4)', lineHeight: 1.7 }}>
                <b style={{ color: 'var(--ink-3)', fontWeight: 600 }}>Shortcuts</b>
                <br />+ / − transpose · 0 reset · [ ] text size
                <br />C chords · F stage · J / K next &amp; previous
              </p>
            </aside>
          )}
        </div>

        {(next || prev) && (
          <div className="show-sm" style={{ flex: '0 0 auto', background: '#111010', borderTop: '1px solid var(--card)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              className="icon-btn bordered"
              style={{ width: 46, height: 46, borderRadius: 12 }}
              aria-label="Previous song"
              disabled={!prev}
              onClick={() => go(prev)}
            >
              <Icon name="left" size={17} />
            </button>
            <div className="grow">
              <div className="eyebrow" style={{ fontSize: 10 }}>{next ? 'Up next' : 'Last in the set'}</div>
              <div className="truncate" style={{ fontSize: 14, fontWeight: 500, color: '#e8e2db', marginTop: 2 }}>
                {next ? next.title : song.title}
              </div>
            </div>
            {next && <span className="key-badge" style={keyStyle(next.key)}>{next.key}</span>}
            <button
              className="btn"
              style={{ width: 46, height: 46, borderRadius: 12, padding: 0 }}
              aria-label="Next song"
              disabled={!next}
              onClick={() => go(next)}
            >
              <Icon name="right" size={18} />
            </button>
          </div>
        )}
      </main>
    </>
  );
}
