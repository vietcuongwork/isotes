# Golden path

The app's core loop: a user creates a trip in Vietnamese Dong, adds a 90,000 expense that they paid, adds two people, splits it equally three ways, and sees the saved expense say what they lent.

## Sub-features

- `gp-create-trip` creates a trip with a name and the VND currency, landing on its Expenses tab.
- `gp-amount` enters 90,000 on the number pad; VND shows no decimals.
- `gp-add-people` adds two people to the trip from the payer sheet.
- `gp-payer` keeps "You" (the trip's owner, present on every trip) as payer.
- `gp-split-equally` splits equally: ₫30,000 each across three people, summing to 90,000.
- `gp-save` saves the expense; its row shows the amount, who paid and what the payer lent.

## How to get to it (user POV)

- Start screen after a cold launch: "Start your first trip" (shown even when trips exist).
- A trip's Expenses tab: the `+` button ("Add expense").
- In New expense: the "You paid" row opens the payer sheet, which has "Add a person"; "Equally" sets the split.

## Driving it with Maestro

Preconditions:

- `scripts/doctor.sh` → `doctor: ok`.
- No MCP steps planned for the rest of this session (the CLI run kills the MCP driver).

- **Run it.** Run SKILL.md's "Whole flow" command with `golden-path` (`flows/golden-path.yaml`). Exit code `0`; the last line waits for the saved row `.*, You paid, ₫90,000, you lent ₫60,000`.
- **Create the trip.** "Start your first trip" → the name field (placeholder `Kyoto in spring`) → Return twice (name → note → opens the currency sheet) → scroll the list until `Vietnamese Dong, VND, ₫` is visible → tap it (the row picks and closes the sheet) → `Create trip`. Result: `Expenses, tab, 1 of 3` is `selected: true` and the trip name is visible.
- **Enter the amount.** `Add expense` → the amount field (placeholder `0`) → wait for `id: number-pad` → `9`, then four `{text: "0", below: "Delete"}` → `Done`. Result: `90,000`.
- **Add two people.** `Y, You paid` → `Add a person` → `Enter name` → `Ana` → Return → `Add to trip`; again with `Ben`; then `Y, You` → `id: sheet-close`. Result: the sheet closes with You as payer.
- **Split equally.** `Equally`. Result: `₫30,000 each · 3 people`.
- **Save.** `Save expense`. Result: one row labelled `<activity>, You paid, ₫90,000, you lent ₫60,000` (a row is one VoiceOver element, so its texts are matched together).
- **Proof: stored expense.** Run `.claude/skills/verify-isotes/scripts/db.sh "SELECT e.amount, e.split_method, m.name FROM expenses e JOIN members m ON m.id = e.paid_by_member_id WHERE e.trip_id = (SELECT id FROM trips WHERE name LIKE 'Flow golden-path %' ORDER BY created_at DESC LIMIT 1)"`. Output: `90000.0|equally|You`.
- **Proof: stored splits.** Run SKILL.md's Helpers splits query. Output: `Ana|30000.0`, `Ben|30000.0`, `You|30000.0`.
- **Proof: screen.** Run SKILL.md's tree read (after the flow, so isotes is in front). Output: the row label, `<activity>, You paid, ₫90,000, you lent ₫60,000`.

## Gotchas

- Only a cold launch reaches the start screen; neither a back swipe nor the menu leaves a trip. Deep links are ignored while a trip is open.
- `hideKeyboard` taps outside the keyboard and lands on the currency field, reopening its sheet. Use Return through the form instead.
- VND is the last of the 34 rows, so `scrollUntilVisible` scrolls the whole list.
- The number pad has dropped synthetic taps (one run read `900`); the flow retries a tap only when the screen didn't change.
- The amount field, `Enter name` and the pad's `0` are matched by placeholder or position, not a label or `testID` yet.
- The Balance tab is an empty stub: check on the Expenses tab. The trip header shows `$0.00` in USD on a VND trip; don't assert it.
- Each run adds a `Flow golden-path …` trip with Ana and Ben; nothing is deleted.
