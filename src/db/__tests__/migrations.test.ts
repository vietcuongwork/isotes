/** @jest-environment node */
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import fs from "node:fs";
import path from "node:path";

import { members, trips } from "../schema";

const MIGRATIONS_FOLDER = path.resolve(__dirname, "../../../drizzle");
const INDEX_ERROR =
  "UNIQUE constraint failed: index 'members_trip_name_unique'";

// An in-memory database with every migration applied, through drizzle's own migrator
function freshDb() {
  const sqlite = new Database(":memory:");
  const db = drizzle(sqlite);
  migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
  return { sqlite, db };
}

function seedTrips(db: ReturnType<typeof freshDb>["db"], ids: string[]): void {
  for (const id of ids) {
    db.insert(trips)
      .values({ id, name: `Trip ${id}`, currencyCode: "USD" })
      .run();
  }
}

function memberRow(id: string, tripId: string, name: string) {
  return { id, tripId, name, memberColor: "sand" as const };
}

function migrationSql(prefix: string): string[] {
  const file = fs
    .readdirSync(MIGRATIONS_FOLDER)
    .find((f) => f.startsWith(prefix) && f.endsWith(".sql"));
  if (!file) throw new Error(`no migration starting with ${prefix}`);
  return fs
    .readFileSync(path.join(MIGRATIONS_FOLDER, file), "utf8")
    .split("--> statement-breakpoint");
}

describe("members_trip_name_unique", () => {
  it("rejects a same-trip duplicate after trim and ASCII lower-casing", () => {
    const { db } = freshDb();
    seedTrips(db, ["t1"]);
    db.insert(members)
      .values(memberRow("m1", "t1", "Mai"))
      .run();

    expect(() =>
      db
        .insert(members)
        .values(memberRow("m2", "t1", " mai "))
        .run(),
    ).toThrow(INDEX_ERROR);
  });

  it("accepts the same name on another trip", () => {
    const { db } = freshDb();
    seedTrips(db, ["t1", "t2"]);
    db.insert(members)
      .values(memberRow("m1", "t1", "Mai"))
      .run();

    db.insert(members)
      .values(memberRow("m2", "t2", "Mai"))
      .run();

    expect(db.select().from(members).all()).toHaveLength(2);
  });

  it("refuses to build over rows that already clash, and leaves them in place", () => {
    const sqlite = new Database(":memory:");
    for (const prefix of ["0000", "0001"]) {
      for (const statement of migrationSql(prefix)) sqlite.exec(statement);
    }
    sqlite.exec(
      "INSERT INTO trips (id, name, currency_code) VALUES ('t1', 'Trip', 'USD')",
    );
    const insert = sqlite.prepare(
      "INSERT INTO members (id, trip_id, name, member_color) VALUES (?, ?, ?, 'sand')",
    );
    insert.run("m1", "t1", "Mai");
    insert.run("m2", "t1", "mai");

    expect(() => {
      for (const statement of migrationSql("0002")) sqlite.exec(statement);
    }).toThrow(INDEX_ERROR);
    expect(sqlite.prepare("SELECT count(*) AS n FROM members").get()).toEqual({
      n: 2,
    });
  });
});
