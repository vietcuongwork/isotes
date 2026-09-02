import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  currencyCode: text("currency_code").notNull(),
  createdAt: integer("created_at")
    .notNull()
    .default(sql`(unixepoch())`),
});

//NOTE - shape of a row you SELECT
export type Project = typeof projects.$inferSelect;
//NOTE - shape you pass to INSERT (id/defaults optional where applicable)
export type NewProject = typeof projects.$inferInsert;
