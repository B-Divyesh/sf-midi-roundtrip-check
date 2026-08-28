# Handoff — MIDI Roundtrip Check v0.1.0

## What shipped

- Local-first Standard MIDI parser for formats 0/1/2 with running status, tempo maps, defensive bounds checks, readable parse errors, and no file upload.
- Quick health check for pitch-bend reset, implicit bend range, incomplete bank/program selection, unfamiliar CC intent, track count/end markers, and trailing data.
- Before/after comparison across tick, channel, controller/program number, and value. It reports missing controllers/bends/programs, distinguishes moved-channel events, and calls added intent events warnings.
- Accessible per-channel intent timeline, plain-language findings, free CSV export, and keyboard/drop/file-picker paths.
- $19 one-time Receipt mode through the Sociobot checkout/verify contract, including callback token capture, daily cached verification, optimistic offline unlock, paste-to-restore, and self-contained HTML receipt export. Core checks and CSV are never gated.
- Responsive static product site, Tauri 2 desktop shell, privacy/terms pages, original optimized hero art, OS-aware release link, verified install scripts, and offline service worker.
- GitHub Actions matrix for Apple-silicon and Intel macOS, Windows, and Linux; it publishes `.dmg`, `.msi`, `.exe`, `.AppImage`, `.deb`, `.rpm`, `SHA256SUMS`, and `latest.json` to a GitHub Release.

## Run and verify

```sh
npm ci
npm test
npm run test:e2e
npm run build
```

The factory build command is exactly `npm run build`; deploy `dist/site` (with `index.html` at that root). `npm run build:app` creates the Tauri frontend in `dist/app`. GitHub-hosted runners perform binary builds; local platform binaries are intentionally not built in the factory worker.

Verified 2026-08-28:

- Vitest: 4/4 passing, including all three seeded discrepancy classes (missing pitch bend, dropped controller, wrong channel).
- Playwright 1.58.2: 4/4 passing across desktop Chromium and a 390 × 844 mobile viewport; no console errors; axe has zero serious/critical findings.
- `npm audit`: 0 vulnerabilities.
- Production bundles: initial JS 26.82 KB (10.41 KB gzip), CSS 12.54 KB (3.70 KB gzip), hero WebP 74 KB / AVIF 61 KB.
- Lighthouse mobile against the production build: Performance 99, Accessibility 100, Best Practices 100, SEO 100; LCP 2.116 s, CLS 0, TBT 0 ms.
- Release workflow: <https://github.com/B-Divyesh/sf-midi-roundtrip-check/actions/workflows/release.yml>
- Release: <https://github.com/B-Divyesh/sf-midi-roundtrip-check/releases/tag/v0.1.0>
- Release run `33153901406`: all four build jobs and publish job succeeded. Public `latest.json` resolves each platform to a real asset; a fresh download of `MIDI.Roundtrip.Check-0.1.0-1.x86_64.rpm` passed its published SHA-256 check (`6fc641a927268b23784a9e2856514201ea7eba957b5658783b3e1c858941bd56`).

## Known limits

- The checker compares MIDI event intent, not rendered audio; differences caused exclusively by synth patches or sample libraries cannot be detected.
- SMPTE time-division MIDI is rejected with an explicit error in v1; PPQN timing is fully supported.
- Findings are intentionally heuristic warnings, not claims that every General MIDI device will play identically.
- Release binaries are unsigned. This is disclosed on the site and install flow.

## Needs operator action

- Deploy `dist/site` to `midi-roundtrip-check.sociobot.in`.
- Register the `midi-roundtrip-check` product and $19 one-time price in the Sociobot billing system; no product ID is embedded in this repository.
- For signed production builds, provision `APPLE_CERTIFICATE` and `WINDOWS_CERT_PFX` (plus the corresponding certificate passwords/identity settings required by the signing setup), then wire signing into the release workflow. Current v0.1.0 artifacts are deliberately unsigned.

## Next useful improvements

- Add SMPTE time-division conversion and optional time-window tolerance for DAWs that quantize control events during export.
- Add MusicXML-side context only if user evidence shows it improves diagnoses; do not turn this focused checker into an editor or sequencer.
