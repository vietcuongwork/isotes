# Upstream: mattpocock/skills

Copied from https://github.com/mattpocock/skills at `4588b32` (2026-10-05), MIT — see `LICENSE-mattpocock-skills`.
`teach` lives user-wide in `~/.claude/skills/teach/`.

| Here | Upstream path |
|---|---|
| `grilling`, `grill-me`, `wait-what`, `writing-for-agents` | `skills/productivity/<name>` |
| `grill-with-docs`, `diagnosing-bugs`, `tdd`, `codebase-design`, `domain-modeling`, `prototype`, `research`, `improve-codebase-architecture`, `retro`, `wizard` | `skills/engineering/<name>` |
| `review-two-axis` | `skills/engineering/code-review` (renamed: clashes with the built-in `code-review`) |
| `to-phases` | `skills/engineering/to-tickets` (adapted: phases in the vault planning note, no tracker or publishing; tasks inside phases) |

Local edits to keep on re-sync: `improve-codebase-architecture/SKILL.md` §1 passes "the structure map named in `CLAUDE.md`", not `documentation/project_structure.md` (2026-10-07). Harness batches A–D (2026-10-07, see the vault's `Ref_harness-engineering.md`): `retro` §3 gains Harness rot / Entropy sweep / Setback layers / Routing gaps / Model change and the what/why/fix line; `review-two-axis` gains the criteria table, item (d) and pasted Verify results; `to-phases` gains Phase 0 readiness and the golden-path run at acceptance (app features only); `diagnosing-bugs` gains the probe format (Phase 4), the touch-path check and log-first story (Phase 3), and the Big-bug Steps 1–5 (hand-off); `autopilot` gains the preflight/Demo additions. ADR split (2026-10-12, see the vault's `Tasks_design-decisions-reorg.md`): `domain-modeling` writes one file per ADR in `documentation/adr/` with an index (`ADR-FORMAT.md` rewritten: Status/Date/Area header, superseding and amending, dated Note lines); `review-two-axis`, `diagnosing-bugs`, `improve-codebase-architecture`, `codebase-design`, `retro`, `to-phases` and `tdd` read the accepted ADRs in the touched area (`documentation/adr/README.md`) instead of `documentation/design_decisions.md`. `commit-message` and `walk-through` are local skills (from AGENTS.md), not upstream.

To see upstream changes since the copy, in a clone of the upstream repo:

```bash
git diff 4588b32..HEAD -- skills/engineering/tdd
```

# Upstream: cursor/plugins pstack

Copied from https://github.com/cursor/plugins at `11713c6` (2026-10-12), MIT, © 2026 Lauren Tan — see `LICENSE-pstack`.

| Here | Upstream path |
|---|---|
| `create-verification-skill` (`SKILL.md`, `references/feature-map-example/`) | `pstack/skills/create-verification-skill` |

Local edits to keep on re-sync (`create-verification-skill/SKILL.md`): `.cursor/skills/` → `.claude/skills/`; §5 "Offer the maintenance loop" dropped, since `maintain-verification-skill` isn't ported (its loop ends in a PR; revisit when the feature map drifts). `verify-isotes` is this generator's output, not upstream.

```bash
git diff 11713c6..HEAD -- pstack/skills/create-verification-skill
```
