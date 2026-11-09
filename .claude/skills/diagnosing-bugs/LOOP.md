# Diagnosing bugs: Phases 1–2

Read when both quick fixes missed, or the symptom wouldn't show. Phase numbers and section names refer to `SKILL.md`; Phases 3–4 are in `HYPOTHESES.md`.

## Phase 1: Build a feedback loop

Reached when both quick fixes failed, or the symptom wouldn't show. **This is the skill.** Everything else is mechanical. If you have a **tight** pass/fail signal for the bug (one that goes red on _this_ bug), you will find the cause; bisection, hypothesis-testing, and instrumentation all just consume it. If you don't have one, no amount of staring at code will save you.

Spend disproportionate effort here. **Be aggressive. Be creative. Refuse to give up.**

### Ways to construct one, in roughly this order

1. **Simulator repro** — for anything touching sheets, keyboard, gestures, focus or layout. Reach the screen with a `verify-isotes` flow and check state from `isotes.db` or the tree; do the triggering gesture or timing through idb (`verify-isotes` `HEADLESS.md`), or computer use for what idb can't do. Follow "Simulator testing" in CLAUDE.md (working simulator, Metro log through `stim logs`, `.sim/cu.sh relaunch|mark|show` for the log slice since the last mark).
2. **Failing Jest test** at whatever seam reaches the bug — for pure logic (helpers, transforms, DB functions).
3. **Replay a captured trace.** Save a real network request / payload / event log to disk; replay it through the code path in isolation.
4. **Throwaway harness.** Spin up a minimal subset of the system (one service, mocked deps) that exercises the bug code path with a single function call.
5. **Property / fuzz loop.** If the bug is "sometimes wrong output", run 1000 random inputs and look for the failure mode.
6. **Bisection harness.** If the bug appeared between two known states (commit, dataset, version), automate "boot at state X, check, repeat" so you can `git bisect run` it.
7. **Differential loop.** Run the same input through old-version vs new-version (or two configs) and diff outputs.
8. **Structured human repro.** Last resort, when you can't drive it yourself: physical-device-only bugs, display unavailable, gestures computer use can't express reliably, or symptoms only a human can judge (jank, flicker, feel). Give the user numbered steps in chat, add `[DEBUG-xxxx]` logs first so Metro captures the ordering, and ask for the observation in a fixed form (e.g. "flash: yes/no", "sheet height after close: …"). Each run is one round; keep the steps identical between rounds.

Build the right feedback loop, and the bug is 90% fixed.

### Tighten the loop

Treat the loop as a product. Once you have _a_ loop, **tighten** it:

- Can I make it faster? (Cache setup, skip unrelated init, narrow the test scope.)
- Can I make the signal sharper? (Assert on the specific symptom, not "didn't crash".)
- Can I make it more deterministic? (Pin time, seed RNG, isolate filesystem, freeze network.)

A 30-second flaky loop is barely better than no loop; a 2-second deterministic one is tight, a debugging superpower.

### Non-deterministic bugs

The goal is not a clean repro but a **higher reproduction rate**. Loop the trigger 100×, parallelise, add stress, narrow timing windows, inject sleeps. A 50%-flake bug is debuggable; 1% is not, so keep raising the rate until it's debuggable.

### When you genuinely cannot build a loop

Stop and say so explicitly. List what you tried. Ask the user for: (a) access to whatever environment reproduces it, (b) a redacted captured artifact (HAR file, log dump, core dump, screen recording with timestamps), or (c) permission to add temporary production instrumentation. Do **not** proceed to hypothesise without a loop.

### Completion criterion: a tight loop that goes red

Phase 1 is done when the loop is **tight** and **red-capable**: you can name **one command** (a script path, a test invocation, a curl) that you have **already run at least once** (show the invocation and its output, redacted), and that is:

- [ ] **Red-capable**: it drives the actual bug code path and asserts the **user's exact symptom**, so it can go red on this bug and green once fixed. Not "runs without erroring"; it must be able to _catch this specific bug_.
- [ ] **Deterministic**: same verdict every run (flaky bugs: a pinned, high reproduction rate, per above).
- [ ] **Fast**: seconds, not minutes.
- [ ] **Agent-driven where possible**: a Jest command or an idb (or computer-use) sequence on the simulator you have already executed once. Fall back to a structured human repro (item 8) only for the cases it lists — never ask the user to reproduce what you can drive.

If you catch yourself reading code to build a third theory before this command exists, **stop: after two missed guesses, another guess is the exact failure this phase prevents.** No red-capable command, no Phase 2.

## Phase 2: Reproduce + minimise

Run the loop. Watch it go red as the bug appears.

Confirm:

- [ ] The loop produces the failure mode the **user** described, not a different failure that happens to be nearby. Wrong bug = wrong fix.
- [ ] The failure is reproducible across multiple runs (or, for non-deterministic bugs, reproducible at a high enough rate to debug against).
- [ ] You have captured the exact symptom (error message, wrong output, slow timing) so later phases can verify the fix actually addresses it.

### Minimise

Once it's red, shrink the repro to the **smallest scenario that still goes red**. Cut inputs, callers, config, data, and steps **one at a time**, re-running the loop after each cut, and keep only what's load-bearing for the failure.

Why bother: a minimal repro shrinks the hypothesis space in Phase 3 (fewer moving parts left to suspect) and becomes the clean regression test in Phase 5.

Done when **every remaining element is load-bearing**: removing any one of them makes the loop go green.

Do not proceed until you have reproduced **and** minimised.
