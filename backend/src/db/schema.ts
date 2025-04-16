import {
	decimal,
	integer,
	jsonb,
	pgTable,
	real,
	text,
	timestamp,
} from "drizzle-orm/pg-core";

export const utterancesTable = pgTable("utterances", {
	id: text("id").primaryKey(),
	fileId: text("file_id").notNull(),
	start: real("start").notNull(),
	end: real("end").notNull(),
	transcript: text("transcript").notNull(),
	confidence: real("confidence").notNull(),
	speaker: integer("speaker"),
	words: jsonb("words").notNull(),
	location: text(),
	latitude: decimal({ precision: 10, scale: 8 }),
	longitude: decimal({ precision: 11, scale: 8 }),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});
