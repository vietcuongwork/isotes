import { desc, eq } from "drizzle-orm";
import { randomUUID } from "expo-crypto";
import { db } from "./client";
import { members, NewTrip, trips } from "./schema";

export async function insertTrip(data: Omit<NewTrip, "id">) {
  const id = randomUUID();

  await db.transaction(async (tx) => {
    await tx.insert(trips).values({ ...data, id });
    // "You" is a fixed name/colour, not user-entered — there's exactly one
    // owner member per trip, created here so a trip never exists without one.
    await tx.insert(members).values({
      id: randomUUID(),
      tripId: id,
      name: "You",
      isOwner: true,
      memberColor: "honey",
    });
  });

  return id;
}

export async function getAllTrips() {
  return db.select().from(trips).orderBy(desc(trips.createdAt));
}

export function getTripById(tripId: string) {
  return db.query.trips.findFirst({
    where: eq(trips.id, tripId),
  });
}
