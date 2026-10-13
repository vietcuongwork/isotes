# Create trip

A user starts a trip by naming it, optionally describing it and choosing its currency; an empty name is refused, and a created trip opens on its empty Expenses tab with the user as its only member ("You").

## Sub-features

- `ct-name-required` refuses an empty name with "Trip name is required" and creates nothing.
- `ct-description` stores an optional description.
- `ct-currency` keeps the default currency (Australian Dollar, the wheel's first row) or picks another (golden-path picks VND).
- `ct-create` creates the trip with one member, "You", and lands on its empty Expenses tab.

## How to get to it (user POV)

- Start screen after a cold launch: "Start your first trip" (shown even when trips exist).
- In the form, Return moves name → Description → opens the currency sheet; tapping the currency field opens it too.

## Driving it with Maestro

Preconditions:

- `scripts/doctor.sh` → `doctor: ok`.
- No MCP steps planned for the rest of this session.

- **Run it.** Run SKILL.md's "Whole flow" command with `create-trip` (`flows/create-trip.yaml`). Exit code `0`; the last line is `Assert that "No expenses yet" is visible... COMPLETED`.
- **Empty name.** "Start your first trip" → `Create trip`. Result: `Trip name is required`.
- **Name and description.** The name field (placeholder `Trip to Vegas`) → the trip name → Return → `Flow description` → Return. Result: the currency sheet opens on `Australian Dollar \(AUD\) - \$`.
- **Currency.** `Close sheet`. Result: the field reads `.*Australian Dollar, AUD`.
- **Create.** `Create trip`. Result: `Expenses, tab, 1 of 3` is `selected: true`, with the trip name, `AUD · created .*` and `No expenses yet`.
- **Proof: stored trip.** Run `.claude/skills/verify-isotes/scripts/db.sh "SELECT name, description, currency_code, (SELECT count(*) FROM members WHERE trip_id = t.id), (SELECT count(*) FROM expenses WHERE trip_id = t.id) FROM trips t WHERE name LIKE 'Flow create-trip %' ORDER BY created_at DESC LIMIT 1"`. Output: `Flow create-trip <MM-DD HH:mm>|Flow description|AUD|1|0`.

## Gotchas

- `hideKeyboard` taps outside the keyboard and lands on the currency field, reopening its sheet. Use Return through the form instead.
- The currency wheel exposes only its selected row, so the sheet's first visible row is the current currency, not a list.
- Text selectors are regex: escape `( ) $` in currency rows (`\\(AUD\\) - \\$` in YAML).
- The trip header shows `$0.00` in USD whatever the currency; don't assert it.
- Each run adds a `Flow create-trip …` trip; nothing is deleted.
