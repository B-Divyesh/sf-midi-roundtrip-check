import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';

const track = [0, 0xc0, 10, 0, 0xb0, 2, 90, 0, 0xe0, 0, 96, 0, 0x90, 60, 100, 96, 0x80, 60, 0, 0, 0xff, 0x2f, 0];
const fixture = Buffer.from([77, 84, 104, 100, 0, 0, 0, 6, 0, 0, 0, 1, 1, 224, 77, 84, 114, 107, 0, 0, 0, track.length, ...track]);
const emptyFixture = Buffer.from([77, 84, 104, 100, 0, 0, 0, 6, 0, 0, 0, 1, 1, 224, 77, 84, 114, 107, 0, 0, 0, 4, 0, 0xff, 0x2f, 0]);
const origin = 'http://127.0.0.1:4173';

test('@claim:sample-comparison shows four specific export differences in one click', async ({ page }) => {
  await page.goto('/demo/');
  await expect(page.getByRole('status', { name: 'Demo mode' })).toContainText('sample data, nothing is saved');
  await expect(page.getByRole('heading', { name: 'signal-sketch-export.mid' })).toBeVisible();
  await expect(page.getByText('4 export differences found')).toBeVisible();
  await expect(page.getByText('0 of 4 reference intent events matched exactly.')).toBeVisible();
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.getByText('4 export differences found')).toBeVisible();
});

test('@claim:local-processing keeps the demo comparison on the product origin', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', request => requests.push(request.url()));
  await page.goto('/demo/');
  await expect(page.getByText('4 export differences found')).toBeVisible();
  expect(requests.every(url => new URL(url).origin === origin)).toBe(true);
});

test('@claim:offline-reload keeps the sample comparison available after the first visit', async ({ browser }) => {
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    await page.goto(`${origin}/demo/`);
    await expect(page.getByText('4 export differences found')).toBeVisible();
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();
    await expect(page.getByText('4 export differences found')).toBeVisible();
    await context.setOffline(true);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByText('4 export differences found')).toBeVisible();
    await expect(page.getByRole('status', { name: 'Demo mode' })).toBeVisible();
  } finally {
    await context.close();
  }
});

test('@claim:csv-export downloads the populated demo report', async ({ page }) => {
  await page.goto('/demo/');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export CSV' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('signal-sketch-export-midi-check.csv');
  const path = await download.path();
  expect(path).not.toBeNull();
  const csv = await readFile(path!, 'utf8');
  expect(csv.split('\n')[0]).toContain('"kind"');
  expect(csv).toContain('"finding","error"');
  expect(csv).toContain('"note-on"');
});

test('@claim:demo-isolation keeps existing real storage unchanged while the demo is open', async ({ page }) => {
  await page.route('https://api.sociobot.in/**', route => route.abort());
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('sb_license:midi-roundtrip-check', 'real-device-license'));
  await page.goto('/demo/');
  await page.getByRole('button', { name: 'Reset demo' }).click();
  const storage = await page.evaluate(() => ({
    realEntries: Object.entries(localStorage).filter(([key]) => !key.startsWith('demo:')),
    demo: localStorage.getItem('demo:midi-roundtrip-check:active')
  }));
  expect(storage).toEqual({ realEntries: [['sb_license:midi-roundtrip-check', 'real-device-license']], demo: 'active' });
  await expect(page.getByText('4 export differences found')).toBeVisible();
  await page.getByRole('link', { name: 'Start for real' }).click();
  await expect(page).toHaveURL(`${origin}/`);
  expect(await page.evaluate(() => localStorage.getItem('demo:midi-roundtrip-check:active'))).toBeNull();
});

