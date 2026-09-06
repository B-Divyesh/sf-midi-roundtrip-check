# Visual thesis — Midnight signal market

## Direction and rationale

MIDI Roundtrip Check uses **night-market neon signage** as a functional metaphor: a dense row of signal lamps turns an opaque event stream into a route that can be inspected at a glance. The interface is single-mode dark because the product is likely used beside DAWs and notation software in dim studios. Decoration is limited to the generated hero awning and the timeline's illuminated event marks; both explain the product's job.

## Tokens

- `ink-950 #080A12` — night sky / page background
- `stall-900 #111522` and `stall-850 #171C2B` — raised work surfaces
- `paper-50 #F7F4EA` — primary copy (15.9:1 on ink)
- `paper-300 #C9C6BE` — secondary copy (9.7:1 on ink)
- `cyan-400 #35E7E0` — primary action and channel signal
- `cyan-950 #032E32` — accent contrast
- `marigold-400 #FFC857` — warnings / bend signal
- `coral-400 #FF6B6B` — errors
- `mint-400 #6EE7A8` — passed checks
- `violet-400 #B69CFF` — program changes

All statuses include a label or symbol as well as color. Focus uses a 3 px cyan ring with a 2 px ink offset. No light theme: the art direction is explicitly environmental, and every surface is painted.

## Type and rhythm

Display and utility copy use the local system sans stack (`Inter`-like forms without a network font); event data uses the local system monospace stack. Sizes: 14, 16, 18, 24, 40–64 px. Body is 16 px minimum, line-height 1.55, readable measure 68ch. Spacing follows a 4/8 px base with 12, 16, 24, 32, 48, 64, and 96 px stops. Corners are clipped like ticket stubs rather than generically rounded.

## Interaction grammar

The main drop zone is the bright shop counter. Opening a file swaps the invitation for a receipt header; signal chips then resolve into the timeline beneath it. Event rows expand from their source track. Controls use direct verbs: “Choose MIDI”, “Export CSV”, “Print receipt”. On phones, the decorative hero art and comparison marketing are dropped; the analyzer and summary stack first.

## Motion policy

State changes use 180–240 ms opacity and translate transitions. Timeline marks rise from their measured timestamp. Nothing loops. Under `prefers-reduced-motion: reduce`, transforms and smooth scrolling are removed and transitions become effectively instant.

## Original asset plan and provenance

- `public/market-signal.webp` / `.avif`: generated hero scene, used as atmospheric evidence of the “signal market” concept, never as a capability claim.
- `public/social-preview.webp`: a 1200×630 crop composed from the generated hero scene for page sharing; it adds no new subject matter or text.
- `public/apple-touch-icon.png`: a 180px raster export of the hand-authored product mark.
- `public/walkthrough-choose.webp`, `walkthrough-compare.webp`, and `walkthrough-report.webp`: 960×600 screenshots of the built local app, captured 2026-09-06 for the desktop walkthrough. They are original product evidence, not illustrative capability claims.
- Hand-authored SVG logo and event glyphs are geometric and original to this repository.

Prompt sheet: **Use case:** stylized-concept. **Subject:** an empty midnight electronics market stall where luminous patch cables form clean horizontal music-event timelines, small controller knobs and pitch-bend wheels arranged like produce, no people. **World/materials:** rain-dark painted metal, translucent acrylic, paper inspection receipts. **Light/lens:** cyan, marigold, coral, and violet practical neon; cinematic wide 35mm, quiet and precise, ample negative space. **Negative list:** no text, no letters, no logos, no brands, no watermark, no human figure, no keyboards with malformed keys, no generic purple gradient, no UI screenshot.

Generated with the factory image deployment (`/opt/fleet/lib/gen-image.sh`), 2026-08-28. Original generated work; project use under the repository MIT license. Source prompt is retained beside the PNG in `assets/src/market-signal.json`.
