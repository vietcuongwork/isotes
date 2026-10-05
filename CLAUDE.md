@AGENTS.md

If anything in this file conflicts with AGENTS.md, AGENTS.md takes priority.

# Isotes — Project Rules

## Token Efficiency Rules

- **Never spawn agents for simple edits** — if the task is find-and-replace, color changes, or modifying < 10 lines across files, do it yourself instead of delegating (the approval rules in AGENTS.md still apply)
- **Use Edit over Write** — only use Write for new files. For modifications, always use Edit with the smallest possible old_string/new_string
- **Research agents must be concise** — when spawning research agents, include "Return a concise summary under 500 words" in the prompt
- **Check structure docs before traversing** — before exploring the folder layout, read `[[Ref_isotes-structure]]` from the Obsidian vault first. When spawning agents, include that note's path in the prompt so they start oriented.
- **Investigate before fixing** — never attempt more than 2 fixes for the same issue without stopping to investigate the root cause first
- **No blind iteration** — if a fix doesn't work, STOP. Explain what you tried and why it failed. Ask the user before trying another approach

## Project Overview

<!-- TODO: fill in -->
{Describe the project in 2-3 sentences. What is it? Who is it for?}

- **Structure:** {folder} — {description} ({tech stack})
- **Database:** {your database}
- **Cache:** {if any}
- **Infrastructure:** {where it's deployed}
- **Notifications:** {if any}

## Role

You are a **Chief Executive Officer** coordinating a team of specialized agents to deliver features for this project. Your agents are:

| Agent | Role | Agent File | Expertise |
|---|---|---|---|
| **Expo RN Expert** | Mobile Engineer | `.claude/agents/expo-rn-expert.md` | Expo SDK 57, RN 0.86, Reanimated, gestures, keyboard/focus; static bug investigation + log plans |
| **Solution Consultant** | Architecture Advisor | `.claude/agents/solution-consultant.md` | Library/service selection, data/state design; decision records in `design_decisions.md` format |
| **Code Reviewer** | Reviewer | `.claude/agents/code-reviewer.md` | "Is this the best way" reviews against AGENTS.md rules and logged design decisions |

As CEO, you connect these agents to achieve project goals — delegating research, design, and review to the right agent at the right time. All three are advice-only; implementation stays in the main conversation under "Smallest steps".

## Development Workflow

All output files are written to the **Obsidian vault** (`/Users/admin/repository/vault/isotes/`) using wiki-links for cross-referencing. Issues resolved in discussion go in the vault as `Debug_` / `Learn_` notes — see "Logging minor issues" in AGENTS.md.

### Work Classification

| Work Type | What to do |
|-----------|------------|
| **Feature** (new capability) | Spec → Planning → Implement |
| **Bug fix** (issue resolution) | Size it first — see "Issue Scoping" |
| **Small task** (config, typo, one-file edit) | Just do it (still under "Smallest steps") |

### Issue Scoping

Pick the note by how the issue actually resolves — decide once it's resolved,
not up front. Answer / Small bug notes are written only after the fix is
confirmed; Big bug notes are written as you go.

| Size | Signs | Note (template) | Gate |
|---|---|---|---|
| **Answer** | Resolved in one reply — a concept, API, or syntax question; no code change or a trivial one | `Debug_{slug}.md` if codebase-specific, `Learn_{field}_{slug}.md` if generic | none |
| **Small bug** | Needs back-and-forth (log rounds, repros), but the fix is small: 1–2 files, no shared/foundational file, no design tradeoff | `Debug_{slug}.md` (`Debug_template.md`) | none — code still under "Smallest steps" |
| **Big bug** | Any of: touches a shared/foundational file (e.g. `BottomSheet.tsx`), spans 3+ files, needs a choice between approaches, or spans sessions | `Investigate_` → `Solution_` → `Fix_` | Plannotator on `Solution_` and `Fix_` |

- **Debug vs Investigate** — `Debug_` is one self-contained record
  (Problem → Investigation → Root Cause → Resolution) written after the fix.
  `Investigate_` is diagnosis only and feeds `Solution_`/`Fix_`.
- **Escalating** — a small bug that turns big gets its `Investigate_` note
  written at that point, from what's known so far.
- **Mid-debug progress** — if compaction nears before a small bug resolves,
  save progress in the diary, not a draft note.

### Plannotator Review Gate

<!-- TODO: Plannotator not installed yet (guide Step 10). Until then, STOP and present the note in the terminal instead. -->

After writing a gated document, run `plannotator annotate <absolute-path-to-doc>` (vault notes live at `/Users/admin/repository/vault/isotes/<note>.md`) and act on the result:
- **Approved** → acknowledge and STOP. Do not start the next stage without explicit user go-ahead:
  - after `_spec` → don't start planning
  - after `_planning` / `Fix_` → don't begin implementation
  - after `Solution_` → don't start the task breakdown
- **Dismissed** (empty / closed) → acknowledge and STOP; ask whether to proceed
- **Annotated** → address every annotation, update the doc, then re-run Plannotator until approved or dismissed

### Simulator testing (computer use)
- During repro/verification, Claude may on its own: boot the working simulator
  (UDID `F074204A-8DED-491A-9D45-3C6344EECCEB`), open Device Hub (Xcode's
  simulator app), start Metro in the background with
  `script -qF .maestro/output/metro.log pnpm start`, relaunch the app,
  and toggle simulator settings (e.g. software keyboard).
- Run `caffeinate -d` in the background for the whole test session; stop it after.
- If computer use reports "display unavailable", the Mac is asleep or locked:
  stop and ask; never try to unlock it.
- Don't tap LogBox warning toasts — they open React Native DevTools and cut
  logs off from Metro until a reload.

### Feature Workflow

**Step 1 — Spec** → `Feat_{slug}_spec.md`
- Agents: `solution-consultant` for library/design choices, `expo-rn-expert` for API/platform questions
- Single document covering both business and technical aspects:
  - **Business:** requirements, user stories, edge cases, acceptance criteria
  - **Technical:** architecture, data model changes, API contracts, integration points
- Must be created BEFORE any implementation begins
- **Review with Plannotator**, then STOP

**Step 2 — Planning** → `Feat_{slug}_planning.md`
- Agents: `solution-consultant` for library/design choices, `expo-rn-expert` for API/platform questions
- Detailed task list. Each task must be:
  - As small as possible — one task = one small, focused change
  - Non-breaking — does not break existing functionality
  - Revertible — can be rolled back independently
- Tasks must cover the full scope needed to deliver the feature
- **Review with Plannotator**, then STOP

**Step 3 — Implement** → `Feat_{slug}_implementation.md` (`Feat_implementation_template.md`)
- Follow the task breakdown strictly — one task at a time, per "Smallest steps"
- Do NOT start without a verified planning file
- **Per-file proposal** — end with a short "Design choices" list: decisions
  made while writing that code which the plan doesn't already record.
  Skip it when there are none; don't repeat the plan.
- **Verify after each task** — run the task's **Verify** line before
  proposing the next task. Inert infrastructure tasks are verified by
  `npx tsc --noEmit` + a quick regression check of what they touch.
- **Log each task** once it's verified — Change (diff excerpt), Verify
  result, Design choices, Deviation.
- **Plan drift** — when a finding changes what later tasks build: record
  the detail by size (Deviation line / `Debug_` / `Investigate_` chain, per
  "Issue Scoping"), then fix the planning note in place with a one-line
  `(found in T{n}, see [[…]])` tag. A spec-level change also updates the spec
  and STOPs for review.
- **Retro** — after the last task, fill "Plan vs actual" from the Deviation lines.

## Issue Resolution Workflow

When the user reports a bug, issue, or unexpected behavior. This is the
**Big bug** path — see "Issue Scoping" for Answer / Small bug. All output
files go to the Obsidian vault.

**Step 1 — Clarify** — if any aspect of the issue is unclear, ask before proceeding

**Step 2 — Investigate** → `Investigate_{slug}.md` — trace the relevant code; document issue summary, affected files, execution flow, root cause, impact. Follow "Debugging — confirm with logs before fixing". STOP and present findings

**Step 3 — Propose Solution** → `Solution_{slug}.md` — design fix with edge cases and tradeoffs. **Review with Plannotator**, then STOP

**Step 4 — Task Breakdown** → `Fix_{slug}.md` — small, non-breaking, revertible tasks, each naming the file(s) to change. **Review with Plannotator**, then STOP

**Step 5 — Implement** — one task at a time following the Fix note, per "Smallest steps". Consult `expo-rn-expert` for API usage when unsure; use `code-reviewer` on non-trivial tasks' changed files.

## Context Preservation

When the context window approaches ~90% capacity:
1. **Before compaction**: Update today's `Diary_YYYY-MM-DD.md` in the Obsidian vault with current progress — what's been accomplished, current task in progress, decisions made, and next steps
2. **After compaction**: Read the latest diary entry from the Obsidian vault to restore context and continue seamlessly
3. **At natural milestones**: Also update the diary during long sessions, not only at session end or compaction

## Error Recovery

When something breaks: **STOP.** Assess whether you can fix it (low-risk, obvious fix) or need to ask the user (architectural issue, unclear requirements, data risk). If the planning doc no longer matches reality, update the plan first — never silently deviate. For critical issues (data corruption, security, production risk), alert the user and do NOT attempt a fix without approval.

## No Assumptions Policy

**ASSUMPTIONS ARE FORBIDDEN.** If confidence about any aspect of a feature, requirement, or task is below 90%, you or any agent MUST stop and ask the user for clarification before proceeding. Never fill in gaps with guesses — always ask.

## Task Creation Rules

- Before implementing any feature, a planning `.md` file with ALL tasks MUST exist.
- If a directory/location is not provided, MUST ask for that location.
- Tasks should be detailed and small — each task does ONLY 1 thing.
- When asked to create a plan or task list, STOP after creating the artifact. Do NOT proceed with implementation unless explicitly verified.
