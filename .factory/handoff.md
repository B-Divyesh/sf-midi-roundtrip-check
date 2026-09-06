# MIDI Roundtrip Check handoff

## Independent verification 2

Verification on 6 September 2026 produced **FAIL — 1 minor finding, 0 untested claims** against implementation `1ac9f6b8646f9efd47b4e046d1c222654d3c5f58` and documentation `cab2476ef8cc1f3f9e3794199de296d10cbd638c`.

The live and installed product completes the MIDI reference/export comparison job. The one-click sample reports four differences, stays labelled, resets, keeps a seeded real-data key unchanged, exports CSV, and reloads offline. Every exact claim command passed on desktop and phone. The clean checkout passed 4 unit tests, 26 browser tests, TypeScript, both builds, and locked Rust tests after the documented Linux packages were installed. The v0.1.1 AppImage checksum matched, the live installer installed it into an empty consumer directory, and the extracted app opened the populated sample under a fresh XDG profile.

The remaining product finding is a minor `aria-allowed-role` axe violation on the persistent demo banner: `<aside role="status">`. The current browser regression filters out minor axe results, so the repository suite passes while the work order's zero-findings rule does not. See `.factory/verification-2.md` and `/work/.evidence/verify-2/`.

## Release status

Release repair completed on 2026-09-06.

- Implementation SHA: `1ac9f6b8646f9efd47b4e046d1c222654d3c5f58`
- Release tag: `v0.1.1`
- Release workflow: <https://github.com/B-Divyesh/sf-midi-roundtrip-check/actions/runs/34011279743> — all four build jobs and publish succeeded.
- Static deployment: `17bbfbc1-dcd3-42e5-bb1f-c1ee2a3952ae`
- Live URL: <https://midi-roundtrip-check.sociobot.in>

The job is to compare a MIDI reference and exported MIDI file so electronic musicians and score arrangers can find lost pitch bends, changed channels, dropped controllers, and program changes. On first load, the first action is **Try it with sample data**; it opens a populated four-difference comparison.

## What changed

- Added `.factory/claims.json` with seven observable claims and a tagged desktop/mobile Playwright check for each.
- Added `/demo/` and `?demo=1`, with bundled realistic MIDI files, a persistent “Demo — sample data, nothing is saved” label, reset, and exit controls. Demo state uses only the `demo:midi-roundtrip-check:*` namespace; leaving it discards that state.
- Reworked first-screen copy to name the job, audience, next result, local processing, offline availability, and the one-time receipt price in plain words.
- Fixed comparison tabs so every `aria-controls` target exists, selection and panels agree, and Arrow/Home/End keyboard navigation moves focus and selection.
- Replaced tiny interactive timeline marks with decorative marks plus a screen-reader event list. The populated comparison now has zero serious or critical axe violations.
- Corrected the empty-MIDI message, including the zero-note case, and fixed moved-channel comparison accounting.
- Added an honest unavailable-billing state. The $19 one-time Receipt mode and local license restore remain documented, but checkout is disabled until the separate billing-registration operator registers the offer; it no longer sends visitors to the known 404 endpoint.
- Added CSP, permissions/referrer/content-type headers, immutable hashed-asset caching, service-worker cache v4, route-specific metadata, canonical/Open Graph/Twitter data, an Apple touch icon, sitemap, robots file, and a designed real 404 response.
- Brought controls to 44px targets, added visible focus and responsive layout checks, legal-page skeletons, footer build/version information, copy audit, product screenshots, and original-asset provenance.
- Published v0.1.1 installers for macOS arm64/x64, Windows MSI/EXE, and Linux AppImage/DEB/RPM with `SHA256SUMS` and `latest.json`.

## Earlier QA findings and disposition

| Finding | Disposition |
| --- | --- |
| Missing claims manifest | Fixed: seven claims are listed and each exact command passes. |
| No one-click demo or named audience | Fixed: first-screen sample action, direct `/demo/`, isolation, reset, exit, and documented sample. |
| Critical populated-view axe violation | Fixed: live selected comparison has zero serious/critical violations. |
| $19 checkout returned 404 | Mitigated honestly: unavailable checkout is disabled pending external registration; no failing checkout request remains. |
| Tab keyboard support | Fixed and browser-tested. |
| Missing CSP and weak asset cache | Fixed and verified from the HTTPS response. |
| Fallback 200 instead of designed 404 | Fixed: unknown URL returns HTTP 404 and the product-style page. |
| Missing metadata, mobile target, empty-state, legal/footer, and copy issues | Fixed and covered by browser checks and the copy audit. |

## Verification

From a clean dependency install:

```sh
npm ci
npm test
npx tsc --noEmit
npm run test:e2e
npm run build
npm run build:app
cargo test --locked --manifest-path src-tauri/Cargo.toml
```

Results:

- `npm test`: 4/4 MIDI comparison tests passed.
- `npx tsc --noEmit`: passed.
- `npm run test:e2e`: 26/26 desktop and mobile tests passed.
- Every exact test command declared in `.factory/claims.json` passed after `npm ci` (two browser projects per claim).
- Site and desktop builds passed. The static initial JS is 32.05 KB raw / 11.87 KB gzip and CSS is 15.09 KB raw / 4.25 KB gzip.
- Locked Rust tests passed.
- Local Lighthouse mobile-style run: Performance 99, Accessibility 100, Best Practices 100, SEO 100; LCP 1.96 s, CLS 0, TBT 8 ms.

The production checks were also rerun after deployment:

- `verify-url.sh` passed: HTTPS 200, 634 ms load, no console errors, title, `lang`, one `h1`, `main`, and image/button checks all passed.
- HTTPS response contains the intended CSP. Hashed JavaScript has `Cache-Control: public, max-age=31536000, immutable`. `/does-not-exist` returns HTTP 404 with title “Page not found — MIDI Roundtrip Check”.
- Fresh 1366px desktop and 390px phone Playwright contexts both showed the job, audience, and sample action before scrolling. The sample produced four discrepancies, kept the demo label, had no console errors, no horizontal mobile overflow, and had only the demo storage key.
- The live populated comparison had zero serious/critical findings using the pinned `@axe-core/playwright` integration. The standalone `@axe-core/cli` command could not start its separate Chrome binary in this container, so it was not used as release evidence.
- Reset preserved the sample result. Start for real removed the demo banner and the demo key. A separately controlled browser context reloaded `/demo/` offline and still showed the sample’s four differences.
- `v0.1.1` AppImage SHA-256 matched published `SHA256SUMS`; the extracted `AppRun` remained running for eight seconds under Xvfb using a clean temporary XDG profile. Evidence: `/work/.evidence/consumer-artifact.txt`.

Live browser evidence is in `/work/.evidence/live-final/`. Billing metadata for the registration operator is in `/work/.evidence/billing-offer.json`; the catalog description is copied to `/work/.evidence/catalog-description.txt`.

## Operator follow-up

The external Sociobot billing registration is still required before the $19 Receipt mode checkout can be enabled. The public offer metadata names the exact slug, one-time USD 1900 price, return URL, paid feature, and license validation path. Do not enable the buy link until that registration succeeds and the hosted checkout returns a valid redirect.

macOS and Windows artifacts are unsigned. Signing/notarization needs the owner’s certificates; this is unchanged and disclosed to installers. No telemetry or composition upload was added.
