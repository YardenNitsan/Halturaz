import { DEFAULT_LOCALE } from './constants.js';
import he from './he.js';
import en from './en.js';

const dict = { he, en };

export function translate(locale, key, vars = {}) {
  const parts = key.split('.');
  let val = dict[locale] || dict[DEFAULT_LOCALE];
  for (const p of parts) val = val?.[p];
  if (typeof val !== 'string') return key;
  return val.replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? String(vars[k]) : `{${k}}`));
}

export function roleLabel(locale, role) {
  return dict[locale]?.roles?.[role] || role;
}

export function applyDocumentLocale(locale) {
  const loc = locale === 'en' ? 'en' : DEFAULT_LOCALE;
  if (typeof document === 'undefined') return;
  document.documentElement.lang = loc;
  document.documentElement.dir = loc === 'he' ? 'rtl' : 'ltr';
  document.title = translate(loc, 'app.title');
}
