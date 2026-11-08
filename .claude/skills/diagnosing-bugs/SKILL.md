---
name: diagnosing-bugs
description: Diagnosis loop for any bug in isotes — two quick fixes first, then a tight loop and logs. Small bugs end to end, Big bugs through Phase 4 (the Investigate_ note). Use when the user says "diagnose"/"debug this", reports something broken/throwing/failing/slow, or wants to fix a bug in companion mode.
---

# Diagnosing Bugs

Two quick fixes first; a discipline for the bugs they don't fix. Skip phases only when explicitly justified.

When exploring the codebase, read `GLOSSARY.md` (if it exists) to get a clear mental model of the relevant modules, and check the ADR index (`documentation/adr/README.md`) for decisions in the area you're touching.

## Redact

This skill has you show commands, outputs and captured artifacts. **Redact every secret first**: write `<REDACTED>` in its place. Build loops against env vars, so the credential stays in the environment rather than in what you show. Captured artifacts carry auth headers: quote only the lines that carry the signal.

If the redacted output is not enough to diagnose the bug, say so and ask the user.

## Phase 0: Quick fixes

Most bugs here are obvious once the symptom is seen. Try up to two fixes before building a loop.

1. **See it once.** Reproduce the symptom one time (simulator steps, a Jest run, or the user's exact steps) and note what you saw: that's the before-picture each fix is checked against. On the simulator, reach the screen with a `verify-isotes` flow, then trigger the symptom through idb (`verify-isotes` `HEADLESS.md`), or computer use for what idb can't do (CLAUDE.md "Simulator testing"). It needn't be tight or minimised. Can't reproduce it → Phase 1.
2. **Rank 3–5 hypotheses**, each with its prediction (format in Phase 3). Start from the vault: `search_notes` the failing module or error text and read any `Debug_` note it finds, because a Swift build failure was once diagnosed from scratch while a note on that module sat unread. Send the list and the fix for the top one in the same message; the user's yes on that file covers both.
3. **Try it.** Write the fix and repeat the same steps. Symptom gone → Phase 5, then Phase 6; the hypothesis whose prediction held is the cause on record.
4. **Still there → revert the fix**, then try hypothesis 2 the same way. Each attempt runs on clean code, so its result belongs to one change.
5. **Both fail → Phase 1.** Carry both hypotheses and what each attempt showed; Phase 3 starts with them ruled out.
6. **Not on Opus → hand off.** In a session that isn't running Opus (feature implement sessions run on Sonnet), when both quick fixes miss, don't start Phase 1. Write the setback and both tries in the diary's `**Focus:**` line, stop, and tell the user to continue with `/recall <slug> debug`, which opens an Opus session.

Skip straight to Phase 1 when the fix would need 3+ files or a choice between approaches: that's a Big bug from the start. A quick fix that works is a Small bug (`Debug_` note), even in a shared file.

Done when the symptom is gone after one of the two attempts, or both are reverted and their results noted.

## Companion mode

Used when the user asks for it: the user decides each fix and you write it. Only who proposes the fix changes. The two-try limit, the reverts and the notes stay as they are.

1. **Objective.** After Phase 0 step 1, send the symptom as seen, the 3–5 ranked hypotheses with their predictions, and `file:line` pointers to where each cause would sit. Name no fix.
2. **The user's fix.** The user picks a hypothesis and says how to fix it. That message is their yes for the files it names. Write it, and list anything you changed from their wording (a caller they missed, a type that wouldn't compile) and why.
3. **Try it** as in Phase 0 steps 3–5. Each fix the user gives is one of the two tries, and a failed one is reverted before the next.
4. **Stuck.** If the user asks for a hint, give the top hypothesis's fix as a proposal. It still counts as a try.
5. **Big bug.** The companion round moves to `Solution_`: send the `Investigate_` root cause and the constraints a fix must meet, the user outlines the approach, and you write the note from it, listing the differences. The Plannotator gate is unchanged.
6. **Phase 5** runs as written: the user's fix is the one stashed and restored around the regression test.

## Phases 1–2: Build a loop, reproduce and minimise

Reached when both quick fixes failed, or the symptom wouldn't show. Read `LOOP.md` first. Its rule: no Phase 3 until one command you have already run goes red on this bug, and the repro is minimised.

## Phases 3–4: Hypothesise and instrument

Read `HYPOTHESES.md` first. Its two stops: show the 3–5 ranked hypotheses to the user and wait before instrumenting, and change one variable per probe.

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

If the loop is still red after the fix, STOP and return to Phase 3. After 2 failed fixes, stop and ask the user (CLAUDE.md "Working rules", AGENTS.md rule 3).

## Phase 6: Cleanup

Required before declaring done:

- [ ] Original repro no longer reproduces (re-run the Phase 1 loop, or Phase 0's steps)
- [ ] Regression test passes (or absence of seam is documented)
- [ ] All `[DEBUG-...]` instrumentation removed (`grep` the prefix)
- [ ] Throwaway prototypes deleted (or moved to a clearly-marked debug location)
- [ ] The hypothesis that turned out correct is recorded in the `Debug_{slug}.md` note (Small bug) or the `Investigate_`/`Fix_` notes (Big bug), so the next debugger learns
