#!/usr/bin/env bash
# Builds and installs the isotes dev build on the working simulator, then records
# its native fingerprint for doctor.sh. Run from the repo root, as a background
# task (several minutes). Usage: build.sh
set -euo pipefail

SIM=F074204A-8DED-491A-9D45-3C6344EECCEB
SCRIPTS=.claude/skills/verify-isotes/scripts

mkdir -p .sim/build
log=.sim/build/build-$(date +%m%d-%H%M%S).log
# --no-bundler: Metro runs on its own (Launch step 3)
if ! npx expo run:ios --device "$SIM" --no-bundler >"$log" 2>&1; then
  echo "build.sh: build failed. Log: $log; the first error is in .expo/xcodebuild-error.log" >&2
  exit 1
fi
"$SCRIPTS/fingerprint.sh" >.sim/last-native-build
echo "build.sh: installed; fingerprint $(cut -c1-8 .sim/last-native-build). Log: $log"
