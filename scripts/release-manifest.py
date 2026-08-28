#!/usr/bin/env python3
import json, os, sys
repo, tag, directory = sys.argv[1:]
files = sorted(f for f in os.listdir(directory) if os.path.isfile(os.path.join(directory, f)) and f not in ('SHA256SUMS', 'latest.json'))
def url(f): return f"https://github.com/{repo}/releases/download/{tag}/{f}"
def choose(words):
    return next((f for f in files if any(w in f.lower() for w in words)), None)
assets = {}
for key, words in {'macos-arm64':['aarch64.dmg','arm64.dmg'], 'macos-x86_64':['x64.dmg','x86_64.dmg'], 'windows':['x64-setup.exe','.msi'], 'linux':['.appimage']}.items():
    picked = choose(words)
    if picked: assets[key] = {'name': picked, 'url': url(picked)}
print(json.dumps({'version': tag.lstrip('v'), 'tag': tag, 'assets': assets}, indent=2))
