import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon.jsx';
import { useStore } from '../store.jsx';
import { ROOMS, TIMES } from '../data.js';
import { MONTHS, monthGrid, addMonths, parseISO, longDate, weekdayOf, runtime, relative } from '../lib/dates.js';
import { keyStyle } from '../lib/keys.js';

const DOW = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const DOW_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function CalendarScreen() {
  const { events, songs, today, dispatch, toast } = useStore();
  const navigate = useNavigate();

  const start = parseISO(today);
  const [view, setView] = useState({ y: start.y, m: start.m });
  const [selected, setSelected] = useState(today);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({ time: '20:00', place: ROOMS[0], note: '' });

  const cells = useMemo(() => monthGrid(view.y, view.m), [view]);
  const event = events[selected];

  const byId = useMemo(() => Object.fromEntries(songs.map((s) => [s.id, s])), [songs]);
  const setSongs = event ? event.songs.map((id) => byId[id]).filter(Boolean) : [];
  const totalSec = setSongs.reduce((a, s) => a + s.sec, 0);

  function openCreate(date) {
    setSelected(date);
    setDraft({ time: '20:00', place: ROOMS[0], note: '' });
    setCreating(true);
  }

  function pickDay(date) {
    setSelected(date);
    setCreating(false);
  }

  function save() {
    dispatch({ type: 'create-rehearsal', date: selected, ...draft });
    setCreating(false);
    toast(`Rehearsal added · ${longDate(selected)}`);
  }

  return (
    <>
      <main className="main">
        <header className="cal-head">
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <h1 className="cal-title">{MONTHS[view.m]}</h1>
            <span className="cal-year">{view.y}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button className="icon-btn bordered" aria-label="Previous month" onClick={() => setView((v) => addMonths(v.y, v.m, -1))}>
              <Icon name="left" size={15} />
            </button>
            <button className="icon-btn bordered" aria-label="Next month" onClick={() => setView((v) => addMonths(v.y, v.m, 1))}>
              <Icon name="right" size={15} />
            </button>
            <button
              className="ghost"
              onClick={() => {
                setView({ y: start.y, m: start.m });
                pickDay(today);
              }}
            >
              Today
            </button>
          </div>

          <button className="btn" style={{ marginLeft: 'auto' }} onClick={() => openCreate(selected)}>
            <Icon name="plus" size={15} />
            New rehearsal
          </button>
        </header>

        <div className="cal-grid-wrap">
          <div className="cal-dow">
            {DOW.map((d, i) => (
              <span key={i}>
                <span className="hide-sm">{d}</span>
                <span className="show-sm">{DOW_SHORT[i]}</span>
              </span>
            ))}
          </div>

          <div className="cal-grid">
            {cells.map((c) => {
              const ev = c.date ? events[c.date] : null;
              const cls = [
                'day',
                !c.inMonth && 'is-out',
                ev && 'has-event',
                ev && `kind-${ev.kind}`,
                c.date === selected && 'is-selected',
                c.date === today && 'is-today',
                c.date === today && ev && 'is-tonight'
              ]
                .filter(Boolean)
                .join(' ');

              return (
                <button
                  key={c.key}
                  className={cls}
                  disabled={!c.inMonth}
                  onClick={() => pickDay(c.date)}
                  onDoubleClick={() => ev && navigate(`/rehearsal/${c.date}`)}
                  aria-label={c.date ? `${longDate(c.date)}${ev ? `, ${ev.kind === 's' ? 'show' : 'rehearsal'} at ${ev.time}` : ', no rehearsal'}` : undefined}
                >
                  <div className="day-top">
                    <span className="day-num">{c.label}</span>
                  </div>
                  {ev && (
                    <div className="day-body">
                      <span className="day-time">{ev.time}</span>
                      {ev.songs.length ? (
                        <span className="day-keys" title={ev.songs.map((sid) => byId[sid]?.key).filter(Boolean).join(' · ')}>
                          {ev.songs.slice(0, 6).map((sid) => {
                            const song = byId[sid];
                            return song ? <i key={sid} style={keyStyle(song.key)} /> : null;
                          })}
                          {ev.songs.length > 6 && <span>+{ev.songs.length - 6}</span>}
                        </span>
                      ) : (
                        <span className="day-sub">{ev.kind === 's' ? ev.place : 'No songs yet'}</span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </main>

      <aside className="panel">
        {creating ? (
          <div className="panel-inner slidein">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="eyebrow">New rehearsal</div>
              <button className="icon-btn" aria-label="Cancel" onClick={() => setCreating(false)}>
                <Icon name="close" size={14} />
              </button>
            </div>

            <h2 style={{ fontSize: 26 }}>{longDate(selected)}</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label className="eyebrow" style={{ letterSpacing: '0.02em', textTransform: 'none', fontSize: 11, color: 'var(--ink-2)' }}>
                Start time
              </label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {TIMES.map((t) => (
                  <button key={t} className={'chip' + (draft.time === t ? ' is-on' : '')} onClick={() => setDraft((d) => ({ ...d, time: t }))}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label className="eyebrow" style={{ letterSpacing: '0.02em', textTransform: 'none', fontSize: 11, color: 'var(--ink-2)' }}>
                Room
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {ROOMS.map((p) => (
                  <button
                    key={p}
                    className={'chip' + (draft.place === p ? ' is-on' : '')}
                    style={{ height: 42, justifyContent: 'space-between', padding: '0 14px' }}
                    onClick={() => setDraft((d) => ({ ...d, place: p }))}
                  >
                    <span>{p}</span>
                    {draft.place === p && <Icon name="check" size={13} />}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label className="eyebrow" style={{ letterSpacing: '0.02em', textTransform: 'none', fontSize: 11, color: 'var(--ink-2)' }} htmlFor="note">
                Note <span style={{ color: 'var(--ink-4)', fontWeight: 400 }}>optional</span>
              </label>
              <textarea
                id="note"
                className="field"
                placeholder="What are we working on?"
                value={draft.note}
                onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value }))}
              />
            </div>

            <button className="btn btn-lg btn-block" onClick={save}>
              Add to calendar
            </button>
            <p style={{ margin: '-10px 0 0', fontSize: 11, color: 'var(--ink-4)', textAlign: 'center' }}>
              Songs are added on the rehearsal screen.
            </p>
          </div>
        ) : event ? (
          <div className="panel-inner slidein" key={selected}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className={'badge' + (event.kind === 's' ? ' show' : '')}>
                {selected === today ? 'TONIGHT' : event.kind === 's' ? 'SHOW' : 'REHEARSAL'}
              </span>
              <span style={{ fontSize: 11, color: 'var(--ink-4)' }}>
                {weekdayOf(selected)} · {relative(selected, today)}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <h2 style={{ fontSize: 26, lineHeight: 1.1 }}>{longDate(selected)}</h2>
              <div className="meta-row" style={{ fontSize: 13 }}>
                <span className="strong">{event.time}</span>
                <span className="sep">·</span>
                <span>{event.place}</span>
              </div>
              {event.note && <div className="note" style={{ fontSize: 12.5 }}>{event.note}</div>}
            </div>

            {setSongs.length > 0 && (
              <div>
                <div className="keybar" title={setSongs.map((s2) => s2.key).join(' · ')}>
                  {setSongs.map((s2) => (
                    <i key={s2.id} style={keyStyle(s2.key)} />
                  ))}
                </div>
                <div style={{ fontSize: 10.5, color: 'var(--ink-3)', marginTop: 7 }}>
                  Key signature of the set — one band per song
                </div>
              </div>
            )}

            <div className="stat-row">
              <div className="stat-cell">
                <b>{event.songs.length}</b>
                <span>songs</span>
              </div>
              <div className="stat-cell">
                <b>{totalSec ? runtime(totalSec) : '—'}</b>
                <span>runtime</span>
              </div>
              <div className="stat-cell">
                <b>{event.done.length}</b>
                <span>reviewed</span>
              </div>
            </div>

            {setSongs.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div className="eyebrow">Setlist</div>
                  <span style={{ fontSize: 11, color: 'var(--ink-4)' }}>first {Math.min(4, setSongs.length)}</span>
                </div>
                <div>
                  {setSongs.slice(0, 4).map((s, i) => (
                    <button key={s.id} className="mini-row" onClick={() => navigate(`/song/${s.id}?from=${selected}`)}>
                      <span className="mini-num">{i + 1}</span>
                      <span className="grow">
                        <span className="mini-title truncate" style={{ display: 'block' }}>{s.title}</span>
                        <span className="mini-sub">{s.artist}</span>
                      </span>
                      <span className="key-badge" style={keyStyle(s.key)}>{s.key}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="empty">
                <p>No songs yet. Build the setlist on the rehearsal screen.</p>
              </div>
            )}

            <button className="btn btn-lg btn-block" onClick={() => navigate(`/rehearsal/${selected}`)}>
              Open rehearsal
              <Icon name="arrow" size={15} />
            </button>
          </div>
        ) : (
          <div className="panel-inner slidein" key={selected}>
            <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>{weekdayOf(selected)}</div>
            <h2 style={{ fontSize: 26 }}>{longDate(selected)}</h2>
            <div className="empty">
              <Icon name="music" size={30} style={{ color: '#3f3833' }} />
              <p>Nothing scheduled. Book the room while it&rsquo;s still free.</p>
              <button className="btn" onClick={() => openCreate(selected)}>
                <Icon name="plus" size={15} />
                Add rehearsal
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
