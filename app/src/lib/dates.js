export const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
export const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
export const WEEKDAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

const pad = (n) => (n < 10 ? '0' + n : String(n));

export const iso = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;

export function parseISO(s) {
  const [y, m, d] = s.split('-').map(Number);
  return { y, m: m - 1, d };
}

export function weekdayOf(s) {
  const { y, m, d } = parseISO(s);
  return WEEKDAYS[new Date(Date.UTC(y, m, d)).getUTCDay()];
}

/** "August 29" */
export function longDate(s) {
  const { m, d } = parseISO(s);
  return `${MONTHS[m]} ${d}`;
}

/** "Aug 29" */
export function shortDate(s) {
  const { m, d } = parseISO(s);
  return `${MONTHS_SHORT[m]} ${d}`;
}

/** 42 cells covering the month grid, Sunday-first. */
export function monthGrid(y, m) {
  const first = new Date(Date.UTC(y, m, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const daysInPrev = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const cells = [];
  for (let i = 0; i < 42; i++) {
    const n = i - first + 1;
    const inMonth = n >= 1 && n <= daysInMonth;
    cells.push({
      key: i,
      inMonth,
      label: inMonth ? n : n < 1 ? daysInPrev + n : n - daysInMonth,
      date: inMonth ? iso(y, m, n) : null
    });
  }
  return cells;
}

export function addMonths(y, m, delta) {
  const total = y * 12 + m + delta;
  return { y: Math.floor(total / 12), m: ((total % 12) + 12) % 12 };
}

/** 252 -> "4:12" */
export function mmss(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s < 10 ? '0' + s : s}`;
}

/** 2319 -> "39 min" */
export function runtime(sec) {
  const mins = Math.round(sec / 60);
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

/** Human distance from today, e.g. "in 4 days" / "Tonight" */
export function relative(dateStr, today) {
  if (dateStr === today) return 'Tonight';
  const a = parseISO(dateStr);
  const b = parseISO(today);
  const days = Math.round(
    (Date.UTC(a.y, a.m, a.d) - Date.UTC(b.y, b.m, b.d)) / 86400000
  );
  if (days === 1) return 'Tomorrow';
  if (days === -1) return 'Yesterday';
  if (days > 0) return `in ${days} days`;
  return `${-days} days ago`;
}
