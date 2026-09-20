import { eq } from "drizzle-orm";
import { randomUUID } from "expo-crypto";
import { db } from "./client";
import { members, NewMember } from "./schema";

export async function insertMember(data: Omit<NewMember, "id">) {
  const id = randomUUID();
  await db.insert(members).values({ ...data, id });
  return id;
}

export function getMembersByTripId(tripId: string) {
  return db
    .select()
    .from(members)
    .where(eq(members.tripId, tripId))
    .orderBy(members.createdAt);
}
