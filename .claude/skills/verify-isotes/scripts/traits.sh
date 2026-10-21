#!/usr/bin/env bash
# Accessibility traits of the elements whose label matches a regex, read with idb.
# Usage: traits.sh "<label regex>"  → one line per match: label | testID | traits
set -euo pipefail
UDID=F074204A-8DED-491A-9D45-3C6344EECCEB
[ $# -eq 1 ] || { echo 'usage: traits.sh "<label regex>"' >&2; exit 2; }
command -v idb >/dev/null || { echo "traits: idb isn't installed (brew install facebook/fb/idb)" >&2; exit 1; }

# idb leaves a companion daemon running; stop it only when this call started it.
if pgrep -f "idb_companion --udid $UDID" >/dev/null; then started=0; else started=1; fi
out=$(idb ui describe-all --udid "$UDID" --reason "verify-isotes traits")
if [ "$started" = 1 ]; then idb kill >/dev/null 2>&1 || true; fi

# idb tags nearly every element "Scrollable", even ones Inspector shows with no traits.
jq -r --arg re "$1" '.[] | select((.AXLabel // "") | test($re))
  | [.AXLabel, (.AXUniqueId // "-"), ((.traits - ["Scrollable"]) | join(", ") | if . == "" then "(none)" else . end)]
  | join(" | ")' <<<"$out"
