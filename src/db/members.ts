import { eq } from "drizzle-orm";
import { randomUUID } from "expo-crypto";
import { db } from "./client";
import { MEMBERS_TRIP_NAME_INDEX, members, NewMember } from "./schema";
import { uniqueViolationTarget } from "./sqliteErrors";

export type InsertMemberResult =
  { status: "added"; id: string } | { status: "duplicate-name" };

export async function insertMember(
  data: Omit<NewMember, "id">,
): Promise<InsertMemberResult> {
  const id = randomUUID();
  try {
    await db.insert(members).values({ ...data, id });
  } catch (error) {
    if (uniqueViolationTarget(error) === `index '${MEMBERS_TRIP_NAME_INDEX}'`) {
      return { status: "duplicate-name" };
    }
    throw error; // other failures: as today (backlog)
  }
  return { status: "added", id };
}

export function getMembersByTripId(tripId: string) {
  return db
    .select()
    .from(members)
    .where(eq(members.tripId, tripId))
    .orderBy(members.createdAt);
}
