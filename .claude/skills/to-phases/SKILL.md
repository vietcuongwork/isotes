---
name: to-phases
description: Break a reviewed feature spec into vertical-slice phases, each ending on a Demo and declaring its blockers and seams, then into small tasks, written as the planning note. Use at Feature Planning Step 2.
---

# To Phases

Turn a reviewed `Feat_{slug}_spec.md` into **phases**: tracer-bullet vertical slices, each one ending on a **Demo**, each broken into the small tasks the `feature-workflow` skill's Step 2 describes. A phase is the unit you and the user check together; a task is the unit of one proposal.

## 1. Read

- The spec: numbered user stories, acceptance criteria, testing decisions.
- `GLOSSARY.md` (if it exists) for names, and the accepted ADRs in the area you're touching (`documentation/adr/README.md`).
- The code each user story touches. Look for prefactoring: "make the change easy, then make the easy change."

Done when, for every user story, you can name the modules it touches, from where its data lives to where the user sees it. A story may touch one layer or many; the feature's scope decides.

## 2. Draft the phases

<phase-rules>

- **Vertical**: a phase cuts a narrow but complete path through every layer its behaviour needs, and ends on a **Demo**: what the user can see working on the simulator, or a named Jest run for a logic-only phase. A phase with no Demo is a horizontal slice; re-cut it.
- **Tracer bullet first**: the first feature phase is the thinnest end-to-end path; later phases widen it.
- **Prefactoring first**: Phase 0 holds the prefactors. Its Demo is "behaviour unchanged": a regression check of what it touches. It also proves readiness: the baseline is committed, and every seam a later phase names has at least one passing example test.
- **One session**: a phase fits one fresh context window.
- **Wide refactors and migrations run expand–contract**: Expand (the new form beside the old, nothing using it yet; Demo = behaviour unchanged), then one Migrate phase per consumer or batch, each with its own Demo and blocked by Expand, then Contract (delete the old form), blocked by every Migrate.
- **Acceptance closes the spec**: the last phase is acceptance, a phase of its own that runs after the feature's review session (`Feat_{slug}_review`, which the planning note doesn't list). Its one `[Live]` task first runs `pnpm check` (the feature's one tsc, lint and Prettier run), then re-runs every criterion's check on the final build — a pass logged by an earlier task doesn't count — and ticks only what passes in full. A partly checked criterion stays unticked with a note on what's missing; a dropped one is marked `descoped: {reason} (user, YYYY-MM-DD)` only with the user's OK. Then it sets the spec's `status` to `done`. For a feature that changes the app (`src/`), the same task runs the vault's `Test_golden-path.md` on that build, so a regression outside the feature's own criteria still shows. It also runs every check the review note lists under "Checks not shown". Last, it greps `Tasks_backlog.md` for open items that link to this feature (`[[Feat_{slug}_…]]`) or carry one of its `screen/` or `area/` tags (`Ref_tag-pool`), and lists them beside the criteria they might satisfy. The user names which ones the feature fixed, and the task ticks those in the vault note: `- [x]` moved under `## Done` with `· done {today}`. It also sets `status: done` on the feature's spec, planning, implementation and review notes. With no matching items, it writes "backlog: none linked or tagged". The review session has already updated the `Flow_{area}` note.

</phase-rules>

Each phase declares:

- **Demo**: the check that ends it.
- **Covers**: the user stories it delivers (`US3, US4`) and their acceptance criteria.
- **Blocked by**: the phases that genuinely gate it, or "none".
- **Seams**: the Jest seams it tests, taken from the spec's testing decisions, or "none (Live only)".

## 3. Quiz the user

Present the phase list only, no tasks yet: number, title, Demo, Covers, Blocked by. Ask, as one grilling round with a recommended answer for each:

1. Granularity: is any phase too coarse or too fine? Merge or split?
2. Blocked by: does each phase depend only on phases that genuinely gate it?
3. Coverage: does every user story land in exactly one phase?

Iterate until the user approves the phase list. Then ask: "Companion, or should I write the tasks myself?"

- **Write them yourself:** go to step 4.
- **Companion:** follow [`companion.md`](companion.md), then go to step 4, which adds the tags, **Verify** lines and criterion numbers to what the rounds produced.

## 4. Break each phase into tasks

Inside each approved phase, write the tasks by the `feature-workflow` skill's Step 2 task rules: smallest, non-breaking, revertible, tagged `[TDD]` or `[Live]`, with a **Verify** line and `Blocked by` where needed. Tasks may be one file each; the phase carries the vertical slice. A `[TDD]` task names its seam from the phase's **Seams**.

Tag a task `[Live, checked in T{n}]` only when it draws something and changes no behaviour: no tap handler, no state change, no navigation. A task that adds an interaction, such as a popover that opens and closes, keeps its own short Verify and runs it on the simulator at that task.

A task that renames, removes or replaces a labelled element, or puts a new screen in a flow's path, names the flows that select it (`grep -ln '<label>' .claude/skills/verify-isotes/flows/*.yaml`). Its **Verify** line runs them, and the task updates them by the upkeep rule in `verify-isotes/features/README.md`.

An `accessible` row or card exposes one joined label, so wrapping texts in one replaces their labels. Its flows and **Verify** lines match the whole label by regex (`".*, You paid, \\$7\\.25"`), and a size inside it is measured from a screenshot.

A UI task's board check compares bounds with the board's HTML, as the vault's `Ref_claude-design.md` → "In the feature workflow" describes. Its **Verify** line says so; a rendered picture of the board is used only when the user asks for one.

Done when every acceptance criterion in the spec traces to a task — write that task's number into the criterion's `verified by` (`Live (T12)`) — and every phase's last task ends on its Demo. Then read each criterion and each Demo Verify line for behaviours (a tap that changes state, a close, a save) and check that each one appears in the body of the task that builds it, not only in the task that checks it.

## 5. Write the planning note

Write `Feat_{slug}_planning.md` from `templates/Tasks_template.md`, and copy the spec's `screen/` and `area/` tags into its frontmatter `tags`. Each phase is a section under **Task List**:

    ### Phase 2: <title>

    **Demo:** …
    **Covers:** US3, US4
    **Blocked by:** Phase 1
    **Seams:** `computeSplitRows`

    - [ ] **T5 — <title>. [TDD]**
      - **Verify:** …

Then hand back to the `feature-workflow` skill's Step 2 review gate.
