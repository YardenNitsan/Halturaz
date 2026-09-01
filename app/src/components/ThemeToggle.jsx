import React from 'react';
import { useStore } from '../store.jsx';
import { useI18n } from '../i18n/index.js';

export function ThemeToggle() {
  const { theme, dispatch } = useStore();
  const { t } = useI18n();
  const light = theme === 'light';

  return (
    <button
      type="button"
      className={'theme-toggle' + (light ? ' is-light' : '')}
      role="switch"
      aria-checked={light}
      aria-label={light ? t('shell.themeDark') : t('shell.themeLight')}
      onClick={() => dispatch({ type: 'set-theme', theme: light ? 'dark' : 'light' })}
    >
      <span className="theme-track" aria-hidden>
        <svg className="theme-mark theme-mark-moon" viewBox="0 0 24 24">
          <path d="M15.4 4.6A7.4 7.4 0 1 0 19.4 15 6.2 6.2 0 0 1 15.4 4.6z" />
        </svg>
        <svg className="theme-mark theme-mark-sun" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="3.4" />
          <path d="M12 3.4v1.8M12 18.8v1.8M3.4 12h1.8M18.8 12h1.8M6 6l1.3 1.3M16.7 16.7 18 18M6 18l1.3-1.3M16.7 7.3 18 6" />
        </svg>
        <span className="theme-knob">
          <svg className="theme-icon theme-sun" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="3.4" />
            <path d="M12 3.4v1.8M12 18.8v1.8M3.4 12h1.8M18.8 12h1.8M6 6l1.3 1.3M16.7 16.7 18 18M6 18l1.3-1.3M16.7 7.3 18 6" />
          </svg>
          <svg className="theme-icon theme-moon" viewBox="0 0 24 24">
            <path d="M15.4 4.6A7.4 7.4 0 1 0 19.4 15 6.2 6.2 0 0 1 15.4 4.6z" />
          </svg>
        </span>
      </span>
    </button>
  );
}
