import './style.css';
import { analysisCsv, compareMidi, parseMidi, type Comparison, type Finding, type MidiAnalysis, type MidiEvent } from './midi';

const SLUG = 'midi-roundtrip-check';
const API = 'https://api.sociobot.in/api/v1';
const REPO = 'B-Divyesh/sf-midi-roundtrip-check';
const LICENSE_KEY = `sb_license:${SLUG}`;
const VERIFY_KEY = `${LICENSE_KEY}:verify`;

type LicenseState = { unlocked: boolean; message: string };
let reference: MidiAnalysis | undefined;
let exported: MidiAnalysis | undefined;
let comparison: Comparison | undefined;
let license: LicenseState = { unlocked: false, message: '' };

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
  <header class="site-header">
    <a class="brand" href="/" aria-label="MIDI Roundtrip Check home"><img src="/mark.svg" width="32" height="32" alt=""><span>MIDI Roundtrip Check</span></a>
    <nav aria-label="Primary"><a href="#analyzer">Analyzer</a><a href="#download">Download</a><a href="#unlock">Receipt mode</a></nav>
  </header>
  <main id="main">
    <section class="hero" aria-labelledby="hero-title">
      <div class="hero-copy">
        <p class="eyebrow"><span class="status-dot"></span> Local MIDI inspection</p>
        <h1 id="hero-title">Catch what your MIDI export left behind.</h1>
        <p class="lede">Compare a reference with its export. See missing bends, shifted channels, controller intent and program changes—without reading raw bytes or uploading your music.</p>
        <div class="hero-actions"><a class="button primary" href="#analyzer">Check a MIDI file</a><a class="text-link" href="#how">How it reads the file <span aria-hidden="true">↓</span></a></div>
        <p class="privacy-note"><span aria-hidden="true">◆</span> Offline by design. Your compositions never leave this device.</p>
      </div>
      <figure class="hero-art"><picture><source srcset="/market-signal.avif" type="image/avif"><img src="/market-signal.webp" width="960" height="640" alt="A miniature midnight electronics stall where glowing patch cables form a musical event timeline" decoding="async" fetchpriority="high"></picture><figcaption>Signals in. Intent accounted for.</figcaption></figure>
    </section>

    <section class="analyzer-wrap" id="analyzer" aria-labelledby="analyzer-title">
      <div class="section-heading"><div><p class="eyebrow">Inspection counter · 01</p><h2 id="analyzer-title">Make a fidelity receipt</h2></div><p>Start with the exported file for a health check. Add the original MIDI to compare intent event by event.</p></div>
      <div class="mode-tabs" role="tablist" aria-label="Inspection mode"><button class="tab active" id="single-tab" role="tab" aria-selected="true" aria-controls="single-panel">Quick check</button><button class="tab" id="compare-tab" role="tab" aria-selected="false" aria-controls="compare-panel">Compare export</button></div>
      <div class="file-panels" id="single-panel" role="tabpanel" aria-labelledby="single-tab">
        <div class="drop-zone" data-slot="export">
          <div class="jack" aria-hidden="true">↗</div><div><strong id="export-title">Choose exported MIDI</strong><span id="export-help">or drop a .mid / .midi file here · processed locally</span></div>
          <input id="export-input" type="file" accept=".mid,.midi,audio/midi,audio/x-midi" aria-label="Choose exported MIDI file">
          <button class="button compact" type="button" data-choose="export">Choose file</button>
        </div>
        <div class="drop-zone hidden" id="reference-zone" data-slot="reference">
          <div class="jack reference" aria-hidden="true">◎</div><div><strong id="reference-title">Add original reference</strong><span id="reference-help">the version before export</span></div>
          <input id="reference-input" type="file" accept=".mid,.midi,audio/midi,audio/x-midi" aria-label="Choose original reference MIDI file">
          <button class="button compact secondary" type="button" data-choose="reference">Choose reference</button>
        </div>
      </div>
      <p id="file-status" class="sr-only" aria-live="polite"></p>
      <div id="results" class="results" aria-live="polite"></div>
    </section>

    <section class="how" id="how" aria-labelledby="how-title">
      <div><p class="eyebrow">Under the awning · 02</p><h2 id="how-title">A check, not a black box.</h2><p>Standard MIDI is read in your browser or desktop app. The report separates exact structural differences from practical General MIDI warnings, so a warning never pretends to be a playback guarantee.</p></div>
      <ol class="steps"><li><span>01</span><strong>Read structure</strong><p>Tracks, running status, tempo and malformed boundaries are parsed defensively.</p></li><li><span>02</span><strong>Trace intent</strong><p>Programs, CC values, pitch bends, ticks and channels become a legible timeline.</p></li><li><span>03</span><strong>Issue receipt</strong><p>Exact omissions are flagged, heuristics are labelled, and CSV is always free.</p></li></ol>
    </section>

    <section class="download" id="download" aria-labelledby="download-title">
      <div><p class="eyebrow">Desktop app · 03</p><h2 id="download-title">Keep the checker beside your DAW.</h2><p>Native, local, and telemetry-free. The site detects this device; every release includes published checksums.</p><div class="download-actions"><a class="button primary" id="platform-download" href="https://github.com/${REPO}/releases/latest">View downloads</a><a class="text-link" href="https://github.com/${REPO}/releases/latest">All platforms</a></div><p id="download-note" class="small">Detecting your platform…</p></div>
      <div class="platform-list" aria-label="Supported platforms"><div><span>macOS</span><small>Apple silicon + Intel · unsigned</small></div><div><span>Windows</span><small>Installer + portable · unsigned</small></div><div><span>Linux</span><small>AppImage + Debian package</small></div></div>
    </section>

    <section class="unlock" id="unlock" aria-labelledby="unlock-title">
      <div class="ticket-stub"><span>RECEIPT</span><b>∞</b><small>one-time</small></div>
      <div><p class="eyebrow">Receipt mode</p><h2 id="unlock-title">Make the handoff presentable.</h2><p>CSV export and every safety check are free. A $19 one-time license adds polished, self-contained HTML receipts you can print, archive, or send with a project. No subscription.</p><div class="unlock-actions"><a class="button warm" href="${API}/products/${SLUG}/checkout">Buy Receipt mode · $19</a><button class="text-button" id="restore-toggle" type="button" aria-expanded="false" aria-controls="restore-form">Have a license?</button></div><form id="restore-form" class="restore hidden"><label for="license-token">License token</label><div><input id="license-token" autocomplete="off" spellcheck="false"><button class="button compact" type="submit">Verify license</button></div></form><p id="license-status" class="small" aria-live="polite"></p></div>
    </section>
  </main>
  <footer><a class="brand" href="/"><img src="/mark.svg" width="28" height="28" alt="">MIDI Roundtrip Check</a><p>Built for careful musical handoffs. Generated hero artwork is original and disclosed in the project design notes.</p><nav aria-label="Legal"><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a><a href="https://github.com/${REPO}">Source</a></nav></footer>`;

const qs = <T extends Element>(selector: string) => document.querySelector<T>(selector)!;
const esc = (s: unknown) => String(s ?? '').replace(/[&<>'"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' })[c]!);

function setCompareMode(compare: boolean) {
  qs('#reference-zone').classList.toggle('hidden', !compare);
  qs('#compare-tab').classList.toggle('active', compare);
  qs('#single-tab').classList.toggle('active', !compare);
  qs('#compare-tab').setAttribute('aria-selected', String(compare));
  qs('#single-tab').setAttribute('aria-selected', String(!compare));
  if (!compare) { reference = undefined; comparison = undefined; renderResults(); }
}
qs('#compare-tab').addEventListener('click', () => setCompareMode(true));
qs('#single-tab').addEventListener('click', () => setCompareMode(false));

for (const zone of document.querySelectorAll<HTMLElement>('.drop-zone')) {
  const slot = zone.dataset.slot as 'export' | 'reference';
  const input = qs<HTMLInputElement>(`#${slot}-input`);
  zone.addEventListener('click', e => { if (!(e.target as HTMLElement).closest('button')) input.click(); });
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('dragging'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('dragging'));
  zone.addEventListener('drop', e => { e.preventDefault(); zone.classList.remove('dragging'); const file = e.dataTransfer?.files[0]; if (file) void readFile(file, slot); });
  input.addEventListener('change', () => { if (input.files?.[0]) void readFile(input.files[0], slot); });
  qs(`[data-choose="${slot}"]`).addEventListener('click', e => { e.stopPropagation(); input.click(); });
}

