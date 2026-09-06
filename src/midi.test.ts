import { describe, expect, it } from 'vitest';
import { analysisCsv, compareMidi, parseMidi } from './midi';

function midi(events: number[], channels = 1) {
  const track = [...events, 0, 0xff, 0x2f, 0];
  return Uint8Array.from([77,84,104,100, 0,0,0,6, 0,0, 0,1, 1,224, 77,84,114,107, 0,0,0,track.length, ...track]);
}

describe('MIDI parser', () => {
  it('reads running status, programs, controllers and pitch bends', () => {
    const data = midi([0,0xc0,40, 0,0xb0,2,90, 0,2,80, 0,0xe0,0,96, 0,0x90,60,100, 96,60,0]);
    const out = parseMidi(data, 'intent.mid');
    expect(out.counts).toEqual({ notes: 1, bends: 1, controllers: 2, programs: 1 });
    expect(out.findings.some(x => x.code === 'bend-not-reset')).toBe(true);
    expect(out.durationTicks).toBe(96);
  });

  it('rejects truncated and non-MIDI data with useful errors', () => {
    expect(() => parseMidi(Uint8Array.from([1,2,3]))).toThrow(/ends unexpectedly/);
    expect(() => parseMidi(new TextEncoder().encode('not a midi file'))).toThrow(/MThd/);
  });

  it('finds missing controller, missing bend, and changed channel', () => {
    const reference = parseMidi(midi([0,0xb0,2,90, 0,0xe0,0,96, 0,0xc0,10]));
    const exported = parseMidi(midi([0,0xc1,10]));
    const diff = compareMidi(reference, exported);
    expect(diff.findings.map(f => f.code)).toEqual(expect.arrayContaining(['missing-controller', 'missing-pitch-bend', 'changed-channel']));
    expect(diff.findings.some(f => f.code === 'extra-events')).toBe(false);
    expect(diff.fidelity).toBe(0);
  });

  it('exports quoted CSV without raw-byte knowledge', () => {
    expect(analysisCsv(parseMidi(midi([0,0xb0,7,100])))).toContain('"Volume · 100"');
  });
});
