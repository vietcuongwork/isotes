---
name: commit-message
description: Suggest a commit message for isotes in its house format, plus the runnable git commit command, and write pull request descriptions. Use when the user asks to git diff and suggest a commit message, to commit, to open a pull request, or when autopilot ends at a Demo.
---

# Commit message

1. Read the change: `git diff` (and `git diff --staged`, `git status --porcelain` for new files). Describe only what the diff shows.
2. Write the message:
   - Header: `<category>: <short summary>`, lowercase first word after the colon.
   - Only these three categories: `feature`, `refactor`, `bugfix`.
   - Body: one bullet per change, each prefixed with its own category (`feature:`, `refactor:`, or `bugfix:`), lowercase first word, grouped feature bullets first, then refactor, then bugfix.
   - No `Co-Authored-By:` / `Claude-Session:` attribution lines (AGENTS.md "Hard constraints").
3. Give the runnable command, not just the text, so it can be pasted straight into the terminal:

```bash
git commit -m "$(cat <<'EOF'
feature: add trip balances

- feature: show per-member balances on the balance tab
- refactor: move split rounding into distributeRemainderToPayer
EOF
)"
```

Add a pathspec (`… )" -- <paths>`) when other changes are already staged that this commit shouldn't sweep in. The user runs the commit, except under `/worktree-finish`, where one yes on the shown commit message and pull request text covers the commit, the push and the pull request.

## Pull request description

Copy `.github/pull_request_template.md`, fill each section from the diff, and pass the result to `gh pr create` with `--body-file`, because the `gh` manual doesn't say it reads the template on its own. Tick a check only after it ran. Delete Notes when it's empty. The title is the commit header.

The repo is public, so describe the change in words and name only tracked code paths, keeping vault notes, `documentation/` and `.claude/` files out of it. End at the last section, with no tool attribution line (user, 2026-11-09).
