# Usage signals

The terms the weekly usage report, the retro, CLAUDE.md Step 3 and the implementation template share for measuring how a feature's tasks went.

## Language

**Work unit**:
One task finished in a week: a new `### T` heading in an implementation note, a ticked task in a `Fix_` note, a new `Debug_` note, or a `Fix_` note newly set to `done`.
_Avoid_: ticket, story point

**Rework**:
A setback caused by a wrong spec, missing context or a faulty check. It counts as `spec`, `context` and `verify` labels, plus new `Debug_` notes.
_Avoid_: redo, churn

**Friction**:
A setback caused by the environment, leftover state or missing visibility. It counts as `env`, `state` and `observe` labels.
_Avoid_: overhead, noise

**Setback layer**:
The one cause a Deviation line names: `spec`, `context`, `verify`, `env`, `state` or `observe`.
_Avoid_: error type, category

**Focus entry**:
An entry in `Ref_usage-report` → Current focus for one change under trial, with its question, metric, start date, review date and status.
_Avoid_: experiment row, KPI

**Decision**:
A Deviation label for a choice the user made that the plan didn't record. It counts as neither rework nor friction.
_Avoid_: change request
