# Paid by & split

A user picks who paid an expense and how it's split. The payer sheet and the split sheet can each add a person to the trip. The split can be equal, custom amounts (the remainder goes to members left blank), or shares. The saved row then says who paid and what "you" owe or lent.

## Sub-features

- `ps-payer` picks a payer other than You from the payer sheet; the row reads `<initial>, <name> paid`.
- `ps-add-person-payer` adds a person to the trip from the payer sheet.
- `ps-add-person-split` adds a person to the trip from the split sheet.
- `ps-amounts` gives members custom amounts on the number pad; members left blank split the rest, and the summary reads `All <amount> assigned`.
- `ps-shares` steps a member's shares up or down; the summary reads `<per share> per share · <n> shares`.
- `ps-toggle` tapping a member's name in the split sheet takes them out of the split or back in.
- `ps-save` saves each expense; the stored splits sum to its amount.

## How to get to it (user POV)

- In New expense: the payer row (`Y, You paid` by default) opens the payer sheet, which has `Add a person`.
- The `Equally` / `Amounts` / `Shares` control sets the method; the people row below it (`<n> people`) opens the split sheet, which has the same control, `Add a person`, and one row per member.
- In the split sheet: `Amount for <name>` fields in Amounts, and `Remove a share for <name>` / `Add a share for <name>` steppers in Shares.

## Driving it with Maestro

Preconditions:

- `scripts/doctor.sh` → `doctor: ok`.
- No MCP steps planned for the rest of this session.

- **Run it.** Run SKILL.md's "Whole flow" command with `paid-by-split` (`flows/paid-by-split.yaml`). Exit code `0`; the last step waits for the row `.*, Ben paid, .*, you owe \$10\.00`.
- **Trip.** Creates `Flow paid-by-split <MM-DD HH:mm>` in the default AUD (see `create-trip.md`).
- **Amount.** `Add expense` → the amount field (placeholder `0.00`) → wait for `id: number-pad` → `6`, `{text: "0", below: "Delete"}` → `Done`. Result: `60`.
- **Payer, adding Ana.** `Y, You paid` → `Add a person` → `Enter name` → `Ana` → Return → `Add to trip` → `A, Ana` → `id: sheet-close`. Result: `A, Ana paid`.
- **Amounts, adding Ben.** `Amounts` → `2 people.*` → `Add a person` → `Enter name` → `Ben` → Return → `Add to trip`. Then `Amount for Ana` → `1`, `0`; `Amount for Ben` → `2`, `0` → `Done`. Result: `id: number-pad` stays visible between keys; `All \$60.00 assigned`.
- **Save.** `id: sheet-close` → `Save expense`. Result: a row labelled `.*, Ana paid, .*, you owe \$30\.00` (a row is one VoiceOver element).
- **Shares.** A second expense: `4`, `0` → `Done` → `Y, You paid` → `B, Ben` → `id: sheet-close` (`B, Ben paid`) → `Shares` → `3 people.*` → `Add a share for Ana` → `Add a share for Ben` (`\$8.00 per share · 5 shares`) → `Remove a share for Ben`. Result: `\$10.00 per share · 4 shares`.
- **Toggle a member.** `You` (`\$13.33 per share · .*`) → `You` again. Result: `\$10.00 per share · 4 shares`.
- **Save the shares expense.** `id: sheet-close` → `Save expense`. Result: a row labelled `.*, Ben paid, .*, you owe \$10\.00`.
- **Proof: stored splits.** Run `.claude/skills/verify-isotes/scripts/db.sh "SELECT e.amount, e.split_method, p.name, (SELECT group_concat(m.name || '=' || s.individual_amount, ' ') FROM expense_splits s JOIN members m ON m.id = s.member_id WHERE s.expense_id = e.id), (SELECT sum(s.individual_amount) FROM expense_splits s WHERE s.expense_id = e.id) FROM expenses e JOIN members p ON p.id = e.paid_by_member_id WHERE e.trip_id = (SELECT id FROM trips WHERE name LIKE 'Flow paid-by-split %' ORDER BY created_at DESC LIMIT 1) ORDER BY e.amount"`. Output: `40.0|shares|Ben|You=10.0 Ana=20.0 Ben=10.0|40.0` and `60.0|amounts|Ana|You=30.0 Ana=10.0 Ben=20.0|60.0`.

## Gotchas

- The people row's label carries the avatar initials (`2 people, Y, A`): match it with `2 people.*`.
- Payer rows are labelled `<initial>, <name>`; the sheet stays open after a pick, so close it with `id: sheet-close`.
- The pad must stay up between keys in the split sheet (a sheet opened from another sheet); the flow asserts `id: number-pad` after each field's first key.
- In Amounts and Shares, a member's fields and steppers are reached by their `Amount for <name>` / `Add a share for <name>` / `Remove a share for <name>` labels; the member's name is a separate element, and tapping it toggles the member.
- The pad's `0` key is selected `{text: "0", below: "Delete"}`: a bare `"0"` also matches amount placeholders and typed values.
- Text selectors are regex: escape `$`.
