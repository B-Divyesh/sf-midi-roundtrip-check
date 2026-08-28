import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const base = 'https://midi-roundtrip-check.sociobot.in';
const out = {};
const header = (format = 0, tracks = 1, division = 480) => [
  77, 84, 104, 100, 0, 0, 0, 6,
  (format >> 8) & 255, format & 255,
  (tracks >> 8) & 255, tracks & 255,
  (division >> 8) & 255, division & 255,
];
const midi = (events, { format = 0, tracks = 1, division = 480, end = true } = {}) => {
  const data = [...events, ...(end ? [0, 0xff, 0x2f, 0] : [])];
  return Buffer.from([...header(format, tracks, division), 77, 84, 114, 107,
    (data.length >>> 24) & 255, (data.length >>> 16) & 255,
    (data.length >>> 8) & 255, data.length & 255, ...data]);
};
const reference = midi([
  0, 0xc0, 10,
  0, 0xb0, 2, 90,
  0, 0xe0, 0, 96,
  0, 0x90, 60, 100,
  96, 0x80, 60, 0,
  0, 0xe0, 0, 64,
]);
const exported = midi([
  0, 0xc1, 10,
  0, 0x91, 60, 100,
  96, 0x81, 60, 0,
]);
const boundary = midi([
  0, 0xcf, 127,
  0, 0xbf, 127, 127,
  0, 0xef, 127, 127,
]);
const empty = midi([]);
const zeroDivision = midi([], { division: 0 });
const smpte = midi([], { division: 0xe728 });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
const page = await context.newPage();
const requests = [];
const errors = [];
page.on('request', request => requests.push({ url: request.url(), method: request.method(), resourceType: request.resourceType(), postData: request.postData() }));
page.on('console', message => { if (message.type() === 'error') errors.push(`console: ${message.text()}`); });
page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));
page.on('requestfailed', request => errors.push(`requestfailed: ${request.url()} ${request.failure()?.errorText}`));
await page.goto(base, { waitUntil: 'networkidle' });

out.cold = {
  title: await page.title(),
  h1: await page.locator('h1').allTextContents(),
  sampleActions: await page.getByText(/sample data|load sample|try it/i).allTextContents(),
  cookies: await context.cookies(),
  storage: await page.evaluate(() => Object.keys(localStorage)),
};

// Full normal quick-check and free CSV export.
await page.locator('#export-input').setInputFiles({ name: 'normal-export.mid', mimeType: 'audio/midi', buffer: reference });
await page.getByRole('heading', { name: 'normal-export.mid' }).waitFor();
out.normal = {
  score: await page.locator('.score').innerText(),
  metrics: await page.locator('.metrics').innerText(),
  findings: await page.locator('.finding-list').innerText(),
  timelineMarks: await page.locator('.event-mark').count(),
};
const csvDownload = page.waitForEvent('download');
await page.getByRole('button', { name: 'Export CSV' }).click();
const csv = await csvDownload;
const csvPath = await csv.path();
out.csv = { suggestedFilename: csv.suggestedFilename(), content: await (await import('node:fs/promises')).readFile(csvPath, 'utf8') };

// Comparison fixture seeds one moved channel, one dropped controller, and two dropped bends.
await page.getByRole('tab', { name: 'Compare export' }).click();
await page.locator('#reference-input').setInputFiles({ name: 'reference.mid', mimeType: 'audio/midi', buffer: reference });
await page.locator('#export-input').setInputFiles({ name: 'damaged-export.mid', mimeType: 'audio/midi', buffer: exported });
await page.getByRole('heading', { name: 'damaged-export.mid' }).waitFor();
out.comparison = {
  score: await page.locator('.score').innerText(),
  verdict: await page.locator('.verdict').innerText(),
  findingTitles: await page.locator('.finding-list .finding b').allTextContents(),
  findingDetails: await page.locator('.finding-list .finding p').allTextContents(),
};

const axeResult = await new AxeBuilder({ page }).analyze();
out.axeAfterResults = axeResult.violations.map(v => ({
  id: v.id,
  impact: v.impact,
  help: v.help,
  nodes: v.nodes.map(n => ({ target: n.target, html: n.html, failureSummary: n.failureSummary })),
}));
await page.screenshot({ path: '.factory/verification-artifacts/live-results-desktop.png', fullPage: true });

// Invalid extension, malformed content, and recovery to a boundary-value MIDI.
await page.getByRole('button', { name: 'Check another file' }).click();
await page.locator('#export-input').setInputFiles({ name: 'valid-midi.txt', mimeType: 'text/plain', buffer: reference });
out.invalidExtension = await page.locator('[role=alert]').innerText();
await page.locator('#export-input').setInputFiles({ name: 'broken.mid', mimeType: 'audio/midi', buffer: Buffer.from('not midi') });
out.malformed = await page.locator('[role=alert]').innerText();
await page.locator('#export-input').setInputFiles({ name: 'boundary.mid', mimeType: 'audio/midi', buffer: boundary });
await page.getByRole('heading', { name: 'boundary.mid' }).waitFor();
out.boundaryRecovery = {
  metrics: await page.locator('.metrics').innerText(),
  findings: await page.locator('.finding-list').innerText(),
};

