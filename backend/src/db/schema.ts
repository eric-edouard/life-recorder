import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const memoriesTable = pgTable("memories", {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	content: text().notNull(),
	createdAt: timestamp().notNull().defaultNow(),
});
