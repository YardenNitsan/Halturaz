import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon.jsx';
import { useStore } from '../store.jsx';
import { mmss, runtime } from '../lib/dates.js';

const GROUPS = [
  { id: 'all', label: 'All songs', test: () => true },
  { id: 'originals', label: 'Originals', test: (s) => s.own },
  { id: 'covers', label: 'Covers', test: (s) => !s.own },
  { id: 'charts', label: 'Has chords', test: (s) => s.sections.length > 0 },
  { id: 'work', label: 'Needs work', test: (s) => s.needsWork }
];

export default function LibraryScreen() {
  const { songs } = useStore();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState('all');
  const [key, setKey] = useState('All');

  const keys = useMemo(() => ['All', ...Array.from(new Set(songs.map((s) => s.key)))], [songs]);
  const active = GROUPS.find((g) => g.id === group) || GROUPS[0];

  const q = query.trim().toLowerCase();
  const rows = songs
    .filter(active.test)
    .filter((s) => key === 'All' || s.key === key)
    .filter((s) => !q || `${s.title} ${s.artist} ${s.key}`.toLowerCase().includes(q));

  const totalSec = songs.reduce((a, s) => a + s.sec, 0);

  return (
    <>
      <aside className="rail" style={{ borderRight: 0, width: 200, flex: '0 0 200px', background: 'transparent', paddingTop: 90 }}>
        <div className="rail-section">
          <div className="eyebrow">Collections</div>
          {GROUPS.map((g) => {
            const n = songs.filter(g.test).length;
            return (
              <button
                key={g.id}
                className="nav-item"
                style={{ height: 34, fontSize: 12.5, background: group === g.id ? 'var(--raised-2)' : undefined, color: group === g.id ? 'var(--text)' : undefined, fontWeight: group === g.id ? 600 : 400 }}
                onClick={() => setGroup(g.id)}
              >
                {g.label}
                <span className="nav-count">{n}</span>
              </button>
            );
          })}
        </div>
        <div style={{ marginTop: 'auto', padding: '0 8px', fontSize: 10.5, color: 'var(--fainter)', lineHeight: 1.6 }}>
          Library total
          <br />
          <span className="mono" style={{ color: 'var(--dim)', fontSize: 13 }}>{runtime(totalSec)}</span> of material
        </div>
      </aside>

      <main className="main">
        <header className="screen-head" style={{ background: 'transparent', borderBottom: 0, paddingBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 18, flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ fontSize: 34, marginBottom: 7 }}>Songs</h1>
              <div style={{ fontSize: 13, color: 'var(--dim)' }}>
                {rows.length} of {songs.length} · {active.label}
              </div>
            </div>

            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 9 }}>
              <div className="search">
                <Icon name="search" size={14} />
                <input
                  className="field"
                  style={{ width: 250, height: 36 }}
                  placeholder="Search title, artist or key"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <button className="btn hide-sm">
                <Icon name="plus" size={15} />
                New song
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 16, flexWrap: 'wrap' }}>
            <span className="eyebrow hide-sm" style={{ marginRight: 3 }}>Key</span>
            {keys.map((k) => (
              <button key={k} className={'chip mono' + (key === k ? ' is-on' : '')} onClick={() => setKey(k)}>
                {k}
              </button>
            ))}
          </div>
        </header>

        <div className="lib-head" style={{ marginTop: 18 }}>
          <span />
          <span>Title</span>
          <span>Key</span>
          <span>Tempo</span>
          <span className="right">Time</span>
          <span>Last played</span>
          <span />
        </div>

        <div className="scroll" style={{ padding: '6px 20px 30px' }}>
          {rows.map((s) => (
            <button key={s.id} className="lib-row" onClick={() => navigate(`/song/${s.id}`)}>
              <span className={'art' + (s.own ? ' own' : '')}>{s.key}</span>

              <span className="grow" style={{ display: 'flex', flexDirection: 'column', gap: 2, textAlign: 'left' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <span className="set-title truncate">{s.title}</span>
                  {s.needsWork && <span className="tag tag-work">NEEDS WORK</span>}
                  {s.sections.length === 0 && <span className="tag" style={{ color: 'var(--fainter)', background: 'var(--raised)' }}>NO CHART</span>}
                </span>
                <span className="set-artist truncate">{s.artist}</span>
              </span>

              <span className="lib-key"><span className="key-badge">{s.key}</span></span>
              <span className="lib-tempo set-bpm">{s.bpm} <i>bpm</i></span>
              <span className="lib-time set-dur">{mmss(s.sec)}</span>
              <span className="lib-last" style={{ fontSize: 12, color: 'var(--faint)' }}>{s.lastPlayed}</span>
              <span className="go"><Icon name="arrow" size={13} /></span>
            </button>
          ))}

          {rows.length === 0 && (
            <div className="empty empty-plain">
              <Icon name="search" size={32} style={{ color: '#3f3833' }} />
              <p>Nothing in the library matches that</p>
              <button
                className="ghost"
                onClick={() => {
                  setQuery('');
                  setGroup('all');
                  setKey('All');
                }}
              >
                Reset filters
              </button>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
