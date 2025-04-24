import {
	boolean,
	index,
	integer,
	jsonb,
	pgTable,
	real,
	text,
	timestamp,
	vector,
} from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
	id: text("id").primaryKey(),
	email: text("email").notNull().unique(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const peopleTable = pgTable("people", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	contactId: text("contact_id").unique(),
	notes: text("notes"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
	isUser: boolean("is_user").default(false),
	userId: text("user_id")
		.notNull()
		.references(() => usersTable.id),
});

export const voiceProfilesTable = pgTable(
	"voice_profiles",
	{
		id: text("id").primaryKey(),
		personId: text("person_id").references(() => peopleTable.id),
		embedding: vector("embedding", { dimensions: 256 }).notNull(),
		duration: real("duration").notNull(),
		language: text("language"),
		fileId: text("file_id").notNull().unique(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
		userId: text("user_id")
			.notNull()
			.references(() => usersTable.id),
	},
	(table) => [
		index("embeddingIndex").using(
			"hnsw",
			table.embedding.op("vector_cosine_ops"),
		),
	],
);

export const utterancesTable = pgTable("utterances", {
	id: text("id").primaryKey(),
	fileId: text("file_id").notNull(),
	start: real("start").notNull(),
	end: real("end").notNull(),
	transcript: text("transcript").notNull(),
	confidence: real("confidence").notNull(),
	voiceProfileId: text("voice_profile_id").references(
		() => voiceProfilesTable.id,
	),
	nonIdentifiedSpeaker: integer("non_identified_speaker").notNull(),
	words: jsonb("words").notNull(),
	languages: text("languages").array(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	userId: text("user_id")
		.notNull()
		.references(() => usersTable.id),
});
