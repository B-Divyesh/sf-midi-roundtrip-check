import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const track = [0,0xb0,2,90, 0,0xe0,0,96, 0,0xc0,10, 0,0x90,60,100, 96,60,0, 0,0xff,0x2f,0];
const fixture = Buffer.from([77,84,104,100, 0,0,0,6, 0,0, 0,1, 1,224, 77,84,114,107, 0,0,0,track.length, ...track]);

test('loads accessibly without console errors and analyzes a MIDI file', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  await page.locator('#export-input').setInputFiles({ name: 'breath-test.mid', mimeType: 'audio/midi', buffer: fixture });
  await expect(page.getByRole('heading', { name: 'breath-test.mid' })).toBeVisible();
  await expect(page.getByText('Pitch bend does not return to center')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Export CSV' })).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter(v => ['serious','critical'].includes(v.impact ?? ''))).toEqual([]);
  expect(errors).toEqual([]);
});

test('keyboard path opens the file chooser and mobile layout does not overflow', async ({ page }, testInfo) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Choose file' }).focus();
  await expect(page.getByRole('button', { name: 'Choose file' })).toBeFocused();
  await expect(page.locator('body')).toHaveCSS('overflow-x', 'visible');
  const width = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
  expect(width, `${testInfo.project.name} viewport should not scroll sideways`).toBe(true);
});
