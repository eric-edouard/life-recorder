import { db } from "@backend/src/db/db";
import { speakersTable, voiceProfilesTable } from "@backend/src/db/schema";
import { cosineDistance, desc, eq, gt, sql } from "drizzle-orm";

export const findMatchingVoiceProfileAndSpeaker = async (
	newEmbedding: number[],
	threshold = 0.7,
) => {
	// Define similarity calculation expression
	const similarityExpression = sql<number>`1 - (${cosineDistance(
		voiceProfilesTable.embedding,
		newEmbedding,
	)})`;

	const matches = await db
		.select({
			voiceProfile: {
				id: voiceProfilesTable.id,
				language: voiceProfilesTable.language,
				duration: voiceProfilesTable.duration,
				similarity: similarityExpression,
				speakerId: voiceProfilesTable.speakerId,
				embedding: voiceProfilesTable.embedding,
				fileId: voiceProfilesTable.fileId,
				type: voiceProfilesTable.type,
			},
			speaker: {
				id: speakersTable.id,
				name: speakersTable.name,
				contactId: speakersTable.contactId,
				notes: speakersTable.notes,
				isUser: speakersTable.isUser,
			},
		})
		.from(voiceProfilesTable)
		.leftJoin(speakersTable, eq(voiceProfilesTable.speakerId, speakersTable.id))
		.where(gt(similarityExpression, threshold))
		.orderBy(desc(similarityExpression))
		.limit(1);

	return matches[0] ?? null;
};
