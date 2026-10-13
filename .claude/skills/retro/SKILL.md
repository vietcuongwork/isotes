---
name: retro
description: "Conduct a retrospective on a coding session."
disable-model-invocation: true
---

The user has asked for a **retrospective**. You are suggesting improvements to the coding agent's **environment** to improve future runs.

## Steps

1. Call the Skill tool with `writing-for-agents` for the writing style guide.

2. Read the primary sources for the session the user specifies. This may mean searching through session logs on this machine. If the user doesn't specify a session, default to the current one.

3. Look for candidates for improvement in these categories.

- **Navigation**: how easy was it for the agent to find the right files? Are there hidden dependencies between files? Would a **navigation pointer** make it easier? _Use when_ the session took a long time to find a piece of information.
- **Automated checks**: are there automated checks that could catch errors the agent made? Linting, typing, tests, filesystem linters? Read the repo's own check command first (its `package.json`/build-tool `lint`/`check` scripts, its CI workflow), so a check that already exists but sits unwired or silently broken is the finding, not a reinvention. A repo with no **guardrail** (no pre-commit hook and no CI job running its lint/typecheck/test command) is itself a finding: an un-linted repo is a standing missed opportunity, not a neutral default. _Use when_ the agent made a mistake an automated check could have caught, or the repo has no guardrail at all.
- **Coding standards**: should the **reviewer agent** be given a new rule to enforce? Should an existing rule be removed or clarified? Classify the violation first: a **mechanical** one (a fixed syntactic pattern, a banned API, an import shape, a file-location rule) gets a deterministic check, full stop: a custom rule in the repo's own linter, a new pre-commit hook, or a new CI job, whichever the repo's language and existing guardrail make cheapest. Default to building the check over writing the rule. A check's failure message has three parts: what's wrong, why (the rule or `[[note]]`), and the fix to make. Reserve the reviewer's criteria (`.claude/agents/code-reviewer.md`, the ADRs in `documentation/adr/`) for genuine **judgement calls** (cross-file consistency, "matches the surrounding style," anything no guardrail could ever substitute for). _Use when_ the reviewer agent failed to catch a mistake.
- **Global AGENTS.md**: are there any steering instructions that should be moved to coding standards (or automated checks) instead? _Use when_ the AGENTS.md file is particularly large - in the repo OR the user's global scope.
- **Tool economy**: did the agent make expensive tool calls that could be streamlined? Is there any custom tooling (CLI's, MCP's) that is particularly token-inefficient? _Use when_ the agent made an expensive tool call.
- **No-ops**: look for instructions in steering files that don't modify the agent's behavior. _Use when_ the steering files are large and unwieldy.
- **Information access**: look for opportunities to increase the agent's access to information. Teeing dev server logs, readonly access to third-party services. _Use when_ a crucial piece of information was not available to the agent.
- **Harness rot**: list file paths named in `AGENTS.md`, `CLAUDE.md`, `.claude/rules`, `.claude/agents` and skills, and flag any that no longer exist (historical examples may keep old names if they read as history). Also flag the same rule stated in two places, two rules that contradict, and accepted ADRs whose "Revisit when" has come true. _Use when_ a feature's last task is logged.
- **Entropy sweep**: report counts, compared with the last retro's where the diary has them: lint errors/warnings; `TODO|FIXME` in `src` not listed in a planning note's "Out of scope, flagged"; harness-rot hits; test files per `src/features/*` and `src/db` (0 = untested module); age and size of uncommitted work. For each count that improved, name the anchor that confirms it (device check, ticked acceptance criterion, review finding): a number that improved with no anchor is a Goodhart candidate. _Use when_ a feature's last task is logged.
- **Setback layers**: tally the `[spec|context|env|verify|state|observe]` prefixes on Deviation lines since the last retro. The most frequent layer is the first place to invest. _Use when_ the implementation note has tagged Deviations.
- **Routing gaps**: for each "not yet a rule (gap)" row in the vault's `Ref_workflow-skills.md` → Routing, count how often that situation happened since the note was written (Deviation lines, diaries). The second occurrence → propose the rule. _Use when_ any retro runs.
- **Model change**: list rules that compensate for model behaviour (not user preferences) and propose removing one at a time, checking the next few sessions for regressions. _Use when_ the session ran on a newer model than the last retro.
- **Principle pruning**: take the last 4 weekly reports (`~/.claude/usage/<week>.json`) whose `fingerprints` list `.claude/principles/` files. For each principle with no `typed` or `called` use in any of them, propose a vault `Tasks_backlog.md` item "drop or reword its use-when line?"; the user decides each one. Fewer than 4 such reports: say so and prune nothing. _Use when_ any retro runs.

4. Present these candidates to the user, in order of severity.

5. Each suggestion the user accepts is applied per "Smallest steps" (AGENTS.md) — retro proposes, it doesn't edit.

## Reference

### Implementation vs Review

Remember that all work goes through two stages: implementation and review. The implementation agent has the most **context pressure**. They are responsible for exploration, writing code, and debugging failures.

The review agent has the least context pressure - it receives a diff, so no exploration needed. It often does not need to write code or debug.

This means that the review agent should be responsible for imposing coding standards, not the implementation agent.

### Files

You have access to several files in the repo:

- `CLAUDE.md`/`AGENTS.md`: these files are pushed to the context window of any agent working in this repo. They should be used incredibly sparingly, usually only for **navigation pointers** to other files.
- `.claude/rules/*.md`: loaded into every session like `CLAUDE.md`, so the same sparing rule applies — move anything only needed at review time out of them.
- `.claude/agents/code-reviewer.md` and the ADRs in `documentation/adr/`: read during review, not implementation — the home for review-only standards.
- The Obsidian vault (`/Users/admin/repository/vault/isotes/`): `Debug_` / `Learn_` notes are where resolved issues are recorded; a repeated `Debug_` cause is a candidate for an automated check.
- Docs: use docs as references files, pointed to by other files. Look for existing docs before writing new ones.
- Skills: use skills for docs (since their description goes into the agent's context window), or for user-invoked commands. Follow the advice in the `writing-for-agents` skill.
