---
name: diagnosing-bugs
description: Diagnosis loop for any bug in isotes — two quick fixes first, then a tight loop and logs. Small bugs end to end, Big bugs through Phase 4 (the Investigate_ note). Use when the user says "diagnose"/"debug this", or reports something broken/throwing/failing/slow.
---

# Diagnosing Bugs

Two quick fixes first; a discipline for the bugs they don't fix. Skip phases only when explicitly justified.

When exploring the codebase, read `GLOSSARY.md` (if it exists) to get a clear mental model of the relevant modules, and check the ADR index (`documentation/adr/README.md`) for decisions in the area you're touching.

## Redact

This skill has you show commands, outputs and captured artifacts. **Redact every secret first**: write `<REDACTED>` in its place. Build loops against env vars, so the credential stays in the environment rather than in what you show. Captured artifacts carry auth headers: quote only the lines that carry the signal.

If the redacted output is not enough to diagnose the bug, say so and ask the user.

## Phase 0: Quick fixes

Most bugs here are obvious once the symptom is seen. Try up to two fixes before building a loop.

1. **See it once.** Reproduce the symptom one time (simulator steps, a Jest run, or the user's exact steps) and note what you saw: that's the before-picture each fix is checked against. On the simulator, reach the screen with a `verify-isotes` flow, then trigger the symptom with computer use. It needn't be tight or minimised. Can't reproduce it → Phase 1.
2. **Rank 3–5 hypotheses**, each with its prediction (format in Phase 3). Send the list and the fix for the top one in the same message; the user's yes on that file covers both.
3. **Try it.** Write the fix and repeat the same steps. Symptom gone → Phase 5, then Phase 6; the hypothesis whose prediction held is the cause on record.
4. **Still there → revert the fix**, then try hypothesis 2 the same way. Each attempt runs on clean code, so its result belongs to one change.
5. **Both fail → Phase 1.** Carry both hypotheses and what each attempt showed; Phase 3 starts with them ruled out.

Skip straight to Phase 1 when the fix would need 3+ files or a choice between approaches: that's a Big bug from the start. A quick fix that works is a Small bug (`Debug_` note), even in a shared file.

Done when the symptom is gone after one of the two attempts, or both are reverted and their results noted.

## Phase 1: Build a feedback loop

Reached when both quick fixes failed, or the symptom wouldn't show. **This is the skill.** Everything else is mechanical. If you have a **tight** pass/fail signal for the bug (one that goes red on _this_ bug), you will find the cause; bisection, hypothesis-testing, and instrumentation all just consume it. If you don't have one, no amount of staring at code will save you.

Spend disproportionate effort here. **Be aggressive. Be creative. Refuse to give up.**

### Ways to construct one, in roughly this order

1. **Simulator repro** — for anything touching sheets, keyboard, gestures, focus or layout. Reach the screen with a `verify-isotes` flow and check state from `isotes.db` or the tree; do the triggering gesture or timing with computer use. Follow "Simulator testing" in CLAUDE.md (working simulator, Metro log at `.sim/metro.log`, `.sim/cu.sh relaunch|mark|show` for the log slice since the last mark).
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
- [ ] **Agent-driven where possible**: a Jest command or a computer-use sequence on the simulator you have already executed once. Fall back to a structured human repro (item 8) only for the cases it lists — never ask the user to reproduce what you can drive.

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

## Phase 3: Hypothesise

Re-rank with what the loop and the failed quick fixes showed: drop the two ruled out, add new ones, **3–5 ranked hypotheses** in all, before testing any of them. Single-hypothesis generation anchors on the first plausible idea.

Each hypothesis must be **falsifiable**: state the prediction it makes.

> Format: "If <X> is the cause, then <changing Y> will make the bug disappear / <changing Z> will make it worse."

If you cannot state the prediction, the hypothesis is a vibe: discard or sharpen it.

**"Will the touch reach X?"** Trace the whole path from the touch point to the view: every ancestor wrapper's `pointerEvents`, sibling overlays, the sheet's wrapper and backdrop (`src/components/sheet-keyboard/sheet/BottomSheet.tsx`). Don't stop at the first blocker, and state the full path in the hypothesis. (2026-09-30: a removed scrim was claimed to free the Split list, but a second wrapper was `pointerEvents="none"`.)

**Why logs after two misses.** A theory that sounds mechanically sound is still a guess until a log confirms that specific mechanism fires; this codebase has several overlapping candidates (the shared `BottomSheet`, gesture-handler, keyboard handling all touch focus). On 2026-09-28 (numpad caret blur) two theories were each implemented before a log disproved them, and the second had to be reverted out of `BottomSheet.tsx`, which every sheet uses. That's why the quick tries stop at two: past them, every fix waits for a log that confirms its mechanism.

**Show the ranked list to the user and wait for their reply before instrumenting.** They often have domain knowledge that re-ranks instantly, or know hypotheses they've already ruled out.

## Phase 4: Instrument

Each probe must map to a specific prediction from Phase 3. **Change one variable at a time.**

Tool preference:

1. **Debugger / REPL inspection** if the env supports it. One breakpoint beats ten logs.
2. **Targeted logs** at the boundaries that distinguish hypotheses.
3. Never "log everything and grep".

**Tag every debug log** with a unique prefix, e.g. `[DEBUG-a4f2]`. Cleanup at the end becomes a single grep. Untagged logs survive; tagged logs die.

**One format for every probe**: `[TAG] <event> key=value … t=${performance.now().toFixed(1)}`, one line per event, so captures from different rounds line up and sort by `t`.

**Perf branch.** For performance regressions, logs are usually wrong. Instead: establish a baseline measurement (timing harness, `performance.now()`, profiler, query plan), then bisect. Measure first, fix second.

## Big bug hand-off

If the confirmed cause needs a Big-bug fix (shared/foundational file, 3+ files, a choice between approaches — see "Issue Scoping" in CLAUDE.md), STOP here. Write Phases 0–4 into `Investigate_{slug}.md` and continue with the Solution_ → Fix_ chain. Phases 5–6 then run as tasks in the Fix_ note. All notes go to the vault (`/Users/admin/repository/vault/isotes/`):

1. **Clarify** — anything unclear about the issue: ask before proceeding, in `grilling` rounds.
2. **Investigate** → `Investigate_{slug}.md`: issue summary, affected files, execution flow, root cause, impact. STOP and present findings.
3. **Propose Solution** → `Solution_{slug}.md`: design the fix with edge cases and tradeoffs; name the regression-test seam, or record that none exists. Use `codebase-design` / `prototype` when the fix is a design choice. Review with Plannotator (CLAUDE.md "Plannotator Review Gate"), then STOP.
4. **Task Breakdown** → `Fix_{slug}.md`: small, non-breaking, revertible tasks, each naming the file(s) to change. Review with Plannotator, then STOP.
5. **Implement** — one task at a time following the Fix note, per "Smallest steps" (AGENTS.md). Write the regression test with `tdd` where a seam exists. Consult `expo-rn-expert` for API usage when unsure; run `review-two-axis` on non-trivial tasks.

## Phase 5: Fix + regression test

Write the regression test **before the fix**, but only if there is a **correct seam** for it.

A correct seam is one where the test exercises the **real bug pattern** as it occurs at the call site. If the only available seam is too shallow (single-caller test when the bug needs multiple callers, unit test that can't replicate the chain that triggered the bug), a regression test there gives false confidence.

**If no correct seam exists, that itself is the finding.** Note it. The codebase architecture is preventing the bug from being locked down. Flag this for the next phase.

If a correct seam exists:

1. Turn the minimised repro into a failing test at that seam, using the `tdd` skill. From Phase 0 the fix is already in: write the test from the steps that showed the symptom, and see it go red with the fix stashed (`git stash push -- <fix file>`), then green with it back (`git stash pop`).
2. Watch it fail.
3. Propose the fix per "Smallest steps" (AGENTS.md) and write it only after the user approves that file.
4. Watch it pass.
5. Re-run the Phase 1 feedback loop against the original (un-minimised) scenario.

If the loop is still red after the fix, STOP and return to Phase 3. After 2 failed fixes, stop and ask the user (CLAUDE.md "Investigate before fixing").

## Phase 6: Cleanup

Required before declaring done:

- [ ] Original repro no longer reproduces (re-run the Phase 1 loop, or Phase 0's steps)
- [ ] Regression test passes (or absence of seam is documented)
- [ ] All `[DEBUG-...]` instrumentation removed (`grep` the prefix)
- [ ] Throwaway prototypes deleted (or moved to a clearly-marked debug location)
- [ ] The hypothesis that turned out correct is recorded in the `Debug_{slug}.md` note (Small bug) or the `Investigate_`/`Fix_` notes (Big bug), so the next debugger learns
