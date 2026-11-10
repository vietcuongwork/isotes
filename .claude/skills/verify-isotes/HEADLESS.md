# Verify isotes: drive headless

Read before the first idb or `ios-simulator` MCP call. Section names (Drive, Helpers) refer to `SKILL.md`.

Gestures with tight timing, visual checks and a look at a failed check go through idb: the `ios-simulator` MCP (`ui_tap`, `ui_swipe`, `ui_type`, `ui_describe_all`, `screenshot`) or `idb ui` in the shell. Both work with Device Hub closed, another app in front, or the Mac locked, as long as `caffeinate` runs.

- Pass the `SIM=` value from `scripts/sim-env.sh` as `udid:` on every MCP call.
- After every simulator boot, run `idb connect <that UDID>` before the first idb call. A companion left from the previous boot fails taps with "dtuhidd connection ... has been invalidated".
- If `ui_describe_all` returns only the app node with a 0×0 frame, `traits.sh` prints nothing even though the app renders. A Maestro run clears it, and so does a simulator reboot followed by `idb connect`. A relaunch or a companion restart doesn't. It has appeared after launches without Maestro; the cause is unknown. Taps by coordinates keep working.
- Coordinates are points, screenshot pixels ÷ 3 (1206×2622 px is 402×874 pt). `idb ui tap` takes whole numbers, so round down a center computed from a frame.
- Screenshots come from `xcrun simctl io <that UDID> screenshot --type=jpeg <file>` or the MCP's `screenshot`. `ui_view` reads the size from the tree's root frame, so it fails whenever the tree is empty.
- Send taps, text and swipes one call at a time, never several in one message: parallel calls overlap, iOS drops touches, and it looks like an app bug (why: [[Ref_ported-memories]]). An idb tap takes about 300 ms against Maestro's 1.7 s, so a fast run of taps goes through idb.
- A race shorter than one idb tap (about 300 ms, even with `idb ui multi-tap --pause 0`) won't reproduce with plain taps. Widen it with a temporary `[DEBUG-…]` delay in the code under test, and remove the delay before the checks (why: [[Debug_save-double-tap]]).
- When a Maestro flow ends, the app can drop to the background, and idb taps then land on the home screen. Run `xcrun simctl launch <that UDID> com.anonymous.isotes` first: it brings the running app forward with the same pid and the draft intact.
- A long press is `ui_tap` with `duration`. Pinch, Home, keys and multi-tap exist only in the shell: `idb ui pinch <x> <y> <scale>` (the zoom comes out below the scale asked for), `idb ui button HOME`, `idb ui key`, `idb ui multi-tap`.
- With the hardware keyboard connected, a focused field shows no software keyboard. To change it, use computer use in Device Hub: the Device menu, then Keyboard, then "Simulate Hardware Keyboard". The menu appears about 1 s after the click, so wait before the screenshot. `defaults write com.apple.iphonesimulator ConnectHardwareKeyboard` and a Simulator restart changed nothing. Compare keyboard-up shots only with shots taken under the same setting.
- A card fully behind the on-screen keyboard drops out of `ui_describe_all` and `traits.sh`, while cards below the screen's bottom edge stay listed. Close the keyboard with Return before reading a low card (why: a Trips card looked missing after a search until the keyboard closed).

## Visual evidence

- **No flash while loading** (a state that lasts a few frames): record with `xcrun simctl io booted recordVideo <file>.mp4`, then `scripts/frames.sh <file>.mp4 [from to]` tiles the frames 12 per sheet and prints each cell's frame number and timestamp. Read the key first, then only the sheets around the change.
- **Pixel facts** (glyph widths, a fade's timing, a color run): `scripts/pixels.sh` (Helpers) on a screenshot or recording, so numbers back the verdict instead of a look at the image.
- A flow's own `takeScreenshot` takes a bare name, never a path: Maestro rejects an absolute path. Run the flow with `flow.sh`, which sets `--debug-output` and `--test-output-dir` itself. The image lands at `.sim/maestro/<run>/shots/<time>/<flow name>/takeScreenshot/<name>.png`. Copy it out from there. A raw `maestro test` needs both flags, or its log goes to `~/.maestro/tests`.
