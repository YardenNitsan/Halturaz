import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Icon, Logo } from './Icon.jsx';
import { BAND } from '../data.js';
import { useStore } from '../store.jsx';

function MonthStats() {
  const { events, today } = useStore();
  const prefix = today.slice(0, 7); // current month, e.g. "2026-08"
  const keys = Object.keys(events).filter((k) => k.startsWith(prefix));
  const rehearsals = keys.filter((k) => events[k].kind === 'r').length;
  const shows = keys.filter((k) => events[k].kind === 's').length;

  return (
    <div className="rail-section">
      <div className="eyebrow">This month</div>
      <div>
        <div className="stat">
          <span className="stat-dot" style={{ background: 'var(--ink)' }} />
          <span className="stat-label">Rehearsals</span>
          <span className="stat-value">{rehearsals}</span>
        </div>
        <div className="stat">
          <span className="stat-dot" style={{ background: 'var(--gig)' }} />
          <span className="stat-label">Shows</span>
          <span className="stat-value">{shows}</span>
        </div>
      </div>
    </div>
  );
}

export function Shell({ children }) {
  const { songs, today } = useStore();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <div className="app">
      <aside className="rail">
        <div className="brand">
          <Logo />
          <div>
            <div className="brand-name">{BAND.name}</div>
            <div className="brand-sub">
              {BAND.members.length} members · {BAND.city}
            </div>
          </div>
        </div>

        <nav className="nav">
          <NavLink to="/" end className={({ isActive }) => 'nav-item' + (isActive ? ' is-active' : '')}>
            <Icon name="calendar" />
            Calendar
          </NavLink>
          <NavLink to="/songs" className={({ isActive }) => 'nav-item' + (isActive ? ' is-active' : '')}>
            <Icon name="music" />
            Songs
            <span className="nav-count">{songs.length}</span>
          </NavLink>
        </nav>

        <MonthStats />

        <div style={{ marginTop: 'auto', padding: '0 8px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="avatars">
            {BAND.members.map((m) => (
              <div className="avatar" key={m.id} title={`${m.name} · ${m.role}`}>
                {m.initials}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--ink-4)', lineHeight: 1.6 }}>
            {BAND.members.map((m) => m.name).join(', ')}
          </div>
        </div>
      </aside>

      {children}

      <nav className="tabbar">
        <NavLink to="/" end className={({ isActive }) => 'tab' + (isActive ? ' is-active' : '')}>
          <Icon name="calendar" size={20} />
          <span>Calendar</span>
        </NavLink>
        <button className="fab" aria-label="Go to tonight" onClick={() => navigate(`/rehearsal/${today}`)}>
          <Icon name="play" size={18} />
        </button>
        <NavLink to="/songs" className={({ isActive }) => 'tab' + (isActive ? ' is-active' : '')}>
          <Icon name="music" size={20} />
          <span>Songs</span>
        </NavLink>
      </nav>
    </div>
  );
}
