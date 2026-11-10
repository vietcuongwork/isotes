---
name: feature-workflow
description: "The isotes feature lifecycle: Spec, Planning, Implement, Review, Acceptance. Use for any new feature request, and whenever starting, resuming or handing off one of those steps (a Feat_{slug} note, /recall {slug}, /autopilot)."
---

# Feature workflow

Notes go to the vault (`/Users/admin/repository/vault/isotes/`) with wiki-links. Each step has its own note and, where marked, a Plannotator gate (CLAUDE.md "Plannotator Review Gate"): run it, then STOP until the user says go.

| Step | Note | Session | Gate |
|---|---|---|---|
| 1 Spec | `Feat_{slug}_spec` | own session | Plannotator, STOP |
| 2 Planning | `Feat_{slug}_planning` | new session, `/recall {slug}` | Plannotator, STOP |
| 3 Implement | `Feat_{slug}_implementation` | companion, or `/autopilot <phase>` per code phase | none |
| 4 Review | `Feat_{slug}_review` | fresh session, `/recall {slug}`, opus | none; findings wait for the user's call |
| 5 Acceptance | the planning note's last phase | `/autopilot` or companion | none |

Status follows the feature: `in-progress` from spec approval until acceptance closes every criterion, then `done` on all four notes.

## Step 1: Spec

- Run `grilling` (numbered rounds, each with a recommended answer). It calls `domain-modeling` for `GLOSSARY.md` terms and ADRs. Offer `prototype` when a state-model question stays open.
- Tag the spec with `screen/` and `area/` tags from `[[Ref_tag-pool]]`; a new tag goes into the pool first. Look up open backlog items with those tags (`grep -nE '#screen/{name}' Tasks_backlog.md`), ask in a round which are in scope, and link those `→ [[Feat_{slug}_spec]]`.
- Size check before writing, for a feature over about 15 tasks or spanning more than one of schema, shared foundation and UI: ask whether each part could ship alone. A part that can becomes its own feature, ordered with `Blocked by: [[Feat_x]]`. A feature that stays large gets a one-line reason.
- Agents: `solution-consultant` for library or design choices, `expo-rn-expert` for API or platform questions.
- One document, business and technical. Business: requirements, numbered user stories, edge cases, acceptance criteria, one checkbox each: `- [ ] {behaviour} — verified by: {Jest seam | Live | device}`. Technical: architecture, data model, API contracts, integration points, and testing decisions (which seams get Jest, what is verified on the simulator).
- The spec exists before any implementation starts. It is written on `main`, never in a worktree. Then Plannotator, STOP.

## Step 2: Planning

- Start in a new session opened with `/recall {slug}`, so planning has room for its rounds.
- Run `to-phases`: vertical-slice phases, each ending on a Demo, approved before tasks are written. The user then chooses whether you write the tasks or plan them in companion mode. Acceptance is its own last phase; the review is not listed in the plan.
- Each task is as small as possible (one focused change), non-breaking, and revertible alone. It is tagged after the title: `[TDD]` for logic callable as a plain function (see the `tdd` skill's scope), `[Live]` for running the real thing (the app on the simulator, or a tool's real command), `[Live, checked in T{n}]` for a piece a later task renders (no Verify line of its own).
- A task that keeps behaviour unchanged runs its own tests and `tsc`; its flows and screenshots wait for the phase Demo.
- Prefactoring tasks come first. A task that depends on a non-adjacent task says `Blocked by: T{n}`. Tasks cover the full scope.
- Agents as in Step 1. Planning stays on `main` too. Then Plannotator, STOP.
- After approval, check that Plannotator kept the approved copy: the newest numbered file in `~/.plannotator/history/isotes/annotate-feat-{slug}-planning-md-*/`. It is the handoff version that Step 4 compares against, so later edits to done tasks lose nothing. If no copy exists, copy the note to `.sim/review/{slug}-planning-handoff.md` before the first task.

## Step 3: Implement

Needs a verified planning note. Mode is companion by default, one proposal at a time (AGENTS.md "Smallest steps"). `/autopilot <phase>` runs one approved phase without per-file approval and stops at its Demo. Both modes Verify and log every task.

