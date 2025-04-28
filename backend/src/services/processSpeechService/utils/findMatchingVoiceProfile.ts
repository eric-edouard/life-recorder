import { db } from "@backend/src/db/db";
import { voiceProfilesTable } from "@backend/src/db/schema";
import { cosineDistance, desc, gt, sql } from "drizzle-orm";

export const findMatchingVoiceProfile = async (
	newEmbedding: number[],
	threshold = 0.75,
) => {
	// Define similarity calculation expression
	const similarityExpression = sql<number>`1 - (${cosineDistance(
		voiceProfilesTable.embedding,
		newEmbedding,
	)})`;

	const matches = await db
		.select({
			id: voiceProfilesTable.id,
			language: voiceProfilesTable.language,
			duration: voiceProfilesTable.duration,
			similarity: similarityExpression,
			speakerId: voiceProfilesTable.speakerId,
		})
		.from(voiceProfilesTable)
		.where(gt(similarityExpression, threshold))
		.orderBy(desc(similarityExpression))
		.limit(1);

	return matches[0] ?? null;
};
