// Part 1 of the FRAC Studio demo video: records the Creator flow end to end (brief, research, competencies with an
// instruction for the AI, roles, ladders, expert check, Fix all, download, history) against a running portal and
// FRAC Studio service. Makes real AI calls (about $2-4, 10-15 minutes). See README.md.
// Writes out/video/*.webm, out/marks.json ([{ t, label, kind }], t in seconds from the start of the video;
// kind "show" = kept near real speed, "wait" = an AI job running, compressed by edit.mjs), out/shots/*.png and the
// downloaded FRAC workbook (out/FRAC-demo.xlsx, which record-review.mjs reviews).
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';

const BASE = `${process.env.PORTAL_URL ?? 'http://localhost:3000'}/app/home/frac-studio`;
const CADRE = process.env.DEMO_CADRE ?? 'ASHA';
const STATE = process.env.DEMO_STATE ?? 'Karnataka';
const SCOPE = process.env.DEMO_SCOPE
  ?? 'ASHA in rural villages and urban NUHM areas: maternal, newborn and child health, immunisation, family planning and NCD screening.';
const INSTRUCTION = process.env.DEMO_INSTRUCTION ?? 'Include a digital literacy competency for the ASHA app and the RCH portal.';
const W = 1440, H = 900;
process.chdir(fileURLToPath(new URL('.', import.meta.url)));
rmSync('out/video', { recursive: true, force: true });
mkdirSync('out/video', { recursive: true });
mkdirSync('out/shots', { recursive: true });

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({
  viewport: { width: W, height: H }, deviceScaleFactor: 1, acceptDownloads: true,
  recordVideo: { dir: 'out/video', size: { width: W, height: H } },
});
// A visible cursor and click ripple, since headless video has no pointer
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
const shot = (name) => page.screenshot({ path: `out/shots/${name}.png` }).catch(() => {});

