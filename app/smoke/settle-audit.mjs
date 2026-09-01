/* How the day sheet moves, not just where it ends up: the dimming has to ride
   the finger, and the release has to land on the same curve the month does. */
import { chromium } from 'playwright-core';
const chrome = process.env.CHROME || '/home/yaliby/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome';
const browser = await chromium.launch({ executablePath: chrome, headless: true, args: ['--no-sandbox','--disable-gpu'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'he-IL' });
const page = await ctx.newPage();
page.on('pageerror', (e) => console.log('PAGE ERROR', e.message));
await page.goto('http://127.0.0.1:5174/', { waitUntil: 'networkidle' });
await page.waitForTimeout(400);
const cdp = await ctx.newCDPSession(page);

const shot = () => page.evaluate(() => {
  const p = document.querySelector('.panel');
  const s = document.querySelector('.day-scrim');
  return { h: Math.round(p.getBoundingClientRect().height), o: +(+getComputedStyle(s).opacity).toFixed(2) };
});
const record = () => page.evaluate(() => new Promise((done) => {
  const p = document.querySelector('.panel');
  const s = document.querySelector('.day-scrim');
  const frames = [];
  const t0 = performance.now();
  (function tick(t) {
    frames.push([Math.round(t - t0), Math.round(p.getBoundingClientRect().height), +(+getComputedStyle(s).opacity).toFixed(2)]);
    if (t - t0 < 700) requestAnimationFrame(tick); else done(frames);
  })(t0);
}));
async function touch(type, x, y) {
  await cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
}
const c = async (sel, n = 0) => { const b = await page.locator(sel).nth(n).boundingBox(); return [b.x + b.width/2, b.y + b.height/2]; };

// the dimming while a finger owns the sheet
let [x, y] = await c('.cal-month:not([aria-hidden]) .day:not(.is-out)', 12);
await touch('touchStart', x, y);
const trail = [];
for (const d of [-40, -100, -180, -260, -340]) { await touch('touchMove', x, y + d); await page.waitForTimeout(30); trail.push(await shot()); }
console.log('while dragging   ', trail.map((s) => `${s.h}px/${s.o}`).join('  ->  '));
const settle = record();
await touch('touchEnd', x, y);
let f = await settle;
console.log('flick up settles ', f.filter((_, i) => i % 3 === 0).map(([t, h, o]) => `${t}:${h}/${o}`).slice(0, 9).join(' '));
console.log('  landed at      ', JSON.stringify(f[f.length - 1]), '| worst jump', Math.max(...f.slice(1).map(([, h], i) => Math.abs(h - f[i][1]))) + 'px');

// and back down, where the dimming has to fade instead of vanishing
[x, y] = await c('.sheet-peek');
await touch('touchStart', x, y);
for (const d of [40, 120, 220, 320]) { await touch('touchMove', x, y + d); await page.waitForTimeout(30); }
const settle2 = record();
await touch('touchEnd', x, y + 320);
f = await settle2;
console.log('shutting settles ', f.filter((_, i) => i % 3 === 0).map(([t, h, o]) => `${t}:${h}/${o}`).slice(0, 9).join(' '));
console.log('  landed at      ', JSON.stringify(f[f.length - 1]));

// a sheet still on its way can be caught, the way a month can
await page.waitForTimeout(300);
[x, y] = await c('.cal-month:not([aria-hidden]) .day:not(.is-out)', 12);
await touch('touchStart', x, y);
for (const d of [-40, -120, -260]) { await touch('touchMove', x, y + d); await page.waitForTimeout(30); }
await touch('touchEnd', x, y - 260);
await page.waitForTimeout(60);                       // it is mid-settle now
const caught = await shot();
await touch('touchStart', 195, 300);
await page.waitForTimeout(40);
const held = await shot();
for (const d of [40, 140, 260]) { await touch('touchMove', 195, 300 + d); await page.waitForTimeout(30); }
await touch('touchEnd', 195, 560);
await page.waitForTimeout(600);
console.log('caught in flight ', `${caught.h}px/${caught.o} -> held ${held.h}px/${held.o} -> ${JSON.stringify(await shot())}`);

// a tap has no finger to carry on from: it takes the full glide
await page.waitForTimeout(300);
const settle3 = record();
await page.locator('.sheet-peek-row').click();
f = await settle3;
console.log('tap opens        ', f.filter((_, i) => i % 3 === 0).map(([t, h, o]) => `${t}:${h}/${o}`).slice(0, 9).join(' '));
await browser.close();
