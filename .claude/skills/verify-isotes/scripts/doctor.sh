#!/usr/bin/env bash
# Read-only: is the working simulator worth driving? Prints each problem and exits 1; "doctor: ok" and 0 when clean.
# No Maestro device call: each one starts an XCTest driver, which kills the MCP server's.
# Usage: doctor.sh
set -uo pipefail

repo=$(cd "$(dirname "$0")/../../../.." && pwd)
cd "$repo" || exit 1
SCRIPTS=.claude/skills/verify-isotes/scripts
BUNDLE=com.anonymous.isotes
MAESTRO_VERSION=2.11.0
STIM_VERSION=1.40.0
# 12 h, longer than any test session
LEFTOVER_SECS=43200
# System apps seen running in the background on an idle simulator; anything else is someone's foreground app.
BACKGROUND_APPS='^(com\.apple\.Spotlight|com\.apple\.chrono\..*|com\.apple\.mobilecal)$'

problems=0
fail() { echo "!! $1"; problems=$((problems + 1)); }

version=$(maestro --version 2>/dev/null | tail -1)
[ "$version" = "$MAESTRO_VERSION" ] || fail "maestro is '${version:-missing}', want $MAESTRO_VERSION. Fix: upgrading is its own task; ask the user."
stim_version=$(stim --version 2>/dev/null | tail -1)
[ "$stim_version" = "$STIM_VERSION" ] || fail "stim is '${stim_version:-missing}', want $STIM_VERSION. Fix: upgrading is its own task; ask the user."
# traits.sh reads header/selected/button through idb; Maestro's tree has no traits
command -v idb >/dev/null || fail "idb isn't installed, so traits.sh can't read traits. Fix: ask the user before brew install facebook/fb/idb (its tap formulae need brew trust)."

# sim-env.sh stops at its first problem, so it's tried in a subshell: doctor reports every problem.
if ! msg=$("$SCRIPTS/sim-env.sh" 2>&1 >/dev/null); then
  fail "${msg#sim-env: }"
else
  . "$SCRIPTS/sim-env.sh"
  xcrun simctl get_app_container "$SIM" "$BUNDLE" >/dev/null 2>&1 \
    || fail "isotes isn't installed on $SIM. Fix: scripts/build.sh as a background task, or ask the user."

  # Fail closed: an unreadable app list isn't a clean simulator.
  if apps=$(xcrun simctl spawn "$SIM" launchctl list 2>/dev/null); then
    others=$(grep -o 'UIKitApplication:[^[]*' <<<"$apps" | cut -d: -f2 \
      | grep -v -x "$BUNDLE" | grep -v -E "$BACKGROUND_APPS" | sort -u | tr '\n' ' ')
    [ -z "$others" ] || fail "other apps running on the simulator: ${others% }. Why: driving isotes takes over a screen someone may be using. Fix: ask the user before closing them."
  else
    fail "couldn't list the simulator's running apps (launchctl via simctl failed). Fix: rerun; if it persists, run 'stim ios'."
  fi

  # The app loads its JS from this workspace's Metro, which Stim supervises.
  if [ "$METRO_RUNNING" != "true" ]; then
    fail "Stim's Metro for this checkout isn't running. Why: the app falls back to :8081 and loads whatever serves there. Fix: run 'stim start'."
  else
    # A Metro started before the last pnpm install serves a stale bundle (pnpm rewrites node_modules/.modules.yaml on install)
    started=$(date -j -u -f '%Y-%m-%dT%H:%M:%S' "${SUPERVISOR_STARTED%%.*}" +%s 2>/dev/null)
    installed=$(stat -f %m "$repo/node_modules/.modules.yaml" 2>/dev/null)
    [ -z "$started" ] || [ -z "$installed" ] || [ "$started" -ge "$installed" ] \
      || fail "Stim's Metro (started $SUPERVISOR_STARTED) started before the last pnpm install, so it may serve a stale bundle that ignores new code. Fix: ask the user, then run 'stim start --reset-cache'."
    [ "$(curl -s -m 3 "localhost:$METRO_PORT/status")" = "packager-status:running" ] \
      || fail ":$METRO_PORT doesn't answer packager-status:running (Metro still starting, hung, or not Metro). Fix: wait and rerun, or ask the user."
  fi
fi

# A native change with no rebuild leaves the installed app on old native code.
# build.sh records the fingerprint of the build it installs.
built=$(cat "$repo/.sim/last-native-build" 2>/dev/null)
now=$(cd "$repo" && .claude/skills/verify-isotes/scripts/fingerprint.sh 2>/dev/null)
if [ -z "$now" ]; then
  fail "couldn't compute the native fingerprint. Fix: run scripts/fingerprint.sh by hand to read its error."
elif [ -z "$built" ]; then
  fail "no record of the installed build's native fingerprint (.sim/last-native-build). Fix: scripts/build.sh writes it on its next build."
elif [ "$now" != "$built" ]; then
  fail "native inputs changed since the installed build (fingerprint ${built:0:8}, now ${now:0:8}). Why: a native module or the app config changed, and the app still runs the old native code. Fix: scripts/build.sh as a background task."
fi

# Leftovers: listed, never counted as a problem. A background shell from any Claude
# session runs until stopped, however long the session sits idle.
ps -eo pid=,etime=,command= | grep -F shell-snapshots | grep -v grep \
  | while read -r pid etime cmd; do
      secs=$(awk -F'[-:]' '{ if (NF == 4) print $1*86400 + $2*3600 + $3*60 + $4; else if (NF == 3) print $1*3600 + $2*60 + $3; else print $1*60 + $2 }' <<<"$etime")
      [ "$secs" -ge "$LEFTOVER_SECS" ] || continue
      what=$(sed -E "s/.*eval '?//; s/'? < \/dev\/null.*//" <<<"$cmd")
      echo "-- leftover from a Claude session, up $etime: pid $pid, ${what:0:70}. Fix: ask the user before stopping it."
    done

[ "$problems" -eq 0 ] && echo "doctor: ok" || exit 1
