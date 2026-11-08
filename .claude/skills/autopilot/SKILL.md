---
name: autopilot
description: Run one named phase of a planning note end to end (tdd at its seams, Verify, log each task; review in the feature's last phase) and stop at its Demo with uncommitted changes. Invoke as /autopilot <phase>.
disable-model-invocation: true
---

# Autopilot

The user hands you one **phase** of `Feat_{slug}_planning.md` to run without per-file approval. This lifts AGENTS.md "Smallest steps" for the files that phase's tasks name, for this phase only, and ends at the phase's **Demo**. Every other rule still applies.

**App checks follow the app.** The simulator smoke test, the full Jest suite and simulator checks for `[Live]` apply when the phase's tasks change `src/`; `pnpm check` runs once, in the feature's acceptance task. Otherwise use the checks the planning note's conventions name (e.g. a `UT` suite, `[Live]` as the real command's run), and record the baseline from wherever those files live.

## 0. Preflight

- The argument names one phase. Missing or ambiguous: ask and stop.
- The planning note passed review, and every phase in this phase's **Blocked by** is ticked done.
- The acceptance phase starts only when `Feat_{slug}_review` exists with status `done`. A missing or open review note is a blocker: tell the user the review session comes first.
- The phase starts in a session that hasn't run one yet. If this session already ran a phase to its Demo, run `/preserve` and hand over its `/recall` line: a phase needs the room for its Demo and report.
- Record `git status --porcelain` as the baseline, so the end report separates this phase's changes from work already in progress. If it covers an earlier phase, ask whether to commit that first: a phase should start from a committed Demo.
- If the phase has `[Live]` tasks that change `src/`, smoke-test first with `verify-isotes` (CLI): Doctor → `doctor: ok`, then `scripts/green.sh check`. `same`: the last green Demo ran on this `src`, so it stands in for the flow. `changed`: `.sim/cu.sh mark`, the golden-path flow (that skill's Drive command) green, then `.sim/cu.sh show` with no ERROR lines. Broken → stop and report before task 1. When the flow was skipped and the first `[Live]` Verify fails, run golden-path before blaming the task.
- Read the spec, this phase, `Feat_{slug}_implementation.md`, and the `implementing-tasks` skill (Deviation labels, Plan drift, Setbacks). Also read the `verify-isotes/features/` note for each screen the phase touches (`features/README.md` maps them), so a check starts from the saved labels and selectors.

Done when the phase is identified, its blockers are done, the session is fresh, and the baseline is recorded.

## 1. Run each task, in order

- `[TDD]`: run the `tdd` skill at the task's seam; seams listed in the phase count as confirmed.
- `[Live]`: write the change, then run the real thing per the `feature-workflow` skill's Step 3 (simulator for `src/`, otherwise the real command or task).
- After each file: the task's own test file, when there is one.
- Run the task's **Verify** line and log evidence for each item. An item with no evidence becomes an Open check.
- The acceptance task: put each of its checks on the task list as its own step (`pnpm check`, the saved check flows, the golden path, each group of criteria, cleanup), so the user sees progress during a run of 20 minutes or more.
- Review: read each task's diff inline against AGENTS.md, `isotes-code-style.md` and `isotes-architecture.md` before logging it. The feature-level review is not part of `/autopilot`. It runs in its own session, recorded in `Feat_{slug}_review`, after the last code phase.
- Log the task in the implementation note per the `feature-workflow` skill's Step 3 (one `· as planned` line, or Verify, Q&A, Design choices, Change and Deviation), and tick it in the planning note.

## 2. Hand back early

Stop, report where you are, and wait for the user when:

- A Verify fails and two fix attempts don't turn it green. Report both attempts and why each failed, and write the setback note per `implementing-tasks`.
- The plan or spec leaves a decision open (No Assumptions Policy).
- A finding changes what later tasks build (plan drift): record it per `implementing-tasks`.
- The next change touches a file no task in this phase names, or installs a package the phase doesn't list.
- A Verify line, acceptance criterion, or existing test assertion looks wrong: changing it needs the user's OK (CLAUDE.md "Frozen targets").

Once the user answers, log it on that task's Q&A line as `Q (hand-back) … → A …`. An answer that changes the code also gets its Deviation (`decision`) or Design choices line, and the task is edited in place in the planning note, prose and code blocks, with `· changed in implementation` (`feature-workflow` Step 3).

## 3. Finish at the Demo

- Run the full Jest suite once (`pnpm test`).
- Run the phase's **Demo**.
- Confirm no debug logs are left.
- Phase ran flows on the simulator: once the Demo's evidence is quoted in the log, run `verify-isotes/scripts/cleanup.sh --dry-run`, then `cleanup.sh`, and put its before and after counts in the report. It keeps the newest trip per flow and the baseline trip. Skip it when the phase ran no flows.
- Every Open check due by this phase is closed or, on its first postponement, re-targeted to a later task or Demo. A check already postponed once keeps the Demo from being green: log the Demo as `not green`, name the check in the report, and wait for the user to accept it or say how to close it (`implementing-tasks`, Open checks).
- Demo green and the phase changed `src/`: run `verify-isotes/scripts/green.sh mark`, so the next phase's Preflight can skip its smoke flow.
- Report: the Demo result, tasks done, Deviations, review judgement calls, open checks, and the files changed since the baseline. Add a suggested commit (the `commit-message` skill, as a runnable `git commit` command). The user commits.
- **Read these first**: up to 3 hunks where the phase's risk sits (logic no test covers, a deviation from the plan, a judgement call the review flagged — at least one from review, if any were flagged), each as `file:line` plus one line on why. These are what to understand before committing; Verify and review cover the rest.
- Append a session section to today's `Diary_` (template fields, including **State**), linking the implementation note instead of repeating task details.

Then STOP. The next phase starts only when the user says so. After the last code phase, the report ends with: "Next: review session. Start a fresh session with `/recall {slug}`." After the review is done, the acceptance phase follows.
