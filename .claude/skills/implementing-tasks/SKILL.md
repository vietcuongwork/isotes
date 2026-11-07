---
name: implementing-tasks
description: Bookkeeping rules for implementing a Feat_ planning task or a Fix_ task in isotes: Open checks, Caught late, Deviation labels, Plan drift, Spin-offs, Setbacks. Read before the first task of a feature or Fix_ note, and when /autopilot hits a failed Verify or a plan-drift finding.
---

# Implementing tasks: bookkeeping

Moved out of the `feature-workflow` skill's Step 3 so it loads only when a task is being implemented. That step keeps Verify, Log each task, Frozen targets and Review.

- **Open checks** — a Verify item that can't be done yet (it needs a later
  task's code, or data the app doesn't have yet) goes in the implementation
  note's Open checks, with the task or Demo that will close it. A phase's
  Demo isn't done while a check due by it is still open. A check may be
  postponed once; postponing it again needs the user's OK.
- **Caught late** — when a Demo or a later task fails on something a check
  moved off its task (Step 2's tag and Verify rules) would have caught, the
  task that fixes it writes `caught late, check deferred from T{n}` on its
  Deviation line, with a `spec`, `context` or `verify` label. `/retro` counts
  these against `Ref_usage-report` → Current focus.
- **Deviation label** — a Deviation line starts `**Deviation (<label>):**`
  with exactly one label: `spec` (the spec or plan was wrong or missed a
  case), `context` (a fact about the code or a library the agent didn't
  have), `verify` (the check was wrong, flaky, too slow, or let a failure
  through), `env` (tooling, simulator, Metro or browser setup), `state`
  (leftover app, database or simulator state), `observe` (the agent couldn't
  see what happened), `decision` (a choice the user made that the plan
  didn't record). `spec`, `context` and `verify` count as rework in the
  weekly report, `env`, `state` and `observe` as friction. The Spec half of
  `review-two-axis` flags a missing, unknown or doubled label. `Fix_` notes
  are exempt.
- **Plan drift** — when a finding changes what later tasks build: record
  the detail by size (Deviation line / `Debug_` / `Investigate_` chain, per
  "Issue Scoping"), then fix the planning note in place with a one-line
  `(found in T{n}, see [[…]])` tag. A spec-level change also updates the spec
  and STOPs for review. A newly found task goes right after its parent
  task's last sub-bullet, so the parent keeps its own Verify line.
- **Spin-offs** — a problem found mid-task that this feature doesn't need
  goes to the planning note's "Out of scope, flagged" list, never only the
  diary. Still open when the feature closes → move it to `Tasks_backlog.md`.
  A `Fix_` note's last task and a Small bug's fix do the same check for backlog items
  that link to them. Fixes with no link are ticked by hand.
- **Setbacks → vault notes, automatically** — whenever a task hits an error
  or setback (a failed Verify, a crash, a wrong assumption, a tool that
  misbehaves), run `diagnosing-bugs` if the cause isn't obvious, then write
  the note as soon as the cause is known, without asking:
  `Debug_{slug}.md` if it's codebase-specific, `Learn_{field}_{slug}.md` if
  it's generic, or both (per "Issue Scoping" in CLAUDE.md). Link it
  from that task's Deviation line. Still unresolved → keep it on the
  Deviation line and write the note once the cause is confirmed.
