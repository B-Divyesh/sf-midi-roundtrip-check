# Verification handoff — FAIL

Independent QA on 2026-08-28 tested candidate `ae5d4a4fa481543ee88aef7e499d6747bde28685` and <https://midi-roundtrip-check.sociobot.in>.

**Release verdict: FAIL. Do not ship this candidate.**

The deployed HTML, JS, CSS, and service worker match the candidate. Clean install, unit tests, typecheck, site/app builds, desktop/mobile repository E2E, Rust compilation/tests, offline reload, performance budgets, release assets, checksum verification, normal MIDI analysis, and the brief’s seeded discrepancy target passed.

Release blockers:

1. `.factory/claims.json` is missing, so the mandatory claims test gate cannot run. The site and README contain many unlisted claims.
2. The first screen does not name the intended user and has no one-click sample demo. `/demo` is the ordinary landing page; `.factory/demo.md` is missing.
3. The populated comparison view has a critical axe failure: selected `#compare-tab` controls nonexistent `#compare-panel`.
4. The advertised $19 Receipt mode checkout returns HTTP 404 from the required Sociobot endpoint.

Additional material defects: tab arrow keys do not work, no live CSP is sent, hashed assets cache for only 30 seconds, there is no real 404 route, required social/canonical metadata is missing, several mobile links are under 44 px high, and the zero-note empty state incorrectly says the file contains notes.

Full evidence, severity, exact commands/results, performance numbers, rate-limit threshold, deployment hashes, and release checksum are in [.factory/verification.md](verification.md). Browser evidence is under `.factory/verification-artifacts/`.

No product code was changed. Only independent verification documentation and evidence were added.

## Required next work

- Add `.factory/claims.json` and one real `@claim:<id>` sandbox test per site/README claim.
- Add a bundled, isolated sample MIDI demo with `/demo`, persistent demo banner, reset/exit controls, and `.factory/demo.md`.
- Fix the comparison tab panel relationship and implement Left/Right arrow behavior; rerun axe after results render.
- Register/enable the Sociobot paid product or remove the unavailable paid offer.
- Deploy platform-native security/cache configuration with CSP and immutable hashed-asset caching.
- Add the designed 404 route, metadata, compliant mobile touch targets, and correct empty-state copy.

After those repairs, rerun every check in `.factory/verification.md` from a clean checkout and fresh browser profile.
