---
name: review-two-axis
description: "Two-axis review — Standards (isotes rules, design decisions, smell baseline) and Spec (the vault note the work implements) — run as parallel sub-agents and reported side by side. Use after a non-trivial implementation task (Feat_ Step 3, Fix_ Step 5), or when the user asks to review changes since X. Not for trivial edits."
---

Two-axis review of the changes pinned in step 1:

- **Standards**: does the code conform to this repo's documented coding standards?
- **Spec**: does the code faithfully implement the originating issue / spec?

Both axes run as **parallel sub-agents** so they don't pollute each other's context, then this skill aggregates their findings.

## Process

### 1. Pin what to review

- **Default (a task under review):** the uncommitted changes to that task's files — `git diff HEAD -- <task files>`, plus any new untracked task files (`git status --porcelain -- <task files>`). `main` usually carries unrelated work in progress, so never review the whole working tree.
- **A fixed point the user names** (commit SHA, branch, tag, `HEAD~5`): `git diff <fixed-point>...HEAD` and `git log <fixed-point>..HEAD --oneline`.

Confirm the diff is non-empty before going further. An empty diff should fail here, not inside two parallel sub-agents.

### 2. Identify the spec source

The spec is the vault note the work implements, under `/Users/admin/repository/vault/isotes/`:

1. A note the user names.
2. The current task's entry in `Feat_{slug}_planning.md` plus `Feat_{slug}_spec.md`, or the task in `Fix_{slug}.md` plus `Solution_{slug}.md`.
3. If none is clear, ask. If there isn't one (e.g. a small task), the **Spec** sub-agent skips and reports "no spec available".

Read the note(s) with the Obsidian MCP tools and paste the relevant contents into the Spec sub-agent's prompt.

### 3. Identify the standards sources

The standards sources are `AGENTS.md`, `CLAUDE.md`, every file in `.claude/rules/`, `documentation/design_decisions.md` (a logged decision is deliberate, not a finding, unless its "Revisit when" condition is met), and `documentation/rhf-patterns.md` for form code.

On top of whatever the repo documents, the Standards axis always carries the **smell baseline** below: a fixed set of Fowler code smells (_Refactoring_, ch.3) that applies even when a repo documents nothing. Two rules bind it:

- **The repo overrides.** A documented repo standard always wins; where it endorses something the baseline would flag, suppress the smell.
- Known override: **Repeated Switches** is suppressed for split-method branching — the rules keep it plain `if`/`switch` per function until a 4th method exists.
- **Always a judgement call.** Each smell is a labelled heuristic ("possible Feature Envy"), never a hard violation. Like any standard here, skip anything tooling already enforces.

Each smell reads *what it is* → *how to fix*; match it against the diff:

- **Mysterious Name**: a function, variable, or type whose name doesn't reveal what it does or holds. → rename it; if no honest name comes, the design's murky.
- **Duplicated Code**: the same logic shape appears in more than one hunk or file in the change. → extract the shared shape, call it from both.
- **Feature Envy**: a method that reaches into another object's data more than its own. → move the method onto the data it envies.
- **Data Clumps**: the same few fields or params keep travelling together (a type wanting to be born). → bundle them into one type, pass that.
- **Primitive Obsession**: a primitive or string standing in for a domain concept that deserves its own type. → give the concept its own small type.
- **Repeated Switches**: the same `switch`/`if`-cascade on the same type recurs across the change. → replace with polymorphism, or one map both sites share.
- **Shotgun Surgery**: one logical change forces scattered edits across many files in the diff. → gather what changes together into one module.
- **Divergent Change**: one file or module is edited for several unrelated reasons. → split so each module changes for one reason.
- **Speculative Generality**: abstraction, parameters, or hooks added for needs the spec doesn't have. → delete it; inline back until a real need shows.
- **Message Chains**: long `a.b().c().d()` navigation the caller shouldn't depend on. → hide the walk behind one method on the first object.
- **Middle Man**: a class or function that mostly just delegates onward. → cut it, call the real target direct.
- **Refused Bequest**: a subclass or implementer that ignores or overrides most of what it inherits. → drop the inheritance, use composition.

### 4. Spawn both sub-agents in parallel

- **Standards** runs as the `code-reviewer` agent. Add to its prompt: "Review against standards only — do not judge whether the code matches the spec; that is a separate review." Pass the `.claude/rules/` file list too; the agent doesn't read them by default.
- **Spec** runs as a `general-purpose` agent with the pasted spec contents.

**Standards sub-agent prompt** should include:

- The diff command from step 1 (and the commit list, when reviewing since a fixed point).
- The list of standards-source files you found in step 3, **plus the smell baseline from step 3** pasted in full (the sub-agent has no other access to it).
- The brief: "Report, per file/hunk where relevant, (a) every place the diff violates a documented standard: cite the standard (file + the rule); and (b) any baseline smell you spot: name it and quote the hunk. Distinguish hard violations from judgement calls: documented-standard breaches can be hard, but baseline smells are always judgement calls, and a documented repo standard overrides the baseline. Skip anything tooling enforces. Under 400 words."

**Spec sub-agent prompt** should include:

- The diff command from step 1 (and the commit list, when reviewing since a fixed point).
- The path or fetched contents of the spec.
- The brief: "Report: (a) requirements the spec asked for that are missing or partial; (b) behaviour in the diff that wasn't asked for (scope creep); (c) requirements that look implemented but where the implementation looks wrong. Quote the spec line for each finding. Under 400 words."

If the spec is missing, skip the Spec sub-agent and note this in the final report.

### 5. Aggregate

Present the two reports under `## Standards` and `## Spec` headings, verbatim or lightly cleaned. Do **not** merge or rerank findings, because the two axes are deliberately separate (see _Why two axes_).

End with a one-line summary: total findings per axis, and the worst issue _within each axis_ (if any). Don't pick a single winner across axes: that's the reranking the separation exists to prevent.

Report only — don't fix anything. Each fix the user picks is proposed per "Smallest steps" (AGENTS.md).

## Why two axes

A change can pass one axis and fail the other:

- Code that follows every standard but implements the wrong thing → **Standards pass, Spec fail.**
- Code that does exactly what the issue asked but breaks the project's conventions → **Spec pass, Standards fail.**

Reporting them separately stops one axis from masking the other.
