import {
	index,
	integer,
	jsonb,
	pgTable,
	real,
	text,
	timestamp,
	vector,
} from "drizzle-orm/pg-core";

export const utterancesTable = pgTable("utterances", {
	id: text("id").primaryKey(), // custom readable UUID for the utterance
	fileId: text("file_id"), // foreign key linking to the audio file record
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

export const speakersTable = pgTable(
	"speakers",
	{
		id: text("id").primaryKey(),
		name: text("name"),
		embedding: vector("embedding", { dimensions: 256 }),
		duration: real("duration").notNull().default(0),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(table) => [
		index("embeddingIndex").using(
			"hnsw",
			table.embedding.op("vector_cosine_ops"),
		),
	],
);
