export const DEFAULT_THEME = 'dark';

export function applyDocumentTheme(theme) {
  const mode = theme === 'light' ? 'light' : DEFAULT_THEME;
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.theme = mode;
  document.documentElement.style.colorScheme = mode;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = mode === 'light' ? '#ece3d4' : '#0e0d0c';
}
