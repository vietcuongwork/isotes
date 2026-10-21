---
name: verify-isotes
description: Drive isotes (the Expo iOS trip-expense app) on the working simulator with named Maestro flows, and prove results from isotes.db and the element tree instead of screenshots. Use for a [Live] Verify, to reach a screen before reproducing a bug, or to check a saved trip, expense or split.
---

# Verify isotes

isotes is a mobile app: one dev build (`com.anonymous.isotes`) on the simulator `F074204A-8DED-491A-9D45-3C6344EECCEB`, loading its JS from Metro on `:8081`. A user touches it only through the screen; its state lives in `isotes.db` (SQLite) inside the app's data container. Run every command from the repo root. Features and how to reach each: `features/README.md`.

## Launch

1. Boot the simulator (no-op when booted): `xcrun simctl bootstatus F074204A-8DED-491A-9D45-3C6344EECCEB -b`
2. Keep the Mac awake for the session, as a background task: `caffeinate -d -t 14400`. It exits after 4 h, so a forgotten one can't leak; start another if the session runs longer.
3. Metro, only if nothing listens on 8081 (`lsof -nP -iTCP:8081 -sTCP:LISTEN`), as a background task: `tail -f /dev/null | script -qF .sim/metro.log pnpm start` (add `--clear` after a package install). Ready when `curl -s localhost:8081/status` prints `packager-status:running`.
4. Relaunch the app and mark the log: `.sim/cu.sh relaunch` → `ready (~Ns)`. It refuses on a shared simulator and says what to do.

Teardown is under Cleanup.

## Doctor

Run before driving, and whenever anything looks off: `.claude/skills/verify-isotes/scripts/doctor.sh` → `doctor: ok`. It's read-only and safe in any session: it makes no Maestro device call (each one starts a driver). It exits 1 with a reason and a fix when Maestro isn't 2.11.0, the simulator isn't booted, isotes isn't installed, another app is open on the simulator, nothing listens on 8081, any listener there isn't this checkout's Metro, or 8081 doesn't answer `packager-status:running`. It also lists, without failing, background shells a Claude session left running over 12 hours (the live Metro's excepted). Never stop what it names without asking the user.

In an MCP session, also call MCP `list_devices`: `F074204A-…` should be `connected: true`. That only means booted; it answers even when the MCP driver is dead. A dead driver shows on the first `run` or `inspect_screen` as "Device became unreachable" → use the CLI for the rest of the session.

## Drive

Maestro **2.11.0** (`maestro --version`); an upgrade is its own task. `MAESTRO_CLI_NO_ANALYTICS=1` stays set (`~/.zshenv`); never pass `--analyze`.

**One driver per session.** A session drives with the MCP server *or* the CLI, never both. The CLI and the MCP server each install their own XCTest driver and only one survives: a CLI run kills the MCP server's driver until a new session (the desktop app can't reconnect MCP). Need both → MCP steps first, then CLI.

**Whole flow (CLI):** output goes to a fresh `.sim/maestro/<flow>-<time>/` (git-ignored), nothing to `~/.maestro/tests/`. For another flow, replace both `golden-path`s with its file name.

```bash
maestro test --device F074204A-8DED-491A-9D45-3C6344EECCEB --debug-output .sim/maestro/golden-path-$(date +%m%d-%H%M%S) .claude/skills/verify-isotes/flows/golden-path.yaml
```

**Tree read (CLI):** `hierarchy` has no output flag and logs to `~/.maestro/tests/`, so its Java home moves to `.sim/maestro/home/` (keep that folder). Never read the raw tree (~150 KB); filter to labels and grep one value. Run it after a flow: the session's first CLI call starts Maestro's driver, which brings the iOS home screen forward, so a tree read first reads the home screen.

```bash
JAVA_TOOL_OPTIONS=-Duser.home=$PWD/.sim/maestro/home maestro --device F074204A-8DED-491A-9D45-3C6344EECCEB hierarchy 2>/dev/null | jq -r '.. | .attributes? // empty | [.accessibilityText, .text, ."resource-id"] | map(select(. != null and . != "")) | unique | join(" | ") | select(. != "")' | awk '!seen[$0]++' | grep -F 'you lent'
```

