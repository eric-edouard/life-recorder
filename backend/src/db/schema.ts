import {
	integer,
	jsonb,
	pgTable,
	real,
	text,
	timestamp,
} from "drizzle-orm/pg-core";

export const utterancesTable = pgTable("utterances", {
	id: text("id").primaryKey(), // custom readable UUID for the utterance
	fileId: text("file_id").notNull(), // foreign key linking to the audio file record
	start: real("start").notNull(), // start time in seconds
	end: real("end").notNull(), // end time in seconds
	transcript: text("transcript").notNull(),
	confidence: real("confidence").notNull(),
	// This field now references the speakers table. It can be null if not identified
	speaker: text("speaker").references(() => speakersTable.id),
	non_identified_speaker: integer("non_identified_speaker"),
	words: jsonb("words").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const speakersTable = pgTable("speakers", {
	// Use a custom readable ID. It could be generated similarly (or auto-increment if you prefer)
	id: text("id").primaryKey(),
	// Optional human-readable name
	name: text("name"),
	// Embedding vector from Resemblyzer – stored as JSON array of numbers
	embedding: jsonb("embedding").notNull(),
	// Automatically add created time
	createdAt: timestamp("created_at").defaultNow().notNull(),
});
