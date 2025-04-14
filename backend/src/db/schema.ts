import {
	decimal,
	integer,
	pgTable,
	text,
	timestamp,
} from "drizzle-orm/pg-core";

export const memoriesTable = pgTable("memories", {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	content: text().notNull(),
	location: text(),
	latitude: decimal({ precision: 10, scale: 8 }),
	longitude: decimal({ precision: 11, scale: 8 }),
	createdAt: timestamp().notNull().defaultNow(),
});
