#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';

const REPO = 'B-Divyesh/sf-midi-roundtrip-check';
const API_URL = `https://api.github.com/repos/${REPO}/releases/latest`;
const output = process.argv[2];

if (!output) throw new Error('Usage: sync-release-manifest.mjs <output-file>');

function pick(assets, patterns) {
  return assets.find(asset => patterns.some(pattern => asset.name.toLowerCase().includes(pattern)));
}

function toManifest(release) {
  const assets = Array.isArray(release.assets) ? release.assets : [];
  const choices = {
    'macos-arm64': pick(assets, ['aarch64.dmg', 'arm64.dmg']),
    'macos-x86_64': pick(assets, ['x64.dmg', 'x86_64.dmg']),
    windows: pick(assets, ['x64-setup.exe', '.msi']),
    linux: pick(assets, ['.appimage'])
  };
  const resolved = Object.fromEntries(Object.entries(choices).flatMap(([key, asset]) => asset ? [[key, { name: asset.name, url: asset.browser_download_url }]] : []));
  if (Object.keys(resolved).length !== 4) throw new Error('Latest release does not contain all four desktop installer targets');
  return { version: String(release.tag_name).replace(/^v/, ''), tag: release.tag_name, assets: resolved };
}

function validManifest(value) {
  return value && typeof value.tag === 'string' && ['macos-arm64', 'macos-x86_64', 'windows', 'linux'].every(key => {
    const asset = value.assets?.[key];
    return typeof asset?.name === 'string' && typeof asset?.url === 'string' && asset.url.startsWith(`https://github.com/${REPO}/releases/download/`);
  });
}

try {
  const response = await fetch(API_URL, {
    headers: { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'midi-roundtrip-check-build' },
    signal: AbortSignal.timeout(10_000)
  });
  if (!response.ok) throw new Error(`GitHub Releases API returned ${response.status}`);
  const manifest = toManifest(await response.json());
  await writeFile(output, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Release manifest: ${manifest.tag} from ${API_URL}`);
} catch (error) {
  const fallback = JSON.parse(await readFile(output, 'utf8'));
  if (!validManifest(fallback)) throw error;
  console.warn(`Release manifest: using bundled ${fallback.tag} fallback (${error instanceof Error ? error.message : error})`);
}
