import { relations } from "drizzle-orm";
import { expenses, expenseSplits, members, trips } from "./schema";

export const tripsRelations = relations(trips, ({ many }) => ({
  members: many(members),
  expenses: many(expenses),
}));

export const membersRelations = relations(members, ({ one, many }) => ({
  trip: one(trips, {
    fields: [members.tripId],
    references: [trips.id],
  }),
  expensesPaid: many(expenses),
  splits: many(expenseSplits),
}));

export const expensesRelations = relations(expenses, ({ one, many }) => ({
  trip: one(trips, {
    fields: [expenses.tripId],
    references: [trips.id],
  }),
  paidBy: one(members, {
    fields: [expenses.paidByMemberId],
    references: [members.id],
  }),
  splits: many(expenseSplits),
}));

export const expenseSplitsRelations = relations(expenseSplits, ({ one }) => ({
  expense: one(expenses, {
    fields: [expenseSplits.expenseId],
    references: [expenses.id],
  }),
  member: one(members, {
    fields: [expenseSplits.memberId],
    references: [members.id],
  }),
}));
