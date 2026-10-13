#!/usr/bin/env bash
# Read-only: is the working simulator worth driving? Prints each problem and exits 1; "doctor: ok" and 0 when clean.
# No Maestro device call: each one starts an XCTest driver, which kills the MCP server's.
# Usage: doctor.sh
set -uo pipefail

SIM=F074204A-8DED-491A-9D45-3C6344EECCEB
BUNDLE=com.anonymous.isotes
MAESTRO_VERSION=2.11.0
# System apps seen running in the background on an idle simulator; anything else is someone's foreground app.
BACKGROUND_APPS='^(com\.apple\.Spotlight|com\.apple\.chrono\..*|com\.apple\.mobilecal)$'

problems=0
fail() { echo "!! $1"; problems=$((problems + 1)); }

version=$(maestro --version 2>/dev/null | tail -1)
[ "$version" = "$MAESTRO_VERSION" ] || fail "maestro is '${version:-missing}', want $MAESTRO_VERSION. Fix: upgrading is its own task; ask the user."

if ! xcrun simctl list devices booted | grep -q "$SIM"; then
  fail "simulator $SIM isn't booted. Fix: Launch step 1."
else
  xcrun simctl get_app_container "$SIM" "$BUNDLE" >/dev/null 2>&1 \
    || fail "isotes isn't installed on $SIM. Fix: build it (expo run:ios), or ask the user."

  # Fail closed: an unreadable app list isn't a clean simulator.
  if apps=$(xcrun simctl spawn "$SIM" launchctl list 2>/dev/null); then
    others=$(grep -o 'UIKitApplication:[^[]*' <<<"$apps" | cut -d: -f2 \
      | grep -v -x "$BUNDLE" | grep -v -E "$BACKGROUND_APPS" | sort -u | tr '\n' ' ')
    [ -z "$others" ] || fail "other apps running on the simulator: ${others% }. Why: driving isotes takes over a screen someone may be using. Fix: ask the user before closing them."
  else
    fail "couldn't list the simulator's running apps (launchctl via simctl failed). Fix: rerun; if it persists, Launch step 1."
  fi
fi

# The dev build loads its JS from :8081, so every listener there must be this checkout's Metro.
repo=$(cd "$(dirname "$0")/../../../.." && pwd)
pids=$(lsof -nP -iTCP:8081 -sTCP:LISTEN -t 2>/dev/null | sort -u)
if [ -z "$pids" ]; then
  fail "nothing listens on :8081, so isotes' Metro isn't running. Fix: Launch step 3."
else
  for pid in $pids; do
    cmd=$(ps -o command= -p "$pid")
    [[ "$cmd" == "node $repo/node_modules/"* ]] \
      || fail ":8081 is held by another process (pid $pid: ${cmd:0:80}). Why: the isotes build would load that bundle. Fix: ask the user before stopping it."
  done
  [ "$(curl -s -m 3 localhost:8081/status)" = "packager-status:running" ] \
    || fail ":8081 doesn't answer packager-status:running (Metro still starting, hung, or not Metro). Fix: wait and rerun, or ask the user."
fi

[ "$problems" -eq 0 ] && echo "doctor: ok" || exit 1
