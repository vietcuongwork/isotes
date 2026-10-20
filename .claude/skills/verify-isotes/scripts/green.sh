#!/usr/bin/env bash
# Fingerprints src/ (tracked and untracked files), so a phase can reuse the last green Demo as its smoke test.
# mark: after a green Demo, writes the fingerprint to .sim/last-green
# check: prints "same" and exits 0 when src matches it; "changed" and exits 1 otherwise
# Usage: green.sh mark | check
set -uo pipefail
cd "$(git rev-parse --show-toplevel)" || exit 2

STAMP=.sim/last-green

# A deleted tracked file makes shasum fail; dropping it still changes the hash
fingerprint() {
  { git ls-files -z -co --exclude-standard src | sort -z | xargs -0 shasum 2>/dev/null || true; } |
    shasum | cut -d' ' -f1
}

case "${1:-}" in
  mark)
    fingerprint > "$STAMP"
    echo "marked $(cat "$STAMP")"
    ;;
  check)
    if [ -f "$STAMP" ] && [ "$(fingerprint)" = "$(cat "$STAMP")" ]; then
      echo "same: src unchanged since the last green Demo"
    else
      echo "changed: run the smoke test"
      exit 1
    fi
    ;;
  *)
    echo "usage: green.sh mark | check" >&2
    exit 2
    ;;
esac
