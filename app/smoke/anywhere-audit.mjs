/* The day sheet takes its up-and-down swipe from anywhere on the calendar —
   the month, the header, the backdrop — and sideways still means the month. */
import { chromium } from 'playwright-core';
const chrome = process.env.CHROME || '/home/yaliby/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome';
const browser = await chromium.launch({ executablePath: chrome, headless: true, args: ['--no-sandbox','--disable-gpu'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'he-IL' });
const page = await ctx.newPage();
page.on('pageerror', (e) => console.log('PAGE ERROR', e.message));
await page.goto('http://127.0.0.1:5174/', { waitUntil: 'networkidle' });
await page.waitForTimeout(400);
const LIVE = '.cal-month:not([aria-hidden]) .day:not(.is-out)';
const state = () => page.evaluate(() => {
  const el = document.querySelector('.panel');
  return { h: Math.round(el.getBoundingClientRect().height), open: el.classList.contains('is-open'),
           month: document.querySelector('.cal-title-page:not([aria-hidden]) .cal-title').textContent,
           day: document.querySelector('.sheet-peek-day').textContent };
});
async function dragAt(x, y, dy, dx = 0, steps = 12, pause = 12) {
  await page.mouse.move(x, y); await page.mouse.down();
  for (let i = 1; i <= steps; i++) { await page.mouse.move(x + dx*i/steps, y + dy*i/steps); await page.waitForTimeout(pause); }
  const mid = await state();
  await page.mouse.up(); await page.waitForTimeout(500);
  return { mid, end: await state() };
}
const centre = async (sel, n = 0) => { const b = await page.locator(sel).nth(n).boundingBox(); return [b.x + b.width/2, b.y + b.height/2]; };

console.log('rest          ', JSON.stringify(await state()));
let [x,y] = await centre(LIVE, 12);
let r = await dragAt(x, y, -320);
console.log('up on a day   ', 'mid h', r.mid.h, '=> end', JSON.stringify(r.end));
r = await dragAt(195, 90, 320);                       // top of the screen, over the scrim
console.log('down on scrim ', 'mid h', r.mid.h, '=> end', JSON.stringify(r.end));
[x,y] = await centre('.cal-head');
r = await dragAt(x, y, -300);
console.log('up on header  ', 'mid h', r.mid.h, '=> end', JSON.stringify(r.end));
[x,y] = await centre('.sheet-peek');
r = await dragAt(x, y, 320);
console.log('down on peek  ', 'mid h', r.mid.h, '=> end', JSON.stringify(r.end));
// sideways on the very same grid is still the month, and the sheet stays put
[x,y] = await centre('.cal-viewport');
r = await dragAt(x, y, 0, 140);        // wider than this leaves the viewport
console.log('sideways      ', JSON.stringify(r.end));
r = await dragAt(x, y, 0, -140);
console.log('sideways back ', JSON.stringify(r.end));
// a tap still picks a day; a swipe that ends on one does not
const before = (await state()).day;
await page.locator(LIVE).nth(20).click(); await page.waitForTimeout(400);
console.log('tap a day     ', before, '->', (await state()).day, '| open', (await state()).open);
const picked = (await state()).day;
[x,y] = await centre(LIVE, 9);
r = await dragAt(x, y, -320);
console.log('swipe a day   ', picked, '->', r.end.day, '| open', r.end.open, 'h', r.end.h);
// quick flick up from the middle of the month
[x,y] = await centre('.sheet-peek'); await dragAt(x, y, 320);
[x,y] = await centre(LIVE, 12);
r = await dragAt(x, y, -60, 0, 3, 4);
console.log('flick up      ', 'end', JSON.stringify(r.end));
await page.screenshot({ path: '/tmp/anywhere.png' });
await browser.close();
