---
name: verify-isotes
description: Drive isotes (the Expo iOS trip-expense app) on the working simulator with named Maestro flows, and prove results from isotes.db and the element tree instead of screenshots. Use for a [Live] Verify, to reach a screen before reproducing a bug, or to check a saved trip, expense or split.
---

# Verify isotes

isotes is a mobile app: one dev build (`com.anonymous.isotes`) on the simulator `F074204A-8DED-491A-9D45-3C6344EECCEB`, loading its JS from Metro on `:8081`. A user touches it only through the screen; its state lives in `isotes.db` (SQLite) inside the app's data container. Run every command from the repo root. Features and how to reach each: `features/README.md`. Reference files next to this one: `HEADLESS.md` (idb gestures and visual evidence), `MAESTRO-MCP.md` (the Maestro MCP server) and `HELPERS.md` (every script's arguments).

## Launch

1. Boot the simulator (no-op when booted): `xcrun simctl bootstatus F074204A-8DED-491A-9D45-3C6344EECCEB -b`
2. Keep the Mac awake for the session, as a background task: `caffeinate -d -t 14400`. It exits after 4 h, so a forgotten one can't leak; start another if the session runs longer.
3. Metro, only if nothing listens on 8081 (`lsof -nP -iTCP:8081 -sTCP:LISTEN`), as a background task: `tail -f /dev/null | script -qF .sim/metro.log pnpm start` (add `--clear` after a package install). Ready when `curl -s localhost:8081/status` prints `packager-status:running`.
4. Relaunch the app and mark the log: `.sim/cu.sh relaunch` → `ready (~Ns)`. It refuses on a shared simulator and says what to do.

Teardown is under Cleanup.

## Doctor

Run before driving, and whenever anything looks off: `.claude/skills/verify-isotes/scripts/doctor.sh` → `doctor: ok`. It's read-only and safe in any session: it makes no Maestro device call (each one starts a driver). It exits 1 with a reason and a fix when Maestro isn't 2.11.0, idb isn't installed, the simulator isn't booted, isotes isn't installed, another app is open on the simulator, nothing listens on 8081, any listener there isn't this checkout's Metro, 8081 doesn't answer `packager-status:running`, or the native fingerprint differs from the installed build's (`.sim/last-native-build`). It also lists, without failing, background shells a Claude session left running over 12 hours (the live Metro's excepted). Never stop what it names without asking the user.

## Drive

Maestro **2.11.0** (`maestro --version`); an upgrade is its own task. `MAESTRO_CLI_NO_ANALYTICS=1` stays set (`~/.zshenv`); never pass `--analyze`.

**One driver per session.** A session drives with the MCP server *or* the CLI, never both. The CLI and the MCP server each install their own XCTest driver and only one survives: a CLI run kills the MCP server's driver until a new session (the desktop app can't reconnect MCP). Need both → MCP steps first, then CLI.

**Whole flow (CLI):** output goes to a fresh `.sim/maestro/<flow>-<time>/` (git-ignored), nothing to `~/.maestro/tests/`; a flow's screenshots land in its `shots/` folder. Maestro options such as `-e` go after the flow file. `flow.sh` exits 2 and names the variable when the flow uses `${NAME}` without `-e NAME=<value>`.

```bash
.claude/skills/verify-isotes/scripts/flow.sh .claude/skills/verify-isotes/flows/golden-path.yaml
```

**Tree read (CLI):** `hierarchy` has no output flag and logs to `~/.maestro/tests/`, so its Java home moves to `.sim/maestro/home/` (keep that folder). Never read the raw tree (~150 KB); filter to labels and grep one value. Run it after a flow: the session's first CLI call starts Maestro's driver, which brings the iOS home screen forward, so a tree read first reads the home screen.

```bash
JAVA_TOOL_OPTIONS=-Duser.home=$PWD/.sim/maestro/home maestro --device F074204A-8DED-491A-9D45-3C6344EECCEB hierarchy 2>/dev/null | jq -r '.. | .attributes? // empty | [.accessibilityText, .text, ."resource-id"] | map(select(. != null and . != "")) | unique | join(" | ") | select(. != "")' | awk '!seen[$0]++' | grep -F 'you lent'
```

**Step by step (MCP server `maestro`):** read `MAESTRO-MCP.md` before the first call.

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

**Flows that open an existing trip** take its name and id as `-e` variables (`${A}`, `${A_ID}` in the YAML), looked up at run time with `trip.sh`. `cleanup.sh` keeps only the newest trip per flow, so a trip written into the YAML is gone by the next session. A screenshot baseline must outlive that cleanup, so its flow opens the trip the script protects (`BASELINE`, named `Flow golden-path 10-15 19:44`) or a trip named outside the `Flow …` pattern. A baseline taken on an ordinary flow trip lost that trip, and its title then differed behind every sheet.