test('@claim:receipt-status keeps checkout disabled until the billing offer is registered', async ({ page }) => {
  await page.goto('/demo/');
  await expect(page.getByRole('heading', { name: 'Receipt mode is being registered' })).toBeVisible();
  await expect(page.getByText('A $19 one-time license will add self-contained HTML receipts.')).toBeVisible();
  await expect(page.getByText('Checkout is unavailable until the billing offer is registered.')).toBeVisible();
  await expect(page.locator('a[href*="/checkout"]')).toHaveCount(0);
});

test('@claim:release-download resolves a platform installer from same-origin release metadata', async ({ page }) => {
  const errors: string[] = [];
  const requests: string[] = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => requests.push(request.url()));
  await page.goto('/demo/');
  await expect(page.locator('#platform-download')).toHaveAttribute('href', /releases\/download\/v[^/]+\/.*\.(?:AppImage|exe|dmg)$/);
  expect(requests.filter(url => new URL(url).origin !== origin)).toEqual([]);
  expect(errors).toEqual([]);
});

test('the populated comparison has no serious or critical axe violations', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('/demo/');
  await expect(page.getByRole('heading', { name: 'signal-sketch-export.mid' })).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter(violation => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
  expect(errors).toEqual([]);
});

test('arrow keys change inspection tabs and keep the selected panel valid', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('tab', { name: 'Quick check' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Compare export' })).toBeFocused();
  await expect(page.getByRole('tab', { name: 'Compare export' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#compare-panel')).toBeVisible();
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByRole('tab', { name: 'Quick check' })).toBeFocused();
  await expect(page.locator('#single-panel')).toBeVisible();
});

test('a malformed file shows an error and a valid file works afterwards', async ({ page }) => {
  await page.goto('/');
  await page.locator('#export-input').setInputFiles({ name: 'not-midi.txt', mimeType: 'text/plain', buffer: Buffer.from('not midi') });
  await expect(page.getByRole('alert')).toContainText('That file is not MIDI');
  await page.locator('#export-input').setInputFiles({ name: 'breath-test.mid', mimeType: 'audio/midi', buffer: fixture });
  await expect(page.getByRole('heading', { name: 'breath-test.mid' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Export CSV' })).toBeVisible();
});

test('a valid empty MIDI reports zero notes without contradictory copy', async ({ page }) => {
  await page.goto('/');
  await page.locator('#export-input').setInputFiles({ name: 'empty.mid', mimeType: 'audio/midi', buffer: emptyFixture });
  await expect(page.getByText('No controller timeline in this file')).toBeVisible();
  await expect(page.getByText('This file has 0 notes and no pitch-bend, program, or control-change messages.')).toBeVisible();
});

test('keyboard restore opens the license field and moves focus', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Restore a license' }).click();
  await expect(page.getByRole('button', { name: 'Restore a license' })).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#license-token')).toBeFocused();
});

test('routes have titles, a designed 404, 44px controls, and no mobile overflow', async ({ page }, testInfo) => {
  await page.goto('/');
  await expect(page).toHaveTitle('MIDI Roundtrip Check — compare MIDI exports');
  for (const route of ['/demo/', '/privacy/', '/terms/', '/404.html']) {
    await page.goto(route);
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('h1')).toHaveCount(1);
  }
  await page.goto('/404.html');
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  await page.goto('/');
  const undersized = await page.locator('a, button').evaluateAll(elements => elements
    .filter(element => !element.hasAttribute('disabled') && (element as HTMLElement).offsetParent !== null)
    .map(element => ({ text: (element.textContent || '').trim(), height: element.getBoundingClientRect().height, width: element.getBoundingClientRect().width }))
    .filter(control => control.height < 44 || control.width < 44));
  expect(undersized, `${testInfo.project.name} controls must meet 44px target`).toEqual([]);
  const fits = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
  expect(fits, `${testInfo.project.name} viewport should not scroll sideways`).toBe(true);
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  const fitsAtTwoHundredPercent = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
  expect(fitsAtTwoHundredPercent, `${testInfo.project.name} viewport should not scroll sideways at 200% text`).toBe(true);
});
