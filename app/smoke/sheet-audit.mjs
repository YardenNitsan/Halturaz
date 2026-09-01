/* The day sheet opens and shuts by dragging its header, not by a chevron. */
import { chromium } from 'playwright-core';
const chrome = process.env.CHROME || '/home/yaliby/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome';
const browser = await chromium.launch({ executablePath: chrome, headless: true, args: ['--no-sandbox', '--disable-gpu'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'he-IL' });
const page = await ctx.newPage();
page.on('pageerror', (e) => console.log('PAGE ERROR', e.message));
await page.goto('http://127.0.0.1:5174/', { waitUntil: 'networkidle' });
await page.waitForTimeout(400);

const state = () => page.evaluate(() => {
  const el = document.querySelector('.panel');
  return {
    h: Math.round(el.getBoundingClientRect().height),
    open: el.classList.contains('is-open'),
    // the dimming is always there now; how far up it is dimmed is the state
    scrim: +(+getComputedStyle(document.querySelector('.day-scrim')).opacity).toFixed(2),
    inline: el.style.maxHeight || '(none)'
  };
});

async function dragSheet(dy, { hold = 0, steps = 10, pause = 12 } = {}) {
  const b = await page.locator('.sheet-peek').boundingBox();
  const x = b.x + b.width / 2;
  const y = b.y + 14;
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let i = 1; i <= steps; i++) { await page.mouse.move(x, y + (dy * i) / steps); await page.waitForTimeout(pause); }
  const mid = await state();
  if (hold) await page.waitForTimeout(hold);
  await page.mouse.up();
  await page.waitForTimeout(450);
  return { mid, end: await state() };
}

console.log('rest        ', JSON.stringify(await state()));
console.log('chevron gone', (await page.locator('.sheet-peek-row svg').count()) === 0);

let r = await dragSheet(-300);
console.log('drag up 300 ', 'mid', JSON.stringify(r.mid), '=> end', JSON.stringify(r.end));

r = await dragSheet(320);
console.log('drag down   ', 'mid', JSON.stringify(r.mid), '=> end', JSON.stringify(r.end));

r = await dragSheet(-60);
console.log('short up 60 ', 'mid', JSON.stringify(r.mid), '=> end', JSON.stringify(r.end));

r = await dragSheet(-40, { steps: 3, pause: 4 });   // quick flick up
console.log('flick up    ', 'mid', JSON.stringify(r.mid), '=> end', JSON.stringify(r.end));

r = await dragSheet(50, { steps: 3, pause: 4 });    // quick flick down
console.log('flick down  ', 'mid', JSON.stringify(r.mid), '=> end', JSON.stringify(r.end));

// the header follows the finger step by step
const b = await page.locator('.sheet-peek').boundingBox();
const x = b.x + b.width / 2, y = b.y + 14;
await page.mouse.move(x, y);
await page.mouse.down();
const trail = [];
for (const d of [-40, -90, -150, -220, -300]) { await page.mouse.move(x, y + d); await page.waitForTimeout(16); trail.push((await state()).h); }
console.log('follows     ', trail.join(' -> '), '(finger: 40 90 150 220 300 past 74)');
await page.screenshot({ path: 'smoke/phone/16-sheet-mid-drag.png' });
await page.mouse.up();
await page.waitForTimeout(450);
console.log('after       ', JSON.stringify(await state()));

// a tap on the row still toggles, and a drag does not
await page.locator('.sheet-peek-row').click();
await page.waitForTimeout(400);
console.log('tap row     ', JSON.stringify(await state()));

// the day's action bar still works after a sheet drag — it never moved
await dragSheet(-300);
await page.locator('.sheet-act .btn').click();
await page.waitForTimeout(500);
console.log('button      ', page.url());

await browser.close();
