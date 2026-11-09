#!/usr/bin/env bash
# The simulator and Metro of this checkout, read from Stim.
# Source it to set SIM, SIM_STATE, METRO_PORT, METRO_RUNNING, SUPERVISOR_STARTED and SIM_LOG_DIR, or run it to print them.
# It stops with a message for a folder Stim doesn't know or a simulator that isn't booted:
# `simctl get_app_container` fails on a shut-down simulator, which reads as "not installed".

root=$(git rev-parse --show-toplevel 2>/dev/null) || {
  echo "sim-env: $PWD isn't inside a git checkout" >&2; exit 1; }
status=$(stim status --json 2>/dev/null) || {
  echo "sim-env: 'stim status --json' failed. Is Stim installed?" >&2; exit 1; }

# status lists every workspace on the machine. read collapses empty tab fields, so a missing value becomes "-".
# tostring keeps metro.running: jq's // treats false as missing.
row=$(jq -r --arg root "$root" '.environments[] | select(.path == $root)
  | [.ios.udid, .ios.state, .metro.port, .logs.dir, (.metro.running | tostring), .supervisor.startedAt, .ios.name]
  | map(. // "-") | @tsv' <<<"$status") || {
  echo "sim-env: couldn't parse 'stim status --json'" >&2; exit 1; }

[ -n "$row" ] || { echo "sim-env: Stim has no workspace for $root. Run 'stim ios' there first." >&2; exit 1; }
IFS=$'\t' read -r SIM SIM_STATE METRO_PORT SIM_LOG_DIR METRO_RUNNING SUPERVISOR_STARTED sim_name <<<"$row"

[ "$SIM" != "-" ] || { echo "sim-env: the workspace $root has no simulator. Run 'stim ios' there first." >&2; exit 1; }
[ "$SIM_STATE" = "Booted" ] || {
  echo "sim-env: $sim_name ($SIM) is $SIM_STATE, not Booted (Metro port $METRO_PORT, logs $SIM_LOG_DIR). Run 'stim ios' in $root." >&2; exit 1; }

if [ "${BASH_SOURCE[0]}" = "$0" ]; then
  printf 'SIM=%s\nSIM_STATE=%s\nMETRO_PORT=%s\nMETRO_RUNNING=%s\nSUPERVISOR_STARTED=%s\nSIM_LOG_DIR=%s\n' \
    "$SIM" "$SIM_STATE" "$METRO_PORT" "$METRO_RUNNING" "$SUPERVISOR_STARTED" "$SIM_LOG_DIR"
fi
