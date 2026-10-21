# Create trip

A user starts a trip by naming it, optionally adding a note and choosing its currency; an empty name is refused, and a created trip opens on its empty Expenses tab with the user as its only member ("You").

## Sub-features

- `ct-name-required` refuses an empty name with "Give the trip a name to continue." and creates nothing.
- `ct-description` stores an optional note (the trip's description).
- `ct-currency` keeps the default currency (the newest trip's, or US Dollar with no trips) or picks another (golden-path picks VND).
- `ct-create` creates the trip with one member, "You", and lands on its empty Expenses tab.

## How to get to it (user POV)

- Start screen after a cold launch: "Start your first trip" (shown even when trips exist).
- In the form, Return moves name → note → opens the currency sheet; tapping the currency button opens it too.

## Driving it with Maestro

Preconditions:

- `scripts/doctor.sh` → `doctor: ok`.
- No MCP steps planned for the rest of this session.
- At least one trip exists, and `NEWEST_CODE` holds the newest one's code, read right before the run: `NEWEST_CODE=$(.claude/skills/verify-isotes/scripts/db.sh "SELECT currency_code FROM trips ORDER BY created_at DESC LIMIT 1")`.

- **Run it.** Run SKILL.md's "Whole flow" command with `create-trip` (`flows/create-trip.yaml`), adding `-e NEWEST_CODE="$NEWEST_CODE"`. Exit code `0`; the last line is `Assert that "No expenses yet" is visible... COMPLETED`.
- **Default currency.** "Start your first trip". Result: the currency button reads `Currency, .*, ${NEWEST_CODE}`.
- **Empty name.** `Create trip`. Result: `Give the trip a name to continue\.`.
- **Name and note.** The name field (placeholder `Kyoto in spring`) → the trip name → Return → `Flow description` → Return. Result: the currency sheet opens on `.* \(${NEWEST_CODE}\) - .*`.
- **Currency.** `Close sheet`. Result: the currency button reads `Currency, .*, ${NEWEST_CODE}`.
- **Create.** `Create trip`. Result: `Expenses, tab, 1 of 3` is `selected: true`, with the trip name, `Created .* · ${NEWEST_CODE}` and `No expenses yet`.
- **Proof: stored trip.** Run `.claude/skills/verify-isotes/scripts/db.sh "SELECT name, description, currency_code, (SELECT count(*) FROM members WHERE trip_id = t.id), (SELECT count(*) FROM expenses WHERE trip_id = t.id) FROM trips t WHERE name LIKE 'Flow create-trip %' ORDER BY created_at DESC LIMIT 1"`. Output: `Flow create-trip <MM-DD HH:mm>|Flow description|<NEWEST_CODE>|1|0`.

## Gotchas

- `hideKeyboard` taps outside the keyboard and lands on the currency button, reopening its sheet. Use Return through the form instead.
- The currency wheel exposes only its selected row, so the sheet's first visible row is the current currency, not a list.
- The default follows the newest trip, so a flow that needs one currency picks it on the wheel (`add-expense` and `paid-by-split` pick AUD). A swipe down from the wheel moves it about one row; a swipe up moves about five.
- Text selectors are regex: escape `( ) $` in currency rows (`\\(AUD\\) - \\$` in YAML).
- The trip header shows `$0.00` in USD whatever the currency; don't assert it.
- Each run adds a `Flow create-trip …` trip; nothing is deleted.
