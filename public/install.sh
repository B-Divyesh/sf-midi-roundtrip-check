#!/bin/sh
set -eu
repo="B-Divyesh/sf-midi-roundtrip-check"
base="https://github.com/$repo/releases/latest/download"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT INT TERM
arch="$(uname -m)"
case "$(uname -s):$arch" in
  Darwin:arm64) key="macos-arm64" ;;
  Darwin:x86_64) key="macos-x86_64" ;;
  Linux:x86_64) key="linux" ;;
  *) echo "No automatic installer for $(uname -s) $arch. See https://github.com/$repo/releases/latest" >&2; exit 1 ;;
esac
curl -fsSL "$base/latest.json" -o "$work/latest.json"
url="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["assets"][sys.argv[2]]["url"])' "$work/latest.json" "$key")"
name="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["assets"][sys.argv[2]]["name"])' "$work/latest.json" "$key")"
[ -n "$url" ] || { echo "Release manifest has no $key build." >&2; exit 1; }
file="$work/$name"
curl -fL "$url" -o "$file"
curl -fsSL "$base/SHA256SUMS" -o "$work/SHA256SUMS"
(cd "$work" && grep "  $(basename "$file")$" SHA256SUMS | sha256sum -c -)
case "$file" in
  *.AppImage) destination="${XDG_BIN_HOME:-$HOME/.local/bin}"; mkdir -p "$destination"; install -m 755 "$file" "$destination/midi-roundtrip-check"; echo "Installed to $destination/midi-roundtrip-check" ;;
  *.dmg) cp "$file" "$HOME/Downloads/"; echo "Verified and saved $(basename "$file") to Downloads. Open it, then right-click the app and choose Open (unsigned build)." ;;
esac
