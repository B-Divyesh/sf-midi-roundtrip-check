# Independent product verification — FAIL

Verified 2026-08-28 against candidate `ae5d4a4fa481543ee88aef7e499d6747bde28685` and <https://midi-roundtrip-check.sociobot.in>.

## Verdict

**FAIL — do not release this candidate.** The local build and core MIDI comparison work, and the live bundle matches the candidate, but mandatory acceptance gates are absent or broken.

## Release-blocking findings

### BLOCKER — Required claims contract is missing

`.factory/claims.json` does not exist in the working tree or candidate Git tree. The required first command therefore exited with release-blocking status before any claim command could be run. There are no `@claim:*` tests.

The site and README nevertheless make unlisted claims, including “Offline by design,” “Your compositions never leave this device,” “telemetry-free,” format 0/1/2 support, free CSV export, published checksums, and a $19 one-time Receipt mode. None is registered in the mandatory claims manifest.

### BLOCKER — First-read and demo contract fail

Cold first read:

- What it does: compares a reference MIDI with an export and reports missing bends, shifted channels, controllers, and program changes.
- For whom: the first screen does not say. The intended electronic musicians and score arrangers appear only in the external brief/README.
- What to click first: “Check a MIDI file,” then “Choose file.” There is no sample-data action.

The cold DOM had `sampleActions: []`. `/demo` and `?demo=1` return the ordinary landing page with the same headline and no seeded data, demo banner, reset action, or “Start for real” action. `.factory/demo.md` is also absent. For this desktop product, there is no “Load sample project” first-run action or the required 3–5-frame product walkthrough.

Evidence: [first-read-desktop.png](verification-artifacts/first-read-desktop.png), [first-read-desktop.txt](verification-artifacts/first-read-desktop.txt), and [browser-qa.json](verification-artifacts/browser-qa.json).

### CRITICAL — Populated comparison view fails axe

After loading the reference/export comparison, axe reports one critical `aria-valid-attr-value` violation. `#compare-tab` declares `aria-controls="compare-panel"`, but no element with that ID exists. The repository E2E suite misses this because it runs axe on the quick-check state, not the selected comparison state.

Evidence: `axeAfterResults` in [browser-qa.json](verification-artifacts/browser-qa.json).

### HIGH — Advertised paid purchase is unavailable

The live page advertises “Buy Receipt mode · $19,” but its required Sociobot endpoint returns HTTP 404 with `{"error":"enabled factory product","status":404}`. A visitor cannot purchase the advertised receipt export.

Evidence: [billing-endpoints.txt](verification-artifacts/billing-endpoints.txt).

## Other defects

### HIGH

- Keyboard tabs do not implement arrow navigation. With “Quick check” focused, ArrowRight leaves focus and selection on “Quick check.” This violates the attached keyboard baseline for tab widgets.
- Live responses have no Content-Security-Policy. The deployed host also omits `Permissions-Policy` and framing protection. HSTS, `Referrer-Policy`, and `X-Content-Type-Options` are present.

### MEDIUM

- The required designed 404 route is absent. `/does-not-exist` returns HTTP 200 and renders the normal landing page.
- Hashed JS and CSS are served with `Cache-Control: public, must-revalidate, max-age=30`, not the repository’s intended one-year immutable policy. The checked-in Netlify-style `_headers` file is not taking effect on the deployed host.
- The landing page lacks canonical, Open Graph, Twitter-card, apple-touch icon, and 1200×630 social-image metadata.
- Several real mobile links have targets under 44 px high: the header/footer wordmarks and footer Privacy, Terms, and Source links measure 25–32 px high.
- The empty valid-MIDI state contradicts its data. It reports zero notes but says, “The file contains notes.”
- The first screen supplies only one combined offline/privacy fact, not the required three plain facts including price.
- Privacy and Terms use separate minimal markup and omit the standard site footer/build identity. The main footer also has no version/build ID.
- `.factory/copy-audit.md` is missing.

## Build and repository checks

An isolated detached worktree at the exact candidate commit was clean before and after the run.

| Check | Result |
| --- | --- |
| `npm ci` | PASS — 65 packages; audit reported 0 vulnerabilities |
| `npm test` | PASS — 4/4 Vitest tests |
| `npx tsc --noEmit` | PASS |
| `npm run build` | PASS — exact site build in `dist/site` |
| `npm run build:app` | PASS — Tauri frontend in `dist/app` |
| `npm run test:e2e` | PASS — 8/8 Playwright cases, desktop and 390×844 |
| `cargo test --locked` | PASS after installing system prerequisites — library, binary, and doc-test targets; zero Rust tests defined |
| Lint | Not available — no lint script/configuration is present |
| Installer/script syntax | PASS |

