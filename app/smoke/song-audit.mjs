import { chromium } from 'playwright-core';
import { mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const dir = join(dirname(fileURLToPath(import.meta.url)), 'phone');
mkdirSync(dir, { recursive: true });

const chrome = process.env.CHROME ||
  '/home/yaliby/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome';

const browser = await chromium.launch({ executablePath: chrome, headless: true, args: ['--no-sandbox', '--disable-gpu'] });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 }, deviceScaleFactor: 2,
  isMobile: true, hasTouch: true, locale: 'he-IL'
});
const page = await context.newPage();

const url = process.env.URL || 'http://127.0.0.1:5174/song/copper-line';
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(500);

async function shot(name) {
  await page.screenshot({ path: join(dir, `${name}.png`), fullPage: false });
  console.log('shot', name);
}
await shot('song-01-top');

const report = await page.evaluate(() => {
  const out = {};
  const q = (s) => document.querySelector(s);
  const box = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return { x: +b.x.toFixed(1), y: +b.y.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1) }; };
  out.vw = innerWidth; out.vh = innerHeight;
  out.head = box(q('.song-head'));
  out.headOverflowRight = (() => { const h = q('.song-head'); if (!h) return null;
    return [...h.querySelectorAll('*')].filter((e) => e.getBoundingClientRect().right > innerWidth + 0.5).map((e) => e.className + ' | ' + e.textContent.slice(0, 24)); })();
  out.scroll = box(q('.scroll'));
  out.chart = box(q('.chart'));
  out.aside = box(q('.aside'));
  out.asideDisplay = q('.aside') && getComputedStyle(q('.aside')).display;
  out.nextbar = box(q('.song-nextbar'));
  out.tabbar = box(q('.tabbar'));
  out.toggles = box(q('.app-toggles'));
  // lines wider than viewport?
  out.wideLines = [...document.querySelectorAll('.chart .line')].filter((l) => l.scrollWidth > l.clientWidth + 1).length;
  out.totalLines = document.querySelectorAll('.chart .line').length;
  out.docScrollW = document.documentElement.scrollWidth;
  out.headH = q('.song-head')?.offsetHeight;
  // horizontal overflow anywhere
  out.overflowX = [...document.querySelectorAll('body *')].filter((e) => e.getBoundingClientRect().right > innerWidth + 1).slice(0, 12).map((e) => (e.tagName + '.' + e.className).slice(0, 60));
  return out;
});
console.log(JSON.stringify(report, null, 2));

// scroll the chart
await page.evaluate(() => { const s = document.querySelector('.song-body'); if (s) s.scrollTop = 400; });
await page.waitForTimeout(300);
await shot('song-02-scrolled');
await page.evaluate(() => { const s = document.querySelector('.song-body'); if (s) s.scrollTop = s.scrollHeight; });
await page.waitForTimeout(300);
await shot('song-04-bottom');

// stage mode
const stageBtn = page.locator('.song-head button', { hasText: /מצב במה|Stage/ });
if (await stageBtn.count()) { await stageBtn.first().click(); await page.waitForTimeout(400); await shot('song-03-stage'); }

await browser.close();
