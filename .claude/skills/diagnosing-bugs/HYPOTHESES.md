# Diagnosing bugs: Phases 3–4

Read once the Phase 1 loop is red and the repro is minimised (`LOOP.md`). Phase numbers refer to `SKILL.md` and `LOOP.md`.

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
