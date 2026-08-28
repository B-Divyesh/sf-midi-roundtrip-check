# MIDI Roundtrip Check

MIDI Roundtrip Check is a local-first desktop utility for electronic musicians and score arrangers. It makes pitch bends, channels, programs, and controller intent readable, then compares a source MIDI with an exported copy to catch dropped or moved events.

Live site: <https://midi-roundtrip-check.sociobot.in>

## What it does

- Parses Standard MIDI format 0, 1, and 2 files locally, including running status and tempo maps.
- Shows channel-by-channel controller, program, and pitch-bend timelines.
- Warns about malformed files, bends left off-center, implicit bend ranges, incomplete bank changes, and unfamiliar controllers.
- Compares a reference and export by exact tick, channel, controller/program number, and value; distinguishes changed channels from missing events.
- Exports a plain CSV report for free. A $19 one-time Receipt mode license adds self-contained printable HTML receipts.

It is an inspector, not a MIDI editor, synth, or playback guarantee. No composition is uploaded and there is no telemetry.

## Run and test

Requires Node.js 20+ and Rust 1.77+ for the desktop shell.

```sh
npm ci
npm run dev
npm test
npm run test:e2e
npm run build       # static site -> dist/site
npm run build:app   # Tauri frontend -> dist/app
npm run tauri dev
```

Playwright 1.58.2 is pinned. If Chromium is not already available, run `npx playwright install chromium` once.

## Install

Download the detected build from the website or the [latest GitHub Release](https://github.com/B-Divyesh/sf-midi-roundtrip-check/releases/latest).

macOS or Linux:

```sh
curl -fsSL https://midi-roundtrip-check.sociobot.in/install.sh | sh
```

Windows PowerShell:

```powershell
irm https://midi-roundtrip-check.sociobot.in/install.ps1 | iex
```

The scripts fetch `latest.json`, download the matching release asset, and verify it against `SHA256SUMS` before installing or opening it. v0.1 builds are unsigned: on macOS, right-click the app and choose **Open**; on Windows, review the SmartScreen prompt before continuing.

## Releases and deployment

Tags matching `v*` run [.github/workflows/release.yml](.github/workflows/release.yml) on GitHub-hosted macOS, Windows, and Linux runners. The workflow creates `.dmg`, `.msi`/`.exe`, `.AppImage`, `.deb`, and `.rpm` assets where Tauri supports them, then publishes checksums and the download manifest.

The factory deploys `dist/site`; this repository does not manage DNS, billing registration, or hosting infrastructure. Receipt mode verifies licenses only through the Sociobot billing API and contains no hardcoded billing product ID.

## Project notes

- [Visual system and image provenance](.factory/design.md)
- [Build handoff](.factory/handoff.md)
- [Privacy](https://midi-roundtrip-check.sociobot.in/privacy/)
- [Terms](https://midi-roundtrip-check.sociobot.in/terms/)

MIT licensed. © 2026 Sociobot (Param Factory).
