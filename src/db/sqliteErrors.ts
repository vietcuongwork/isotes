import { DrizzleQueryError } from "drizzle-orm";

const UNIQUE_FAILED = "UNIQUE constraint failed: ";
// expo-sqlite appends the native source location to the message
const SOURCE_SUFFIX = " (at ";

// Some drizzle drivers wrap the driver's error (expo-sqlite doesn't)
function driverError(error: unknown): unknown {
  return error instanceof DrizzleQueryError ? error.cause : error;
}

// "index 'members_trip_name_unique'" for an expression index, "members.id" for a column
export function uniqueViolationTarget(error: unknown): string | undefined {
  const inner = driverError(error);
  if (!(inner instanceof Error)) return undefined;
  const at = inner.message.indexOf(UNIQUE_FAILED);
  if (at === -1) return undefined;
  const start = at + UNIQUE_FAILED.length;
  const end = inner.message.indexOf(SOURCE_SUFFIX, start);
  return inner.message.slice(start, end === -1 ? undefined : end).trim();
}
