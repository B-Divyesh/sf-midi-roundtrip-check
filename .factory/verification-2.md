# Verify MIDI references and exports — FAIL

Verified 6 September 2026 against the live site at <https://midi-roundtrip-check.sociobot.in>.

- Implementation reviewed: `1ac9f6b8646f9efd47b4e046d1c222654d3c5f58`
- Documentation reviewed: `cab2476ef8cc1f3f9e3794199de296d10cbd638c`
- Release: `v0.1.1`
- Static deployment: `17bbfbc1-dcd3-42e5-bb1f-c1ee2a3952ae`

## Verdict

**FAIL — 1 minor finding, 0 untested claims.**

The comparison job, demo, offline path, release, and every declared claim work. The populated demo still has one minor axe violation. This work order permits PASS only with zero findings at every severity.

## Job, audience, and first action

The job is to compare a MIDI reference with an export and find lost event intent. The audience is electronic musicians and score arrangers. The first action is **Try it with sample data**. It opens a populated comparison with four export differences.

Fresh 1366×768 desktop and 390×844 phone contexts showed all three items before any scroll. The first screen also showed the next result and three facts about local files, offline use, and the planned price.

## Finding

### MINOR — The demo banner uses an ARIA role that is not allowed on its element

The persistent demo label is rendered as:

```html
<aside class="demo-banner" role="status" aria-label="Demo mode">
```

Axe reports `aria-allowed-role` on this element in both fresh desktop and phone contexts. The failure says: “ARIA role status is not allowed for given element.” The visible banner and its controls work, and no serious or critical axe issue remains. The current browser regression only rejects serious or critical axe violations, so the minor violation passes the repository suite.

Evidence: `/work/.evidence/verify-2/live-qa.json`. The source is `src/main.ts:24` in the implementation candidate.

## Declared claims

Each exact command in `.factory/claims.json` ran from a detached, clean checkout of the implementation SHA after `npm ci`. Every command ran its desktop and phone project.

| Claim | Result | Evidence |
| --- | --- | --- |
| Bundled sample reports four differences | PASS | 2/2 browser cases passed |
| Demo comparison makes no request outside the product origin | PASS | 2/2 browser cases passed |
| Sample works offline after the first visit | PASS | 2/2 browser cases passed |
| Populated comparison exports free CSV | PASS | 2/2 browser cases passed |
| Demo does not change real checker storage | PASS | 2/2 browser cases passed |
| $19 Receipt mode is planned and checkout remains unavailable | PASS | 2/2 browser cases passed |
| Site resolves a platform installer from same-origin metadata | PASS | 2/2 browser cases passed |

All public product statements reviewed map to these declared claims or to the stated product limits. Untested claim count: **0**.

## Live product checks

### Sample, reset, and real data

- One click opened `/demo/` with `signal-sketch-reference.mid` and `signal-sketch-export.mid`.
- The result reported `4 export differences found` and `0 of 4 reference intent events matched exactly`.
- The differences were a program moved from channel 1 to 2, one missing breath controller, and two missing pitch bends.
- The “Demo — sample data, nothing is saved” label remained visible while the sample was open.
- **Reset demo** rebuilt the same four-difference result.
- A seeded real key, `sb_license:midi-roundtrip-check`, stayed unchanged through entry and reset. Demo wrote only `demo:midi-roundtrip-check:active`.
- **Start for real** removed only the demo key and banner. The seeded real key remained.
- CSV export downloaded seven lines with the expected header, error findings, and a MIDI note row.

### Normal, invalid, boundary, and recovery paths

- A valid MIDI showed one note, bend, controller, and program, plus readable warnings and a timeline.
- A malformed `.mid` showed the missing `MThd` error. Loading a valid file immediately afterwards recovered normally.
- A valid empty MIDI reported zero notes without contradictory text.
- Formats 1 and 2 with two tracks parsed correctly. A declared track mismatch produced `track-count`.
- Channel 16, program 128, CC 127/value 127, and pitch bend +8191 parsed at their limits.
- Truncated and short headers, format 3, zero division, SMPTE division, and running status before a channel event all produced specific errors.

### Keyboard, phone, motion, and accessibility

- Arrow Left/Right and Home/End moved tab focus and selection to valid panels.
- Enter opened license restore and moved focus to the labelled token field.
- Skip and focus styles use a visible 3 px cyan outline.
- No horizontal overflow occurred at 390 px or at 200% text size.
- Visible links and buttons met 44 px targets. The 1 px native file inputs are visually hidden behind labelled 44 px chooser buttons and were not counted as touch controls.
- Reduced-motion emulation changed smooth scrolling to `auto`, reduced the hero transition to `0.00001s`, and left no running animation.
- The populated view had zero serious or critical axe violations, but the minor banner violation above remains.
- `verify-url.sh` passed with HTTP 200, title, `lang=en`, one H1, one main landmark, image alternatives, labelled buttons, and no load errors.

### Privacy, offline use, and requests

- A cold load set no cookie and no local storage.
- The isolated demo request log contained only the product origin.
- MIDI bytes were parsed in the page and were not sent in a request.
- An online `/demo/` load registered the service worker. A later offline reload kept the banner and four-difference result.
- The site has no third-party font or script request. License verification is the only documented optional call to `api.sociobot.in` outside demo mode.
- This is a static site and desktop app. Backend tenant isolation, backend restart persistence, health, and backend 429 checks do not apply.

