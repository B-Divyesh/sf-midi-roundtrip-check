export type MidiEventKind = 'note-on' | 'note-off' | 'pitch-bend' | 'controller' | 'program' | 'pressure' | 'meta';

export interface MidiEvent {
  track: number;
  tick: number;
  seconds: number;
  channel?: number;
  kind: MidiEventKind;
  number?: number;
  value?: number;
  label: string;
}

export interface Finding {
  severity: 'error' | 'warning' | 'info';
  code: string;
  title: string;
  detail: string;
  track?: number;
  channel?: number;
}

export interface MidiAnalysis {
  name: string;
  format: number;
  tracks: number;
  division: number;
  durationTicks: number;
  durationSeconds: number;
  events: MidiEvent[];
  findings: Finding[];
  counts: { notes: number; bends: number; controllers: number; programs: number };
}

export interface Comparison {
  findings: Finding[];
  matched: number;
  expected: number;
  fidelity: number;
}

const CC_NAMES: Record<number, string> = {
  0: 'Bank select', 1: 'Modulation', 2: 'Breath', 4: 'Foot control', 5: 'Portamento time',
  6: 'Data entry', 7: 'Volume', 8: 'Balance', 10: 'Pan', 11: 'Expression', 32: 'Bank select LSB',
  64: 'Sustain', 65: 'Portamento', 66: 'Sostenuto', 67: 'Soft pedal', 68: 'Legato', 71: 'Resonance',
  72: 'Release', 73: 'Attack', 74: 'Brightness', 84: 'Portamento control', 91: 'Reverb', 93: 'Chorus',
  98: 'NRPN LSB', 99: 'NRPN MSB', 100: 'RPN LSB', 101: 'RPN MSB', 120: 'All sound off',
  121: 'Reset controllers', 123: 'All notes off'
};

const PROGRAMS = ['Acoustic grand piano', 'Bright piano', 'Electric grand', 'Honky-tonk piano', 'Electric piano 1', 'Electric piano 2', 'Harpsichord', 'Clavinet'];

class Reader {
  private view: DataView;
  pos = 0;
  constructor(private bytes: Uint8Array) { this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength); }
  get length() { return this.bytes.length; }
  ensure(n: number, context: string) { if (this.pos + n > this.length) throw new Error(`The file ends unexpectedly while reading ${context} (byte ${this.pos}).`); }
  u8(context = 'event') { this.ensure(1, context); return this.bytes[this.pos++]; }
  u16(context = 'header') { this.ensure(2, context); const n = this.view.getUint16(this.pos); this.pos += 2; return n; }
  u32(context = 'chunk') { this.ensure(4, context); const n = this.view.getUint32(this.pos); this.pos += 4; return n; }
  text(n: number) { this.ensure(n, 'chunk label'); const out = new TextDecoder('ascii').decode(this.bytes.subarray(this.pos, this.pos + n)); this.pos += n; return out; }
  skip(n: number, context = 'event data') { this.ensure(n, context); this.pos += n; }
  slice(n: number) { this.ensure(n, 'track data'); const out = this.bytes.subarray(this.pos, this.pos + n); this.pos += n; return out; }
  vlq(context = 'delta time') { let value = 0; for (let i = 0; i < 4; i++) { const b = this.u8(context); value = value * 128 + (b & 0x7f); if (!(b & 0x80)) return value; } throw new Error(`Invalid variable-length value while reading ${context}.`); }
}

