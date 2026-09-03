import React from 'react';
import { useI18n } from '../i18n/index.js';

/* Loading, in the app's own language: the logo's arcs keep turning, a note
   rides inside them, and under it six strings are still being plucked. */

const STRINGS = [0, 1, 2, 3, 4, 5];

/** A note held inside a turning ring. `size` is the ring's diameter in px. */
export function Loader({ size = 22, className = '', ...rest }) {
  return (
    <span className={'loader' + (className ? ` ${className}` : '')} aria-hidden {...rest}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <g className="loader-ring" stroke="var(--accent)" strokeWidth="1.7" strokeLinecap="round">
          <path d="M12 2.8a9.2 9.2 0 0 1 9.2 9.2" />
          <path d="M12 21.2A9.2 9.2 0 0 1 2.8 12" opacity="0.34" />
        </g>
        <g className="loader-note">
          {/* The nav's `music` glyph, shrunk to sit inside the ring. */}
          <g
            transform="translate(12.5 12.5) scale(0.46) translate(-12.5 -12.5)"
            stroke="var(--accent)"
            strokeWidth="3.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="7" cy="18" r="3" />
            <circle cx="18" cy="15.5" r="3" />
            <path d="M10 18V6.2l11-2.2v11.5" />
          </g>
        </g>
      </svg>
    </span>
  );
}

/** Six strings, plucked in turn. Sits under the ring on the boot screen. */
export function Strings() {
  return (
    <span className="loader-strings" aria-hidden>
      {STRINGS.map((i) => (
        <i key={i} style={{ animationDelay: `${i * 0.1}s` }} />
      ))}
    </span>
  );
}

/** The whole page, while the band's library is still on its way from the
    database. Fades in a beat late, so a quick answer never flashes it. */
export function BootLoader() {
  const { t } = useI18n();
  return (
    <div className="boot" role="status" aria-live="polite">
      <div className="boot-art">
        <Loader size={64} />
        <Strings />
      </div>
      <p className="boot-label eyebrow">{t('common.tuning')}</p>
    </div>
  );
}
