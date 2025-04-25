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

// ==================== Auth Tables ====================

export const usersTable = pgTable("users", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("email_verified").notNull(),
	image: text("image"),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull(),
});

export const sessionsTable = pgTable("sessions", {
	id: text("id").primaryKey(),
	expiresAt: timestamp("expires_at").notNull(),
	token: text("token").notNull().unique(),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id")
		.notNull()
		.references(() => usersTable.id, { onDelete: "cascade" }),
});

export const accountsTable = pgTable("accounts", {
	id: text("id").primaryKey(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id")
		.notNull()
		.references(() => usersTable.id, { onDelete: "cascade" }),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at"),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
	scope: text("scope"),
	password: text("password"),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull(),
});

export const verificationsTable = pgTable("verification", {
	id: text("id").primaryKey(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: timestamp("expires_at").notNull(),
	createdAt: timestamp("created_at"),
	updatedAt: timestamp("updated_at"),
});

// ==================== Application Tables ====================

export const speakersTable = pgTable("speaker", {
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

export const voiceProfileTable = pgTable(
	"voice_profile",
	{
		id: text("id").primaryKey(),
		speakerId: text("speaker_id").references(() => speakersTable.id),
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

export const utterancesTable = pgTable("utterance", {
	id: text("id").primaryKey(),
	fileId: text("file_id").notNull(),
	start: real("start").notNull(),
	end: real("end").notNull(),
	transcript: text("transcript").notNull(),
	confidence: real("confidence").notNull(),
	voiceProfileId: text("voice_profile_id").references(
		() => voiceProfileTable.id,
	),
	nonIdentifiedSpeaker: integer("non_identified_speaker").notNull(),
	words: jsonb("words").notNull(),
	languages: text("languages").array(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	userId: text("user_id")
		.notNull()
		.references(() => usersTable.id),
});
