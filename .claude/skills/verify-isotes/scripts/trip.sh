#!/usr/bin/env bash
# Prints the newest trip whose name starts with a prefix, as "id|name", for a flow's -e variables.
# Usage: trip.sh "<name prefix>"   e.g. trip.sh "Flow paid-by-split"
set -euo pipefail

[ $# -eq 1 ] || { echo 'usage: trip.sh "<name prefix>"' >&2; exit 2; }

# instr() = 1 is an exact prefix match: LIKE would treat _ and % in a name as wildcards.
prefix=${1//\'/\'\'}
row=$("$(dirname "$0")/db.sh" "SELECT id || '|' || name FROM trips WHERE instr(name, '$prefix') = 1 ORDER BY created_at DESC LIMIT 1")
[ -n "$row" ] || { echo "trip.sh: no trip whose name starts with '$1'" >&2; exit 1; }
echo "$row"