async function glide(locator) {
  const box = await locator.boundingBox();
  if (box) await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 18 });
}
async function click(locator) {
  await locator.scrollIntoViewIfNeeded();
  await glide(locator);
  await pause(350);
  await locator.click();
}
async function scrollShow(px = 900, steps = 6, back = true) {
  for (let i = 0; i < steps; i++) { await page.mouse.wheel(0, px / steps); await pause(450); }
  await pause(800);
  if (back) { await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' })); await pause(900); }
}
const running = () => page.locator('.next-step-msg[role="status"]');
async function waitJob(label, maxMin = 20) {
  // A job shows its progress message while it runs
  const started = await running().first().waitFor({ state: 'visible', timeout: 15000 }).then(() => true).catch(() => false);
  if (!started) return false;
  mark(label, 'wait');
  await running().first().waitFor({ state: 'detached', timeout: maxMin * 60000 }).catch(async () => {
    await running().first().waitFor({ state: 'hidden', timeout: 1000 }).catch(() => {});
  });
  await pause(1500);
  const err = await page.locator('.error[role="alert"]').first().textContent().catch(() => null);
  if (err && err.trim()) console.log('ERROR shown:', err.trim());
  return true;
}
const primary = () => page.locator('.next-step-actions .btn-primary').first();
async function openTab(name) {
  await click(page.locator('nav.tabs .tab', { hasText: name }).first());
  await pause(1200);
}

try {
  // 1. Brief
  await page.goto(`${BASE}/creator`, { waitUntil: 'networkidle', timeout: 90000 });
  await pause(1500);
  mark('FRAC Studio: build a FRAC dictionary with an AI agent');
  await pause(2500);
  mark('Step 1. Brief: the position, the state and what the FRAC should cover');
  await click(page.locator('#fs-cadre'));
  await page.locator('#fs-cadre').pressSequentially(CADRE, { delay: 120 });
  await pause(1500);
  for (const name of ['usePostings', 'useRoles']) {
    const box = page.locator(`input[name="${name}"]`);
    if (await box.count() && await box.isChecked()) await box.uncheck();
  }
  await click(page.locator('select[name="state"]'));
  await page.locator('select[name="state"]').selectOption(STATE);
  await pause(800);
  await click(page.locator('#fs-prompt'));
  await page.locator('#fs-prompt').pressSequentially(SCOPE, { delay: 18 });
  await pause(1200);
  await shot('01-brief');
  await click(page.locator('button[type="submit"]', { hasText: 'Create FRAC' }));
  await page.waitForURL(/\/creator\/[0-9a-f-]{36}/, { timeout: 60000 });
  await page.locator('nav.tabs').waitFor({ timeout: 60000 });
  await pause(2000);

  // 2. Research
  mark('Step 2. Job research: optional documents, then the agent researches the job');
  await scrollShow(500, 4);
  await click(primary());
  if (!(await waitJob('The agent researches the job description, postings, authorised scope and sources'))) {
    await click(primary());
    await waitJob('The agent researches the job description, postings, authorised scope and sources');
  }
  mark('Research result: summary, postings, authorised and not-authorised work, sources');
  await shot('02-research');
  await scrollShow(1600, 10);

  // 3. Competencies, with an instruction for the agent (feedback is read first)
  await openTab('Competencies');
  mark('Step 3. Competencies: an instruction for the AI agent, read before anything else');
  const box = page.locator('textarea.revise-input');
  await click(box);
  await box.pressSequentially(INSTRUCTION, { delay: 25 });
  await pause(1200);
  await click(primary());
  await waitJob('The agent derives the competencies from the research and follows the instruction');
  mark('Competencies: typed Domain, Functional and Behavioural, ready to edit');
  await shot('03-competencies');
  await scrollShow(1400, 8);

  // 4. Roles and activities
  await click(primary());
  await pause(1200);
  if (!(await waitJob('The agent writes roles and activities and maps each activity to a competency'))) {
    mark('Step 4. Roles and activities');
    await click(primary());
    await waitJob('The agent writes roles and activities and maps each activity to a competency');
  }
  mark('Roles and activities: Yes/No per posting, source tier, competency@level for each activity');
  await shot('04-roles');
  await scrollShow(1600, 10);

  // 5. Level ladders
  await click(primary());
  await pause(1200);
  if (!(await waitJob('The agent writes five Bloom\'s levels for every competency'))) {
    mark('Step 5. Level ladders');
    await click(primary());
    await waitJob('The agent writes five Bloom\'s levels for every competency');
  }
  mark('Level ladders: L1 Foundational to L5 Expert, measurable verbs and indicators');
  await shot('05-ladders');
  await scrollShow(1400, 8);

  // 6. Expert check
  mark('Step 6. Expert check: rule-based checks plus the agent\'s clinical checklist');
  await click(page.locator('.next-step-actions button', { hasText: /Run expert check/ }).first());
  await waitJob('The expert check reviews scope, Bloom\'s verbs, structure and state fit');
  if (!(await page.locator('nav.tabs .tab.active', { hasText: 'Expert check' }).count())) await openTab('Expert check');
  mark('Expert check report: verdict, scores and findings with suggested fixes');
  await shot('06-check');
  await scrollShow(1400, 8);

  // 7. Fix all findings, then the check runs again
  const fixAll = page.locator('button.fix-all-btn');
  if (await fixAll.count() && await fixAll.isEnabled()) {
    mark('Fix all findings: the agent fixes what it can and re-runs the check');
    await click(fixAll);
    await waitJob('The agent fixes the findings, rewrites the ladders it named, then re-checks', 25);
    mark('After the fix: what changed, and what is left for the team');
    await shot('07-fixed');
    await scrollShow(1200, 8);
  }

  // 8. Download and history
  await openTab('Level ladders');
  mark('Download the finished FRAC as Excel; every change is kept in History');
  const dl = page.locator('.next-step-actions button', { hasText: /Download/ }).first();
  if (await dl.count()) {
    const wait = page.waitForEvent('download', { timeout: 30000 }).catch(() => null);
    await click(dl);
    const file = await wait;
    if (file) await file.saveAs('out/FRAC-demo.xlsx').catch(() => {});
  }
  await pause(1500);
  await openTab('History');
  await shot('08-history');
  await scrollShow(800, 5);
  mark('end');
} catch (e) {
  console.log('FAILED:', e.message);
  await shot('zz-failure');
  mark('end');
}

writeFileSync('out/marks.json', JSON.stringify(marks, null, 2));
const video = page.video();
await context.close();
console.log('video:', video ? await video.path() : 'none');
await browser.close();
