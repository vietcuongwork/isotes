---
name: autopilot
description: Run one named phase of a planning note end to end (tdd at its seams, Verify, review, log each task) and stop at its Demo with uncommitted changes. Invoke as /autopilot <phase>.
disable-model-invocation: true
---

# Autopilot

The user hands you one **phase** of `Feat_{slug}_planning.md` to run without per-file approval. This lifts AGENTS.md "Smallest steps" for the files that phase's tasks name, for this phase only, and ends at the phase's **Demo**. Every other rule still applies.

**App checks follow the app.** The simulator smoke test, the full Jest suite and simulator checks for `[Live]` apply when the phase's tasks change `src/`; `pnpm check` runs once, in the feature's acceptance task. Otherwise use the checks the planning note's conventions name (e.g. a `UT` suite, `[Live]` as the real command's run), and record the baseline from wherever those files live.

## 0. Preflight

- The argument names one phase. Missing or ambiguous: ask and stop.
- The planning note passed review, and every phase in this phase's **Blocked by** is ticked done.
- The phase starts in a session that hasn't run one yet. If this session already ran a phase to its Demo, run `/preserve` and hand over its `/recall` line: a phase needs the room for its Demo and report.
- Record `git status --porcelain` as the baseline, so the end report separates this phase's changes from work already in progress. If it covers an earlier phase, ask whether to commit that first: a phase should start from a committed Demo.
- If the phase has `[Live]` tasks that change `src/`, smoke-test first with `verify-isotes` (CLI): Doctor → `doctor: ok`, then `scripts/green.sh check`. `same`: the last green Demo ran on this `src`, so it stands in for the flow. `changed`: `.sim/cu.sh mark`, the golden-path flow (that skill's Drive command) green, then `.sim/cu.sh show` with no ERROR lines. Broken → stop and report before task 1. When the flow was skipped and the first `[Live]` Verify fails, run golden-path before blaming the task.
- Read the spec, this phase, and `Feat_{slug}_implementation.md`.

Done when the phase is identified, its blockers are done, the session is fresh, and the baseline is recorded.

## 1. Run each task, in order

- `[TDD]`: run the `tdd` skill at the task's seam; seams listed in the phase count as confirmed.
- `[Live]`: write the change, then run the real thing per CLAUDE.md Step 3 (simulator for `src/`, otherwise the real command or task).
- After each file: the task's own test file, when there is one.
- Run the task's **Verify** line.
- Non-trivial task: run `review-two-axis` on its files. Fix hard violations; record judgement calls in the log. One review pass per task.
- Log the task in the implementation note per CLAUDE.md Step 3 (Change, Verify, Design choices, Deviation), and tick it in the planning note.

## 2. Hand back early

Stop, report where you are, and wait for the user when:

- A Verify fails and two fix attempts don't turn it green. Report both attempts and why each failed, and write the setback note per CLAUDE.md Step 3.
- The plan or spec leaves a decision open (No Assumptions Policy).
- A finding changes what later tasks build (plan drift): record it per CLAUDE.md Step 3.
- The next change touches a file no task in this phase names, or installs a package the phase doesn't list.
- A Verify line, acceptance criterion, or existing test assertion looks wrong: changing it needs the user's OK (CLAUDE.md "Frozen targets").

## 3. Finish at the Demo

- Run the full Jest suite once (`pnpm test`).
- Run the phase's **Demo**.
- Confirm no debug logs are left.
- Demo green and the phase changed `src/`: run `verify-isotes/scripts/green.sh mark`, so the next phase's Preflight can skip its smoke flow.
- Every Open check due by this phase is closed, re-targeted, or listed in the report for the user to accept.
- Report: the Demo result, tasks done, Deviations, review judgement calls, open checks, and the files changed since the baseline. Add a suggested commit (the `commit-message` skill, as a runnable `git commit` command). The user commits.
- **Read these first**: up to 3 hunks where the phase's risk sits (logic no test covers, a deviation from the plan, a judgement call the review flagged — at least one from review, if any were flagged), each as `file:line` plus one line on why. These are what to understand before committing; Verify and review cover the rest.
- Append a session section to today's `Diary_` (template fields, including **State**), linking the implementation note instead of repeating task details.

Then STOP. The next phase starts only when the user says so.
