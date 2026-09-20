# Data layer roadmap

## Current stage (anonymous, local-only)

- **Zustand** holds reactive in-memory state (`src/stores/store.ts`).
- **SQLite** (`expo-sqlite`, via `src/db/`) is the actual persistence layer and source of truth — not `zustand/middleware`'s `persist`. Zustand mirrors what's in SQLite; actions write to SQLite first, then update in-memory state.
- IDs generated with `expo-crypto`'s `randomUUID()`.
- No cloud backend, no auth. Matches the "Anonymous / link-only access, Sign in to save" UI state — everything here is device-local.

## Why SQL over NoSQL for this app

The domain is relational: projects → expenses → participants → splits, and the Balances/Analytics screens need aggregation (`SUM` grouped by person). SQL does this natively; a NoSQL/document model (e.g. Firestore) would require denormalizing that data and computing aggregates client-side or in cloud functions. This preference holds regardless of which cloud backend gets picked later.

## Cloud backend options considered (not decided, not started)

All three below are actually answering the *same* three-part question: (1) a cloud DB to durably hold everyone's data, (2) a sync engine that queues local writes made offline and pushes them up / pulls remote changes down on reconnect, (3) a conflict-resolution rule for when the same row was changed on two offline devices before either synced. Local SQLite is already the "works offline" half regardless of which option is picked — the UI only ever reads/writes local SQLite, so offline capability isn't something to add later, it's already true today. What changes is what sits *underneath* `src/db/` to keep that local copy honest against a shared cloud copy.

- **Firebase/Firestore** — NoSQL, but ships an all-in-one managed product: cloud DB + local cache + realtime sync + offline queueing + conflict resolution (last-write-wins by default, or custom via transactions) built into the client SDK. Least setup, but fights the relational shape of this app's data (aggregation needs denormalization or cloud functions).
- **Supabase + PowerSync/ElectricSQL** — Supabase = hosted Postgres + auth + realtime + REST/GraphQL API (the "Firebase but SQL" provider). Supabase alone does *not* sync a local SQLite replica or queue offline writes — that needs a separate sync engine (PowerSync or ElectricSQL) bridging Postgres (cloud) and SQLite (local). PowerSync resolves conflicts per-table (commonly last-write-wins on a timestamp column); ElectricSQL leans toward CRDT-style merges so concurrent edits don't silently overwrite each other. Two vendors integrated together, but the local half stays SQLite — existing Drizzle schema/queries and `useLiveQuery` keep working unchanged, since they just react to local rows regardless of whether a local mutation or the sync engine wrote them.
- **Turso** — cloud database on libSQL (a SQLite fork) with an "embedded replica" feature: a local SQLite file kept in sync with the cloud copy by Turso's client library, one vendor. Verify its current write/offline-queueing maturity against the latest Turso docs before committing — this has been evolving and I don't want to assert a specific guarantee that may be stale.

For this app's domain (mostly inserts — new expenses — plus occasional edits), true CRDT-grade conflict resolution is likely overkill: two people offline-editing the *exact same* expense at the *exact same* time is rare, so a simple `updatedAt`-based last-write-wins per row is a reasonable default, with the loser's edit optionally kept as a "conflicted copy" rather than silently dropped if that matters later.

## useLiveQuery / enableChangeListener (not in use yet)

Drizzle's `useLiveQuery` hook (from `drizzle-orm/expo-sqlite`) gives a component a reactive query that auto-refreshes whenever the underlying rows change — no manual refetch after a write. Mechanism: it registers a change listener directly on the SQLite connection, so it fires for *any* write to the watched table, not just ones that went through a specific call site. Requires `openDatabaseSync(name, { enableChangeListener: true })`, which `src/db/client.ts` does not currently set. Not needed yet since no screen queries reactively — revisit when a screen (e.g. expense list) should live-update as rows are written elsewhere.

## Trips list must not nest expenses

The trips-list/hamburger-menu screen shows per-trip aggregates only (name, member count, expense count, balance owed) — never the full expense array. Compute those aggregates with one grouped query (`GROUP BY tripId` with `COUNT`/`SUM`) across all trips, not a loop that queries each trip's expenses separately (N+1). A trip's full expense list is a separate, on-demand query fired only when that trip is opened. Downside to accept: opening a trip has a real (if currently near-instant) loading moment for its expense query — that seam is exactly where a cloud backend later needs a loading/skeleton state. Prefer computing the aggregate numbers on read rather than denormalized counter columns, unless the grouped query is ever measured as slow.

## Decision rule for later

Whichever backend is chosen, keep `src/db/` as the local data-access layer and `src/stores/` as the reactive layer on top of it — that boundary shouldn't need to change when a cloud sync layer is added underneath `src/db/`.

## useLiveQuery vs TanStack Query vs Zustand — three different jobs, not interchangeable

`useLiveQuery` and TanStack Query look like they solve the same problem ("keep UI in sync with a data source") but they don't work the same way, and conflating them causes stale-cache bugs:

- **TanStack Query has no mechanism that watches the database for changes.** Its cache only refreshes when *told* to: `staleTime` expiring, `refetchOnWindowFocus`/`refetchOnMount`, or a mutation's `onSuccess` calling `queryClient.invalidateQueries([...])`/`refetch()`. If some other write path forgets to invalidate the right key, the cache goes stale silently.
- **useLiveQuery reacts automatically** to any change on the watched table, regardless of which code (or, later, which sync engine) wrote it — no invalidate calls to remember at every write site.
- **Zustand** is for state with no query behind it at all: the in-progress expense draft (activity/date/paidBy/split picked before Save), which bottomsheet is open, an expense-slideshow's current index.

Current decision: use `useLiveQuery` for local reads (trips-list aggregates, per-trip expenses, members) — it's the stronger default at this local-only stage since it needs no manual invalidation anywhere. Bring in TanStack Query only once there's an actual network call to wrap (auth, a remote API) — not as a replacement for `useLiveQuery` on local SQLite data. Note this still holds even after a PowerSync/ElectricSQL/Turso sync layer is added underneath, since `useLiveQuery` reacts to local row changes whether they came from a local mutation or the sync engine pulling remote changes down — TanStack Query would have no "mutation succeeded" callback to hang an invalidate off for a background sync write.

## Stack navigation and "on mount" fetches

React Navigation's stack keeps Screen A mounted when Screen B is pushed on top — going back to A does **not** remount it, so a `useEffect(() => { fetch() }, [])` on A won't see writes made on B. A plain mount-effect fetch is only safe for screens with no upstream stack (e.g. a true entry screen), or ones that don't need to reflect changes made elsewhere. Otherwise use `useFocusEffect` (refetch every time the screen regains focus) or `useLiveQuery` (auto-updates regardless of focus).
