# MIDI Roundtrip Check

MIDI Roundtrip Check is a local MIDI comparison tool for electronic musicians and score arrangers. Compare a reference MIDI with an export to find missing bends, changed channels, controllers, and programs before sharing a file.

Try the bundled sample at <https://midi-roundtrip-check.sociobot.in/demo/>. The sample is separate from real checker data and nothing in it is saved.

## What it does

- Compares a reference MIDI with an exported MIDI on your device.
- Shows a channel timeline for controller, program, and pitch-bend events.
- Exports the populated findings as a free CSV file.
- Explains malformed MIDI files and lets you try a valid file afterwards.
- Keeps working offline after the first visit.

MIDI Roundtrip Check is an inspector. It does not edit MIDI, generate audio, install hardware drivers, or promise matching playback on every device.

Receipt mode will add self-contained HTML receipts for a $19 one-time license. Its billing offer is not registered yet, so checkout is intentionally unavailable. CSV export and safety checks remain free.

## Run and test

Requires Node.js 20+ and Rust 1.77+ for the desktop shell.

On Debian or Ubuntu, install the Tauri build prerequisites before running the Rust check:

```sh
sudo apt-get update
sudo apt-get install -y libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf
```

```sh
npm ci
npm test
npm run test:e2e
npm run build
npm run build:app
cargo test --locked --manifest-path src-tauri/Cargo.toml
```

Run a single documented public claim from a clean install:

```sh
npm run test:e2e -- --grep @claim:sample-comparison
```

Playwright 1.58.2 is pinned. If Chromium is unavailable, run `npx playwright install chromium` once.

## Use the desktop app

Download the detected build from the website or the [latest GitHub Release](https://github.com/B-Divyesh/sf-midi-roundtrip-check/releases/latest). Version 0.1 builds are unsigned.

macOS or Linux:

```sh
curl -fsSL https://midi-roundtrip-check.sociobot.in/install.sh | sh
```

Windows PowerShell:

```powershell
irm https://midi-roundtrip-check.sociobot.in/install.ps1 | iex
```

## Build and deploy

`npm run build` writes the static site to `dist/site`. It includes the Azure Static Web Apps security, cache, route, and 404 configuration. `npm run build:app` writes the Tauri frontend to `dist/app`.

Tags matching `v*` run the desktop release workflow on GitHub Actions. The workflow publishes macOS, Windows, and Linux artifacts, `SHA256SUMS`, and `latest.json`.

The factory deploys `dist/site`. This repository does not manage DNS, infrastructure, or billing registration.

## Documentation

- [Product brief](.factory/brief.json)
- [Visual system and image provenance](.factory/design.md)
- [Demo sandbox](.factory/demo.md)
- [Public claims and verification commands](.factory/claims.json)
- [Privacy](https://midi-roundtrip-check.sociobot.in/privacy/)
- [Terms](https://midi-roundtrip-check.sociobot.in/terms/)

MIT licensed. © 2026 Sociobot (Param Factory).
