---
name: to-phases
description: Break a reviewed feature spec into vertical-slice phases, each ending on a Demo and declaring its blockers and seams, then into small tasks, written as the planning note. Use at Feature Planning Step 2.
---

# To Phases

Turn a reviewed `Feat_{slug}_spec.md` into **phases**: tracer-bullet vertical slices, each one ending on a **Demo**, each broken into the small tasks CLAUDE.md Step 2 describes. A phase is the unit you and the user check together; a task is the unit of one proposal.

## 1. Read

- The spec: numbered user stories, acceptance criteria, testing decisions.
- `GLOSSARY.md` (if it exists) for names, and `documentation/design_decisions.md` in the area you're touching.
- The code each user story touches. Look for prefactoring: "make the change easy, then make the easy change."

Done when, for every user story, you can name the modules it touches, from where its data lives to where the user sees it. A story may touch one layer or many; the feature's scope decides.

## 2. Draft the phases

<phase-rules>

- **Vertical**: a phase cuts a narrow but complete path through every layer its behaviour needs, and ends on a **Demo**: what the user can see working on the simulator, or a named Jest run for a logic-only phase. A phase with no Demo is a horizontal slice; re-cut it.
- **Tracer bullet first**: the first feature phase is the thinnest end-to-end path; later phases widen it.
- **Prefactoring first**: Phase 0 holds the prefactors. Its Demo is "behaviour unchanged": tsc clean plus a regression check of what it touches.
- **One session**: a phase fits one fresh context window.
- **Wide refactors and migrations run expand–contract**: Expand (the new form beside the old, nothing using it yet; Demo = behaviour unchanged), then one Migrate phase per consumer or batch, each with its own Demo and blocked by Expand, then Contract (delete the old form), blocked by every Migrate.

</phase-rules>

Each phase declares:

- **Demo**: the check that ends it.
- **Covers**: the user stories it delivers (`US3, US4`) and their acceptance criteria.
- **Blocked by**: the phases that genuinely gate it, or "none".
- **Seams**: the Jest seams it tests, taken from the spec's testing decisions, or "none (Sim only)".

## 3. Quiz the user

Present the phase list only, no tasks yet: number, title, Demo, Covers, Blocked by. Ask, as one grilling round with a recommended answer for each:

1. Granularity: is any phase too coarse or too fine? Merge or split?
2. Blocked by: does each phase depend only on phases that genuinely gate it?
3. Coverage: does every user story land in exactly one phase?

Iterate until the user approves the phase list.

## 4. Break each phase into tasks

Inside each approved phase, write the tasks by CLAUDE.md Step 2's task rules: smallest, non-breaking, revertible, tagged `[TDD]` or `[Sim]`, with a **Verify** line and `Blocked by` where needed. Tasks may be one file each; the phase carries the vertical slice. A `[TDD]` task names its seam from the phase's **Seams**.

Done when every acceptance criterion in the spec traces to a task, and every phase's last task ends on its Demo.

## 5. Write the planning note

Write `Feat_{slug}_planning.md` from `templates/Tasks_template.md`. Each phase is a section under **Task List**:

    ### Phase 2: <title>

    **Demo:** …
    **Covers:** US3, US4
    **Blocked by:** Phase 1
    **Seams:** `computeSplitRows`

    - [ ] **T5 — <title>. [TDD]**
      - **Verify:** …

Then hand back to CLAUDE.md Step 2's review gate.
