# isotes verification map

This directory is the maintained source for verifying isotes' user-facing behaviour on the working simulator. Read this index before driving, then use the matching feature file as the recipe. Commands and helpers are in `../SKILL.md`.

## Baseline preconditions

- `scripts/doctor.sh` prints `doctor: ok` (Metro is this checkout's and answers, nothing else open on the simulator, Maestro 2.11.0).
- The session drives with one Maestro driver: the CLI for whole flows (these recipes), or the MCP server, never both.
- Never drive while the user is using the simulator by hand; ask when unsure.

## Driving conventions

- Every recipe is a flow in `../flows/`, run with SKILL.md's "Whole flow" command; it cold-starts the app with `launchApp`.
- Select by accessibility label, `testID` (`id:`) or visible text, never `point:`. Text selectors are full-string regex.
- A flow that writes creates its own trip, `Flow <flow> <MM-DD HH:mm>`, and never edits or deletes another. Flow trips stay; the user deletes them by hand.
- Treat commands as literal; keep quoted names and flags unchanged.

## Proof and skip reporting

- Capture the action and the state it leaves: the flow's own asserts, plus a read-only second view of stored values via `scripts/db.sh`.
- Pick the flow's trip as the newest by `created_at`: two runs in one minute share a name.
- Quote rows and tree values in the vault task log; run folders are scratch.
- Report an unreachable path with the command tried and the unmet precondition; never count a different path as verified.

## Feature entry contract

Each feature file starts with an H1 title and one paragraph on the user-visible behaviour, then exactly four H2s in this order: `Sub-features` (short IDs, one line each), `How to get to it (user POV)` (every user entry point), `Driving it with Maestro` (starts with `Preconditions:`, then labelled bullets pairing each user action with its flow step and observable result), `Gotchas` (traps that waste or invalidate a run). Keep implementation details out; name only user paths, stable handles, required state, commands and proof.

## Features

- [Golden path](./golden-path.md): create a VND trip, add a 90,000 expense paid by You, split equally three ways, and check the saved row and its splits.
- [Create trip](./create-trip.md): the empty-name refusal, name, description and default currency, landing on an empty Expenses tab.
- [Add expense](./add-expense.md): a decimal amount and description, the restored draft and Start over, and saving an expense paid by You.
- [Paid by & split](./paid-by-split.md): a payer other than You, Add person from both sheets, custom amounts and shares, with the stored splits summing to each amount.
