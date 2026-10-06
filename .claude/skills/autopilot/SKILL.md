---
name: autopilot
description: Run one named phase of a planning note end to end (tdd at its seams, Verify, review, log each task) and stop at its Demo with uncommitted changes. Invoke as /autopilot <phase>.
disable-model-invocation: true
---

# Autopilot

The user hands you one **phase** of `Feat_{slug}_planning.md` to run without per-file approval. This lifts AGENTS.md "Smallest steps" for the files that phase's tasks name, for this phase only, and ends at the phase's **Demo**. Every other rule still applies.

## 0. Preflight

- The argument names one phase. Missing or ambiguous: ask and stop.
- The planning note passed review, and every phase in this phase's **Blocked by** is ticked done.
- Record `git status --porcelain` as the baseline, so the end report separates this phase's changes from work already in progress.
- Read the spec, this phase, and `Feat_{slug}_implementation.md`.

Done when the phase is identified, its blockers are done, and the baseline is recorded.

## 1. Run each task, in order

- `[TDD]`: run the `tdd` skill at the task's seam; seams listed in the phase count as confirmed.
- `[Sim]`: write the change, then check it on the simulator per CLAUDE.md "Simulator testing".
- After each file: `npx tsc --noEmit`, plus the task's own test file when there is one.
- Run the task's **Verify** line.
- Non-trivial task: run `review-two-axis` on its files. Fix hard violations; record judgement calls in the log. One review pass per task.
- Log the task in the implementation note per CLAUDE.md Step 3 (Change, Verify, Design choices, Deviation), and tick it in the planning note.

## 2. Hand back early

Stop, report where you are, and wait for the user when:

- A Verify fails and two fix attempts don't turn it green. Report both attempts and why each failed, and write the setback note per CLAUDE.md Step 3.
- The plan or spec leaves a decision open (No Assumptions Policy).
- A finding changes what later tasks build (plan drift): record it per CLAUDE.md Step 3.
- The next change touches a file no task in this phase names, or installs a package the phase doesn't list.

## 3. Finish at the Demo

- Run the full suite once (`pnpm test`) and `npx tsc --noEmit`.
- Run the phase's **Demo**.
- Confirm no debug logs are left.
- Report: the Demo result, tasks done, Deviations, review judgement calls, and the files changed since the baseline. Add a suggested commit (AGENTS.md "Commit message template", as a runnable `git commit` command). The user commits.

Then STOP. The next phase starts only when the user says so.
