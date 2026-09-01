import { useCallback } from 'react';
import { flushSync } from 'react-dom';
import { useStore } from '../store.jsx';
import { translate, roleLabel, applyDocumentLocale } from './translate.js';

export { DEFAULT_LOCALE } from './constants.js';
export { translate, roleLabel, applyDocumentLocale } from './translate.js';

function swapView(apply, next) {
  if (typeof document === 'undefined') {
    apply();
    return;
  }
  const root = document.documentElement;
  root.dataset.localeSlide = next === 'en' ? 'ltr' : 'rtl';
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (reduce) {
    apply();
    return;
  }
  if (typeof document.startViewTransition === 'function') {
    document.startViewTransition(apply);
    return;
  }
  root.classList.remove('locale-slide-play');
  apply();
  requestAnimationFrame(() => {
    root.classList.add('locale-slide-play');
    window.setTimeout(() => root.classList.remove('locale-slide-play'), 620);
  });
}

export function useI18n() {
  const { locale, dispatch } = useStore();
  const t = useCallback((key, vars) => translate(locale, key, vars), [locale]);
  const setLocale = useCallback((next) => {
    if (next !== 'he' && next !== 'en') return;
    swapView(() => {
      flushSync(() => dispatch({ type: 'set-locale', locale: next }));
      applyDocumentLocale(next);
    }, next);
  }, [dispatch]);
  const role = useCallback((r) => roleLabel(locale, r), [locale]);
  return { locale, setLocale, t, role, dir: locale === 'he' ? 'rtl' : 'ltr' };
}
