import { desc, eq } from "drizzle-orm";
import { randomUUID } from "expo-crypto";
import { db } from "./client";
import { expenses, expenseSplits, NewExpense, NewExpenseSplit } from "./schema";

export async function insertExpenseWithSplits(
  data: Omit<NewExpense, "id">,
  splits: Omit<NewExpenseSplit, "id" | "expenseId">[],
) {
  const expenseId = randomUUID();

  await db.transaction(async (tx) => {
    await tx.insert(expenses).values({ ...data, id: expenseId });
    await tx.insert(expenseSplits).values(
      splits.map((split) => ({
        ...split,
        id: randomUUID(),
        expenseId: expenseId,
      })),
    );
  });

  return expenseId;
}

export async function getExpensesByTripId(tripId: string) {
  return db
    .select()
    .from(expenses)
    .where(eq(expenses.tripId, tripId))
    .orderBy(desc(expenses.date), desc(expenses.createdAt));
}

export function getExpenseById(expenseId: string) {
  return db.query.expenses.findFirst({
    where: eq(expenses.id, expenseId),
    with: { splits: true },
  });
}
