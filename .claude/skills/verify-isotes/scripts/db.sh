#!/usr/bin/env bash
# Read-only query against isotes.db on the working simulator.
# Usage: db.sh "<sql>"
set -euo pipefail

SIM=F074204A-8DED-491A-9D45-3C6344EECCEB
BUNDLE=com.anonymous.isotes

[ $# -eq 1 ] || { echo "usage: db.sh \"<sql>\"" >&2; exit 2; }

# The container's folder name changes on every install, so look it up each call.
container=$(xcrun simctl get_app_container "$SIM" "$BUNDLE" data) || {
  echo "db.sh: isotes isn't installed on $SIM" >&2; exit 1; }

exec sqlite3 -readonly "$container/Documents/SQLite/isotes.db" "$1"
