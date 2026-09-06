import './style.css';
import { analysisCsv, compareMidi, parseMidi, type Comparison, type Finding, type MidiAnalysis, type MidiEvent } from './midi';

const SLUG = 'midi-roundtrip-check';
const API = 'https://api.sociobot.in/api/v1';
const REPO = 'B-Divyesh/sf-midi-roundtrip-check';
const LICENSE_KEY = `sb_license:${SLUG}`;
const VERIFY_KEY = `${LICENSE_KEY}:verify`;
const DEMO_KEY = `demo:${SLUG}:active`;
const isDemo = location.pathname === '/demo' || location.pathname.startsWith('/demo/') || new URLSearchParams(location.search).get('demo') === '1';

type LicenseState = { unlocked: boolean; message: string };
let reference: MidiAnalysis | undefined;
let exported: MidiAnalysis | undefined;
let comparison: Comparison | undefined;
let license: LicenseState = { unlocked: false, message: '' };

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
  <header class="site-header">
    <a class="brand" href="/" aria-label="MIDI Roundtrip Check home"><img src="/mark.svg" width="32" height="32" alt=""><span>MIDI Roundtrip Check</span></a>
    <nav aria-label="Primary"><a href="/demo/">Demo</a><a href="/#analyzer">Check MIDI</a><a href="/#download">Download</a><a href="/privacy/">Privacy</a></nav>
  </header>
  ${isDemo ? `<aside class="demo-banner" role="status" aria-label="Demo mode"><span><b>Demo</b> — sample data, nothing is saved.</span><div><button class="text-button" id="reset-demo" type="button">Reset demo</button><a class="button compact secondary" href="/" id="start-real">Start for real</a></div></aside>` : ''}
  <main id="main">
    <section class="hero" aria-labelledby="hero-title">
      <div class="hero-copy">
        <p class="eyebrow"><span class="status-dot"></span> Local MIDI comparison</p>
        <h1 id="hero-title">Check your MIDI export before you share it.</h1>
        <p class="lede">For electronic musicians and score arrangers who need to find lost bends, channels, controllers, and programs.</p>
        <div class="hero-actions"><a class="button primary" href="/demo/">Try it with sample data</a><span class="action-note">See four export differences in a populated comparison.</span><a class="text-link" href="#analyzer">Choose a MIDI file <span aria-hidden="true">↓</span></a></div>
        <ul class="facts" aria-label="Product facts"><li>Files stay on this device.</li><li>Works offline after the first visit.</li><li>Receipt mode: $19, one time.</li></ul>
      </div>
      <figure class="hero-art"><picture><source srcset="/market-signal.avif" type="image/avif"><img src="/market-signal.webp" width="960" height="640" alt="An electronics stall with patch cables arranged as MIDI event timelines" decoding="async" fetchpriority="high"></picture><figcaption>A local view of MIDI event changes.</figcaption></figure>
    </section>

    <section class="analyzer-wrap" id="analyzer" aria-labelledby="analyzer-title">
      <div class="section-heading"><div><p class="eyebrow">MIDI check</p><h2 id="analyzer-title">Compare a MIDI reference and export</h2></div><p>Start with an export for a health check. Add the original MIDI to compare event intent.</p></div>
      <div class="mode-tabs" role="tablist" aria-label="Inspection mode"><button class="tab active" id="single-tab" role="tab" aria-selected="true" aria-controls="single-panel" tabindex="0">Quick check</button><button class="tab" id="compare-tab" role="tab" aria-selected="false" aria-controls="compare-panel" tabindex="-1">Compare export</button></div>
      <section class="tab-panel" id="single-panel" role="tabpanel" aria-labelledby="single-tab">
        <div id="single-panels" class="file-panels">
          <div class="drop-zone" id="export-zone" data-slot="export">
            <div class="jack" aria-hidden="true">↗</div><div><strong id="export-title">Choose exported MIDI</strong><span id="export-help">or drop a .mid or .midi file here · processed on this device</span></div>
            <input id="export-input" type="file" accept=".mid,.midi,audio/midi,audio/x-midi" aria-label="Choose exported MIDI file">
            <button class="button compact" type="button" data-choose="export">Choose file</button>
          </div>
        </div>
      </section>
      <section class="tab-panel" id="compare-panel" role="tabpanel" aria-labelledby="compare-tab" hidden>
        <p class="tab-description">Choose the original reference and the exported MIDI. The checker compares controller, program, pitch-bend, tick, and channel data.</p>
        <div id="compare-panels" class="file-panels">
          <div class="drop-zone" id="reference-zone" data-slot="reference">
            <div class="jack reference" aria-hidden="true">◎</div><div><strong id="reference-title">Choose original reference</strong><span id="reference-help">the MIDI version before export</span></div>
            <input id="reference-input" type="file" accept=".mid,.midi,audio/midi,audio/x-midi" aria-label="Choose original reference MIDI file">
            <button class="button compact secondary" type="button" data-choose="reference">Choose reference</button>
          </div>
        </div>
      </section>
      <p id="file-status" class="sr-only" aria-live="polite"></p>
      <div id="results" class="results" aria-live="polite"></div>
    </section>

    <section class="how" id="how" aria-labelledby="how-title">
      <div><p class="eyebrow">How it works</p><h2 id="how-title">How the MIDI check works</h2><p>The checker reads event structure locally. It labels practical warnings and does not promise identical playback on every device.</p></div>
      <ol class="steps"><li><span>01</span><strong>Choose MIDI files</strong><p>Start with an export. Add the original file when you need a before-and-after comparison.</p></li><li><span>02</span><strong>Check event intent</strong><p>Channels, programs, controllers, pitch bends, and timing become a readable timeline.</p></li><li><span>03</span><strong>Export the findings</strong><p>Save a free CSV report. Receipt mode adds a printable HTML report when it becomes available.</p></li></ol>
    </section>

    <section class="walkthrough-section" aria-labelledby="walkthrough-title">
      <p class="eyebrow">Walkthrough</p><h2 id="walkthrough-title">See the MIDI check in three steps</h2>
      <div class="walkthrough">
        <figure><img src="/walkthrough-choose.webp" width="960" height="600" alt="The MIDI file chooser for an exported MIDI file" loading="lazy" decoding="async"><figcaption><strong>Choose the export</strong><span>Start with the MIDI you need to check.</span></figcaption></figure>
        <figure><img src="/walkthrough-compare.webp" width="960" height="600" alt="A populated sample comparison with four export differences" loading="lazy" decoding="async"><figcaption><strong>Compare the reference</strong><span>See missing events and a moved channel.</span></figcaption></figure>
        <figure><img src="/walkthrough-report.webp" width="960" height="600" alt="The populated report with a free CSV export button" loading="lazy" decoding="async"><figcaption><strong>Export the findings</strong><span>Save the populated CSV report for free.</span></figcaption></figure>
      </div>
    </section>

    <section class="download" id="download" aria-labelledby="download-title">
      <div><p class="eyebrow">Desktop app</p><h2 id="download-title">Download the desktop app</h2><p>The desktop app keeps MIDI analysis on your computer.</p><div class="download-actions"><a class="button primary" id="platform-download" href="https://github.com/${REPO}/releases/latest">View downloads</a><a class="text-link" href="https://github.com/${REPO}/releases/latest">All platforms</a></div><p id="download-note" class="small">Checking your platform.</p></div>
      <div class="platform-list" aria-label="Supported platforms"><div><span>macOS</span><small>Apple silicon and Intel · unsigned</small></div><div><span>Windows</span><small>Installer and portable build · unsigned</small></div><div><span>Linux</span><small>AppImage and Debian package</small></div></div>
    </section>

    <section class="privacy-section" aria-labelledby="privacy-title">
      <p class="eyebrow">Privacy and limits</p><h2 id="privacy-title">What the checker does not do</h2><p>It does not edit MIDI, generate audio, install hardware drivers, upload compositions, or guarantee playback on every synth.</p><p><a class="text-link" href="/privacy/">Read the privacy policy</a></p>
    </section>

    <section class="unlock" id="unlock" aria-labelledby="unlock-title">
      <div class="ticket-stub"><span>RECEIPT</span><b>∞</b><small>one-time</small></div>
      <div><p class="eyebrow">Receipt mode</p><h2 id="unlock-title">Receipt mode is being registered</h2><p>CSV export and every safety check are free.</p><p>A $19 one-time license will add self-contained HTML receipts.</p><p>You can print, archive, or send those receipts with a project.</p><p>Checkout is unavailable until the billing offer is registered. The free checker works without it.</p>${isDemo ? '' : `<div class="unlock-actions"><button class="button warm" type="button" disabled aria-describedby="checkout-status">Checkout unavailable</button><button class="text-button" id="restore-toggle" type="button" aria-expanded="false" aria-controls="restore-form">Restore a license</button></div><p id="checkout-status" class="small">A billing registration operator must enable this offer before checkout can open.</p><form id="restore-form" class="restore hidden"><label for="license-token">License token</label><div><input id="license-token" autocomplete="off" spellcheck="false" aria-describedby="license-status"><button class="button compact" type="submit">Verify license</button></div></form><p id="license-status" class="small" aria-live="polite"></p>`}</div>
    </section>
  </main>
  <footer><a class="brand" href="/"><img src="/mark.svg" width="28" height="28" alt=""><span>MIDI Roundtrip Check</span></a><p>Compare MIDI references and exports on your device.</p><nav aria-label="Legal"><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a><a href="https://github.com/${REPO}">Source</a></nav><small>v0.1.0 · repair-2</small></footer>`;

const qs = <T extends Element>(selector: string) => document.querySelector<T>(selector)!;
const esc = (s: unknown) => String(s ?? '').replace(/[&<>'"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' })[c]!);

function setDemoMetadata() {
  if (!isDemo) return;
  document.title = 'Demo — MIDI Roundtrip Check';
  qs<HTMLLinkElement>('link[rel="canonical"]').href = `${location.origin}/demo/`;
  const values: Record<string, string> = {
    'meta[name="description"]': 'Try a local MIDI export comparison with bundled sample files. Nothing in the demo is saved.',
    'meta[property="og:title"]': 'Demo — MIDI Roundtrip Check',
    'meta[property="og:description"]': 'Try a local MIDI export comparison with bundled sample files.',
    'meta[property="og:url"]': `${location.origin}/demo/`,
    'meta[name="twitter:title"]': 'Demo — MIDI Roundtrip Check',
    'meta[name="twitter:description"]': 'Try a local MIDI export comparison with bundled sample files.'
  };
  for (const [selector, content] of Object.entries(values)) qs<HTMLMetaElement>(selector).content = content;
}
setDemoMetadata();

const singleTab = qs<HTMLButtonElement>('#single-tab');
const compareTab = qs<HTMLButtonElement>('#compare-tab');
const singlePanel = qs<HTMLElement>('#single-panel');
const comparePanel = qs<HTMLElement>('#compare-panel');
const exportZone = qs<HTMLElement>('#export-zone');
const singlePanels = qs<HTMLElement>('#single-panels');
const comparePanels = qs<HTMLElement>('#compare-panels');

function setCompareMode(compare: boolean, scroll = false) {
  if (compare) comparePanels.prepend(exportZone); else singlePanels.append(exportZone);
  comparePanel.hidden = !compare;
  singlePanel.hidden = compare;
  compareTab.classList.toggle('active', compare);
  singleTab.classList.toggle('active', !compare);
  compareTab.setAttribute('aria-selected', String(compare));
  singleTab.setAttribute('aria-selected', String(!compare));
  compareTab.tabIndex = compare ? 0 : -1;
  singleTab.tabIndex = compare ? -1 : 0;
  if (!compare) {
    reference = undefined;
    comparison = undefined;
  }
  renderResults(scroll);
}

compareTab.addEventListener('click', () => setCompareMode(true));
singleTab.addEventListener('click', () => setCompareMode(false));
qs<HTMLElement>('.mode-tabs').addEventListener('keydown', event => {
  const tabs = [singleTab, compareTab];
  const current = tabs.indexOf(document.activeElement as HTMLButtonElement);
  if (current < 0) return;
  let next = current;
  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (current + 1) % tabs.length;
  else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (current + tabs.length - 1) % tabs.length;
  else if (event.key === 'Home') next = 0;
  else if (event.key === 'End') next = tabs.length - 1;
  else return;
  event.preventDefault();
  setCompareMode(next === 1);
  tabs[next].focus();
});

for (const zone of document.querySelectorAll<HTMLElement>('.drop-zone')) {
  const slot = zone.dataset.slot as 'export' | 'reference';
  const input = qs<HTMLInputElement>(`#${slot}-input`);
  zone.addEventListener('click', event => { if (!(event.target as HTMLElement).closest('button')) input.click(); });
  zone.addEventListener('dragover', event => { event.preventDefault(); zone.classList.add('dragging'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('dragging'));
  zone.addEventListener('drop', event => {
    event.preventDefault();
    zone.classList.remove('dragging');
    const file = event.dataTransfer?.files[0];
    if (file) void readFile(file, slot);
  });
  input.addEventListener('change', () => { if (input.files?.[0]) void readFile(input.files[0], slot); });
  qs<HTMLElement>(`[data-choose="${slot}"]`).addEventListener('click', event => { event.stopPropagation(); input.click(); });
}

function updateLoadedSlot(slot: 'export' | 'reference', name: string) {
  qs(`#${slot}-title`).textContent = name;
  qs<HTMLElement>(`[data-slot="${slot}"]`).classList.add('loaded');
}

async function readFile(file: File, slot: 'export' | 'reference') {
  const status = qs('#file-status');
  if (!/\.(mid|midi)$/i.test(file.name) && !file.type.includes('midi')) {
    status.textContent = 'Choose a .mid or .midi file.';
    showError('That file is not MIDI', 'Choose a file ending in .mid or .midi. The file was not uploaded.');
    return;
  }
  status.textContent = `Reading ${file.name} on this device.`;
  try {
    const parsed = parseMidi(await file.arrayBuffer(), file.name);
    if (slot === 'export') exported = parsed; else reference = parsed;
    updateLoadedSlot(slot, file.name);
    comparison = reference && exported ? compareMidi(reference, exported) : undefined;
    renderResults();
    status.textContent = `${file.name} inspected. ${parsed.events.length} MIDI events read.`;
  } catch (error) {
    showError('This MIDI could not be read', error instanceof Error ? error.message : 'The file is malformed. Export it again and try once more.');
    status.textContent = 'The MIDI file could not be read.';
  }
}

function showError(title: string, detail: string) {
  qs('#results').innerHTML = `<div class="error-box" role="alert"><b>${esc(title)}</b><p>${esc(detail)}</p></div>`;
}

function renderResults(scroll = true) {
  const root = qs<HTMLDivElement>('#results');
  if (!exported) {
    root.innerHTML = '';
    return;
  }
  const allFindings = [...(comparison?.findings ?? []), ...exported.findings];
  const severe = allFindings.filter(f => f.severity === 'error').length;
  const warnings = allFindings.filter(f => f.severity === 'warning').length;
  const differences = comparison ? comparison.expected - comparison.matched : severe;
  const score = comparison ? `${comparison.fidelity}%` : severe ? 'Review' : warnings ? 'Caution' : 'Clear';
  const verdict = comparison ? `${differences} export difference${differences === 1 ? '' : 's'} found` : severe ? `${severe} export difference${severe === 1 ? '' : 's'} found` : warnings ? `${warnings} practical warning${warnings === 1 ? '' : 's'}` : 'No structural warnings found';
  root.innerHTML = `<section class="receipt" aria-labelledby="receipt-title">
    <div class="receipt-head"><div><p class="eyebrow">${isDemo ? 'Demo sample · ' : ''}Local inspection receipt</p><h3 id="receipt-title">${esc(exported.name)}</h3><p>${comparison ? `Compared with ${esc(reference!.name)}` : `Format ${exported.format} · ${exported.tracks} track${exported.tracks === 1 ? '' : 's'} · ${formatTime(exported.durationSeconds)}`}</p></div><div class="score ${severe ? 'bad' : warnings ? 'warn' : 'good'}"><strong>${score}</strong><span>${comparison ? 'intent fidelity' : 'health check'}</span></div></div>
    <div class="metrics"><div><span>Notes</span><b>${exported.counts.notes}</b></div><div><span>Pitch bends</span><b>${exported.counts.bends}</b></div><div><span>Controllers</span><b>${exported.counts.controllers}</b></div><div><span>Programs</span><b>${exported.counts.programs}</b></div></div>
    <div class="verdict"><span class="verdict-icon" aria-hidden="true">${severe ? '!' : warnings ? '△' : '✓'}</span><div><strong>${verdict}</strong><p>${comparison ? `${comparison.matched} of ${comparison.expected} reference intent events matched exactly.` : 'This health check cannot detect events dropped before this file was created. Add a reference to compare.'}</p></div></div>
    ${timeline(exported.events, exported.counts.notes)}
    <div class="finding-list"><h4>What needs attention</h4>${allFindings.length ? allFindings.map(findingHtml).join('') : '<div class="finding info"><span>✓</span><div><b>No warnings</b><p>Channels, controllers, programs, and pitch-bend state look structurally consistent.</p></div></div>'}</div>
    <div class="receipt-actions"><button class="button primary" id="csv-export" type="button">Export CSV</button><button class="button secondary" id="html-export" type="button">${license.unlocked ? 'Save HTML receipt' : 'Receipt mode unavailable'}</button><button class="text-button" id="new-check" type="button">${isDemo ? 'Reset sample' : 'Check another file'}</button></div>
  </section>`;
  qs('#csv-export').addEventListener('click', () => download(`${baseName(exported!.name)}-midi-check.csv`, analysisCsv(exported!, comparison), 'text/csv'));
  const htmlButton = qs<HTMLButtonElement>('#html-export');
  htmlButton.disabled = !license.unlocked;
  htmlButton.addEventListener('click', () => {
    if (license.unlocked) download(`${baseName(exported!.name)}-receipt.html`, printableReceipt(exported!, allFindings), 'text/html');
  });
  qs('#new-check').addEventListener('click', resetFiles);
  if (scroll) root.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function timeline(events: MidiEvent[], noteCount: number) {
  const relevant = events.filter(event => ['pitch-bend', 'controller', 'program'].includes(event.kind)).slice(0, 160);
  if (!relevant.length) return `<div class="empty-timeline"><b>No controller timeline in this file</b><p>This file has ${noteCount} note${noteCount === 1 ? '' : 's'} and no pitch-bend, program, or control-change messages.</p></div>`;
  const max = Math.max(...relevant.map(event => event.tick), 1);
  const channels = [...new Set(relevant.map(event => event.channel!))].sort((a, b) => a - b);
  const textAlternative = relevant.map(event => `<li>Channel ${event.channel}: ${esc(event.label)} at ${event.seconds.toFixed(2)} seconds.</li>`).join('');
  return `<div class="timeline"><div class="timeline-title"><h4>Intent timeline</h4><span>${relevant.length}${events.length > 160 ? '+' : ''} signals shown</span></div>${channels.map(channel => `<div class="lane"><span class="lane-label">CH ${String(channel).padStart(2, '0')}</span><div class="lane-track" aria-hidden="true">${relevant.filter(event => event.channel === channel).map(event => `<span class="event-mark ${event.kind} at-${timelinePosition(event.tick, max)}"></span>`).join('')}</div></div>`).join('')}<div class="timeline-key" aria-hidden="true"><span><i class="controller"></i>Controller</span><span><i class="pitch-bend"></i>Pitch bend</span><span><i class="program"></i>Program</span></div><ul class="sr-only" aria-label="Intent timeline event list">${textAlternative}</ul></div>`;
}

function timelinePosition(tick: number, max: number) {
  return Math.round(Math.min(100, Math.max(0, (tick / max) * 100)) / 5) * 5;
}

function findingHtml(finding: Finding) {
  return `<div class="finding ${finding.severity}"><span aria-hidden="true">${finding.severity === 'error' ? '!' : finding.severity === 'warning' ? '△' : 'i'}</span><div><b>${esc(finding.title)}</b><p>${esc(finding.detail)}</p>${finding.channel ? `<small>Track ${finding.track ?? '—'} · Channel ${finding.channel}</small>` : ''}</div></div>`;
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(Math.round(seconds % 60)).padStart(2, '0')}`;
}
function baseName(name: string) { return name.replace(/\.(mid|midi)$/i, ''); }
function download(name: string, content: string, type: string) {
  const link = document.createElement('a');
  const url = URL.createObjectURL(new Blob([content], { type }));
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function resetFiles() {
  if (isDemo) {
    resetDemo();
    return;
  }
  exported = undefined;
  reference = undefined;
  comparison = undefined;
  for (const element of document.querySelectorAll<HTMLInputElement>('input[type=file]')) element.value = '';
  for (const zone of document.querySelectorAll('.drop-zone')) zone.classList.remove('loaded');
  qs('#export-title').textContent = 'Choose exported MIDI';
  qs('#reference-title').textContent = 'Choose original reference';
  qs('#results').innerHTML = '';
  qs('#analyzer').scrollIntoView({ behavior: 'smooth' });
}

function sampleMidi(events: number[]) {
  const track = Uint8Array.from([...events, 0, 0xff, 0x2f, 0]);
  return Uint8Array.from([77, 84, 104, 100, 0, 0, 0, 6, 0, 0, 0, 1, 1, 224, 77, 84, 114, 107, 0, 0, 0, track.length, ...track]);
}

const SAMPLE_REFERENCE = sampleMidi([0, 0xc0, 40, 0, 0xb0, 2, 90, 0, 0xe0, 0, 96, 48, 0xe0, 0, 80, 0, 0x90, 60, 100, 96, 0x80, 60, 0]);
const SAMPLE_EXPORT = sampleMidi([0, 0xc1, 40, 0, 0x90, 60, 100, 96, 0x80, 60, 0]);

function loadSample(scroll = true) {
  reference = parseMidi(SAMPLE_REFERENCE, 'signal-sketch-reference.mid');
  exported = parseMidi(SAMPLE_EXPORT, 'signal-sketch-export.mid');
  comparison = compareMidi(reference, exported);
  setCompareMode(true, false);
  updateLoadedSlot('reference', reference.name);
  updateLoadedSlot('export', exported.name);
  qs('#file-status').textContent = 'Demo sample loaded. Four reference events are missing or moved in the export.';
  renderResults(scroll);
}

function resetDemo() {
  localStorage.setItem(DEMO_KEY, 'active');
  loadSample();
}

if (isDemo) {
  localStorage.setItem(DEMO_KEY, 'active');
  qs('#reset-demo').addEventListener('click', resetDemo);
  qs<HTMLAnchorElement>('#start-real').addEventListener('click', () => localStorage.removeItem(DEMO_KEY));
  loadSample(false);
  requestAnimationFrame(() => qs('#analyzer').scrollIntoView({ behavior: 'auto', block: 'start' }));
}

function printableReceipt(analysis: MidiAnalysis, findings: Finding[]) {
  return `<!doctype html><html lang="en"><meta charset="utf-8"><title>MIDI receipt — ${esc(analysis.name)}</title><style>body{font:16px system-ui;max-width:760px;margin:48px auto;color:#17191f}h1{font-size:32px}.meta{display:flex;gap:24px;border-block:2px solid;padding:16px 0}.finding{padding:14px 0;border-bottom:1px solid #bbb}.studio{letter-spacing:.15em;text-transform:uppercase;color:#555}@media print{body{margin:20mm}}</style><body><p class="studio">MIDI ROUNDTRIP CHECK · VERIFIED RECEIPT</p><h1>${esc(analysis.name)}</h1><p>Generated locally on ${new Date().toLocaleDateString()}.</p><div class="meta"><b>${analysis.tracks} tracks</b><b>${analysis.counts.notes} notes</b><b>${analysis.counts.bends} bends</b><b>${analysis.counts.controllers} controls</b></div><h2>Findings</h2>${findings.length ? findings.map(finding => `<div class="finding"><b>${esc(finding.severity.toUpperCase())}: ${esc(finding.title)}</b><p>${esc(finding.detail)}</p></div>`).join('') : '<p>No structural warnings found.</p>'}<p><small>Heuristic report, not a playback guarantee. Created by MIDI Roundtrip Check.</small></p></body></html>`;
}

if (!isDemo) {
  qs('#restore-toggle').addEventListener('click', () => {
    const form = qs('#restore-form');
    const hidden = form.classList.toggle('hidden');
    qs('#restore-toggle').setAttribute('aria-expanded', String(!hidden));
    if (!hidden) qs<HTMLInputElement>('#license-token').focus();
  });
  qs<HTMLFormElement>('#restore-form').addEventListener('submit', event => {
    event.preventDefault();
    const token = qs<HTMLInputElement>('#license-token').value.trim();
    if (token) {
      localStorage.setItem(LICENSE_KEY, token);
      void verifyLicense(token, true);
    }
  });
}

async function verifyLicense(token: string, force = false) {
  const cached = JSON.parse(localStorage.getItem(VERIFY_KEY) || 'null') as { valid: boolean; checked: number } | null;
  if (!force && cached?.valid && Date.now() - cached.checked < 86400000) {
    setLicense(true, 'Receipt mode is active.');
    return;
  }
  if (cached?.valid) setLicense(true, 'Receipt mode is active; checking quietly.');
  try {
    const response = await fetch(`${API}/products/${SLUG}/verify?license=${encodeURIComponent(token)}`);
    if (!response.ok) throw new Error('Verification service unavailable');
    const result = await response.json() as { valid: boolean };
    localStorage.setItem(VERIFY_KEY, JSON.stringify({ valid: result.valid, checked: Date.now() }));
    setLicense(result.valid, result.valid ? 'Receipt mode is active on this device.' : 'This license is no longer active. Checkout is not available yet.');
  } catch {
    setLicense(Boolean(cached?.valid), cached?.valid ? 'Offline — using the last valid license check.' : 'Could not verify while offline. The free checker still works.');
  }
}

function setLicense(unlocked: boolean, message: string) {
  license = { unlocked, message };
  qs('#license-status').textContent = message;
  document.body.classList.toggle('licensed', unlocked);
  if (exported) renderResults(false);
}

if (!isDemo) {
  const queryLicense = new URLSearchParams(location.search).get('license');
  if (queryLicense) {
    localStorage.setItem(LICENSE_KEY, queryLicense);
    history.replaceState({}, '', location.pathname + location.hash);
    void verifyLicense(queryLicense, true);
  } else {
    const stored = localStorage.getItem(LICENSE_KEY);
    if (stored) void verifyLicense(stored);
  }
}

async function resolveDownload() {
  const button = qs<HTMLAnchorElement>('#platform-download');
  const note = qs('#download-note');
  const ua = navigator.userAgent.toLowerCase();
  const platform = ua.includes('win') ? 'windows' : ua.includes('mac') ? 'macos' : ua.includes('linux') ? 'linux' : 'other';
  const labels = { windows: 'Download for Windows', macos: 'Download for macOS', linux: 'Download for Linux', other: 'View all downloads' };
  button.textContent = labels[platform];
  note.textContent = platform === 'other' ? 'Choose the build for your computer.' : `Detected ${platform === 'macos' ? 'macOS' : platform[0].toUpperCase() + platform.slice(1)} · unsigned v1 build`;
  try {
    const response = await fetch('/latest.json', { cache: 'no-cache' });
    if (!response.ok) throw new Error('Release manifest unavailable');
    const manifest = await response.json() as { assets?: Record<string, { url?: string } | string> };
    const assetKey = platform === 'macos' ? (ua.includes('arm') || ua.includes('aarch64') ? 'macos-arm64' : 'macos-x86_64') : platform;
    const candidate = manifest.assets?.[assetKey] ?? (platform === 'macos' ? manifest.assets?.['macos-arm64'] : undefined);
    const url = typeof candidate === 'string' ? candidate : candidate?.url;
    if (!url || !url.startsWith(`https://github.com/${REPO}/releases/download/`)) throw new Error('No matching release asset');
    button.href = url;
  } catch {
    note.textContent += ' Release details are unavailable; use All platforms.';
  }
}

void resolveDownload();
if ('serviceWorker' in navigator && ['http:', 'https:'].includes(location.protocol)) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => undefined);
  });
}
