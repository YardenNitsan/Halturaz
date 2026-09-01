import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Icon } from '../components/Icon.jsx';
import { useStore } from '../store.jsx';
import { useI18n } from '../i18n/index.js';
import { BAND } from '../data.js';
import { hue, memberHue, tempoHue } from '../lib/hues.js';
import { transpose, chordsUsed } from '../lib/chords.js';
import { longDate, mmss, isISODate } from '../lib/dates.js';
import { consumeNoteAutoShow } from '../lib/sessionNotes.js';

export default function SongScreen() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const from = params.get('from');
  const navigate = useNavigate();
  const { songs, events, dispatch, notify, locale } = useStore();
  const { t } = useI18n();

  const [steps, setSteps] = useState(0);
  const [scale, setScale] = useState(1);
  const [stage, setStage] = useState(false);
  const [showChords, setShowChords] = useState(true);
  const [noteOpen, setNoteOpen] = useState(false);
  const [jumpOpen, setJumpOpen] = useState(false);
  const notePopRef = React.useRef(null);
  const jumpRef = React.useRef(null);

  const song = songs.find((s) => s.id === id);
  const inSet = from && isISODate(from) && events[from] ? from : null;
  const event = inSet ? events[inSet] : null;

  const setSongs = useMemo(
    () => (event ? event.songs.map((sid) => songs.find((s) => s.id === sid)).filter(Boolean) : []),
    [event, songs]
  );
  const position = setSongs.findIndex((s) => s.id === id);
  const next = position >= 0 ? setSongs[position + 1] : null;
  const prev = position > 0 ? setSongs[position - 1] : null;

  const go = useCallback(
    (target) => target && navigate(`/song/${target.id}${inSet ? `?from=${inSet}` : ''}`),
    [navigate, inSet]
  );

  // Walking into a song hands you the note first — once per tab session, even
  // across a refresh. Stepping to another song in a set is a first visit of
  // its own. The note button still opens it any time after that.
  const hasNote = !!song?.note;
  useEffect(() => {
    setSteps(0);
    setJumpOpen(false);
    setNoteOpen(hasNote && consumeNoteAutoShow('song', id));
  }, [id, hasNote]);
  useEffect(() => { if (noteOpen) notePopRef.current?.focus(); }, [noteOpen]);

  useEffect(() => {
    if (!jumpOpen) return;
    const onPointer = (e) => {
      if (!jumpRef.current?.contains(e.target)) setJumpOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    return () => document.removeEventListener('pointerdown', onPointer);
  }, [jumpOpen]);

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
        Escape: () =>
          jumpOpen
            ? setJumpOpen(false)
            : noteOpen
              ? setNoteOpen(false)
              : stage
                ? setStage(false)
                : navigate(inSet ? `/rehearsal/${inSet}` : '/songs')
      };
      const fn = map[e.key] || map[e.key.toLowerCase()];
      if (fn) { e.preventDefault(); fn(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, next, prev, stage, noteOpen, jumpOpen, inSet, navigate]);

  if (!song) {
    return (
      <main className="main">
        <div className="empty empty-plain">
          <p>{t('song.notFound')}</p>
          <Link to="/songs" className="ghost">{t('song.backSongs')}</Link>
        </div>
      </main>
    );
  }

  const chordRow = showChords ? 18 : 0;
  const displayKey = transpose(song.key.replace(/m$/, ''), steps) + (song.key.endsWith('m') ? 'm' : '');
  const capo = song.capo - steps;
  const chords = chordsUsed(song.sections, steps);
  const hasChart = song.sections.length > 0;
  const noteAuthor = BAND.members.find((m) => m.id === song.noteBy);
  const chartVars = { '--sc': scale, '--chord-row-base': `${chordRow}px` };
  const shiftLabel = steps ? (steps > 0 ? ` +${steps}` : ` ${steps}`) : '';

  const jumpTo = (i) => {
    setJumpOpen(false);
    const el = document.getElementById(`chart-sec-${i}`);
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  };

  return (
    <>
      {stage && (
        <div className="stage-bar">
          <button aria-label={t('song.smallerText')} style={{ fontSize: 13, fontWeight: 600 }} onClick={() => setScale((v) => Math.max(0.8, +(v - 0.12).toFixed(2)))}>A</button>
          <button aria-label={t('song.largerText')} style={{ fontSize: 18, fontWeight: 600 }} onClick={() => setScale((v) => Math.min(1.75, +(v + 0.12).toFixed(2)))}>A</button>
          <button
            className={showChords ? 'is-on' : ''}
            aria-label={t('song.showChords')}
            aria-pressed={showChords}
            onClick={() => setShowChords((v) => !v)}
          >
            <Icon name="lines" size={16} />
          </button>
          <button aria-label={t('song.exitStageAria')} onClick={() => setStage(false)}>
            <Icon name="close" size={16} />
          </button>
        </div>
      )}

      <main className={'main' + (stage ? ' is-stage' : '')}>
        <header className="song-head" style={stage ? { background: 'var(--bg)' } : undefined}>
          {!stage && (
            <Link to={inSet ? `/rehearsal/${inSet}` : '/songs'} className="back">
              <Icon name="left" size={13} />
              {inSet
                ? event.kind === 's'
                  ? t('song.backShow', { date: longDate(inSet, locale) })
                  : t('song.backRehearsal', { date: longDate(inSet, locale) })
                : t('nav.songs')}
            </Link>
          )}

          {/* Title, then every fact about the song on one readable line.
              The tempo and capo used to sit in boxes at the far end of the
              header, pulling the eye away from the title they describe. */}
          <div className="song-headline">
            <div className="song-title-row">
              {position >= 0 && <span className="track-num">{String(position + 1).padStart(2, '0')}</span>}
              <h1 className="song-title" style={stage ? { fontSize: 30 } : undefined}>{song.title}</h1>
            </div>

            <div className="meta-row song-facts">
              <span>{song.artist}</span>
              <span className="sep">·</span>
              <span className="mono">{mmss(song.sec)}</span>
              {/* The time signature is the one fact a phone can spare. */}
              <span className="sep hide-sm">·</span>
              <span className="mono hide-sm">{song.timeSig}</span>
              <span className="sep">·</span>
              <span className="song-bpm">
                <span className="tick" style={{ animationDuration: `${60 / song.bpm}s`, ...tempoHue(song.bpm) }} />
                <span className="mono">{song.bpm}</span> {t('common.bpm')}
              </span>
              {/* A capo is only worth saying when there is one — transposed
                  away, it has nothing to add. */}
              {capo > 0 && (
                <>
                  <span className="sep">·</span>
                  <span>{t('song.capo')} <span className="mono">{capo}</span></span>
                </>
              )}
            </div>
          </div>

          <div className="song-ctl">
            {/* Value controls share the first row with the chords toggle,
                which sits in the gap once the type-size letters sit together.
                The remaining on/off toggles are their own group. */}
            <div className="ctl-group">
              <div className="seg seg-key">
                <button aria-label={t('song.transposeDown')} onClick={() => setSteps((s) => Math.max(-11, s - 1))}>
                  <Icon name="minus" size={14} />
                </button>
                <button
                  className="seg-label"
                  onClick={() => setSteps(0)}
                  title={t('song.keyReset')}
                  aria-label={t('song.keyAria', { key: displayKey, shift: shiftLabel })}
                >
                  <small>{steps === 0 ? 'KEY' : `KEY ${steps > 0 ? `+${steps}` : steps}`}</small>
                  <strong className={steps ? 'is-set' : ''} style={hue(displayKey)}>{displayKey}</strong>
                </button>
                <button aria-label={t('song.transposeUp')} onClick={() => setSteps((s) => Math.min(11, s + 1))}>
                  <Icon name="plus" size={14} />
                </button>
              </div>

              <div className="seg seg-scale">
                <button className="scale-down" aria-label={t('song.smallerText')} onClick={() => setScale((s) => Math.max(0.8, +(s - 0.12).toFixed(2)))}>A</button>
                <button className="scale-up" aria-label={t('song.largerText')} onClick={() => setScale((s) => Math.min(1.75, +(s + 0.12).toFixed(2)))}>A</button>
              </div>

              <button
                className={'ghost ctl-chords' + (showChords ? ' is-on' : '')}
                aria-label={t('song.chords')}
                aria-pressed={showChords}
                onClick={() => setShowChords((v) => !v)}
              >
                <Icon name="lines" size={14} />
                <span className="btn-label">{t('song.chords')}</span>
              </button>
            </div>

            <div className="ctl-toggles">
              {song.note && (
                <button
                  className={'ghost ctl-note' + (noteOpen ? ' is-on' : '')}
                    aria-label={t('song.showNote')}
                  aria-expanded={noteOpen}
                  onClick={() => setNoteOpen(true)}
                >
                  <Icon name="note" size={14} />
                  <span className="btn-label">{t('song.noteButton')}</span>
                </button>
              )}

              <button
                className={'ghost' + (stage ? ' is-on' : '')}
                aria-label={stage ? t('song.exitStage') : t('song.stageMode')}
                aria-pressed={stage}
                onClick={() => setStage((v) => !v)}
              >
                <Icon name="expand" size={14} />
                <span className="btn-label">{stage ? t('song.exitStage') : t('song.stageMode')}</span>
              </button>
            </div>

            {inSet && (next || prev) && (
              <div className="seg hide-sm">
                <button aria-label={t('song.prevSong')} disabled={!prev} onClick={() => go(prev)}>
                  <Icon name="left" size={14} />
                </button>
                <button aria-label={t('song.nextSong')} disabled={!next} onClick={() => go(next)}>
                  <Icon name="right" size={14} />
                </button>
              </div>
            )}

            {chords.length > 0 && (
              <div className="chord-pills hide-sm">
                {chords.slice(0, 7).map((c) => (
                  <span key={c} className="chord-pill" style={hue(c)}>{c}</span>
                ))}
              </div>
            )}
          </div>
        </header>

        <div className="song-body">
          <div className="scroll">
            {hasChart ? (
              <div className="chart" dir="ltr" style={chartVars}>
                <div className="chart-jump">
                  <div className="chart-jump-inner" ref={jumpRef}>
                    <button
                      type="button"
                      className={'ghost chart-jump-btn' + (jumpOpen ? ' is-on' : '')}
                      aria-label={t('song.jumpTo')}
                      aria-haspopup="menu"
                      aria-expanded={jumpOpen}
                      aria-controls="chart-jump-menu"
                      onClick={() => setJumpOpen((v) => !v)}
                    >
                      <span>{t('song.structure')}</span>
                      <Icon name="down" size={13} />
                    </button>
                    {jumpOpen && (
                      <div className="chart-jump-menu" id="chart-jump-menu" role="menu">
                        {song.sections.map((sec, i) => (
                          <button
                            key={i}
                            type="button"
                            role="menuitem"
                            className={'struct-row' + (sec.accent ? ' hot' : '')}
                            onClick={() => jumpTo(i)}
                          >
                            <span className="dot" />
                            <span>{sec.label}</span>
                            <small>{sec.bars}</small>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {song.sections.map((sec, si) => (
                  <section key={si} id={`chart-sec-${si}`} className={'chart-section' + (sec.accent ? ' accent' : '')}>
                    <div className="chart-label">
                      <span>{sec.label}</span>
                      <small>{sec.bars}</small>
                    </div>
                    {sec.lines.map((line, li) => {
                      const chordsOnly = line.every((seg) => !seg.t);
                      return (
                        <p key={li} className={'line' + (chordsOnly ? ' chords-only' : '')}>
                          {line.map((seg, gi) => {
                            const chord = transpose(seg.c, steps);
                            return (
                              <span className="chord-seg" key={gi}>
                                <span className="c" style={hue(chord)}>{showChords ? chord : ' '}</span>
                                <span className="t">{seg.t || ''}</span>
                              </span>
                            );
                          })}
                        </p>
                      );
                    })}
                  </section>
                ))}
                <div className="chart-end">
                  <i /><span>{t('song.end')}</span><i />
                </div>
              </div>
            ) : (
              <div className="empty empty-plain">
                <Icon name="lines" size={30} style={{ color: 'var(--fainter)' }} />
                <p>
                  {t('song.noChart', { title: song.title, key: song.key, bpm: song.bpm })}
                </p>
                <Link className="ghost" to={inSet ? `/rehearsal/${inSet}` : '/songs'}>
                  {inSet ? t('song.backSet') : t('song.backSongs')}
                </Link>
              </div>
            )}
          </div>

          {!stage && (
            <aside className="aside">
              {song.note && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                  <div className="eyebrow">{t('song.bandNote')}</div>
                  <div className="note" style={memberHue(noteAuthor)}>{song.note}</div>
                  {noteAuthor && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingInlineStart: 2 }}>
                      <div className="avatar" style={{ width: 22, height: 22, marginInlineStart: 0, fontSize: 10, borderColor: 'transparent', ...memberHue(noteAuthor) }}>{noteAuthor.initials}</div>
                      <span style={{ fontSize: 11, color: 'var(--fainter)' }}>
                        {/* The age is English either way — isolate it so a
                            Hebrew line doesn't strand its number. */}
                        {t('song.updated', { name: noteAuthor.name, age: `\u2068${song.noteAge}\u2069` })}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {inSet && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                  <div className="eyebrow">{t('song.inSet')}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 9, background: 'var(--well)', border: '1px solid var(--line)', borderRadius: 11, padding: '12px 13px' }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-soft)' }}>
                      {t('song.songOf', { n: position + 1, total: setSongs.length })}
                    </div>
                    <div className="progress">
                      <i style={{ width: `${((position + 1) / setSongs.length) * 100}%` }} />
                    </div>
                  </div>
                </div>
              )}

              {song.custom && (
                <button
                  className="ghost danger"
                  onClick={() => {
                    dispatch({ type: 'remove-from-library', songId: song.id });
                    notify(t('song.removed', { title: song.title }), { events, songs });
                    navigate('/songs');
                  }}
                >
                  <Icon name="trash" size={14} />
                  {t('song.removeFromLibrary')}
                </button>
              )}

              <p className="hide-sm shortcuts-hint" style={{ margin: 'auto 0 0', fontSize: 10.5, color: 'var(--fainter)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                <b style={{ color: 'var(--faint)', fontWeight: 600 }}>{t('song.shortcuts')}</b>
                {'\n'}{t('song.shortcutsBody')}
              </p>
            </aside>
          )}
        </div>

        {(next || prev) && (
          <div className="song-nextbar show-sm" style={{ flex: '0 0 auto', background: 'var(--bar)', borderTop: '1px solid var(--raised-2)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              className="icon-btn bordered"
              style={{ width: 46, height: 46, borderRadius: 12 }}
              aria-label={t('song.prevSongMobile')}
              disabled={!prev}
              onClick={() => go(prev)}
            >
              <Icon name="left" size={17} />
            </button>
            <div className="grow">
              <div className="eyebrow" style={{ fontSize: 10 }}>{next ? t('song.upNext') : t('song.lastInSet')}</div>
              <div className="truncate" style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)', marginTop: 2 }}>
                {next ? next.title : song.title}
              </div>
            </div>
            {next && <span className="key-badge" style={hue(next.key)}>{next.key}</span>}
            <button
              className="btn"
              style={{ width: 46, height: 46, borderRadius: 12, padding: 0 }}
              aria-label={t('song.nextSongMobile')}
              disabled={!next}
              onClick={() => go(next)}
            >
              <Icon name="right" size={18} />
            </button>
          </div>
        )}
      </main>

      {noteOpen && song.note && (
        <div
          className="note-scrim"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setNoteOpen(false); }}
        >
          <div ref={notePopRef} tabIndex={-1} className="note-pop" role="dialog" aria-modal="true" aria-label={t('song.bandNote')} style={memberHue(noteAuthor)}>
            <div className="note-pop-head">
              <span className="eyebrow">{t('song.bandNote')}</span>
              <button className="icon-btn" aria-label={t('song.closeNote')} onClick={() => setNoteOpen(false)}>
                <Icon name="close" size={15} />
              </button>
            </div>
            <p className="note-pop-body">{song.note}</p>
            {noteAuthor && (
              <div className="note-pop-by">
                <div className="avatar" style={{ width: 22, height: 22, marginInlineStart: 0, fontSize: 10, borderColor: 'transparent', ...memberHue(noteAuthor) }}>{noteAuthor.initials}</div>
                <span style={{ fontSize: 11, color: 'var(--fainter)' }}>
                  {/* The age is English either way — isolate it so a
                      Hebrew line doesn't strand its number. */}
                  {t('song.updated', { name: noteAuthor.name, age: `\u2068${song.noteAge}\u2069` })}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
