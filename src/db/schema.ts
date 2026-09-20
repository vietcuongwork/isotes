import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const trips = sqliteTable("trips", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  currencyCode: text("currency_code").notNull(),
  createdAt: integer("created_at")
    .notNull()
    .default(sql`(unixepoch())`),
});

//NOTE - shape of a row you SELECT
export type TripRow = typeof trips.$inferSelect;
//NOTE - shape you pass to INSERT (id/defaults optional where applicable)
export type NewTrip = typeof trips.$inferInsert;

export const members = sqliteTable("members", {
  id: text("id").primaryKey(),
  tripId: text("trip_id")
    .notNull()
    .references(() => trips.id),
  name: text("name").notNull(),
  // true only for the member row auto-created when the trip is made — lets
  // UI/balance math find "you" without matching on name
  isOwner: integer("is_owner", { mode: "boolean" }).notNull().default(false),
  // key into colors.member/colors.memberInk (src/themes/color.js) — resolves
  // to a fixed fill/ink hex pair, assigned once at creation so it stays stable
  // regardless of other members being added/removed later
  // Keep this array's keys in sync with MemberColor (src/types/TExpense.ts)
  // by hand when either changes.
  memberColor: text("member_color", {
    enum: [
      "sand",
      "olive",
      "citron",
      "amber",
      "honey",
      "terracotta",
      "coral",
      "rose",
      "lilac",
      "periwinkle",
      "sky",
      "teal",
    ],
  }).notNull(),
  createdAt: integer("created_at")
    .notNull()
    .default(sql`(unixepoch())`),
});

//NOTE - shape of a row you SELECT
export type MemberRow = typeof members.$inferSelect;
//NOTE - shape you pass to INSERT (id/defaults optional where applicable)
export type NewMember = typeof members.$inferInsert;

export const expenses = sqliteTable("expenses", {
  id: text("id").primaryKey(),
  tripId: text("trip_id")
    .notNull()
    .references(() => trips.id),
  paidByMemberId: text("paid_by_member_id")
    .notNull()
    .references(() => members.id),
  // dollars, not cents — matches parseAmountInput/formatAmountInput 
  // (src/utils/currency.ts), which already work in float dollars throughout the app
  amount: real("amount").notNull(),
  description: text("description"),
  // matches an id in ACTIVITIES (src/features/expense/constants.ts) — app-level enum, not FK'd
  activityId: text("activity_id").notNull(),
  // dateId string — same format as flash-calendar's toDateId/parseDateId (src/utils/date.ts)
  date: text("date").notNull(),
  splitMethod: text("split_method", {
    enum: ["equally", "amounts", "shares"],
  }).notNull(),
  createdAt: integer("created_at")
    .notNull()
    .default(sql`(unixepoch())`),
});

//NOTE - shape of a row you SELECT
export type ExpenseRow = typeof expenses.$inferSelect;
//NOTE - shape you pass to INSERT (id/defaults optional where applicable)
export type NewExpense = typeof expenses.$inferInsert;

export const expenseSplits = sqliteTable("expense_splits", {
  id: text("id").primaryKey(),
  expenseId: text("expense_id")
    .notNull()
    .references(() => expenses.id),
  memberId: text("member_id")
    .notNull()
    .references(() => members.id),
  // this member's resolved dollar contribution — distinct f
  // rom expenses.amount (the expense's total)
  individualAmount: real("individual_amount").notNull(),
  // only set when the parent expense's splitMethod is "shares"; null otherwise
  shares: integer("shares"),
});

//NOTE - shape of a row you SELECT
export type ExpenseSplitRow = typeof expenseSplits.$inferSelect;
//NOTE - shape you pass to INSERT (id/defaults optional where applicable)
export type NewExpenseSplit = typeof expenseSplits.$inferInsert;
