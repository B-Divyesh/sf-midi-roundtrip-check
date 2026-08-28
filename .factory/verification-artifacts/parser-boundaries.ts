import { parseMidi } from '../../src/midi';

const header = (format: number, tracks: number, division = 480) => [
  77, 84, 104, 100, 0, 0, 0, 6,
  0, format, 0, tracks, (division >> 8) & 255, division & 255,
];
const chunk = (events: number[]) => {
  const data = [...events, 0, 255, 47, 0];
  return [77, 84, 114, 107, 0, 0, 0, data.length, ...data];
};

for (const format of [1, 2]) {
  const bytes = Uint8Array.from([
    ...header(format, 2),
    ...chunk([0, 192, 0]),
    ...chunk([0, 177, 2, 127]),
  ]);
  const result = parseMidi(bytes, `format-${format}.mid`);
  console.log(JSON.stringify({
    format: result.format,
    tracks: result.tracks,
    counts: result.counts,
    findings: result.findings.map(finding => finding.code),
  }));
}

const mismatch = parseMidi(
  Uint8Array.from([...header(1, 2), ...chunk([0, 192, 0])]),
  'mismatch.mid',
);
console.log(JSON.stringify({
  case: 'declared-track-mismatch',
  findings: mismatch.findings.map(finding => finding.code),
}));