await page.getByRole('button', { name: 'Check another file' }).click();
for (const [name, buffer] of [['zero-division.mid', zeroDivision], ['smpte.mid', smpte], ['truncated.mid', Buffer.from([77,84,104,100,0])]]) {
  await page.locator('#export-input').setInputFiles({ name, mimeType: 'audio/midi', buffer });
  out[name] = await page.locator('[role=alert]').innerText();
}
await page.locator('#export-input').setInputFiles({ name: 'empty.mid', mimeType: 'audio/midi', buffer: empty });
await page.getByRole('heading', { name: 'empty.mid' }).waitFor();
out.empty = { score: await page.locator('.score').innerText(), timeline: await page.locator('.empty-timeline').innerText() };

// Keyboard entry, focus treatment, and tab-widget arrow behavior.
await page.goto(base, { waitUntil: 'networkidle' });
await page.keyboard.press('Tab');
out.firstTab = await page.evaluate(() => {
  const el = document.activeElement;
  const style = el ? getComputedStyle(el) : null;
  return { text: el?.textContent?.trim(), tag: el?.tagName, outline: style?.outline, rect: el?.getBoundingClientRect().toJSON() };
});
await page.getByRole('button', { name: 'Choose file' }).focus();
const enterChooser = page.waitForEvent('filechooser', { timeout: 3000 }).then(() => true).catch(() => false);
await page.keyboard.press('Enter');
out.enterOpensChooser = await enterChooser;
await page.getByRole('tab', { name: 'Quick check' }).focus();
await page.keyboard.press('ArrowRight');
out.arrowRightTab = {
  focused: await page.evaluate(() => document.activeElement?.textContent?.trim()),
  quickSelected: await page.getByRole('tab', { name: 'Quick check' }).getAttribute('aria-selected'),
  compareSelected: await page.getByRole('tab', { name: 'Compare export' }).getAttribute('aria-selected'),
};

// Restore form validation and privacy-network inspection.
await page.getByRole('button', { name: 'Have a license?' }).click();
out.restoreFocus = await page.evaluate(() => ({ id: document.activeElement?.id, name: document.activeElement?.getAttribute('aria-label'), tag: document.activeElement?.tagName }));
await page.locator('#license-token').fill('qa-invalid-token-browser');
await page.getByRole('button', { name: 'Verify license' }).click();
await page.getByText('This license is no longer active.').waitFor();
out.invalidLicense = await page.locator('#license-status').innerText();
out.storageAfterLicense = await page.evaluate(() => Object.fromEntries(Object.entries(localStorage)));

out.requests = requests;
out.errors = errors;

// Mobile, touch targets, reduced motion, and 200% text sizing.
const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
const mobile = await mobileContext.newPage();
await mobile.goto(base, { waitUntil: 'networkidle' });
const mobileAxe = await new AxeBuilder({ page: mobile }).analyze();
out.mobile = {
  overflow: await mobile.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth })),
  axe: mobileAxe.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.length })),
  undersizedTargets: await mobile.locator('a,button,input').evaluateAll(els => els.filter(el => {
    const r = el.getBoundingClientRect(); const s = getComputedStyle(el);
    return s.display !== 'none' && s.visibility !== 'hidden' && (r.width < 44 || r.height < 44);
  }).map(el => { const r = el.getBoundingClientRect(); return { tag: el.tagName, text: el.textContent?.trim(), id: el.id, width: Math.round(r.width), height: Math.round(r.height) }; })),
  motion: await mobile.evaluate(() => ({ reduce: matchMedia('(prefers-reduced-motion: reduce)').matches, scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior, heroAnimation: getComputedStyle(document.querySelector('.hero-copy')).animationDuration })),
};
await mobile.screenshot({ path: '.factory/verification-artifacts/live-mobile-390.png', fullPage: true });
await mobile.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
out.mobile.text200 = await mobile.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth, scrollHeight: document.documentElement.scrollHeight }));

for (const path of ['/privacy/', '/terms/', '/demo', '/does-not-exist']) {
  const routeContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const p = await routeContext.newPage();
  const nav = await p.goto(base + path, { waitUntil: 'networkidle' });
  const axe = await new AxeBuilder({ page: p }).analyze();
  out[`route:${path}`] = {
    status: nav?.status(), title: await p.title(), h1: await p.locator('h1').allTextContents(),
    sampleActions: await p.getByText(/sample data|load sample|try it/i).allTextContents(),
    axe: axe.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.length })),
  };
  await routeContext.close();
}

const offlineContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
const offlinePage = await offlineContext.newPage();
await offlinePage.goto(base, { waitUntil: 'networkidle' });
out.offline = await offlinePage.evaluate(async () => {
  const registration = await navigator.serviceWorker.ready;
  await registration.update();
  return { scope: registration.scope, caches: await caches.keys() };
});
await offlinePage.reload({ waitUntil: 'networkidle' });
out.offline.controlled = await offlinePage.evaluate(() => Boolean(navigator.serviceWorker.controller));
await offlineContext.setOffline(true);
await offlinePage.reload({ waitUntil: 'domcontentloaded' });
out.offline.reload = {
  h1: await offlinePage.locator('h1').innerText(),
  analyzerVisible: await offlinePage.locator('#analyzer').isVisible(),
  downloadHref: await offlinePage.locator('#platform-download').getAttribute('href'),
};
await offlineContext.close();

await mobileContext.close();
await browser.close();
console.log(JSON.stringify(out, null, 2));