export function parseMidi(input: ArrayBuffer | Uint8Array, name = 'Untitled.mid'): MidiAnalysis {
  const root = new Reader(input instanceof Uint8Array ? input : new Uint8Array(input));
  if (root.text(4) !== 'MThd') throw new Error('This is not a Standard MIDI File: the MThd header is missing.');
  const headerLength = root.u32('header length');
  if (headerLength < 6) throw new Error('The MIDI header is shorter than the required 6 bytes.');
  const format = root.u16();
  const declaredTracks = root.u16();
  const division = root.u16();
  root.skip(headerLength - 6, 'extended header');
  if (format > 2) throw new Error(`MIDI format ${format} is not supported.`);
  if (division & 0x8000) throw new Error('SMPTE time division is valid MIDI but is not supported by this checker yet.');
  if (!division) throw new Error('The MIDI file has a zero ticks-per-quarter-note value.');

  const events: MidiEvent[] = [];
  const tempos: Array<{ tick: number; micros: number }> = [{ tick: 0, micros: 500000 }];
  const findings: Finding[] = [];
  let parsedTracks = 0;
  let durationTicks = 0;

  while (root.pos < root.length && parsedTracks < declaredTracks) {
    const chunk = root.text(4);
    const length = root.u32('track length');
    if (chunk !== 'MTrk') {
      findings.push({ severity: 'warning', code: 'unknown-chunk', title: 'Unknown chunk skipped', detail: `${chunk || 'Unnamed'} is not a MIDI track and was ignored.` });
      root.skip(length, 'unknown chunk');
      continue;
    }
    const track = new Reader(root.slice(length));
    let tick = 0;
    let running = 0;
    let ended = false;
    const finalBend = new Map<number, number>();
    const bankPending = new Set<number>();
    while (track.pos < track.length && !ended) {
      tick += track.vlq();
      let status = track.u8('event status');
      let firstData: number | undefined;
      if (status < 0x80) {
        if (!running) throw new Error(`Track ${parsedTracks + 1} uses running status before a channel event.`);
        firstData = status; status = running;
      } else if (status < 0xf0) running = status;

      if (status === 0xff) {
        const type = track.u8('meta event type');
        const size = track.vlq('meta event length');
        if (type === 0x2f) { track.skip(size); ended = true; }
        else if (type === 0x51 && size === 3) {
          const micros = track.u8() * 65536 + track.u8() * 256 + track.u8();
          if (micros) tempos.push({ tick, micros });
        } else track.skip(size);
        running = 0;
        continue;
      }
      if (status === 0xf0 || status === 0xf7) { track.skip(track.vlq('SysEx length'), 'SysEx data'); running = 0; continue; }
      if (status >= 0xf0) {
        const sysLen: Record<number, number> = { 0xf1: 1, 0xf2: 2, 0xf3: 1, 0xf6: 0, 0xf8: 0, 0xfa: 0, 0xfb: 0, 0xfc: 0, 0xfe: 0 };
        if (!(status in sysLen)) throw new Error(`Unsupported system status 0x${status.toString(16)} in track ${parsedTracks + 1}.`);
        track.skip(sysLen[status]); running = 0; continue;
      }

      const type = status >> 4;
      const channel = (status & 0x0f) + 1;
      const d1 = firstData ?? track.u8('channel event data');
      const oneByte = type === 0xc || type === 0xd;
      const d2 = oneByte ? undefined : track.u8('channel event data');
      if (d1 > 127 || (d2 !== undefined && d2 > 127)) throw new Error(`Track ${parsedTracks + 1} contains a data byte outside 0–127.`);
      if (type === 0x8 || type === 0x9) {
        const on = type === 0x9 && d2 !== 0;
        events.push({ track: parsedTracks + 1, tick, seconds: 0, channel, kind: on ? 'note-on' : 'note-off', number: d1, value: d2, label: `${on ? 'Note on' : 'Note off'} ${d1}` });
      } else if (type === 0xb) {
        events.push({ track: parsedTracks + 1, tick, seconds: 0, channel, kind: 'controller', number: d1, value: d2, label: `${CC_NAMES[d1] ?? `CC ${d1}`} · ${d2}` });
        if (d1 === 0 || d1 === 32) bankPending.add(channel);
      } else if (type === 0xc) {
        events.push({ track: parsedTracks + 1, tick, seconds: 0, channel, kind: 'program', number: d1, value: d1, label: `Program ${d1 + 1}${PROGRAMS[d1] ? ` · ${PROGRAMS[d1]}` : ''}` });
        bankPending.delete(channel);
      } else if (type === 0xe) {
        const bend = ((d2 ?? 0) << 7) | d1;
        events.push({ track: parsedTracks + 1, tick, seconds: 0, channel, kind: 'pitch-bend', value: bend - 8192, label: `Pitch bend ${bend - 8192 >= 0 ? '+' : ''}${bend - 8192}` });
        finalBend.set(channel, bend - 8192);
      } else if (type === 0xa || type === 0xd) {
        events.push({ track: parsedTracks + 1, tick, seconds: 0, channel, kind: 'pressure', number: d1, value: d2 ?? d1, label: type === 0xd ? `Channel pressure ${d1}` : `Poly pressure ${d1} · ${d2}` });
      }
    }
    durationTicks = Math.max(durationTicks, tick);
    for (const [channel, bend] of finalBend) if (bend !== 0) findings.push({ severity: 'warning', code: 'bend-not-reset', title: 'Pitch bend does not return to center', detail: `Channel ${channel} ends at ${bend > 0 ? '+' : ''}${bend}. The next note may inherit that bend on some players.`, track: parsedTracks + 1, channel });
    for (const channel of bankPending) findings.push({ severity: 'warning', code: 'bank-without-program', title: 'Bank select has no following program change', detail: `Channel ${channel} selects a bank but never chooses a sound in this track. Some players will ignore it.`, track: parsedTracks + 1, channel });
    if (!ended) findings.push({ severity: 'warning', code: 'missing-end', title: 'Track has no end marker', detail: `Track ${parsedTracks + 1} reached its byte boundary without an End of Track event.`, track: parsedTracks + 1 });
    parsedTracks++;
  }
  if (parsedTracks !== declaredTracks) findings.push({ severity: 'error', code: 'track-count', title: 'Track count does not match header', detail: `Header declares ${declaredTracks} track${declaredTracks === 1 ? '' : 's'}, but ${parsedTracks} could be read.` });
  if (root.pos < root.length) findings.push({ severity: 'warning', code: 'trailing-data', title: 'Extra data follows the MIDI tracks', detail: `${root.length - root.pos} trailing byte${root.length - root.pos === 1 ? '' : 's'} were ignored.` });

  const tempoMap = [...tempos].sort((a, b) => a.tick - b.tick).filter((t, i, a) => i === 0 || t.tick !== a[i - 1].tick || t.micros !== a[i - 1].micros);
  const tickToSeconds = (target: number) => { let seconds = 0, lastTick = 0, micros = 500000; for (const t of tempoMap) { if (t.tick > target) break; seconds += (t.tick - lastTick) * micros / division / 1e6; lastTick = t.tick; micros = t.micros; } return seconds + (target - lastTick) * micros / division / 1e6; };
  for (const event of events) event.seconds = tickToSeconds(event.tick);
  const controllers = events.filter(e => e.kind === 'controller');
  const bends = events.filter(e => e.kind === 'pitch-bend');
  if (bends.length && !controllers.some(e => e.number === 100 || e.number === 101)) findings.push({ severity: 'info', code: 'default-bend-range', title: 'Pitch-bend range is implicit', detail: 'No RPN pitch-bend range was found. Many General MIDI players assume ±2 semitones, but instruments can differ.' });
  const uncommon = [...new Set(controllers.filter(e => !(e.number! in CC_NAMES)).map(e => e.number!))];
  if (uncommon.length) findings.push({ severity: 'info', code: 'unlabelled-controller', title: 'Manufacturer-specific controller intent', detail: `CC ${uncommon.join(', CC ')} ${uncommon.length === 1 ? 'is' : 'are'} not assigned a common General MIDI label. Confirm the destination understands ${uncommon.length === 1 ? 'it' : 'them'}.` });
  const counts = { notes: events.filter(e => e.kind === 'note-on').length, bends: bends.length, controllers: controllers.length, programs: events.filter(e => e.kind === 'program').length };
  return { name, format, tracks: parsedTracks, division, durationTicks, durationSeconds: tickToSeconds(durationTicks), events, findings, counts };
}

