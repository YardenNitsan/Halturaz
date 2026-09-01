import React from 'react';
import { useI18n } from '../i18n/index.js';

export function LanguageToggle() {
  const { locale, setLocale, t } = useI18n();
  const en = locale === 'en';

  return (
    <button
      type="button"
      className={'lang-toggle' + (en ? ' is-en' : '')}
      dir="ltr"
      role="switch"
      aria-checked={en}
      aria-label={t('shell.langHe') + ' / ' + t('shell.langEn')}
      onClick={() => setLocale(en ? 'he' : 'en')}
    >
      <span className="lang-track" aria-hidden>
        <span className="lang-mark lang-mark-he">{t('shell.langHe')}</span>
        <span className="lang-mark lang-mark-en">{t('shell.langEn')}</span>
        <span className="lang-knob">{en ? t('shell.langEn') : t('shell.langHe')}</span>
      </span>
    </button>
  );
}
