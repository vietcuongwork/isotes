#!/usr/bin/env bash
# Builds the isotes dev build or restores it from Stim's cache, installs and launches
# it on this checkout's simulator, then records its native fingerprint for doctor.sh.
# Run from the repo root, as a background task (several minutes if not cached). Usage: build.sh
set -euo pipefail

SCRIPTS=.claude/skills/verify-isotes/scripts

mkdir -p .sim/build
log=.sim/build/build-$(date +%m%d-%H%M%S).log
# Also starts this workspace's Metro if it's down
if ! stim ios >"$log" 2>&1; then
  echo "build.sh: stim ios failed. Log: $log" >&2
  exit 1
fi
# Not Stim's own fingerprint: its hash differs, and doctor.sh compares against this one.
"$SCRIPTS/fingerprint.sh" >.sim/last-native-build
echo "build.sh: installed; fingerprint $(cut -c1-8 .sim/last-native-build). Log: $log"
