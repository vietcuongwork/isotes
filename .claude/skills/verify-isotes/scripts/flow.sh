#!/usr/bin/env bash
# Runs one Maestro flow on the working simulator, into its own .sim/maestro/<flow>-<time>/.
# When the XCTest runner starts with another app in front (usually the home screen), a flow
# that doesn't launch isotes itself fails; that run gets one retry after isotes is brought back.
# Usage: flow.sh <flow.yaml> [maestro test options, e.g. -e A="$A"]
set -uo pipefail
. "$(dirname "$0")/sim-env.sh"
cd "$(git rev-parse --show-toplevel)" || exit 2

# Run folders are scratch (evidence is quoted in the vault), so a week is kept.
# home/ is Maestro's Java home for tree reads and stays
find .sim/maestro -mindepth 1 -maxdepth 1 -type d -mtime +7 ! -name home -exec rm -rf {} + 2>/dev/null

BUNDLE=com.anonymous.isotes

[ $# -ge 1 ] || { echo 'usage: flow.sh <flow.yaml> [maestro test options]' >&2; exit 2; }
flow=$1
shift

# A variable left out of -e reaches the app as the text "undefined"; stop before the run.
for name in $(grep -oE '\$\{[A-Za-z_][A-Za-z0-9_]*\}' "$flow" | tr -d '${}' | sort -u); do
  case " $* " in
    *" $name="*) ;;
    *) echo "flow.sh: $flow uses \${$name}; pass -e $name=<value>" >&2; exit 2 ;;
  esac
done

# One last line a `tail -1` can trust: a run's output once ended in a banner box that hid its result (2026-11-23).
trap 'rc=$?; echo "flow.sh: $([ "$rc" = 0 ] && echo PASS || echo "FAIL ($rc)") $(basename "$flow" .yaml)${out:+ → $out}"' EXIT

run() {
  out=.sim/maestro/$(basename "$flow" .yaml)-$(date +%m%d-%H%M%S)
  maestro test --device "$SIM" --debug-output "$out" --test-output-dir "$out/shots" "$@" "$flow" || return
  # A pass needs no simulator system log, and it's ~10.7 MB of a run's ~11 MB;
  # a failed run keeps it. why: .sim/maestro reached 6.1 GB in 566 runs (2026-11-11)
  find "$out" -name device-simulator.log -delete
}

run "$@" && exit 0
# The runner logs the app in front as it starts. why: [[Fix_textinput-recycled-placeholder]] Task 2
front=$(grep -ohm1 'Detected running apps: .*' "$out"/.maestro/tests/*/xctest_runner_*.log 2>/dev/null)
case $front in *"$BUNDLE"* | '') exit 1 ;; esac
echo "flow.sh: the run started with ${front#Detected running apps: } in front, not isotes; bringing isotes back and retrying once"
# simctl launch on a running app brings it forward without a restart (same pid)
xcrun simctl launch "$SIM" "$BUNDLE" >/dev/null || exit 1
run "$@"