async function readFile(file: File, slot: 'export' | 'reference') {
  const status = qs('#file-status');
  if (!/\.(mid|midi)$/i.test(file.name) && !file.type.includes('midi')) { status.textContent = 'Choose a .mid or .midi file.'; showError('That file does not look like MIDI', 'Choose a file ending in .mid or .midi. Nothing was uploaded.'); return; }
  status.textContent = `Reading ${file.name} locally…`;
  try {
    const parsed = parseMidi(await file.arrayBuffer(), file.name);
    if (slot === 'export') exported = parsed; else reference = parsed;
    qs(`#${slot}-title`).textContent = file.name;
    qs(`[data-slot="${slot}"]`).classList.add('loaded');
    comparison = reference && exported ? compareMidi(reference, exported) : undefined;
    renderResults();
    status.textContent = `${file.name} inspected. ${parsed.events.length} MIDI events read.`;
  } catch (error) {
    showError('This MIDI could not be read', error instanceof Error ? error.message : 'The file is malformed. Try exporting it again.');
    status.textContent = 'The MIDI file could not be read.';
  }
}

function showError(title: string, detail: string) { qs('#results').innerHTML = `<div class="error-box" role="alert"><b>${esc(title)}</b><p>${esc(detail)}</p></div>`; }

function renderResults() {
  const root = qs<HTMLDivElement>('#results');
  if (!exported) { root.innerHTML = ''; return; }
  const allFindings = [...(comparison?.findings ?? []), ...exported.findings];
  const severe = allFindings.filter(f => f.severity === 'error').length;
  const warnings = allFindings.filter(f => f.severity === 'warning').length;
  const score = comparison ? `${comparison.fidelity}%` : severe ? 'Review' : warnings ? 'Caution' : 'Clear';
  const verdict = severe ? `${severe} export difference${severe === 1 ? '' : 's'} found` : warnings ? `${warnings} practical warning${warnings === 1 ? '' : 's'}` : 'No structural warnings found';
  root.innerHTML = `<section class="receipt" aria-labelledby="receipt-title">
    <div class="receipt-head"><div><p class="eyebrow">Local inspection receipt</p><h3 id="receipt-title">${esc(exported.name)}</h3><p>${comparison ? `Compared with ${esc(reference!.name)}` : `Format ${exported.format} · ${exported.tracks} track${exported.tracks === 1 ? '' : 's'} · ${formatTime(exported.durationSeconds)}`}</p></div><div class="score ${severe ? 'bad' : warnings ? 'warn' : 'good'}"><strong>${score}</strong><span>${comparison ? 'intent fidelity' : 'health check'}</span></div></div>
    <div class="metrics"><div><span>Notes</span><b>${exported.counts.notes}</b></div><div><span>Pitch bends</span><b>${exported.counts.bends}</b></div><div><span>Controllers</span><b>${exported.counts.controllers}</b></div><div><span>Programs</span><b>${exported.counts.programs}</b></div></div>
    <div class="verdict"><span class="verdict-icon" aria-hidden="true">${severe ? '!' : warnings ? '△' : '✓'}</span><div><strong>${verdict}</strong><p>${comparison ? `${comparison.matched} of ${comparison.expected} reference intent events matched exactly.` : 'This health check cannot detect events dropped before this file was created. Add a reference to compare.'}</p></div></div>
    ${timeline(exported.events)}
    <div class="finding-list"><h4>What needs attention</h4>${allFindings.length ? allFindings.map(findingHtml).join('') : '<div class="finding info"><span>✓</span><div><b>No warnings</b><p>Channels, controllers, programs, and pitch-bend state look structurally consistent.</p></div></div>'}</div>
    <div class="receipt-actions"><button class="button primary" id="csv-export" type="button">Export CSV</button><button class="button secondary" id="html-export" type="button">${license.unlocked ? 'Save HTML receipt' : 'Unlock HTML receipt'}</button><button class="text-button" id="new-check" type="button">Check another file</button></div>
  </section>`;
  qs('#csv-export').addEventListener('click', () => download(`${baseName(exported!.name)}-midi-check.csv`, analysisCsv(exported!, comparison), 'text/csv'));
  qs('#html-export').addEventListener('click', () => license.unlocked ? download(`${baseName(exported!.name)}-receipt.html`, printableReceipt(exported!, allFindings), 'text/html') : qs('#unlock').scrollIntoView({ behavior: 'smooth' }));
  qs('#new-check').addEventListener('click', resetFiles);
  root.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function timeline(events: MidiEvent[]) {
  const relevant = events.filter(e => ['pitch-bend', 'controller', 'program'].includes(e.kind)).slice(0, 160);
  if (!relevant.length) return '<div class="empty-timeline"><b>No controller timeline in this file</b><p>The file contains notes, but no pitch bend, program change, or control-change messages.</p></div>';
  const max = Math.max(...relevant.map(e => e.tick), 1);
  const channels = [...new Set(relevant.map(e => e.channel!))].sort((a,b) => a-b);
  return `<div class="timeline"><div class="timeline-title"><h4>Intent timeline</h4><span>${relevant.length}${events.length > 160 ? '+' : ''} signals shown</span></div>${channels.map(ch => `<div class="lane"><span class="lane-label">CH ${String(ch).padStart(2,'0')}</span><div class="lane-track">${relevant.filter(e => e.channel === ch).map(e => `<button class="event-mark ${e.kind}" style="left:${Math.min(98, e.tick / max * 96 + 1)}%" title="${esc(e.label)} at ${e.seconds.toFixed(2)}s" aria-label="${esc(e.label)} at ${e.seconds.toFixed(2)} seconds"></button>`).join('')}</div></div>`).join('')}<div class="timeline-key"><span><i class="controller"></i>Controller</span><span><i class="pitch-bend"></i>Pitch bend</span><span><i class="program"></i>Program</span></div></div>`;
}

function findingHtml(f: Finding) { return `<div class="finding ${f.severity}"><span aria-hidden="true">${f.severity === 'error' ? '!' : f.severity === 'warning' ? '△' : 'i'}</span><div><b>${esc(f.title)}</b><p>${esc(f.detail)}</p>${f.channel ? `<small>Track ${f.track ?? '—'} · Channel ${f.channel}</small>` : ''}</div></div>`; }
function formatTime(seconds: number) { const m = Math.floor(seconds / 60); return `${m}:${String(Math.round(seconds % 60)).padStart(2, '0')}`; }
function baseName(name: string) { return name.replace(/\.(mid|midi)$/i, ''); }
function download(name: string, content: string, type: string) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([content], { type })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 5000); }
function resetFiles() { exported = reference = undefined; comparison = undefined; for (const el of document.querySelectorAll<HTMLInputElement>('input[type=file]')) el.value = ''; for (const z of document.querySelectorAll('.drop-zone')) z.classList.remove('loaded'); qs('#export-title').textContent = 'Choose exported MIDI'; qs('#reference-title').textContent = 'Add original reference'; qs('#results').innerHTML = ''; qs('#analyzer').scrollIntoView({ behavior: 'smooth' }); }

