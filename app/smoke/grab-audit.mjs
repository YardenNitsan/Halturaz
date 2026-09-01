/* Catching the month strip mid-flight must not jump: sample where each month
   page sits, frame by frame, across a settle that gets grabbed. */
import { chromium } from 'playwright-core';
const chrome = process.env.CHROME || '/home/yaliby/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome';
const browser = await chromium.launch({ executablePath: chrome, headless: true, args: ['--no-sandbox', '--disable-gpu'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'he-IL' });
const page = await ctx.newPage();
page.on('pageerror', (e) => console.log('PAGE ERROR', e.message));
await page.goto('http://127.0.0.1:5174/', { waitUntil: 'networkidle' });
await page.waitForTimeout(400);

const title = async () => (await page.locator('.cal-title-page').nth(1).innerText()).replace('\n', ' ');
const sel = () => page.locator('.sheet-peek-day').innerText();

async function sampler(on) {
  if (on) {
    await page.evaluate(() => {
      window.__s = [];
      window.__go = true;
      const step = () => {
        window.__s.push([
          Math.round(performance.now()),
          [...document.querySelectorAll('.cal-title-page')].map((el) => [
            el.innerText.replace('\n', ' '),
            Math.round(el.getBoundingClientRect().x)
          ])
        ]);
        if (window.__go) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
    return;
  }
  return page.evaluate(() => {
    window.__go = false;
    return window.__s;
  });
}

function jumps(samples) {
  let worst = 0;
  let where = null;
  for (let i = 1; i < samples.length; i++) {
    const prev = new Map(samples[i - 1][1]);
    for (const [k, x] of samples[i][1]) {
      if (!prev.has(k)) continue;
      const d = Math.abs(x - prev.get(k));
      const dt = samples[i][0] - samples[i - 1][0];
      if (d > worst) { worst = d; where = `${k} moved ${d}px in ${dt}ms`; }
    }
  }
  return { worst, where };
}

/** Is the strip parked exactly on one month? */
const rest = () => page.evaluate(() => {
  const el = document.querySelector('.cal-grid-track');
  const w = document.querySelector('.cal-viewport').clientWidth;
  const p = new DOMMatrixReadOnly(getComputedStyle(el).transform).m41 / w + 1;
  return Math.abs(p) < 0.001 ? 'parked' : `OFF CENTRE p=${p.toFixed(3)}`;
});

const box = await page.locator('.cal-viewport').boundingBox();
const cy = box.y + box.height / 2;
const cx = box.x + box.width / 2;

async function swipe(dx, ms = 80) {
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  for (let i = 1; i <= 6; i++) { await page.mouse.move(cx + (dx * i) / 6, cy); await page.waitForTimeout(ms / 6); }
  await page.mouse.up();
}

// 1. grab a settle in mid-air and drag it back the other way
await sampler(true);
await swipe(-150);
await page.waitForTimeout(120);              // ~1/3 into the 400ms slide
await page.mouse.move(cx, cy);
await page.mouse.down();
for (let i = 1; i <= 8; i++) { await page.mouse.move(cx + 20 * i, cy); await page.waitForTimeout(12); }
await page.mouse.up();
await page.waitForTimeout(600);
let s = await sampler(false);
console.log('1 grab mid-slide + drag back :', JSON.stringify(jumps(s)), '-> month', await title(), '|', await rest());

// 2. grab mid-slide and let go without moving: it carries on
await sampler(true);
await swipe(-150);
await page.waitForTimeout(140);
await page.mouse.move(cx, cy);
await page.mouse.down();
await page.waitForTimeout(60);
await page.mouse.up();
await page.waitForTimeout(600);
s = await sampler(false);
console.log('2 grab + release            :', JSON.stringify(jumps(s)), '-> month', await title(), '|', await rest());

// 3. a tap during a slide stops it, and must not pick a day
const before = await sel();
await sampler(true);
await swipe(-150);
await page.waitForTimeout(120);
await page.mouse.click(cx, cy);
await page.waitForTimeout(600);
s = await sampler(false);
console.log('3 tap during slide          :', JSON.stringify(jumps(s)), '-> month', await title(), '|', await rest(), '| day', before, '->', await sel());

// 4. two quick swipes in a row cross two months
const m0 = await title();
await swipe(-150);
await page.waitForTimeout(90);
await swipe(-150);
await page.waitForTimeout(700);
console.log('4 two swipes back to back   :', m0, '->', await title(), '|', await rest());

// 5. hammering the arrow
const m1 = await title();
for (let i = 0; i < 4; i++) { await page.getByLabel('חודש הבא').click(); await page.waitForTimeout(70); }
await page.waitForTimeout(700);
console.log('5 four fast arrow taps      :', m1, '->', await title(), '|', await rest());

// 6. today lands home from anywhere, mid-flight included
await page.getByLabel('חודש הבא').click();
await page.waitForTimeout(80);
await page.locator('.ghost', { hasText: 'היום' }).click();
await page.waitForTimeout(700);
console.log('6 today during a slide      :', await title(), '|', await rest(), '| day', await sel());
await page.screenshot({ path: 'smoke/phone/15-after-grabs.png' });

// 7. today pressed while the strip is already sliding home
await page.getByLabel('חודש הבא').click();
await page.waitForTimeout(500);
await page.getByLabel('חודש קודם').click();   // heading back to today's month
await page.waitForTimeout(90);
await page.locator('.ghost', { hasText: 'היום' }).click();
await page.waitForTimeout(700);
console.log('7 today while already going  :', await title(), '|', await rest(), '| day', await sel());

await browser.close();
