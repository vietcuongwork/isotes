# Data layer roadmap

## Current stage (anonymous, local-only)

- **Zustand** holds reactive in-memory state (`src/stores/store.ts`).
- **SQLite** (`expo-sqlite`, via `src/db/`) is the actual persistence layer and source of truth — not `zustand/middleware`'s `persist`. Zustand mirrors what's in SQLite; actions write to SQLite first, then update in-memory state.
- IDs generated with `expo-crypto`'s `randomUUID()`.
- No cloud backend, no auth. Matches the "Anonymous / link-only access, Sign in to save" UI state — everything here is device-local.

## Why SQL over NoSQL for this app

The domain is relational: projects → expenses → participants → splits, and the Balances/Analytics screens need aggregation (`SUM` grouped by person). SQL does this natively; a NoSQL/document model (e.g. Firestore) would require denormalizing that data and computing aggregates client-side or in cloud functions. This preference holds regardless of which cloud backend gets picked later.

## Cloud backend options considered (not decided, not started)

Deferred until real accounts/sign-in work begins. Options on the table:

- **Firebase/Firestore** — NoSQL, but ships an all-in-one managed product: cloud DB + local cache + realtime sync + offline queueing built into the client SDK. Least setup, but fights the relational shape of this app's data (aggregation needs denormalization or cloud functions).
- **Supabase + PowerSync/ElectricSQL** — Supabase = hosted Postgres + auth + realtime + REST/GraphQL API (the "Firebase but SQL" provider). Supabase alone does *not* sync a local SQLite replica — that needs a separate sync engine (PowerSync or ElectricSQL) bridging Postgres (cloud) and SQLite (local). Two vendors integrated together; full relational power.
- **Turso** — cloud database on libSQL (a SQLite fork) with built-in "embedded replica" support: an actual local SQLite file kept in sync with the cloud copy by Turso itself, one vendor. Closest SQL-world equivalent to what Firebase provides as a single bundled product (cloud + local cache + sync, batteries included).

## useLiveQuery / enableChangeListener (not in use yet)

Drizzle's `useLiveQuery` hook (from `drizzle-orm/expo-sqlite`) gives a component a reactive query that auto-refreshes whenever the underlying rows change — no manual refetch after a write. It requires change-listening to be enabled on the SQLite connection (`openDatabaseSync(name, { enableChangeListener: true })`), which `src/db/client.ts` does not currently set. Not needed yet since no screen queries reactively — revisit when a screen (e.g. expense list) should live-update as rows are written elsewhere, instead of manually re-querying/updating Zustand state after each write.

## Decision rule for later

Whichever backend is chosen, keep `src/db/` as the local data-access layer and `src/stores/` as the reactive layer on top of it — that boundary shouldn't need to change when a cloud sync layer is added underneath `src/db/`.

## Zustand vs useLiveQuery — not complementary, two solutions to the same problem

Both exist to keep UI in sync with SQLite after a write; they're alternatives, not a stack.

- **useLiveQuery** wins for screens that only need to reflect *local* SQLite state — it subscribes a component straight to a query and re-runs it whenever the underlying rows change, no manual mirroring step. Good fit for things like "Recent Projects."
- **Zustand** earns its keep once state stops being "just what's in local SQLite" — e.g. a member/collaboration flow reconciling API responses against a real remote database, optimistic updates, or any state that isn't 1:1 with a local query. `useLiveQuery` only reacts to local SQLite writes, not network/API state, so it can't cover that case.

## Stack navigation and "on mount" fetches

React Navigation's stack keeps Screen A mounted when Screen B is pushed on top — going back to A does **not** remount it, so a `useEffect(() => { fetch() }, [])` on A won't see writes made on B. A plain mount-effect fetch is only safe for screens with no upstream stack (e.g. a true entry screen), or ones that don't need to reflect changes made elsewhere. Otherwise use `useFocusEffect` (refetch every time the screen regains focus) or `useLiveQuery` (auto-updates regardless of focus).
