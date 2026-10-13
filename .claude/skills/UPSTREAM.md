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
| `.claude/principles/<name>.md` (prefix dropped, frontmatter kept; private, git-ignored; indexed in `.claude/rules/isotes-principles.md`) | `pstack/skills/principle-<name>/SKILL.md` |
| `.claude/rules/isotes-typescript.md` (a path-scoped rule, not a skill; private) | `pstack/skills/typescript-best-practices/SKILL.md` |
| `documentation/typescript-patterns.md` (unchanged; private) | `pstack/skills/typescript-best-practices/references/patterns.md` |

Local edits to keep on re-sync (`create-verification-skill/SKILL.md`): `.cursor/skills/` → `.claude/skills/`; §5 "Offer the maintenance loop" dropped, since `maintain-verification-skill` isn't ported (its loop ends in a PR; revisit when the feature map drifts). `verify-isotes` is this generator's output, not upstream.

Local edits to keep on re-sync (principles; each is one line, so an isotes rule wins inside the copy). `never-block-on-the-human` isn't ported.
- `outcome-oriented-execution`: "Intermediate breakage is acceptable …" → every task stays non-breaking (CLAUDE.md Planning); "Declare where temporary breakage is acceptable" → name the phase that removes any temporary form (expand–contract).
- `fix-root-causes`: "When stuck, instrument. Don't guess" → two quick fixes first, each reverted if it fails (`diagnosing-bugs` Phase 0), then instrument.
- `guard-the-context-window`: "Keep frequently used content inline" → keep skills around 100 lines, longer content in reference files.
- `prove-it-works`: "the **show-me-your-work** skill" (not ported) → the task's Verify line in the implementation note.
- `explain-the-number`: the `benchmark-checklist` link (not ported) → "check that it repeats and that the work really happened before you report it".
- `minimize-reader-load`: "wrappers with one caller" → pass-through wrappers only; a one-caller function that names a separable concern stays (AGENTS.md "Function scope").
- `test-behavior-not-implementation`: "For a mock, assert the payload it received" → for a mock at a system boundary only (`tdd/mocking.md`).
- `type-system-discipline`: after "Derive types from authoritative schemas", a line that `schema.ts` mirrors tokens by hand and code past a transform uses `src/types/` (AGENTS.md, `isotes-architecture`).

Local edits to keep on re-sync (`isotes-typescript.md`):
- Frontmatter: Cursor's `name`/`description`/`paths`/`disable-model-invocation` → `paths:` `src/**/*.ts`, `src/**/*.tsx`.
- A **Scope** line after "Apply … first": code a task writes or changes; branded types and object args only where the area already uses them or the task says to; no retrofits (AGENTS.md rule 7).
- Exhaustiveness: adds `return _exhaustive;` (a bare declaration fails `pnpm check`'s 0-warning cap).
- Schema-derived types: adds "past a transform function, derive from `src/types/`, never from schema row types" (AGENTS.md).
- Structured telemetry: `console.log` allowed for the permanent `[lifecycle]` lines in `_layout.tsx`.
- "Examples: `references/patterns.md`" → `documentation/typescript-patterns.md`.

```bash
git diff 11713c6..HEAD -- pstack/skills/create-verification-skill 'pstack/skills/principle-*' pstack/skills/typescript-best-practices
```

To check every local copy against `11713c6` (or name files as arguments), from the repo root:

```bash
.claude/skills/pstack-diff.sh
```

It prints `same` or a diff per file, then a `-- N files: …` summary, and exits 1 on a missing, unmapped or unfetched file. Every diff should be one of the local edits listed above.
