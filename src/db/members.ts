import { eq } from "drizzle-orm";
import { randomUUID } from "expo-crypto";
import { db } from "./client";
import { MEMBERS_TRIP_NAME_INDEX, members, NewMember } from "./schema";
import { uniqueViolationTarget } from "./sqliteErrors";

export type InsertMemberResult =
  { kind: "added"; id: string } | { kind: "duplicate-name" };

export async function insertMember(
  data: Omit<NewMember, "id">,
): Promise<InsertMemberResult> {
  const id = randomUUID();
  try {
    await db.insert(members).values({ ...data, id });
  } catch (error) {
    if (uniqueViolationTarget(error) === `index '${MEMBERS_TRIP_NAME_INDEX}'`) {
      return { kind: "duplicate-name" };
    }
    throw error; // only the name index is an expected failure
  }
  return { kind: "added", id };
}

export function getMembersByTripId(tripId: string) {
  return db
    .select()
    .from(members)
    .where(eq(members.tripId, tripId))
    .orderBy(members.createdAt);
}
