#!/usr/bin/env bash
# Runs one Maestro flow on the working simulator, into its own .sim/maestro/<flow>-<time>/.
# When the XCTest runner starts with another app in front (usually the home screen), a flow
# that doesn't launch isotes itself fails; that run gets one retry after isotes is brought back.
# Usage: flow.sh <flow.yaml> [maestro test options, e.g. -e A="$A"]
set -uo pipefail
cd "$(git rev-parse --show-toplevel)" || exit 2

SIM=F074204A-8DED-491A-9D45-3C6344EECCEB
BUNDLE=com.anonymous.isotes

[ $# -ge 1 ] || { echo 'usage: flow.sh <flow.yaml> [maestro test options]' >&2; exit 2; }
flow=$1
shift

run() {
  out=.sim/maestro/$(basename "$flow" .yaml)-$(date +%m%d-%H%M%S)
  maestro test --device "$SIM" --debug-output "$out" "$@" "$flow"
}

run "$@" && exit 0
# The runner logs the app in front as it starts. why: [[Fix_textinput-recycled-placeholder]] Task 2
front=$(grep -ohm1 'Detected running apps: .*' "$out"/.maestro/tests/*/xctest_runner_*.log 2>/dev/null)
case $front in *"$BUNDLE"* | '') exit 1 ;; esac
echo "flow.sh: the run started with ${front#Detected running apps: } in front, not isotes; bringing isotes back and retrying once"
# simctl launch on a running app brings it forward without a restart (same pid)
xcrun simctl launch "$SIM" "$BUNDLE" >/dev/null || exit 1
run "$@"
