import { db } from "@backend/src/db/db";
import { voiceProfilesTable } from "@backend/src/db/schema";
import { cosineDistance, lt, sql } from "drizzle-orm";

const SIMILARITY_THRESHOLD = 0.75; // matches Python script threshold

type VoiceProfileMatch = {
	id: string;
	speaker_id: string | null;
};

export const findNearestVoiceProfile = async (
	embedding: number[],
): Promise<VoiceProfileMatch | null> => {
	// Build distance and similarity expressions once.
	const distanceExpr = cosineDistance(voiceProfilesTable.embedding, embedding);
	const similarityExpr = sql<number>`1 - (${distanceExpr})`;

	// k‑NN search: order by raw distance so the HNSW index is used.
	const rows = await db
		.select({
			id: voiceProfilesTable.id,
			speaker_id: voiceProfilesTable.speakerId,
			distance: distanceExpr,
			similarity: similarityExpr,
		})
		.from(voiceProfilesTable)
		.where(lt(distanceExpr, 1 - SIMILARITY_THRESHOLD)) // distance < 0.25
		.orderBy(distanceExpr) // nearest first, index friendly
		.limit(1)
		.execute();

	if (rows.length === 0) return null;

	const { id, speaker_id, distance, similarity } = rows[0];
	console.log(
		`Nearest voice profile similarity: ${similarity} (distance: ${distance})`,
	);

	return { id, speaker_id };
};