function printableReceipt(a: MidiAnalysis, findings: Finding[]) { return `<!doctype html><html lang="en"><meta charset="utf-8"><title>MIDI receipt — ${esc(a.name)}</title><style>body{font:16px system-ui;max-width:760px;margin:48px auto;color:#17191f}h1{font-size:32px}.meta{display:flex;gap:24px;border-block:2px solid;padding:16px 0}.finding{padding:14px 0;border-bottom:1px solid #bbb}.studio{letter-spacing:.15em;text-transform:uppercase;color:#555}@media print{body{margin:20mm}}</style><body><p class="studio">MIDI ROUNDTRIP CHECK · VERIFIED RECEIPT</p><h1>${esc(a.name)}</h1><p>Generated locally on ${new Date().toLocaleDateString()}.</p><div class="meta"><b>${a.tracks} tracks</b><b>${a.counts.notes} notes</b><b>${a.counts.bends} bends</b><b>${a.counts.controllers} controls</b></div><h2>Findings</h2>${findings.length ? findings.map(f => `<div class="finding"><b>${esc(f.severity.toUpperCase())}: ${esc(f.title)}</b><p>${esc(f.detail)}</p></div>`).join('') : '<p>No structural warnings found.</p>'}<p><small>Heuristic report, not a playback guarantee. Created by MIDI Roundtrip Check.</small></p></body></html>`; }

