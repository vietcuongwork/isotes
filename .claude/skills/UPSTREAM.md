# Upstream: mattpocock/skills

Copied from https://github.com/mattpocock/skills at `4588b32` (2026-10-05), MIT — see `LICENSE-mattpocock-skills`.
`teach` lives user-wide in `~/.claude/skills/teach/`.

| Here | Upstream path |
|---|---|
| `grilling`, `grill-me`, `wait-what`, `writing-for-agents` | `skills/productivity/<name>` |
| `grill-with-docs`, `diagnosing-bugs`, `tdd`, `codebase-design`, `domain-modeling`, `prototype`, `research`, `improve-codebase-architecture`, `retro`, `wizard` | `skills/engineering/<name>` |
| `review-two-axis` | `skills/engineering/code-review` (renamed: clashes with the built-in `code-review`) |
| `to-phases` | `skills/engineering/to-tickets` (adapted: phases in the vault planning note, no tracker or publishing; tasks inside phases) |

To see upstream changes since the copy, in a clone of the upstream repo:

```bash
git diff 4588b32..HEAD -- skills/engineering/tdd
```
