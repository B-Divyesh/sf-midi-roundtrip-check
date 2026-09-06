# Demo sandbox

Open <https://midi-roundtrip-check.sociobot.in/demo/> or choose **Try it with sample data** on the landing page.

The demo loads two bundled MIDI files in memory:

- `signal-sketch-reference.mid` has one program change, one breath controller, and two pitch-bend events.
- `signal-sketch-export.mid` moves the program change to channel 2 and drops the breath controller and two pitch bends.

The populated receipt reports four export differences. The **Demo — sample data, nothing is saved** banner stays visible while the sample is open.

**Reset demo** recreates the bundled files. **Start for real** leaves `/demo/` and removes only `demo:midi-roundtrip-check:active`.

Demo storage uses the `demo:midi-roundtrip-check:*` localStorage namespace. It does not read or write the real `sb_license:midi-roundtrip-check` namespace. MIDI bytes are parsed in memory and are never uploaded.
