// Part 2 of the FRAC Studio demo video: records the Reviewer (upload an existing FRAC, expert review, report) and
// My FRACs. Reviews REVIEW_FILE, by default the workbook record.mjs downloaded (out/FRAC-demo.xlsx). See README.md.
// Writes out/review-video/*.webm, out/review-marks.json (same shape as record.mjs) and out/review-shots/*.png.
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { copyFileSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';

const BASE = `${process.env.PORTAL_URL ?? 'http://localhost:3000'}/app/home/frac-studio`;
const CADRE = process.env.DEMO_CADRE ?? 'ASHA';
const STATE = process.env.DEMO_STATE ?? 'Karnataka';
const NOTES = process.env.DEMO_REVIEW_NOTES ?? 'Draft from the district team; check it against current Karnataka programmes.';
const W = 1440, H = 900;
process.chdir(fileURLToPath(new URL('.', import.meta.url)));
// The file name shows in the report title, so the default copy gets a reader-friendly name
const FILE = process.env.REVIEW_FILE ?? `out/${CADRE}_${STATE}_FRAC_v1.xlsx`.replace(/\s+/g, '_');
if (!process.env.REVIEW_FILE) {
  if (!existsSync('out/FRAC-demo.xlsx')) throw new Error('Run record.mjs first, or set REVIEW_FILE to an .xlsx FRAC to review.');
  copyFileSync('out/FRAC-demo.xlsx', FILE);
}
rmSync('out/review-video', { recursive: true, force: true });
mkdirSync('out/review-video', { recursive: true });
mkdirSync('out/review-shots', { recursive: true });

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ viewport: { width: W, height: H }, recordVideo: { dir: 'out/review-video', size: { width: W, height: H } } });
await context.addInitScript(() => {
  const add = () => {
    if (document.getElementById('__cursor')) return;
    const c = document.createElement('div');
    c.id = '__cursor';
    Object.assign(c.style, { position: 'fixed', zIndex: 2147483647, width: '22px', height: '22px', borderRadius: '50%',
      background: 'rgba(28,93,149,0.35)', border: '2px solid #1c5d95', pointerEvents: 'none', left: '-40px', top: '-40px',
      transform: 'translate(-50%,-50%)', transition: 'left 0.25s ease, top 0.25s ease' });
    document.body.appendChild(c);
    document.addEventListener('mousemove', (e) => { c.style.left = e.clientX + 'px'; c.style.top = e.clientY + 'px'; }, true);
    document.addEventListener('mousedown', () => { c.style.background = 'rgba(28,93,149,0.75)'; }, true);
    document.addEventListener('mouseup', () => { c.style.background = 'rgba(28,93,149,0.35)'; }, true);
  };
  if (document.body) add(); else document.addEventListener('DOMContentLoaded', add);
});

const page = await context.newPage();
const t0 = Date.now();
const marks = [];
const mark = (label, kind = 'show') => { marks.push({ t: (Date.now() - t0) / 1000, label, kind }); console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s] ${kind}: ${label}`); };
const pause = (ms) => page.waitForTimeout(ms);
const shot = (name) => page.screenshot({ path: `out/review-shots/${name}.png` }).catch(() => {});
async function click(locator) {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  if (box) await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 18 });
  await pause(350);
  await locator.click();
}
async function scrollShow(px = 900, steps = 6, back = true) {
  for (let i = 0; i < steps; i++) { await page.mouse.wheel(0, px / steps); await pause(450); }
  await pause(800);
  if (back) { await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' })); await pause(900); }
}

try {
  await page.goto(`${BASE}/reviewer`, { waitUntil: 'networkidle', timeout: 90000 });
  await pause(1500);
  mark('Review FRAC: upload an existing FRAC and get a graded expert review');
  await pause(2000);
  await page.locator('.file-drop input[type="file"]').setInputFiles(FILE);
  const drop = page.locator('.file-drop');
  const box = await drop.boundingBox();
  if (box) await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 18 });
  await pause(1500);
  mark('Optional context: position, state and reviewer notes');
  await click(page.locator('#fs-review-cadre'));
  await page.locator('#fs-review-cadre').pressSequentially(CADRE, { delay: 120 });
  await page.locator('select[aria-label="State"]').selectOption(STATE);
  await click(page.locator('#fs-review-notes'));
  await page.locator('#fs-review-notes').pressSequentially(NOTES, { delay: 20 });
  await pause(1200);
  await shot('01-upload');
  await click(page.locator('.actions .btn-primary', { hasText: 'Review FRAC' }));
  // The review runs as a job; the report replaces the form when it is done
  mark('The expert check reviews the workbook: rules first, then the agent\'s clinical checklist', 'wait');
  await page.locator('ws-app-frac-review-report').waitFor({ timeout: 20 * 60000 });
  await pause(2000);
  mark('Review report: verdict, scores per check, and every finding with a suggested fix');
  await shot('02-report');
  await scrollShow(2200, 14);
  mark('Download the review, or open the FRAC in Create FRAC to fix it with the agent');
  await glide(page.locator('.actions .btn-primary', { hasText: 'Open in Create FRAC' }));
  await pause(2500);

  await page.goto(`${BASE}/my-fracs`, { waitUntil: 'networkidle', timeout: 90000 });
  await pause(1500);
  mark('My FRACs: every FRAC and review, saved with versions, to open, continue or delete');
  await shot('03-my-fracs');
  await scrollShow(900, 6);
  mark('end');
} catch (e) {
  console.log('FAILED:', e.message);
  await shot('zz-failure');
  mark('end');
}

async function glide(locator) {
  const b = await locator.boundingBox().catch(() => null);
  if (b) await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 18 });
}

writeFileSync('out/review-marks.json', JSON.stringify(marks, null, 2));
const video = page.video();
await context.close();
console.log('video:', video ? await video.path() : 'none');
await browser.close();
