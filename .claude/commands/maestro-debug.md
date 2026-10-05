---
description: Run a Maestro repro flow for a bug, capture app logs + Maestro output, and report the event order.
argument-hint: "<slug> [--sim working|debug] [--video]"
---

# /maestro-debug

Args: $ARGUMENTS → slug = first arg; flow = `.maestro/debug/<slug>.yaml`

## Constants
- Bundle id `com.anonymous.isotes`
- Working sim: iPhone 17 `F074204A-8DED-491A-9D45-3C6344EECCEB` (default)
- Debug sim: iPhone 17 `C0FFD7ED-DB97-4163-A480-F7DC613E6F45` (`--sim debug`)
- Always target by UDID (two sims share the name "iPhone 17").
- `.maestro/debug/*.yaml` repro flows are throwaway — write them directly, no per-file approval.
  Reusable `.maestro/flows/*` and debug `console.log`s in `src/` still need approval.

## 1. Preflight (report; don't fix silently)
1. Flow file exists? If not, stop and say so.
2. Sim booted? Boot it if not.
3. App installed? `xcrun simctl get_app_container <UDID> com.anonymous.isotes`
4. Build stale? `package.json` / `app.json` / `ios/` / `ios/Podfile.lock`
   newer than the installed `.app` → ASK before `npx expo run:ios --device <UDID>`.
5. Metro listening on 8081? (`curl -s localhost:8081/status`) If not, ask the user to start it.
6. Warn that `launchApp` restarts the app on the target sim (in-memory drafts are lost).

## 2. Run
- `OUT=.maestro/output/<slug>_<YYYY-MM-DD_HHMMSS>`
- Start app-log capture in the background → `$OUT/app.log`:
  `xcrun simctl spawn <UDID> log stream --style compact --level debug --predicate 'subsystem == "com.facebook.react.log"' > "$OUT/app.log"`
  Wait ~1s before running Maestro so `launchApp`'s startup lines aren't missed.
- If `--video`: `xcrun simctl io <UDID> recordVideo --codec=h264 "$OUT/repro.mov"` in the background.
- `MAESTRO_CLI_NO_ANALYTICS=1 maestro test --udid <UDID> --test-output-dir "$OUT" --debug-output "$OUT" --flatten-debug-output .maestro/debug/<slug>.yaml`
- Stop log capture / video (SIGINT) when Maestro exits. Never use `--analyze` (it uploads test output).
- In flows, wait on real text (`extendedWaitUntil`), not `waitForAnimationToEnd` — the splash screen fools it.

## 3. Report
- Pass/fail per step (`commands.json`), then the `app.log` lines in timestamp
  order, then what screenshots/frames show at the key moment.
- Video: extract frames sparsely first (`ffmpeg -i repro.mov -vf fps=2`), denser around the key second.
- If a flow step failed, say whether it's a flow problem (selector/timing)
  or the bug itself — don't guess past what the logs show.
- Bundle build errors (syntax, unresolved module) only appear in the user's Metro terminal — ask for it if the run shows a red screen.
- No fix proposals from this alone (AGENTS.md "Debugging — confirm with logs before fixing").

## 4. Cleanup (after the user confirms findings are in the vault)
- Delete `$OUT`.
