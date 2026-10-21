# Add expense

A user adds an expense from a trip's Expenses tab: they type the amount on the app's number pad, can describe it, and save it with themselves ("You") as the default payer. Closing the sheet keeps an unsaved draft, which the next open restores with a "Start over" option.

## Sub-features

- `ae-amount` types an amount on the number pad, including the decimal point for two-decimal currencies.
- `ae-description` stores an optional description ("What was it for?").
- `ae-draft-restore` closing without saving keeps a draft; reopening shows "Picked up where you left off" with its values.
- `ae-start-over` "Start over", confirmed in its dialog, clears the draft back to a blank expense.
- `ae-save` saves the expense paid by You, split equally, and lists it on the Expenses tab.

## How to get to it (user POV)

- A trip's Expenses tab: the `+` button ("Add expense").
- In New expense: the amount field opens the number pad; "Done" closes it. The sheet's close button keeps the draft.
- The draft banner's "Start over" chip opens a "Start over?" dialog: "Keep editing" or "Start over".

## Driving it with Maestro

Preconditions:

- `scripts/doctor.sh` → `doctor: ok`.
- No MCP steps planned for the rest of this session.

- **Run it.** Run SKILL.md's "Whole flow" command with `add-expense` (`flows/add-expense.yaml`). Exit code `0`; the last line is `Assert that "No expenses yet" is not visible... COMPLETED`.
- **Trip.** Creates `Flow add-expense <MM-DD HH:mm>` in AUD: Return twice opens the wheel, swipes down until `Australian Dollar \(AUD\) - \$`, `Close sheet`. Result: `Currency, Australian Dollar, AUD` (see `create-trip.md`).
- **Leave a draft.** `Add expense` → the amount field (placeholder `0.00`) → wait for `id: number-pad` → `1`, `2`, `Decimal point`, `5` → `Done`. Result: `12.5`. Then `What was it for\?` → `Flow draft` → Return → `id: sheet-close`.
- **Restore.** `Add expense`. Result: `Picked up where you left off` and `Flow draft`.
- **Start over.** The chip `Start over` → `Start over\?` → the dialog's `{text: "Start over", rightOf: "Keep editing"}`. Result: neither the banner nor `Flow draft` is visible.
- **Save.** The amount field → `7`, `Decimal point`, `2`, `5` → `Done` (`7.25`, `Y, You paid`) → `Save expense`. Result: one row labelled `.*, You paid, \$7\.25` (a row is one VoiceOver element), and `No expenses yet` is gone.
- **Proof: stored expense.** Run `.claude/skills/verify-isotes/scripts/db.sh "SELECT e.amount, m.name, coalesce(e.description, '<none>'), e.split_method FROM expenses e JOIN members m ON m.id = e.paid_by_member_id WHERE e.trip_id = (SELECT id FROM trips WHERE name LIKE 'Flow add-expense %' ORDER BY created_at DESC LIMIT 1)"`. Output: exactly one row, `7.25|You|<none>|equally` (the draft's description was not saved).

## Gotchas

- Drafts live in memory: a cold launch (`launchApp`) drops them, so a flow that needs a draft makes one after launching.
- "Start over" is both the banner chip and the dialog's confirm button; select the button by `rightOf: "Keep editing"`.
- The amount field has no label: its placeholder is `0.00` for two-decimal currencies and `0` for VND. The field shows what was typed (`12.5`), not a padded value.
- The pad's keys are labelled by digit; the decimal key is `Decimal point`, the delete key `Delete`. Pad taps use `retryTapIfNoChange` (a dropped tap was seen once).
- Text selectors are regex: escape `?` and `$`.
