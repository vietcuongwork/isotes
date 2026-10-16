#!/usr/bin/env bash
# Delete flow trips on the working simulator, keeping the newest per flow and
# the baseline trip. Run from the repo root. Usage: cleanup.sh [--dry-run]
set -euo pipefail

SIM=F074204A-8DED-491A-9D45-3C6344EECCEB
BUNDLE=com.anonymous.isotes
# The baseline Expenses tab and Add expense shots deep-link to this trip
BASELINE=dbcb98c7-4ac2-44c9-a42f-6236590cb3b3
# Flow trips are named "Flow <flow> MM-DD HH:mm"; the stamp is the last 12 characters
FLOW_GLOB="'Flow * [0-1][0-9]-[0-3][0-9] [0-2][0-9]:[0-5][0-9]'"
FLOW_TRIPS="SELECT id, substr(name, 1, length(name) - 12) AS flow,
  row_number() OVER (PARTITION BY substr(name, 1, length(name) - 12) ORDER BY created_at DESC) AS rank
  FROM trips WHERE name GLOB $FLOW_GLOB"
COUNTS="SELECT (SELECT count(*) FROM trips) || ' trips, ' || (SELECT count(*) FROM members) || ' members, '
  || (SELECT count(*) FROM expenses) || ' expenses, ' || (SELECT count(*) FROM expense_splits) || ' splits'"

[ $# -eq 0 ] || [ "$1" = "--dry-run" ] || { echo "usage: cleanup.sh [--dry-run]" >&2; exit 2; }

# The container's folder name changes on every install, so look it up each call.
container=$(xcrun simctl get_app_container "$SIM" "$BUNDLE" data) || {
  echo "cleanup.sh: isotes isn't installed on $SIM" >&2; exit 1; }
db="$container/Documents/SQLite/isotes.db"

sqlite3 -readonly -header -column "$db" "WITH f AS ($FLOW_TRIPS)
  SELECT flow, count(*) AS matched,
    sum(rank = 1 OR id = '$BASELINE') AS kept,
    sum(rank > 1 AND id <> '$BASELINE') AS to_delete
  FROM f GROUP BY flow ORDER BY flow"
sqlite3 -readonly "$db" "SELECT count(*) || ' other trips left alone' FROM trips WHERE name NOT GLOB $FLOW_GLOB"
[ $# -eq 0 ] || exit 0

# The app holds the database open, and its live queries don't see outside writes
xcrun simctl terminate "$SIM" "$BUNDLE" 2>/dev/null || true
backup=".sim/backup/isotes-$(date +%m%d-%H%M%S)"
mkdir -p .sim/backup
for s in "" -wal -shm; do if [ -e "$db$s" ]; then cp "$db$s" "$backup.db$s"; fi; done
echo "before: $(sqlite3 "$db" "$COUNTS")"

# No cascading deletes in the schema, so children go first
sqlite3 "$db" "BEGIN;
  CREATE TEMP TABLE doomed AS WITH f AS ($FLOW_TRIPS)
    SELECT id FROM f WHERE rank > 1 AND id <> '$BASELINE';
  DELETE FROM expense_splits
    WHERE expense_id IN (SELECT id FROM expenses WHERE trip_id IN (SELECT id FROM doomed))
    OR member_id IN (SELECT id FROM members WHERE trip_id IN (SELECT id FROM doomed));
  DELETE FROM expenses WHERE trip_id IN (SELECT id FROM doomed);
  DELETE FROM members WHERE trip_id IN (SELECT id FROM doomed);
  DELETE FROM trips WHERE id IN (SELECT id FROM doomed);
  COMMIT;"
echo "after:  $(sqlite3 "$db" "$COUNTS")"
echo "restore: xcrun simctl terminate $SIM $BUNDLE; rm -f \"$db-wal\" \"$db-shm\"; for s in \"\" -wal -shm; do [ -e \"$backup.db\$s\" ] && cp \"$backup.db\$s\" \"$db\$s\"; done"
.sim/cu.sh relaunch
