# Trips

A returning user opens the light Trips list from Welcome: every trip as a card, newest first, under "Your trips", a search field and an "ONGOING · N trips" row. Search matches part of a trip's name, ignoring case, accents and Đ/đ; a query that matches nothing shows "No trips match “…”" with a hint, and a user with no trips sees the sleeping raven and "No trips yet" with no search.

## Sub-features

- `tr-open` opens Trips from Welcome's "I've used it before".
- `tr-search` lists only the trips whose names contain the query, and the count follows.
- `tr-no-matches` shows "No trips match “{query}”" and its hint, hides the "ONGOING" row, and keeps New trip.
- `tr-clear` empties the query with the field's clear button and lists every trip again.
- `tr-no-trips` shows the sleeping raven, "No trips yet", its body line and New trip, with no search and no header raven.

## How to get to it (user POV)

- Welcome after a cold launch: "I've used it before".
- Back from a trip opened from a card: the swipe back returns to Trips with the query kept.

## Driving it with Maestro

Preconditions:

- `scripts/doctor.sh` → `doctor: ok`.
- At least one trip exists (`scripts/db.sh "SELECT count(*) FROM trips"` above 0); with none, Trips shows the no-trips state and has no search.
- No MCP steps planned for the rest of this session.

- **Run it.** Run SKILL.md's "Whole flow" command with `trips` (`flows/trips.yaml`). Exit code `0`; the last line is `Assert that "No trips match.*" is not visible... COMPLETED`. It writes nothing.
- **Open.** `I've used it before`. Result: `Your trips` and `Ongoing`.
- **No matches.** `Search trips` → type a query no name contains. Result: `No trips match “<query>”`, `Search looks at trip names.*` and `New trip`, with no `Ongoing`.
- **Clear.** `Clear text` while the field has focus. Result: `Ongoing` again and no `No trips match.*`.
- **Proof: one match.** Seed a trip by hand named `Flow <purpose> <MM-DD HH:mm>` with an accented name (for example `Flow Đà Lạt …` through Create trip), type an unaccented part of it (`da lat`), and assert its card (`Flow Đà Lạt <MM-DD HH:mm>,.*`) and `1 trip|1 TRIP`.
- **Proof: the count.** Clear the query and assert `<N> trips|<N> TRIPS`, where N is `scripts/db.sh "SELECT count(*) FROM trips"`.

## Gotchas

- The "ONGOING" count renders upper-case on screen but its label is the raw text: match `1 trip|1 TRIP` so either reads.
- The clear button is iOS's own (`Clear text`) and shows only while the field has focus; after coming back from a trip, tap `Search trips` first.
- With the no-matches message showing there is nothing to swipe, so `hideKeyboard` fails; close the keyboard with `pressKey: Enter` (the Search key).
- Cards are one accessibility element each, labelled `<name>, created <date>, <code>, <N people>, spent <total>, <position>`: match by regex on the name.
- The no-trips state needs an empty database. Check it on a temporary simulator with a fresh install, never by deleting trips on the working one.
- With 30+ trips, `scrollUntilVisible` to the oldest card needs `speed: 90` and a longer `timeout` than the 20 s default.
