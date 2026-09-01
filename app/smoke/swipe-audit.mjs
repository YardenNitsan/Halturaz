import { chromium } from 'playwright-core';
import { mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const dir = join(dirname(fileURLToPath(import.meta.url)), 'phone');
mkdirSync(dir, { recursive: true });
const chrome = process.env.CHROME || '/home/yaliby/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome';

const browser = await chromium.launch({ executablePath: chrome, headless: true, args: ['--no-sandbox', '--disable-gpu'] });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'he-IL' });
const page = await context.newPage();
page.on('pageerror', (e) => console.log('PAGE ERROR', e.message));
await page.goto('http://127.0.0.1:5174/', { waitUntil: 'networkidle' });
await page.waitForTimeout(400);

const title = () => page.locator('.cal-title-page').nth(1).innerText();
const trackX = () => page.evaluate(() => {
  const el = document.querySelector('.cal-grid-track');
  return new DOMMatrixReadOnly(getComputedStyle(el).transform).m41;
});
const centres = () => page.evaluate(() => [...document.querySelectorAll('.cal-title-page')].map((el) => {
  const r = el.getBoundingClientRect();
  return [el.innerText.replace('\n', ' '), Math.round(r.x)];
}));

async function drag(dx, { release = true } = {}) {
  const box = await page.locator('.cal-viewport').boundingBox();
  const y = box.y + box.height / 2;
  const x = box.x + box.width / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  const steps = 12;
  for (let i = 1; i <= steps; i++) {
    await page.mouse.move(x + (dx * i) / steps, y);
    await page.waitForTimeout(8);
  }
  const mid = await trackX();
  if (release) {
    await page.mouse.up();
    await page.waitForTimeout(650);
  }
  return mid;
}

async function step(label, dx) {
  const before = await title();
  const restBefore = await trackX();
  const mid = await drag(dx);
  const after = await title();
  console.log(`${label}: "${before}" -> "${after}"   rest=${restBefore.toFixed(1)} mid=${mid.toFixed(1)} rest_after=${(await trackX()).toFixed(1)}`);
}

console.log('order (he):', JSON.stringify(await centres()));
await step('he swipe left  (-140)', -140);
await step('he swipe right (+140)', 140);
await step('he small drag  (-40)', -40);

// mid-drag position should track the finger
const box = await page.locator('.cal-viewport').boundingBox();
await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
await page.mouse.down();
await page.mouse.move(box.x + box.width / 2 - 60, box.y + box.height / 2);
await page.mouse.move(box.x + box.width / 2 - 120, box.y + box.height / 2);
await page.waitForTimeout(30);
console.log('follow: after -120px finger, track dx =', (await trackX()).toFixed(1), '(0 rest is', (390 * -1).toFixed(1) + ')');
await page.screenshot({ path: join(dir, '11-mid-drag.png') });
await page.mouse.up();
await page.waitForTimeout(650);

// today's disc
await page.locator('.ghost', { hasText: 'היום' }).click().catch(() => {});
await page.waitForTimeout(700);
const todayBox = await page.locator('.day.is-today .day-num').boundingBox();
console.log('today disc box', todayBox, 'title now', await title());
await page.screenshot({ path: join(dir, '12-today-he.png') });

// tap a day still works after a swipe
await drag(-140);
const day = page.locator('.cal-month:not([aria-hidden]) .day:not(.is-out)').nth(14);
await day.click();
await page.waitForTimeout(300);
console.log('tap after swipe ->', await page.locator('.sheet-peek-day').innerText());
await page.screenshot({ path: join(dir, '13-after-swipe.png') });

// english
await page.locator('.lang-toggle').click();
await page.waitForTimeout(800);
console.log('order (en):', JSON.stringify(await centres()));
await step('en swipe left  (-140)', -140);
await step('en swipe right (+140)', 140);
await page.screenshot({ path: join(dir, '14-calendar-en.png') });

await browser.close();
console.log('done');