- Implement, review and acceptance run in the feature's worktree (`/worktree-start feature {slug}`, then `/worktree-finish {slug}`). The main session drives it by path and no session opens inside it. Edits to rule files (`.claude/`, `CLAUDE.md`, `AGENTS.md`) stay on `main`.
- Follow the task breakdown strictly, one task at a time.
- `[TDD]` tasks run the `tdd` skill, with the failing test proposed and run first. `[Live]` tasks run the real thing (CLAUDE.md "Simulator testing" for `src/`) and read the output back. A `[Live]` task that adds logic still gets unit tests.
- A per-file proposal ends with a short "Design choices" list of decisions the plan doesn't record. Skip it when there are none.
- Run the task's Verify line before proposing the next task. Inert infrastructure tasks get a quick regression check; `tsc`, lint and Prettier run once, in acceptance.
- Read `implementing-tasks` before the first task (Open checks, Caught late, Deviation labels, Plan drift, Spin-offs, Setbacks).
- Log each task once verified, in the implementation template's fields only. A task that went exactly to plan gets one line: its title with `· as planned`, and its Verify. Otherwise: Verify, then Q&A (every question put to the user, an autopilot hand-back as `Q (hand-back)`), Design choices (what the plan didn't cover), Change (only the part that differs from the plan) and Deviation, each only when there is one.
- Keep the planning note matching the code. When a task's Change, Design choices or Deviation line means its code differs from the planned text, edit that task in the planning note in place, its prose and its code blocks both, in the same step as the log, and add `· changed in implementation` to its title. The why stays on the implementation note's line.
- Frozen targets: never weaken or delete a Verify line, an acceptance criterion or an existing test assertion to make a task pass. If one looks wrong, say so and get the user's OK first; log the OK on the Deviation line.
- Review each task's diff inline against AGENTS.md, `isotes-code-style.md` and `isotes-architecture.md` before logging it. Log it only when it changed something, as a Design choice or a Deviation.
- After the last code phase's Demo, the session ends with: "Next: review session. Start a fresh session with `/recall {slug}`."

## Step 4: Review (fresh session)

- `/recall {slug}` loads spec, planning and implementation notes. Create `Feat_{slug}_review` from `templates/Feat_review_template`.
- Run `review-two-axis` once on the feature's whole diff, from the baseline commit T1 recorded to the working tree. Running it here is the user's OK to spawn its sub-agents; `/autopilot` does not run it.
- Fill the review note's Summary first. "What planning missed" tallies the Deviation labels in the implementation note and names 0 to 3 lessons for the next plan.
- Before the findings, check that the planning note matches the code: every task with a Change, Design choices or Deviation line that changed code carries `· changed in implementation` and describes the final code. Fix any that don't.
- Record each Spec finding with a decision: fix now, reword spec, backlog or accept. Fixes follow "Smallest steps": one file per proposal, re-verified after each batch. A finding that needs a spec rewording waits for the user's review. A fix that needs real tasks becomes a new phase in the planning note, before acceptance.
- Each review fix keeps the notes matching the code. It gets an entry in the implementation note's "Review fixes" section (the finding's number, Change, Verify), and the done task it changes is edited in place in the planning note, prose and code blocks, with `· changed in review, finding {n}`. The review note keeps the finding and the user's decision only.
- If the feature changed a rule or a screen path, update the `Flow_{area}` note from `templates/Flow_template.md` (create it if needed, cover only what this feature touched); otherwise write "not needed" with the reason in the review note's Flow section.
- List criteria the review could not see under "Checks not shown". They carry into acceptance.
- Then open the handoff diff for the user, in the background: `git diff --no-index <approved copy> <planning note> | plannotator review --patch-file -`. It shows every change to the plan from handoff to the end of review. Address any annotations it returns.
- Status `done` once every finding has a decision, each fix is verified, and the user has closed the handoff diff.

## Step 5: Acceptance

The planning note's last phase, after the review note is `done` (`/autopilot` refuses to start it otherwise). Its one `[Live]` task is defined in `to-phases`. A failure it fixes is logged like a review fix: a "Review fixes" entry in the implementation note and an in-place edit of the planning task. If it edited the plan, open the handoff diff again (Step 4) before closing. Recommend `/retro` at the end of every feature, with one line on whether "What planning missed" names a change to the environment (rules, checks, tooling). It runs in a new session on opus: run `/preserve` first, with `/retro` as the Focus, then `whats-next`, so the session ends on a proposal for the next feature.
