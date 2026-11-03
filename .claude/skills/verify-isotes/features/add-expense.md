# Add expense

A user adds an expense from a trip's Expenses tab: they type the amount on the app's number pad, can describe it, and save it with themselves ("You") as the default payer. Closing the sheet keeps an unsaved draft, which the next open restores with a "Start over" option.

## Sub-features

- `ae-amount` types an amount on the number pad, including the decimal point for two-decimal currencies.
- `ae-description` stores an optional description ("What was it for?").
- `ae-activity` the activity field opens a two-column popover; a pick or a tap outside closes it.
- `ae-date` the date field opens the Date sheet: Today, Yesterday, the selected date's own pill and a Monday-first month; Done closes it.
- `ae-draft-restore` closing without saving keeps a draft; reopening shows "Picked up where you left off" with its values.
- `ae-start-over` "Start over", confirmed in its dialog, clears the draft back to a blank expense.
- `ae-save` saves the expense paid by You, split equally, and lists it on the Expenses tab.

## How to get to it (user POV)

- A trip's Expenses tab: the `+` button ("Add expense").
- In New expense: the amount field opens the number pad; "Done" closes it. The sheet's X ("Close", `id: sheet-close`) keeps the draft.
- In New expense: the activity field ("Activity, Lodging") and the date field ("Date, 27 Oct 2026") sit side by side. The date field opens the Date sheet, closed by its Done.
- The draft banner's "Start over" chip opens a "Start over?" dialog: "Keep editing" or "Start over".

## Driving it with Maestro

Preconditions:

- `scripts/doctor.sh` → `doctor: ok`.
- No MCP steps planned for the rest of this session.

- **Run it.** Run SKILL.md's "Whole flow" command with `add-expense` (`flows/add-expense.yaml`). Exit code `0`; the last line is `Assert that "No expenses yet" is not visible... COMPLETED`.
- **Trip.** Creates `Flow add-expense <MM-DD HH:mm>` in AUD: Return twice opens the currency sheet, then `Australian Dollar, AUD, \$` (the row picks and closes it). Result: `Currency, Australian Dollar, AUD` (see `create-trip.md`).
- **Leave a draft.** `Add expense` → the amount field (placeholder `0.00`) → wait for `id: number-pad` → `1`, `2`, `Decimal point`, `5` → `Done`. Result: `12.5`. Then `What was it for\?` → `Flow draft` → Return → `id: sheet-close`.
- **Restore.** `Add expense`. Result: `Picked up where you left off` and `Flow draft`.
- **Start over.** The chip `Start over` → `Start over\?` → the dialog's `{text: "Start over", rightOf: "Keep editing"}`. Result: neither the banner nor `Flow draft` is visible.
- **Pick activity and date.** `Activity, Lodging` → `What was it for\?` (tap outside: the popover closes, `Activity, Lodging` stays) → `Activity, Lodging` → `Food` (a pick closes it; `Activity, Food`). Then `Date, .*` → `Yesterday` → `id: sheet-close` (the sheet's Done). Result: `Previous month` is gone and the date field reads yesterday.
- **Save.** The amount field → `7`, `Decimal point`, `2`, `5` → `Done` (`7.25`, `You paid`) → `Save expense`. Result: one row labelled `.*, You paid, \$7\.25` (a row is one VoiceOver element), and `No expenses yet` is gone.
- **Proof: stored expense.** Run `.claude/skills/verify-isotes/scripts/db.sh "SELECT e.amount, m.name, coalesce(e.description, '<none>'), e.split_method, e.activity_id, e.date = date('now', 'localtime', '-1 day') FROM expenses e JOIN members m ON m.id = e.paid_by_member_id WHERE e.trip_id = (SELECT id FROM trips WHERE name LIKE 'Flow add-expense %' ORDER BY created_at DESC LIMIT 1)"`. Output: exactly one row, `7.25|You|<none>|equally|food|1` (the draft's description was not saved; `1` means the date is yesterday).

## Gotchas

- Drafts live in memory: a cold launch (`launchApp`) drops them, so a flow that needs a draft makes one after launching.
- "Start over" is both the banner chip and the dialog's confirm button; select the button by `rightOf: "Keep editing"`.
- The amount field has no label: its placeholder is `0.00` for two-decimal currencies and `0` for VND. The field shows what was typed (`12.5`), not a padded value.
- The pad's keys are labelled by digit; the decimal key is `Decimal point`, the delete key `Delete`. Pad taps use `retryTapIfNoChange` (a dropped tap was seen once).
- With a VND trip the field's `0` placeholder and the pad's `0` key both match `text: "0"`. Tap the pad's with `below: "Delete"`. Digits 1 to 9 take no `below`, since they sit above and left of Delete and the match fails. The `000` key is drawn but `text: "000"` finds nothing, so tap `0` three times.
- Text selectors are regex: escape `?` and `$`.
- A pick closes the activity popover. While it is open, a full-screen scrim sits over the sheet, so a tap on the date field only closes the popover and the Date sheet never opens.
- The Date, Paid by and Split sheets close with a text button "Done" that keeps `id: sheet-close`. On Paid by and Split with the pad open, "Done" matches both that button and the pad's; select the pad's as `{text: "Done", below: "Delete"}` (`childOf: number-pad` doesn't find the key). The New expense sheet itself has an X, so a plain "Done" there is the pad's.
- The currency chip is not a button: "Currency, {name}, the trip currency" in the tree, nothing to tap.
- The date label reads `d MMM yyyy` (`27 Oct 2026`), never "Today". Select it with `Date, .*`.
- Day cells are plain numbers; the `1` and `28` to `30` that outside days repeat are ambiguous, `31` is not. The quick picks and the activity rows show no radio or option trait in the idb tree, only `Selected` on the chosen row.