qs('#restore-toggle').addEventListener('click', () => { const form = qs('#restore-form'); const hidden = form.classList.toggle('hidden'); qs('#restore-toggle').setAttribute('aria-expanded', String(!hidden)); if (!hidden) qs<HTMLInputElement>('#license-token').focus(); });
qs<HTMLFormElement>('#restore-form').addEventListener('submit', e => { e.preventDefault(); const token = qs<HTMLInputElement>('#license-token').value.trim(); if (token) { localStorage.setItem(LICENSE_KEY, token); void verifyLicense(token, true); } });

async function verifyLicense(token: string, force = false) {
  const cached = JSON.parse(localStorage.getItem(VERIFY_KEY) || 'null') as { valid: boolean; checked: number } | null;
  if (!force && cached?.valid && Date.now() - cached.checked < 86400000) { setLicense(true, 'Receipt mode is active.'); return; }
  if (cached?.valid) setLicense(true, 'Receipt mode is active; checking quietly…');
  try {
    const response = await fetch(`${API}/products/${SLUG}/verify?license=${encodeURIComponent(token)}`);
    if (!response.ok) throw new Error('Verification service unavailable');
    const result = await response.json() as { valid: boolean; reason: string };
    localStorage.setItem(VERIFY_KEY, JSON.stringify({ valid: result.valid, checked: Date.now() }));
    setLicense(result.valid, result.valid ? 'Receipt mode is active on this device.' : 'This license is no longer active. You can purchase a new license below.');
  } catch { setLicense(Boolean(cached?.valid), cached?.valid ? 'Offline — using the last valid license check.' : 'Could not verify while offline. The free checker still works.'); }
}
function setLicense(unlocked: boolean, message: string) { license = { unlocked, message }; qs('#license-status').textContent = message; document.body.classList.toggle('licensed', unlocked); if (exported) renderResults(); }
const queryLicense = new URLSearchParams(location.search).get('license');
if (queryLicense) { localStorage.setItem(LICENSE_KEY, queryLicense); history.replaceState({}, '', location.pathname + location.hash); void verifyLicense(queryLicense, true); } else { const stored = localStorage.getItem(LICENSE_KEY); if (stored) void verifyLicense(stored); }

