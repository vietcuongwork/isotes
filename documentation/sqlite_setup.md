# SQLite — Setup

How this project wires local SQLite persistence into Expo, via `expo-sqlite` + Drizzle ORM + Drizzle Kit migrations. This is the device-local source of truth; see [data_layer_roadmap.md](./data_layer_roadmap.md) for how Zustand and any future cloud backend sit around it.

---

## 1. Packages

```json
"expo-sqlite": "~57.0.2",
"drizzle-orm": "^0.45.2",
"expo-crypto": "~57.0.2",
"expo-drizzle-studio-plugin": "^0.2.1",
"drizzle-kit": "^0.31.10",              // devDependency
"babel-plugin-inline-import": "^3.0.0"  // devDependency
```

- `expo-sqlite` — the native SQLite binding (`openDatabaseSync`).
- `drizzle-orm` — typed query builder + the Expo migration hook.
- `drizzle-kit` — CLI that turns `schema.ts` into SQL migration files.
- `expo-crypto` — `randomUUID()` for row IDs (SQLite has no UUID type).
- `expo-drizzle-studio-plugin` — inspect the live DB from the Expo dev tools.
- `babel-plugin-inline-import` — lets `.sql` migration files be imported as strings.

---

## 2. `app.json`

```json
"plugins": [
  "expo-router",
  ...
  "expo-sqlite"
]
```

The `expo-sqlite` config plugin is required for the native build to include the SQLite module.

---

## 3. `babel.config.js`

```js
plugins: [["inline-import", { extensions: [".sql"] }]],
```

Makes `import m0000 from "./0000_xxx.sql"` resolve to the file's **text contents** (a string), not a module. Drizzle's migrator needs the raw SQL.

---

## 4. `metro.config.js`

```js
config.resolver.sourceExts.push("sql");
```

Tells Metro to treat `.sql` as a resolvable source file so the inline-import above can pick it up.

---

## 5. `drizzle.config.ts`

```ts
export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  driver: "expo",
});
```

`driver: "expo"` makes Drizzle Kit emit the Expo-flavored migration bundle (the `drizzle/` folder + `migrations.js`) instead of plain `.sql` only.

---

## 6. `src/db/` layout

| File | Role |
|------|------|
| `schema.ts` | Table definitions (`sqliteTable`) + inferred `Project` / `NewProject` types. |
| `client.ts` | Opens the DB, creates the Drizzle instance, exposes the migration + studio hooks. |
| `projects.ts` | Data-access functions (`insertProject`, `getAllProjects`). One file per table/domain. |

### `schema.ts`

```ts
export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  currencyCode: text("currency_code").notNull(),
  createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
});

export type Project = typeof projects.$inferSelect;    // row you SELECT
export type NewProject = typeof projects.$inferInsert;  // shape you INSERT
```

- No native `uuid` / `boolean` / `date` types in SQLite — IDs are `text`, timestamps are `integer` unix seconds (`unixepoch()`), booleans would be `integer` 0/1.
- Column names are snake_case in SQL, camelCase in TS — Drizzle maps between them.

### `client.ts`

```ts
export const DATABASE_NAME = "isotes.db";
const expoDB = openDatabaseSync(DATABASE_NAME);
export const db = drizzle(expoDB, { schema });

export function useDatabaseMigrations() {
  return useMigrations(db, migrations);
}

export function useStudio() {
  return useDrizzleStudio(expoDB);
}
```

- `db` is the singleton used everywhere for queries.
- `enableChangeListener` is **not** set — required before `useLiveQuery` can be used (see roadmap doc).

### `projects.ts`

```ts
export async function insertProject(data: Omit<NewProject, "id">) {
  const id = randomUUID();
  await db.insert(projects).values({ ...data, id });
  return id;
}

export async function getAllProjects() {
  return db.select().from(projects).orderBy(desc(projects.createdAt));
}
```

IDs are generated in app code (`expo-crypto`), not by the DB.

---

## 7. Migrations

### Generated files (`drizzle/`, committed)

```
drizzle/
  0000_living_namora.sql   raw CREATE TABLE statements
  migrations.js            bundles journal + each .sql for the Expo migrator
  meta/_journal.json       ordered list of migrations + timestamps
  meta/0000_snapshot.json  schema snapshot used to diff the next generation
```

`migrations.js` is hand-shaped for Expo (per Drizzle docs) — it imports each `.sql` as a string and exports `{ journal, migrations }`.

### Applying migrations — `src/app/_layout.tsx`

```tsx
const { success: migrationReady, error: migrationError } = useDatabaseMigrations();
useStudio();

if (!fontLoaded || !migrationReady) {
  return null;   // hold render until the DB schema is ready
}
```

Migrations run on app start, before any screen mounts.

### Regenerating after a schema change

There is no npm script yet — run Drizzle Kit directly:

```bash
npx drizzle-kit generate      # after editing src/db/schema.ts
```

This writes a new `000N_*.sql` + snapshot and updates `_journal.json`. Then add the new migration import to `drizzle/migrations.js` (matching the existing `m0000` pattern). The new migration applies on next app launch via `useDatabaseMigrations()`.

> Consider adding `"db:generate": "drizzle-kit generate"` to `package.json` scripts.

---

## 8. Drizzle Studio (dev inspection)

`useStudio()` in the root layout wires `expo-drizzle-studio-plugin` to the running DB. Open it from the Expo dev tools to browse/edit rows live during development. Dev-only; no effect in production builds.
