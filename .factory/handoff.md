# Handoff — MIDI Roundtrip Check v0.1.0 repair

## Repair summary

- Reproduced the reported production failure in Chromium against `https://midi-roundtrip-check.sociobot.in`: the page requested GitHub's `releases/latest/download/latest.json`, the redirect response had no CORS allow-origin header, Chromium emitted a CORS error plus two failed-resource errors, and the UI incorrectly described the failure as offline.
- The browser now requests only same-origin `/latest.json`. `npm run build:site` refreshes that file from the CORS-enabled GitHub Releases API and retains the checked-in v0.1.0 manifest when the API is unavailable during a build.
- The service worker precaches the manifest, refreshes it network-first when online, and uses the cached manifest offline. The Tauri CSP no longer grants an unused connection to `github.com`.
- Playwright now exercises the built production bundle through `vite preview`. Focused regressions prove that metadata is same-origin, no release-manifest request reaches `github.com`, a real installer is selected without console errors, no third-party request occurs on an ordinary first load, and both shell and installer metadata work offline.

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

The factory clean build command is exactly `npm ci && npm test && npm run build:site`; deploy `dist/site` (with `index.html` at that root). `npm run build:app` creates the Tauri frontend in `dist/app`. GitHub-hosted runners perform binary builds; local platform binaries are intentionally not built in the factory worker.

Repair verified 2026-08-28:

- Exact clean factory command `npm ci && npm test && npm run build:site`: passed; Vitest 4/4 and the static production build completed with the v0.1.0 manifest refreshed from `api.github.com`.
- `npm run test:e2e`: 8/8 passing against the production build across desktop Chromium and a 390 × 844 touch viewport. Coverage includes analysis, keyboard focus, responsive overflow, axe (zero serious/critical findings), same-origin metadata/no console errors, privacy/no third-party first-load requests, and cached offline reload.
- `npx tsc --noEmit`, `npm run build`, `npm run build:app`, and `cargo test --locked`: passed. Rust ran library, binary, and doc-test targets.
- `npm audit`: 0 vulnerabilities.
- Production bundles: initial JS 26.82 KB (10.41 KB gzip), CSS 12.54 KB (3.70 KB gzip), hero WebP 74 KB / AVIF 61 KB.
- Lighthouse mobile against the local production build: Performance 99, Accessibility 100, Best Practices 100, SEO 100; LCP 1.972 s, CLS 0, TBT 33 ms.
- Installer/script checks: `sh -n public/install.sh`, Python manifest-generator compile, Node manifest-generator syntax, and four-platform manifest shape passed.
- Release workflow: <https://github.com/B-Divyesh/sf-midi-roundtrip-check/actions/workflows/release.yml>
- Release: <https://github.com/B-Divyesh/sf-midi-roundtrip-check/releases/tag/v0.1.0>
- Release run `33153901406`: all four build jobs and publish job succeeded. The live API was rechecked and contains both macOS DMGs, Windows EXE/MSI, Linux AppImage/DEB/RPM, `SHA256SUMS`, and `latest.json`. A fresh RPM download again passed its published SHA-256 check (`6fc641a927268b23784a9e2856514201ea7eba957b5658783b3e1c858941bd56`).

## Production deployment evidence

- Repair commit `f067730` was pushed to `origin/main`, then `dist/site` was deployed with the work order's static deployment configuration. Azure Static Web Apps deployment `ab6ab6f5-8624-4ac2-a20b-820e7aea272d` succeeded in `centralus`; the custom domain remained Ready with HTTPS 200.
- `/opt/fleet/lib/verify-url.sh https://midi-roundtrip-check.sociobot.in /work/.evidence/repair-live` passed: 946 ms load, zero console errors, expected title, `lang="en"`, one `<h1>`, a `<main>`, no images missing alt, and no unlabeled buttons.
- A separate fresh Chromium identity check loaded the repaired hashed bundle `main-DJbOyIHI.js`, recorded no console/page/request failures, made only same-origin requests, fetched `https://midi-roundtrip-check.sociobot.in/latest.json`, and resolved the Linux button to the real v0.1.0 AppImage. The manifest returned HTTP 200 as `application/json`; the resolved AppImage returned HTTP 200.
- Live 390 × 844 axe/keyboard/privacy smoke check found zero serious/critical violations, no horizontal overflow, visible focus on “Choose file”, a reduced-motion stylesheet rule, no cookies, and no local-storage keys on a normal first load.

## Known limits

- The checker compares MIDI event intent, not rendered audio; differences caused exclusively by synth patches or sample libraries cannot be detected.
- SMPTE time-division MIDI is rejected with an explicit error in v1; PPQN timing is fully supported.
- Findings are intentionally heuristic warnings, not claims that every General MIDI device will play identically.
- Release binaries are unsigned. This is disclosed on the site and install flow.

## Needs operator action

- Register the `midi-roundtrip-check` product and $19 one-time price in the Sociobot billing system; no product ID is embedded in this repository.
- For signed production builds, provision `APPLE_CERTIFICATE` and `WINDOWS_CERT_PFX` (plus the corresponding certificate passwords/identity settings required by the signing setup), then wire signing into the release workflow. Current v0.1.0 artifacts are deliberately unsigned.

## Next useful improvements

- Add SMPTE time-division conversion and optional time-window tolerance for DAWs that quantize control events during export.
- Add MusicXML-side context only if user evidence shows it improves diagnoses; do not turn this focused checker into an editor or sequencer.