async function resolveDownload() {
  const button = qs<HTMLAnchorElement>('#platform-download'); const note = qs('#download-note');
  const ua = navigator.userAgent.toLowerCase(); const platform = ua.includes('win') ? 'windows' : ua.includes('mac') ? 'macos' : ua.includes('linux') ? 'linux' : 'other';
  const labels = { windows: 'Download for Windows', macos: 'Download for macOS', linux: 'Download for Linux', other: 'View all downloads' };
  button.textContent = labels[platform]; note.textContent = platform === 'other' ? 'Choose the build for your computer.' : `Detected ${platform === 'macos' ? 'macOS' : platform[0].toUpperCase() + platform.slice(1)} · unsigned v1 builds`;
  try {
    const response = await fetch('/latest.json', { cache: 'no-cache' });
    if (!response.ok) throw new Error('Release manifest unavailable');
    const manifest = await response.json() as { assets?: Record<string, { url?: string } | string> };
    const assetKey = platform === 'macos' ? (ua.includes('arm') || ua.includes('aarch64') ? 'macos-arm64' : 'macos-x86_64') : platform;
    const candidate = manifest.assets?.[assetKey] ?? (platform === 'macos' ? manifest.assets?.['macos-arm64'] : undefined);
    const url = typeof candidate === 'string' ? candidate : candidate?.url;
    if (!url || !url.startsWith(`https://github.com/${REPO}/releases/download/`)) throw new Error('No matching release asset');
    button.href = url;
  } catch { note.textContent += ' · Release details are unavailable; use All platforms.'; }
}
void resolveDownload();
if ('serviceWorker' in navigator && ['http:', 'https:'].includes(location.protocol)) window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js').catch(() => { /* Offline analysis remains available without installability. */ }); });
