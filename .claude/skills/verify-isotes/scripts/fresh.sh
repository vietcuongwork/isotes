#!/usr/bin/env bash
# A fresh install of isotes on a spare simulator, for states that need an empty
# database (no trips). Keeps one simulator and erases it on each run, because
# the Claude app asks for device consent once per simulator UDID.
# Run from the repo root. Usage: fresh.sh [--shutdown]; prints the UDID.
set -euo pipefail

SIM=F074204A-8DED-491A-9D45-3C6344EECCEB
BUNDLE=com.anonymous.isotes
NAME=isotes-fresh
TYPE=com.apple.CoreSimulator.SimDeviceType.iPhone-17
RUNTIME=com.apple.CoreSimulator.SimRuntime.iOS-26-5

[ $# -eq 0 ] || [ "$1" = "--shutdown" ] || { echo "usage: fresh.sh [--shutdown]" >&2; exit 2; }

udid=$(xcrun simctl list devices -j | jq -r --arg n "$NAME" '[.devices[][] | select(.name == $n)][0].udid // empty')

if [ "${1:-}" = "--shutdown" ]; then
  [ -n "$udid" ] && xcrun simctl shutdown "$udid" 2>/dev/null || true
  echo "fresh.sh: $NAME shut down"
  exit 0
fi

[ -n "$udid" ] || udid=$(xcrun simctl create "$NAME" "$TYPE" "$RUNTIME")
# The working simulator's install is the build under test
app=$(xcrun simctl get_app_container "$SIM" "$BUNDLE" app) || {
  echo "fresh.sh: isotes isn't installed on $SIM" >&2; exit 1; }

xcrun simctl shutdown "$udid" 2>/dev/null || true
xcrun simctl erase "$udid"
xcrun simctl boot "$udid"
xcrun simctl bootstatus "$udid" -b >/dev/null
xcrun simctl install "$udid" "$app"
echo "$udid"
