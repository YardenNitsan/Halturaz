import { chromium } from 'playwright-core';

const BASE = process.env.SMOKE_URL || 'http://127.0.0.1:5174';
const TITLE = 'Wonderwall';
const ARTIST = 'Oasis';

let fail = 0;
const ok = (label) => console.log(`ok   ${label}`);
const bad = (label, detail) => {
  fail++;
  console.log(`FAIL ${label}${detail ? `: ${detail}` : ''}`);
};

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

try {
  await page.goto(`${BASE}/songs`, { waitUntil: 'networkidle' });

  const importBtn = page.getByRole('button', { name: /ייבוא מהרשת|Import online/i });
  if (!(await importBtn.count())) bad('import button visible');
  else {
    ok('import button visible');
    await importBtn.click();
  }

  const search = page.getByLabel(/חפש שיר באינטרנט|Search the web/i);
  await search.fill(`${TITLE} ${ARTIST}`);
  await page.waitForTimeout(500);

  const hit = page.locator('.import-hit').filter({ hasText: TITLE }).first();
  await hit.waitFor({ state: 'visible', timeout: 15000 });
  ok('itunes results show Wonderwall');

  const addBtn = hit.locator('.import-hit-action');
  await addBtn.click();

  await page.waitForSelector('.import-hit', { state: 'hidden', timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(800);

  const sheetOpen = await page.locator('.import-sheet').count();
  if (sheetOpen) bad('import sheet closed after add');
  else ok('import sheet closed after add');

  const row = page.locator('.lib-row').filter({ hasText: TITLE }).first();
  if (!(await row.count())) bad('song row in library');
  else {
    ok('song row in library');
    const noChart = await row.locator('.tag-flat').count();
    if (noChart) bad('song has chart tag missing');
    else ok('song shows chart (no "no chart" tag)');
  }

  await row.click();
  await page.waitForURL(/\/song\//, { timeout: 10000 });

  const chartSection = page.locator('.chart-section');
  const sectionCount = await chartSection.count();
  if (sectionCount < 2) bad('chart sections rendered', `got ${sectionCount}`);
  else ok(`chart sections rendered (${sectionCount})`);

  const chord = page.locator('.chart-section .c').first();
  if (!(await chord.count())) bad('chord elements on song page');
  else ok('chord elements on song page');

  const lyric = page.getByText(/Today is gonna be the day/i);
  if (!(await lyric.count())) bad('imported lyrics visible');
  else ok('imported lyrics visible');
} catch (e) {
  bad('import flow', e.message);
} finally {
  await browser.close();
}

console.log(fail ? `\n${fail} import check(s) failed` : '\nimport flow passes');
process.exit(fail ? 1 : 0);