The E2E suite’s test named “keyboard path opens the file chooser” only asserts that the button can receive focus; it does not activate the chooser. Fresh live testing did confirm Enter activation once the control was focused.

## Product flow evidence

The smallest useful free workflow works on the live deployment:

- A representative MIDI produced note, bend, controller, and program counts plus a readable pitch-range finding.
- A reference fixture contained four intent events: one program change, one breath controller, and two pitch bends. Its damaged export moved the program to channel 2 and dropped the controller and both bends. The product reported the moved channel, one missing controller, and two missing bends: 4/4 seeded discrepancies, or 100%, exceeding the brief’s 90% target.
- CSV download succeeded with a header, finding row, and event rows.
- Format 1 and format 2 two-track fixtures parsed correctly. A declared/actual track mismatch produced `track-count`.
- Channel 16, program 128, CC 127, value 127, and maximum positive pitch bend were accepted and explained.
- Wrong extension, missing MIDI header, zero division, SMPTE division, and truncated header all produced actionable errors. A valid file loaded after each failure.
- A valid empty MIDI loaded, but exposed the contradictory empty-state copy noted above.

Evidence: [browser-qa.json](verification-artifacts/browser-qa.json), [live-results-desktop.png](verification-artifacts/live-results-desktop.png), and [parser-boundaries.ts](verification-artifacts/parser-boundaries.ts).

## Live deployment, privacy, and policies

- Live `index.html`, hashed JS, hashed CSS, and `sw.js` SHA-256 values exactly match the candidate build. The values are `a5ef5cd1de69ea1f9dbb5db41b60c0f4757b50a6e44a83789803616804e19ed4`, `0767ce7ce05a7c01afe452ffa16bd9dc44033f9b65efe71d42decaa550d08a46`, `d7108d203fc09dd7cbad47271bb1fd579584ce0903e5a2a693711645304de494`, and `e29e79d35442fa0d3c6d1cd76b63fff90076f43770ce76356525e1e47fad3b39`, respectively. The deployed candidate identity is confirmed.
- No console error, page error, or failed request occurred in the exercised live flows.
- Cold load set no cookies and no local-storage keys. The normal MIDI and comparison flow sent only same-origin requests; file contents were not sent. An explicit invalid-license verification made the expected request only to `api.sociobot.in`.
- License verification returned HTTP 200 with `valid:false`. A rapid 160-request burst reached HTTP 429 at request 31; 130 requests were limited and the first `Retry-After` value was `4` seconds.
- Service-worker registration/update succeeded. After an online load and controlled reload, offline reload preserved the headline, analyzer, and resolved installer URL from cache `midi-roundtrip-check-v2`.
- Initial page structure passes the URL smoke check: HTTP 200, title, `lang=en`, one H1, one main landmark, image alternatives, no unlabeled buttons, and no console errors.

## Responsive, accessibility, and performance

- Desktop and 390×844 layouts have no horizontal overflow. At 200% root text size, the 390 px layout still has no horizontal overflow.
- Reduced-motion emulation is honored: smooth scrolling becomes `auto` and the hero transition is effectively instant.
- Skip-link focus is visible with a 3 px cyan outline. Restore-license expansion moves focus into its input. The critical selected-tab violation and arrow-key defect remain.
- Fresh live Lighthouse mobile: Performance 99, Accessibility 100, Best Practices 100, SEO 100 on the initial state; LCP 1.660 s, CLS 0, TBT 76 ms, Speed Index 1.002 s, transfer 153,072 bytes. Lighthouse’s initial-state axe pass does not cover the failing populated comparison state.
- Build output: JS 26.82 KB raw / 10.40 KB gzip; CSS 12.54 KB raw / 3.70 KB gzip; WebP hero 74,784 bytes; AVIF hero 62,185 bytes. Size budgets pass.

## Desktop release and installer checks

- GitHub release `v0.1.0` is published with Apple-silicon and Intel DMGs, Windows EXE/MSI, Linux AppImage/DEB/RPM, `SHA256SUMS`, and `latest.json`.
- The live Linux button resolves to the release AppImage. Live `install.sh`, `install.ps1`, and `latest.json` return HTTP 200.
- A fresh download of `MIDI.Roundtrip.Check_0.1.0_x64-setup.exe` matched its published SHA-256: `3aae98b45343e7c3f3cc88e74561ddbe04c3657cec537fbacd4074996a70e60b`; its first bytes are the expected PE `MZ` signature.
- The release workflow contains all four required platform jobs. Unsigned status is disclosed.

## Positive observations

The product has a distinctive, documented visual system; original asset provenance; clear error language; privacy/terms pages; an MIT license; a small dependency footprint; no third-party fonts or scripts; useful free CSV output; an honest heuristic-warning boundary; and a focused MIDI inspection workflow. Those strengths do not override the mandatory blockers above.
