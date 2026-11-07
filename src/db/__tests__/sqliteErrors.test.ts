/** @jest-environment node */
import { DrizzleQueryError } from "drizzle-orm";

import { uniqueViolationTarget } from "../sqliteErrors";

// T3's logged device message (primary key), wrapper lines included
const DEVICE_PRIMARY_KEY =
  "FunctionCallException: Calling the 'runSync' function has failed (at ExpoModulesCore/SyncFunctionDefinition.swift:94)\n" +
  "→ Caused by: SQLiteErrorException: Error code 19: UNIQUE constraint failed: members.id (at ExpoSQLite/SQLiteModule.swift:416)";

// The index form: T3's wrapper around T11's text (better-sqlite3 logged the inner text only)
const DEVICE_INDEX =
  "FunctionCallException: Calling the 'runSync' function has failed (at ExpoModulesCore/SyncFunctionDefinition.swift:94)\n" +
  "→ Caused by: SQLiteErrorException: Error code 19: UNIQUE constraint failed: index 'members_trip_name_unique' (at ExpoSQLite/SQLiteModule.swift:416)";

describe("uniqueViolationTarget", () => {
  it("names the index on the device's wrapped message", () => {
    expect(uniqueViolationTarget(new Error(DEVICE_INDEX))).toBe(
      "index 'members_trip_name_unique'",
    );
  });

  it("names the column on the device's primary key message", () => {
    expect(uniqueViolationTarget(new Error(DEVICE_PRIMARY_KEY))).toBe(
      "members.id",
    );
  });

  it("reads an unwrapped message, as better-sqlite3 throws it", () => {
    const error = new Error(
      "UNIQUE constraint failed: index 'members_trip_name_unique'",
    );
    expect(uniqueViolationTarget(error)).toBe(
      "index 'members_trip_name_unique'",
    );
  });

  it("reads the driver error inside a DrizzleQueryError's cause", () => {
    const wrapped = new DrizzleQueryError(
      "insert into members …",
      [],
      new Error(DEVICE_INDEX),
    );
    expect(uniqueViolationTarget(wrapped)).toBe(
      "index 'members_trip_name_unique'",
    );
  });

  it("returns undefined for a constraint that isn't a unique violation", () => {
    const error = new Error(
      "Error code 19: NOT NULL constraint failed: members.name (at ExpoSQLite/SQLiteModule.swift:416)",
    );
    expect(uniqueViolationTarget(error)).toBeUndefined();
  });

  it("returns undefined for a string, undefined and a wrapper with no cause", () => {
    expect(
      uniqueViolationTarget("UNIQUE constraint failed: x.y"),
    ).toBeUndefined();
    expect(uniqueViolationTarget(undefined)).toBeUndefined();
    expect(
      uniqueViolationTarget(new DrizzleQueryError("select 1", [], undefined)),
    ).toBeUndefined();
  });
});