```bash
IFS='|' read -r A_ID A < <(.claude/skills/verify-isotes/scripts/trip.sh "Flow paid-by-split")
.claude/skills/verify-isotes/scripts/flow.sh <flow>.yaml -e A="$A" -e A_ID="$A_ID"
```

**Selectors:** accessibility label, `testID` (`id:`) or visible text, never `point:`. Stable handles: `Add expense` (the `+`), `id: number-pad`, `id: sheet-close`, `Expenses, tab, 1 of 3` (`selected: true` when open). Trip cards' labels are compound (`<name>, +₫9,666, 5 expenses · …`): match them by regex. Per-feature selectors and gotchas: `features/`.

**Keyboard:** close it with `pressKey: Enter` (Return, or Search on a search field). `hideKeyboard` taps or swipes outside the keyboard, so it can land on a field, fail with nothing to swipe, or blur a search field, which hides its `Clear text` button.

**Writes:** a flow that saves anything creates its own trip, `Flow <flow> <MM-DD HH:mm>`, and never edits or deletes other trips. Flows never delete. A trip seeded by hand follows the same pattern (`Flow <purpose> <MM-DD HH:mm>`); without the stamp, `cleanup.sh` leaves it behind.

**Don't save files while a flow runs:** Metro's fast refresh reloads the app mid-flow (a blue "Refreshing…" banner), and the next step fails on a screen that isn't there.

## Drive headless

Gestures with tight timing, visual checks and a look at a failed check go through idb. Read `HEADLESS.md` before the first idb or `ios-simulator` MCP call: it has the `idb connect` step, the coordinate scale, and why taps go one call at a time.

## Evidence

Prove the real user path: the action and the state it leaves, not just the last screen.

- **Database** (side effects): `scripts/db.sh` (Helpers). Two runs in one minute share a trip name, so pick the newest by `created_at`.
- **Screen:** one filtered tree value (Drive), or the flow's own `assertVisible` lines in its run output. Assert a value only the item under test has, such as its trip name; a total that two trips share doesn't prove which one opened.
- **Roles and traits** (button, header, selected): Maestro's iOS tree has labels and bounds only, so read them with `scripts/traits.sh "<label regex>"` (idb), after a flow has reached the screen. Quote its line, e.g. `Expenses, tab, 1 of 3 | - | Selected`. An empty trait list prints `(none)`. Two elements with one label (the drawer's X and scrim) differ by testID. Accessibility Inspector is only for a trait idb doesn't report.
- **Focus:** Maestro's `focused` attribute is always `false` on iOS, even mid-typing. Read focus from `traits.sh`: a focused field lists `IsEditing` (`Search trips | - | TextEntry, IsEditing, TextOperationsAvailable`).
- **Logs:** `.sim/cu.sh mark` before, `.sim/cu.sh show` after → list new WARN/ERROR lines, or "cu.sh → none".
- **Timing and pixels** (a flash while loading, glyph widths, a fade, a flow's own `takeScreenshot`): `HEADLESS.md` "Visual evidence".
- **Screenshots** only for a visual check (layout, color, spacing) or a failed check. A failed flow leaves exactly one in its run folder (`find .sim/maestro/<run> -name '*.png'`); read that one, nothing else.

Quote the values (rows, tree lines, log result) in the task's log in the vault's implementation note. That note is where evidence lives; run folders are scratch.

## Cleanup

- Once findings are quoted in the vault, delete that run's folder: `rm -rf .sim/maestro/<flow>-<time>`. Keep `.sim/maestro/home/`.
- Flow runs and tree reads write nothing to `~/.maestro/tests/`, but each MCP driver start (an `xctest_runner_*.log`) and each `maestro list-devices` does: delete the `~/.maestro/tests/<time>/` folders this session created (`ls -lt ~/.maestro/tests | head`).
- Stop only what this session started, by its background task or PID: `caffeinate`, and Metro if Launch started it. Never kill by process name; never stop another project's Metro.
- At the end of a test session, once the evidence is quoted in the vault, run `scripts/cleanup.sh`: it deletes flow trips, keeping the newest per flow and the baseline trip. The user's own trips never match the flow-name pattern. `/autopilot` runs it at every Demo that ran flows; a companion-mode session runs it in the feature's acceptance task.

## Helpers

Every script's arguments and output: `HELPERS.md`. The ones used above (`flow.sh`, `db.sh`, `trip.sh`, `traits.sh`, `cleanup.sh`) show their call inline.
