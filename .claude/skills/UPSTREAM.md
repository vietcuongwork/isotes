# Upstream: mattpocock/skills

Copied from https://github.com/mattpocock/skills at `4588b32` (2026-10-05), MIT — see `LICENSE-mattpocock-skills`.
`teach` lives user-wide in `~/.claude/skills/teach/`.

| Here | Upstream path |
|---|---|
| `grilling`, `grill-me`, `wait-what`, `writing-for-agents` | `skills/productivity/<name>` |
| `grill-with-docs`, `diagnosing-bugs`, `tdd`, `codebase-design`, `domain-modeling`, `prototype`, `research`, `improve-codebase-architecture`, `retro`, `wizard` | `skills/engineering/<name>` |
| `review-two-axis` | `skills/engineering/code-review` (renamed: clashes with the built-in `code-review`) |
| `to-phases` | `skills/engineering/to-tickets` (adapted: phases in the vault planning note, no tracker or publishing; tasks inside phases) |

Local edits to keep on re-sync: `improve-codebase-architecture/SKILL.md` §1 passes "the structure map named in `CLAUDE.md`", not `documentation/project_structure.md` (2026-10-07). Harness batches A–D (2026-10-07, see the vault's `Ref_harness-engineering.md`): `retro` §3 gains Harness rot / Entropy sweep / Setback layers / Routing gaps / Model change and the what/why/fix line; `review-two-axis` gains the criteria table, item (d) and pasted Verify results; `to-phases` gains Phase 0 readiness and the golden-path run at acceptance (app features only); `diagnosing-bugs` gains the probe format (Phase 4), the touch-path check and log-first story (Phase 3), and the Big-bug Steps 1–5 (hand-off); `autopilot` gains the preflight/Demo additions. `commit-message` and `walk-through` are local skills (from AGENTS.md), not upstream.

To see upstream changes since the copy, in a clone of the upstream repo:

```bash
git diff 4588b32..HEAD -- skills/engineering/tdd
```
