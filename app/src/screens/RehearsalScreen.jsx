import React, { useState, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Icon } from '../components/Icon.jsx';
import { useStore } from '../store.jsx';
import { BAND, ATTENDANCE } from '../data.js';
import { MONTHS, parseISO, longDate, weekdayOf, mmss, runtime, relative } from '../lib/dates.js';
import { keyStyle } from '../lib/keys.js';

export default function RehearsalScreen() {
  const { date } = useParams();
  const navigate = useNavigate();
  const { events, songs, today, dispatch, toast } = useStore();

  const [query, setQuery] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [drag, setDrag] = useState({ from: null, over: null });
  const dragging = useRef(null);

  const event = events[date];
  const byId = useMemo(() => Object.fromEntries(songs.map((s) => [s.id, s])), [songs]);

  if (!event) {
    return (
      <main className="main">
        <div className="empty empty-plain">
          <Icon name="calendar" size={32} style={{ color: '#3f3833' }} />
          <p>Nothing is booked on {longDate(date)}.</p>
          <Link to="/" className="ghost">Back to the calendar</Link>
        </div>
      </main>
    );
  }

  const setSongs = event.songs.map((id) => byId[id]).filter(Boolean);
  const totalSec = setSongs.reduce((a, s) => a + s.sec, 0);
  const q = query.trim().toLowerCase();
  const visible = setSongs
    .map((s, i) => ({ ...s, index: i }))
    .filter((s) => !q || `${s.title} ${s.artist} ${s.key}`.toLowerCase().includes(q));

  const pool = songs.filter((s) => !event.songs.includes(s.id));
  const isShow = event.kind === 's';
  const { m } = parseISO(date);

  const attendance = ATTENDANCE[date];
  const keyTally = setSongs.reduce((acc, s) => ({ ...acc, [s.key]: (acc[s.key] || 0) + 1 }), {});

  function onDrop(toIndex) {
    const from = dragging.current;
    setDrag({ from: null, over: null });
    dragging.current = null;
    if (from === null || from === toIndex) return;
    dispatch({ type: 'reorder', date, from, to: toIndex });
  }

  function remove(song) {
    const snapshot = events;
    dispatch({ type: 'remove-song', date, songId: song.id });
    toast(`Removed ${song.title}`, snapshot);
  }

  function add(song) {
    const snapshot = events;
    dispatch({ type: 'add-song', date, songId: song.id });
    toast(`Added ${song.title} to the set`, snapshot);
  }

  return (
    <>
      <main className="main">
        <header className="screen-head">
          <Link to="/" className="back" style={{ marginBottom: 14 }}>
            <Icon name="left" size={13} />
            {MONTHS[m]} {parseISO(date).y}
          </Link>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className={'badge' + (isShow ? ' show' : '')}>
                  {date === today ? 'TONIGHT' : isShow ? 'SHOW' : 'REHEARSAL'}
                </span>
                <span style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>
                  {weekdayOf(date)} · {relative(date, today)}
                </span>
              </div>

              <h1 className="screen-title">
                {isShow ? 'Show' : 'Rehearsal'} — {longDate(date)}
              </h1>

              <div className="meta-row">
                <span className="strong">{event.time}</span>
                <span className="sep">·</span>
                <span>{event.place}</span>
                <span className="sep">·</span>
                <span className="mono">{event.songs.length} songs</span>
                {totalSec > 0 && (
                  <>
                    <span className="sep">·</span>
                    <span className="mono">~{runtime(totalSec)}</span>
                  </>
                )}
              </div>
            </div>

            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 20 }}>
              <div className="hide-sm" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 7 }}>
                <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                  <b className="mono" style={{ color: 'var(--ink)' }}>{event.done.length}</b> of{' '}
                  <span className="mono">{event.songs.length}</span> reviewed
                </div>
                <div className="progress" style={{ width: 150 }}>
                  <i style={{ width: `${event.songs.length ? (event.done.length / event.songs.length) * 100 : 0}%` }} />
                </div>
              </div>

              {setSongs.length > 0 && (
                <button className="btn btn-lg" onClick={() => navigate(`/song/${setSongs[0].id}?from=${date}`)}>
                  <Icon name="play" size={15} />
                  Start run-through
                </button>
              )}
            </div>
          </div>
        </header>

        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', padding: '20px 34px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em' }}>Setlist</h2>
            <span className="hide-sm" style={{ fontSize: 11, color: 'var(--ink-4)' }}>drag to reorder</span>

            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 9 }}>
              <div className="search hide-sm">
                <Icon name="search" size={14} />
                <input className="field" style={{ width: 200, height: 34 }} placeholder="Filter songs" value={query} onChange={(e) => setQuery(e.target.value)} />
              </div>
              <button className={'ghost' + (addOpen ? ' is-on' : '')} onClick={() => setAddOpen((v) => !v)}>
                <Icon name="plus" size={14} />
                Add song
              </button>
            </div>
          </div>

          <div className="set-head">
            <span>#</span>
            <span>Title</span>
            <span>Key</span>
            <span>Tempo</span>
            <span className="right">Time</span>
            <span />
          </div>

          <div className="scroll" style={{ padding: '6px 0 26px' }}>
            {visible.map((s) => {
              const done = event.done.includes(s.id);
              const cls = [
                'set-row',
                done && 'is-done',
                drag.from === s.index && 'is-dragging',
                drag.over === s.index && drag.from !== null && drag.from !== s.index && 'is-over'
              ]
                .filter(Boolean)
                .join(' ');

              return (
                <div
                  key={s.id}
                  className={cls}
                  style={keyStyle(s.key)}
                  draggable
                  onDragStart={(e) => {
                    dragging.current = s.index;
                    e.dataTransfer.effectAllowed = 'move';
                    try { e.dataTransfer.setData('text/plain', String(s.index)); } catch { /* Safari */ }
                    setDrag({ from: s.index, over: null });
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    setDrag((d) => (d.over === s.index ? d : { ...d, over: s.index }));
                  }}
                  onDrop={(e) => { e.preventDefault(); onDrop(s.index); }}
                  onDragEnd={() => { dragging.current = null; setDrag({ from: null, over: null }); }}
                >
                  <div className="set-lead" style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <span className="grip" aria-hidden><Icon name="grip" size={13} /></span>
                    <span className="set-num">{String(s.index + 1).padStart(2, '0')}</span>
                  </div>

                  <div className="set-body grow">
                    <button
                      onClick={() => navigate(`/song/${s.id}?from=${date}`)}
                      style={{ display: 'flex', flexDirection: 'column', gap: 2, textAlign: 'left', width: '100%' }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                        <span className="set-title truncate">{s.title}</span>
                        {s.needsWork && <span className="tag tag-work">NEEDS WORK</span>}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
                        <span className="set-artist truncate">{s.artist}</span>
                        <span className="show-sm key-badge">{s.key}</span>
                        <span className="show-sm mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{s.bpm} bpm</span>
                        {s.note && <span className="set-note truncate hide-sm">— {s.note.split('.')[0]}</span>}
                      </span>
                    </button>
                  </div>

                  <div className="set-key"><span className="key-badge">{s.key}</span></div>

                  <div className="set-tempo" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ width: 5, height: 5, borderRadius: 99, background: 'var(--line-2)' }} />
                    <span className="set-bpm">{s.bpm}</span>
                  </div>

                  <div className="set-time set-dur">{mmss(s.sec)}</div>

                  <div className="set-actions" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                    <button className="kill" aria-label={`Remove ${s.title}`} onClick={() => remove(s)}>
                      <Icon name="close" size={13} />
                    </button>
                    <button
                      className={'check' + (done ? ' is-on' : '')}
                      aria-label={`Mark ${s.title} reviewed`}
                      aria-pressed={done}
                      onClick={() => dispatch({ type: 'toggle-done', date, songId: s.id })}
                    >
                      <Icon name="check" size={12} />
                    </button>
                  </div>
                </div>
              );
            })}

            {setSongs.length === 0 && (
              <div className="empty empty-plain">
                <Icon name="music" size={30} style={{ color: '#3f3833' }} />
                <p>The setlist is empty. Pull something in from the library and the running time fills itself in.</p>
                <button className="ghost" onClick={() => setAddOpen(true)}>Add song</button>
              </div>
            )}

            {setSongs.length > 0 && visible.length === 0 && (
              <div className="empty empty-plain">
                <Icon name="search" size={30} style={{ color: '#3f3833' }} />
                <p>No song matches &ldquo;{query}&rdquo;</p>
                <button className="ghost" onClick={() => setQuery('')}>Clear filter</button>
              </div>
            )}
          </div>
        </div>
      </main>

      <aside className="aside" style={{ width: 326, flex: '0 0 326px' }}>
        {addOpen ? (
          <div className="slidein" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="eyebrow">Add from library</div>
              <button className="icon-btn" aria-label="Close" onClick={() => setAddOpen(false)}>
                <Icon name="close" size={14} />
              </button>
            </div>

            {pool.length ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {pool.map((s) => (
                  <button key={s.id} className="mini-row" style={{ margin: 0, width: '100%', padding: 10 }} onClick={() => add(s)}>
                    <span className="grow">
                      <span className="mini-title truncate" style={{ display: 'block' }}>{s.title}</span>
                      <span className="mini-sub">{s.artist} · {s.key} · {s.bpm} BPM</span>
                    </span>
                    <span style={{ width: 26, height: 26, borderRadius: 99, border: '1px solid var(--line-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gig)', flex: '0 0 auto' }}>
                      <Icon name="plus" size={13} />
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 12.5, color: 'var(--ink-4)', textAlign: 'center', padding: '30px 10px', lineHeight: 1.55 }}>
                Every song in the library is already in this set.
              </p>
            )}
          </div>
        ) : (
          <>
            {event.note && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div className="eyebrow">Note for {date === today ? 'tonight' : 'this one'}</div>
                <div className="note">{event.note}</div>
              </div>
            )}

            {attendance && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                <div className="eyebrow">Who&rsquo;s coming</div>
                <div>
                  {BAND.members.map((m2) => (
                    <div className="att-row" key={m2.id}>
                      <div className="avatar" style={{ width: 30, height: 30, marginLeft: 0, borderColor: 'transparent' }}>{m2.initials}</div>
                      <div className="grow">
                        <div style={{ fontSize: 12.5, fontWeight: 500, color: '#d9d2cb' }}>{m2.name}</div>
                        <div style={{ fontSize: 10.5, color: 'var(--ink-4)' }}>{m2.role}</div>
                      </div>
                      <span className={'att-status ' + (attendance[m2.id] || 'in')}>
                        {attendance[m2.id] === 'late' ? 'Late' : 'In'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {setSongs.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                <div className="eyebrow">Keys in this set</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {Object.entries(keyTally).map(([k, n]) => (
                    <span
                      key={k}
                      className="key-badge"
                      style={keyStyle(k)}
                    >
                      {k} ×{n}
                    </span>
                  ))}
                </div>
                <p style={{ margin: 0, fontSize: 11.5, color: 'var(--ink-4)', lineHeight: 1.55 }}>
                  {Object.values(keyTally).some((n) => n > 1)
                    ? 'Repeated keys are highlighted — worth spacing them out.'
                    : 'Every song sits in its own key.'}
                </p>
              </div>
            )}
          </>
        )}
      </aside>
    </>
  );
}
