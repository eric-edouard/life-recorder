import { db } from "@backend/db/db";
import { voiceProfilesTable } from "@backend/db/schema";
import { cosineDistance, desc, gt, sql } from "drizzle-orm";

export const findMatchingVoiceProfile = async (
	newEmbedding: number[],
	threshold = 0.75,
) => {
	const similarity = sql<number>`1 - (${cosineDistance(
		voiceProfilesTable.embedding,
		newEmbedding,
	)})`.as("similarity");

	const matches = await db
		.select({
			id: voiceProfilesTable.id,
			language: voiceProfilesTable.language,
			duration: voiceProfilesTable.duration,
			similarity,
		})
		.from(voiceProfilesTable)
		.where(gt(similarity, threshold))
		.orderBy(desc(similarity))
		.limit(1);

	return matches[0] ?? null;
};
