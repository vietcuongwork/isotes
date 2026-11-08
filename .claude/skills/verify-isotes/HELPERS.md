# Verify isotes: helpers

Every script's arguments and output. "Above" and section names (Doctor, Drive, Cleanup) refer to `SKILL.md`.

- `scripts/doctor.sh` — Doctor, above.
- `scripts/flow.sh <flow.yaml> [options]` — Whole flow, above. Retries once, after `simctl launch`, when a failed run started with another app in front (the runner log's first `Detected running apps`).
- `scripts/db.sh "<sql>"` — one read-only `sqlite3` query on `isotes.db`; looks the container up on every call (its folder changes per install). Newest golden-path trip's splits:

  ```bash
  .claude/skills/verify-isotes/scripts/db.sh "SELECT m.name, s.individual_amount FROM expense_splits s JOIN expenses e ON e.id = s.expense_id JOIN members m ON m.id = s.member_id WHERE e.trip_id = (SELECT id FROM trips WHERE name LIKE 'Flow golden-path %' ORDER BY created_at DESC LIMIT 1) ORDER BY m.name"
  ```

- `scripts/trip.sh "<name prefix>"` — the newest trip whose name starts with the prefix, as `id|name`; exits 1 when none matches. For a flow's `-e` variables (Drive).
- `scripts/traits.sh "<label regex>"` — `label | testID | traits` for each matching element, read with `idb ui describe-all`; drops idb's blanket `Scrollable`. Needs `brew install facebook/fb/idb`.
- `scripts/cleanup.sh [--dry-run]` — deletes flow trips (Cleanup, above). It stops the app, backs up `isotes.db` to `.sim/backup/`, deletes in one transaction, prints before and after counts and a restore command, then runs `cu.sh relaunch`. `--dry-run` prints per-flow counts only.
- Deleting single test rows (a name a check added to a flow trip): no script, since `db.sh` is read-only. Follow `cleanup.sh`'s steps by hand: check that no expense or split references the rows, `xcrun simctl terminate` the app, copy `isotes.db` and its `-wal`/`-shm` to `.sim/backup/`, run `sqlite3 "$db" "BEGIN; DELETE … WHERE id IN (…); SELECT changes(); COMMIT;"` by id, then `cu.sh relaunch`. Quote the backup path in the vault log (why: rows were deleted by hand twice during one feature's checks, with no written steps).
- `scripts/fresh.sh [--shutdown]` — erases the spare simulator `isotes-fresh` (created on first use), installs the working simulator's build and prints its UDID; `--shutdown` stops it. One simulator, so the Claude app asks for device consent only once.
- `scripts/build.sh` — builds and installs the dev build (`expo run:ios`, log in `.sim/build/`), then writes its native fingerprint to `.sim/last-native-build`; `scripts/fingerprint.sh` prints the current one. Doctor fails when they differ.
- `scripts/green.sh mark | check` — fingerprints `src/` (tracked and untracked files) into `.sim/last-green` after a green Demo; `check` prints `same` (exit 0) when nothing in `src/` changed since, so autopilot's Preflight can skip the smoke flow.
- `scripts/pixels.sh columns|luma <file> <x> <y> <w> <h>` — region in points (`PIXELS_SCALE=2` on a 2x device). `columns` prints a screenshot's ink column runs (two amounts with the decimal point in the same run are tabular); `luma` prints a recording's mean luma at each change (a fade's start, end and values).
- `.sim/cu.sh relaunch | mark | show` — the project's launcher and Metro log reader (outside this skill).
- `flows/<flow>.yaml` — one per mapped feature; run with the Drive command.
