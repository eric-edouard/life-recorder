import { db } from "@/db/db";
import { speakersTable } from "@/db/schema";
import { cosineDistance, desc, gt, sql } from "drizzle-orm";

export const findMatchingSpeaker = async (
	newEmbedding: number[],
	threshold = 0.75,
) => {
	const similarity = sql<number>`1 - (${cosineDistance(
		speakersTable.embedding,
		newEmbedding,
	)})`;

	const matches = await db
		.select({
			id: speakersTable.id,
			name: speakersTable.name,
			similarity,
			duration: speakersTable.duration,
		})
		.from(speakersTable)
		.where(gt(similarity, threshold))
		.orderBy(desc(similarity))
		.limit(1);

	return matches[0] ?? null;
};