### Routes, links, and response policy

- `/`, `/demo/`, `/privacy/`, and `/terms/` returned 200 with route-specific titles, one H1, header, main, footer, canonical URL, and description.
- `/does-not-exist` deliberately returned HTTP 404 and rendered the designed page with a way home. The browser's expected failed-document console line for that deliberate 404 is not a defect under this work order.
- Every crawled internal, source, release, and installer link resolved. Mail and in-page links were treated as explicit non-fetch links.
- Live responses include the declared CSP, Permissions Policy, Referrer Policy, and `nosniff` header.
- Hashed assets and the social image use one-year immutable caching. `sw.js` uses `no-cache`.
- Open Graph, Twitter, canonical, favicon, 180×180 touch icon, 1200×630 social image, `robots.txt`, and the four-route sitemap are present.

## Build and runtime evidence

A clean detached worktree at the implementation SHA remained unmodified after the checks.

| Check | Result |
| --- | --- |
| `npm ci` | PASS — 65 packages, 0 audit vulnerabilities |
| `npm test` | PASS — 4/4 |
| `npx tsc --noEmit` | PASS |
| `npm run test:e2e` | PASS — 26/26 |
| `npm run build` | PASS — wrote `dist/site` |
| `npm run build:app` | PASS — wrote `dist/app` |
| `cargo test --locked --manifest-path src-tauri/Cargo.toml` | PASS after documented packages were installed; no Rust tests are defined |

The built JavaScript is 32.05 KB raw / 11.87 KB gzip. CSS is 15.09 KB raw / 4.25 KB gzip. Fresh live Lighthouse results were Performance 99, Accessibility 100, Best Practices 100, and SEO 100; LCP 1.653 s, CLS 0, and TBT 94 ms. Lighthouse covers the first page state and does not cancel the populated-view axe finding.

The live `index.html`, JavaScript, CSS, and service worker match the implementation build byte for byte:

| File | SHA-256 |
| --- | --- |
| `index.html` | `8127655b8cc3c84dea1c4ba7b69d9d687e5b11f555326dde8c9b6dab081a0d3a` |
| `main-CySEFnuX.js` | `ecc9d96635d2e8a640e623035ededcc10b10581e18fd5fad2b85e0137da7b3db` |
| `style-Byc6__nG.css` | `4e6de02db9d1a1d4b840770c577a3afca33eed97c9f4665d5acd4805f0b983d4` |
| `sw.js` | `1489abc6e7332acb3577548c740173d20440151e72cc496c161a03bee719328f` |

## Installed desktop release

The public `v0.1.1` release is not a draft or prerelease. It contains Apple-silicon and Intel DMGs, Windows EXE and MSI, Linux AppImage, DEB and RPM, `SHA256SUMS`, and `latest.json`.

The live installer was run with an empty `HOME` and `XDG_BIN_HOME`. It downloaded the Linux AppImage, verified the release checksum, and installed `midi-roundtrip-check`. The AppImage SHA-256 was `ebcb1a0bc05c75deb6fdedd7d739788437a6757e3d8bc02a35f5d1fd16040fa0`, matching `SHA256SUMS`.

The container has no FUSE device, so the installed image was extracted using its supported `--appimage-extract` path. `AppRun` then stayed open for eight seconds under Xvfb with a new XDG profile. The window rendered the landing page; clicking **Try it with sample data** opened the persistent demo banner and the four-difference receipt. Screenshots are in `/work/.evidence/verify-2/desktop-app-consumer.png` and `/work/.evidence/verify-2/desktop-app-four-differences.png`.

## Earlier findings

| Earlier finding | Current disposition |
| --- | --- |
| Claims manifest missing | Fixed. Seven claims exist and every exact command passed. |
| No one-click demo or named audience | Fixed on desktop, phone, direct `/demo/`, and installed desktop app. |
| Invalid `aria-controls` in populated comparison | Fixed. Both controlled panels exist and selection matches the visible panel. |
| Advertised checkout returned 404 | Fixed honestly. Checkout is disabled and clearly pending external billing registration. |
| Tab arrow keys failed | Fixed. Arrow and Home/End behavior passed live and locally. |
| CSP and security headers missing | Fixed in live HTTPS responses. |
| Unknown paths returned the landing page with 200 | Fixed. Unknown paths render the designed 404 with HTTP 404. |
| Hashed assets cached for only 30 seconds | Fixed. Hashed assets use one-year immutable caching. |
| Metadata and social image missing | Fixed, including route metadata and correctly sized original assets. |
| Mobile targets below 44 px | Fixed for visible controls. |
| Empty MIDI said it contained notes | Fixed. The zero-note state is accurate. |
| First screen lacked three facts | Fixed. Privacy, offline use, and price are visible before scrolling. |
| Legal pages lacked the standard footer and build identity | Fixed on Privacy, Terms, and 404 pages. |
| Copy audit missing | Fixed. The audit exists with no sentence over 22 words and no banned term. |

## Remaining actions

1. Replace the demo banner's invalid `<aside role="status">` combination with valid semantics, and make the axe regression reject minor violations as well.
2. Register the separate Sociobot billing offer before enabling checkout. This known external action is disclosed and did not create an additional defect.
3. Add macOS notarization and Windows signing when owner certificates are available. Unsigned status is disclosed.

Evidence collected for this verification is in `/work/.evidence/verify-2/`.
