/* The first pixels of a day-sheet drag: does the sheet's height jump when the
   gesture is finally recognised? Traced in 2px steps, up and down, from the
   handle and from inside the day's own text. */
import { chromium } from 'playwright-core';
const chrome = process.env.CHROME || '/home/yaliby/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome';
const browser = await chromium.launch({ executablePath: chrome, headless: true, args: ['--no-sandbox','--disable-gpu'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'he-IL' });
const page = await ctx.newPage();
page.on('pageerror', (e) => console.log('PAGE ERROR', e.message));
await page.goto('http://127.0.0.1:5174/', { waitUntil: 'networkidle' });
await page.waitForTimeout(400);
const cdp = await ctx.newCDPSession(page);

const h = () => page.evaluate(() => Math.round(document.querySelector('.panel').getBoundingClientRect().height));
const st = () => page.evaluate(() => {
  const p = document.querySelector('.panel');
  return { h: Math.round(p.getBoundingClientRect().height), open: p.classList.contains('is-open'), scrollH: p.scrollHeight, top: Math.round(p.scrollTop) };
});

await page.locator('.cal-month:not([aria-hidden]) .day.has-event').first().click();
await page.waitForTimeout(250);

async function trace(x, y, dir, n = 14, step = 2) {
  const out = [];
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  out.push([0, await h()]);
  for (let i = 1; i <= n; i++) {
    const d = dir * i * step;
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y + d }] });
    await page.waitForTimeout(16);
    out.push([d, await h()]);
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForTimeout(700);
  return out;
}

const peek = await page.locator('.sheet-peek').boundingBox();
console.log('shut  ', JSON.stringify(await st()));
console.log('open drag from handle (finger px : sheet height)');
console.log((await trace(195, peek.y + 14, -1)).map(([d, v]) => `${-d}:${v}`).join('  '));
console.log('after ', JSON.stringify(await st()));

// now shut it again, tracing the first pixels of the downward drag
const peek2 = await page.locator('.sheet-peek').boundingBox();
console.log('\nshut drag from handle (finger px : sheet height)');
console.log((await trace(195, peek2.y + 14, 1, 14)).map(([d, v]) => `${d}:${v}`).join('  '));
console.log('after ', JSON.stringify(await st()));

// and from inside the day's own text, pulling down at the top of the content
await page.locator('.sheet-peek-row').click();
await page.waitForTimeout(800);
console.log('\nopen  ', JSON.stringify(await st()));
console.log('shut drag from the day text (finger px : sheet height)');
console.log((await trace(195, 600, 1, 14)).map(([d, v]) => `${d}:${v}`).join('  '));
console.log('after ', JSON.stringify(await st()));

await browser.close();
