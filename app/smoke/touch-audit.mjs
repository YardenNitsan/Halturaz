/* The same gestures again, but with real touch points: what the phone sends.
   Also watches for a pointercancel — the browser stealing a swipe halfway is
   what turns a drag into a pull-to-refresh. */
import { chromium } from 'playwright-core';
const chrome = process.env.CHROME || '/home/yaliby/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome';
const browser = await chromium.launch({ executablePath: chrome, headless: true, args: ['--no-sandbox','--disable-gpu'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'he-IL' });
const page = await ctx.newPage();
page.on('pageerror', (e) => console.log('PAGE ERROR', e.message));
await page.goto('http://127.0.0.1:5174/', { waitUntil: 'networkidle' });
await page.waitForTimeout(400);
const cdp = await ctx.newCDPSession(page);

await page.evaluate(() => {
  window.__cancels = 0;
  window.addEventListener('pointercancel', () => window.__cancels++, true);
});
const state = () => page.evaluate(() => {
  const p = document.querySelector('.panel');
  if (!p) return { page: Math.round(document.scrollingElement.scrollTop) };
  return {
    h: Math.round(p.getBoundingClientRect().height),
    open: p.classList.contains('is-open'),
    top: Math.round(p.scrollTop),
    page: Math.round(document.scrollingElement.scrollTop),
    month: document.querySelector('.cal-title-page:not([aria-hidden]) .cal-title').textContent,
    cancels: window.__cancels
  };
});
async function swipe(x, y, dx, dy, steps = 12, pause = 14) {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  for (let i = 1; i <= steps; i++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + dx*i/steps, y: y + dy*i/steps }] });
    await page.waitForTimeout(pause);
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForTimeout(520);
  return state();
}
const c = async (sel, n = 0) => { const b = await page.locator(sel).nth(n).boundingBox(); return [b.x + b.width/2, b.y + b.height/2]; };
const LIVE = '.cal-month:not([aria-hidden]) .day:not(.is-out)';

console.log('rest            ', JSON.stringify(await state()));
let [x,y] = await c(LIVE, 12);
console.log('up on a day     ', JSON.stringify(await swipe(x, y, 0, -320)));
console.log('down in the day ', JSON.stringify(await swipe(195, 700, 0, 300)));   // inside the open sheet
[x,y] = await c(LIVE, 12);
console.log('up on a day     ', JSON.stringify(await swipe(x, y, 0, -320)));
console.log('down on the top ', JSON.stringify(await swipe(195, 90, 0, 300)));    // over the dimmed month
[x,y] = await c('.cal-head');
console.log('up on the head  ', JSON.stringify(await swipe(x, y, 0, -300)));
[x,y] = await c('.sheet-peek');
console.log('down on the grip', JSON.stringify(await swipe(x, y, 0, 320)));
[x,y] = await c('.cal-viewport');
console.log('sideways        ', JSON.stringify(await swipe(x, y, 140, 0)));
// The tabs and the action bar are their own furniture, above the day's
// dimming: they neither hand the day a swipe nor stand in its way.
[x,y] = await c(LIVE, 12);
await swipe(x, y, 0, -320);
console.log('down on the tabs', JSON.stringify(await swipe(195, 800, 0, 200)));
console.log('down on the act ', JSON.stringify(await swipe(...(await c('.sheet-act')), 0, 200)));
await swipe(195, 300, 0, 300);
console.log('down on the grid', JSON.stringify(await swipe(...(await c(LIVE, 12)), 0, 300)));

[x,y] = await c(LIVE, 12);
await swipe(x, y, 0, -320);
await page.locator('.tab').nth(1).tap();
await page.waitForTimeout(600);
console.log('tab with day up ', page.url().replace('http://127.0.0.1:5174', ''));

// the scrollers inside the app still scroll, page and sheet alike
const scrolled = async (label, url, sel) => {
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  const before = await page.evaluate((s) => document.querySelector(s)?.scrollTop, sel);
  await swipe(195, 600, 0, -260, 8, 10);
  const after = await page.evaluate((s) => document.querySelector(s)?.scrollTop, sel);
  console.log(label.padEnd(16), before, '->', Math.round(after), '| page', await page.evaluate(() => document.scrollingElement.scrollTop));
};
await scrolled('songs list', 'http://127.0.0.1:5174/songs', '.scroll');
await scrolled('a song', 'http://127.0.0.1:5174/song/copper-line', '.scroll');
await scrolled('a rehearsal', 'http://127.0.0.1:5174/rehearsal/2026-08-04', '.reh-main');
await browser.close();