function signature(e: MidiEvent, channel = true) {
  return `${e.kind}|${channel ? e.channel ?? '-' : '-'}|${e.tick}|${e.number ?? '-'}|${e.value ?? '-'}`;
}

export function compareMidi(reference: MidiAnalysis, exported: MidiAnalysis): Comparison {
  const important = (e: MidiEvent) => ['pitch-bend', 'controller', 'program'].includes(e.kind);
  const expectedEvents = reference.events.filter(important);
  const actual = new Map<string, number>();
  for (const event of exported.events.filter(important)) actual.set(signature(event), (actual.get(signature(event)) ?? 0) + 1);
  let matched = 0;
  const missing: MidiEvent[] = [];
  for (const event of expectedEvents) { const key = signature(event); const n = actual.get(key) ?? 0; if (n) { matched++; actual.set(key, n - 1); } else missing.push(event); }
  const findings: Finding[] = [];
  const exportedLoose = new Map<string, MidiEvent[]>();
  for (const e of exported.events.filter(important)) { const key = signature(e, false); exportedLoose.set(key, [...(exportedLoose.get(key) ?? []), e]); }
  const genuinelyMissing: MidiEvent[] = [];
  for (const e of missing) {
    const looseEvents = exportedLoose.get(signature(e, false));
    const looseIndex = looseEvents?.findIndex(x => x.channel !== e.channel) ?? -1;
    const loose = looseIndex >= 0 ? looseEvents![looseIndex] : undefined;
    if (loose) {
      looseEvents!.splice(looseIndex, 1);
      const movedKey = signature(loose);
      actual.set(movedKey, Math.max(0, (actual.get(movedKey) ?? 0) - 1));
      findings.push({ severity: 'error', code: 'changed-channel', title: `${kindName(e)} moved to another channel`, detail: `At tick ${e.tick}, the reference uses channel ${e.channel}; the export uses channel ${loose.channel}.`, track: e.track, channel: e.channel });
    }
    else genuinelyMissing.push(e);
  }
  const grouped = new Map<string, MidiEvent[]>();
  for (const e of genuinelyMissing) { const key = `${e.kind}|${e.channel}|${e.number ?? '-'}`; grouped.set(key, [...(grouped.get(key) ?? []), e]); }
  for (const events of grouped.values()) {
    const e = events[0];
    findings.push({ severity: 'error', code: `missing-${e.kind}`, title: `${events.length} ${kindName(e).toLowerCase()} event${events.length === 1 ? '' : 's'} missing`, detail: `Channel ${e.channel}, ${e.kind === 'controller' ? `CC ${e.number} (${CC_NAMES[e.number!] ?? 'unlabelled'})` : e.label}. First expected at tick ${e.tick}.`, track: e.track, channel: e.channel });
  }
  const extra = [...actual.values()].reduce((a, b) => a + b, 0);
  if (extra) findings.push({ severity: 'warning', code: 'extra-events', title: `${extra} unexpected intent event${extra === 1 ? '' : 's'}`, detail: 'The export adds program, controller, or pitch-bend data that was not in the reference.' });
  const fidelity = expectedEvents.length ? Math.round(matched / expectedEvents.length * 100) : 100;
  if (!findings.length) findings.push({ severity: 'info', code: 'intent-match', title: 'Controller intent matches', detail: 'All compared pitch-bend, program, and controller events match by tick, channel, and value.' });
  return { findings, matched, expected: expectedEvents.length, fidelity };
}

function kindName(e: MidiEvent) { return e.kind === 'pitch-bend' ? 'Pitch bend' : e.kind === 'controller' ? 'Controller' : e.kind === 'program' ? 'Program change' : e.kind; }

export function analysisCsv(analysis: MidiAnalysis, comparison?: Comparison) {
  const quote = (v: unknown) => `"${String(v ?? '').replaceAll('"', '""')}"`;
  const rows = [['kind', 'severity', 'track', 'channel', 'tick', 'seconds', 'label', 'detail'].map(quote).join(',')];
  for (const f of [...(comparison?.findings ?? []), ...analysis.findings]) rows.push(['finding', f.severity, f.track, f.channel, '', '', f.title, f.detail].map(quote).join(','));
  for (const e of analysis.events) rows.push([e.kind, '', e.track, e.channel, e.tick, e.seconds.toFixed(3), e.label, ''].map(quote).join(','));
  return rows.join('\n');
}