**Step by step (MCP server `maestro`):** `list_devices` → `run` with inline YAML (`appId: com.anonymous.isotes`, then `---` and commands such as `tapOn`, `openLink`, `assertVisible`) on device `F074204A-8DED-491A-9D45-3C6344EECCEB`. To check one value, `assertVisible` it in a `run`; `inspect_screen` returns the whole unfiltered tree (~7 KB on a trip's expense tab), so use it only to find selectors. `cheat_sheet` is ~20 KB: only when unsure of a command's arguments. Never use the AI commands (`assertWithAI`, `assertNoDefectsWithAI`, `extractTextWithAI`): they upload screenshots. When the server misbehaves, fall back to the CLI above and say so; don't retry the same call.

| Tool | Use | Prompts? |
|---|---|---|
| `list_devices`, `run`, `inspect_screen`, `cheat_sheet` | as above | no (allow-listed) |
| `take_screenshot` | visual checks only (Evidence) | yes, on purpose |
| `open_maestro_viewer` | not used | yes |
| `list_cloud_devices`, `run_on_cloud`, `get_cloud_run_status`, `describe_cloud_run` | not used: `run_on_cloud` uploads the app and flows | yes |

**Reach a trip with no taps:** links work on a cold start only, so stop the app first. Text selectors are full-string regex: escape `( ) + . ?` in the trip name.

```yaml
appId: com.anonymous.isotes
---
- stopApp
- openLink: isotes:///<tripId>/expense
- extendedWaitUntil:
    visible: "<trip name>"
    timeout: 15000
```

**Flows that open an existing trip** take its name and id as `-e` variables (`${A}`, `${A_ID}` in the YAML), looked up at run time with `trip.sh`. `cleanup.sh` keeps only the newest trip per flow, so a trip written into the YAML is gone by the next session.

```bash
IFS='|' read -r A_ID A < <(.claude/skills/verify-isotes/scripts/trip.sh "Flow paid-by-split")
maestro test --device F074204A-8DED-491A-9D45-3C6344EECCEB --debug-output .sim/maestro/switch-$(date +%m%d-%H%M%S) -e A="$A" -e A_ID="$A_ID" <flow>.yaml
```

**Selectors:** accessibility label, `testID` (`id:`) or visible text, never `point:`. Stable handles: `Add expense` (the `+`), `id: number-pad`, `id: sheet-close`, `Expenses, tab, 1 of 3` (`selected: true` when open). Trip cards' labels are compound (`<name>, +₫9,666, 5 expenses · …`): match them by regex. Per-feature selectors and gotchas: `features/`.

**Keyboard:** close it with `pressKey: Enter` (Return, or Search on a search field). `hideKeyboard` taps or swipes outside the keyboard, so it can land on a field, fail with nothing to swipe, or blur a search field, which hides its `Clear text` button.

**Writes:** a flow that saves anything creates its own trip, `Flow <flow> <MM-DD HH:mm>`, and never edits or deletes other trips. Flows never delete. A trip seeded by hand follows the same pattern (`Flow <purpose> <MM-DD HH:mm>`); without the stamp, `cleanup.sh` leaves it behind.

**Don't save files while a flow runs:** Metro's fast refresh reloads the app mid-flow (a blue "Refreshing…" banner), and the next step fails on a screen that isn't there.

## Evidence

Prove the real user path: the action and the state it leaves, not just the last screen.

- **Database** (side effects): `scripts/db.sh` (Helpers). Two runs in one minute share a trip name, so pick the newest by `created_at`.
- **Screen:** one filtered tree value (Drive), or the flow's own `assertVisible` lines in its run output. Assert a value only the item under test has, such as its trip name; a total that two trips share doesn't prove which one opened.
- **Roles and traits** (button, header, selected): Maestro's iOS tree has labels and bounds only, so check these in Accessibility Inspector, never Maestro. The user picks the simulator in its device dropdown (computer use can't open it); open Device Hub so the simulator has a window, hover the element with point-to-inspect on, then step with Inspector's Back / Forward buttons. The Element line reads `<label>, Button`.
- **Logs:** `.sim/cu.sh mark` before, `.sim/cu.sh show` after → list new WARN/ERROR lines, or "cu.sh → none".
- **No flash while loading** (a state that lasts a few frames): record with `xcrun simctl io booted recordVideo <file>.mp4`, then `scripts/frames.sh <file>.mp4 [from to]` tiles the frames 12 per sheet and prints each cell's frame number and timestamp. Read the key first, then only the sheets around the change.
- **Pixel facts** (glyph widths, a fade's timing, a color run): `scripts/pixels.sh` (Helpers) on a screenshot or recording, so numbers back the verdict instead of a look at the image.
- **Screenshots** only for a visual check (layout, color, spacing) or a failed check. A failed flow leaves exactly one in its run folder (`find .sim/maestro/<run> -name '*.png'`); read that one, nothing else.
  - A flow's own `takeScreenshot` takes a bare name, never a path: Maestro rejects an absolute path. Run it with both `--debug-output .sim/maestro/<run>` and `--test-output-dir .sim/maestro/<run>/shots`: without `--debug-output`, Maestro writes its log to `~/.maestro/tests`. The image lands at `shots/<time>/<flow name>/takeScreenshot/<name>.png`. Copy it out from there.

Quote the values (rows, tree lines, log result) in the task's log in the vault's implementation note. That note is where evidence lives; run folders are scratch.

## Cleanup

- Once findings are quoted in the vault, delete that run's folder: `rm -rf .sim/maestro/<flow>-<time>`. Keep `.sim/maestro/home/`.
- Flow runs and tree reads write nothing to `~/.maestro/tests/`, but each MCP driver start (an `xctest_runner_*.log`) and each `maestro list-devices` does: delete the `~/.maestro/tests/<time>/` folders this session created (`ls -lt ~/.maestro/tests | head`).
- Stop only what this session started, by its background task or PID: `caffeinate`, and Metro if Launch started it. Never kill by process name; never stop another project's Metro.
- At the end of a test session, once the evidence is quoted in the vault, run `scripts/cleanup.sh`: it deletes flow trips, keeping the newest per flow and the baseline trip. The user's own trips never match the flow-name pattern.

## Helpers

- `scripts/doctor.sh` — Doctor, above.
- `scripts/db.sh "<sql>"` — one read-only `sqlite3` query on `isotes.db`; looks the container up on every call (its folder changes per install). Newest golden-path trip's splits:

  ```bash
  .claude/skills/verify-isotes/scripts/db.sh "SELECT m.name, s.individual_amount FROM expense_splits s JOIN expenses e ON e.id = s.expense_id JOIN members m ON m.id = s.member_id WHERE e.trip_id = (SELECT id FROM trips WHERE name LIKE 'Flow golden-path %' ORDER BY created_at DESC LIMIT 1) ORDER BY m.name"
  ```

- `scripts/trip.sh "<name prefix>"` — the newest trip whose name starts with the prefix, as `id|name`; exits 1 when none matches. For a flow's `-e` variables (Drive).
- `scripts/cleanup.sh [--dry-run]` — deletes flow trips (Cleanup, above). It stops the app, backs up `isotes.db` to `.sim/backup/`, deletes in one transaction, prints before and after counts and a restore command, then runs `cu.sh relaunch`. `--dry-run` prints per-flow counts only.
- `scripts/green.sh mark | check` — fingerprints `src/` (tracked and untracked files) into `.sim/last-green` after a green Demo; `check` prints `same` (exit 0) when nothing in `src/` changed since, so autopilot's Preflight can skip the smoke flow.
- `scripts/pixels.sh columns|luma <file> <x> <y> <w> <h>` — region in points (`PIXELS_SCALE=2` on a 2x device). `columns` prints a screenshot's ink column runs (two amounts with the decimal point in the same run are tabular); `luma` prints a recording's mean luma at each change (a fade's start, end and values).
- `.sim/cu.sh relaunch | mark | show` — the project's launcher and Metro log reader (outside this skill).
- `flows/<flow>.yaml` — one per mapped feature; run with the Drive command.
