import { db } from "@backend/src/db/db";
import { voiceProfilesTable } from "@backend/src/db/schema";
import { sql } from "drizzle-orm";

const MATCH_THRESHOLD = 0.15;

type VoiceProfileMatch = {
	id: string;
	speaker_id: string | null;
};

export const findNearestVoiceProfile = async (
	embedding: number[],
): Promise<VoiceProfileMatch | null> => {
	const result = await db.execute(
		sql`
        SELECT id, speaker_id
        FROM ${voiceProfilesTable}
        WHERE embedding <-> ${embedding} < ${MATCH_THRESHOLD}
        ORDER BY embedding <-> ${embedding}
        LIMIT 1
      `,
	);

	return result.rows[0] as VoiceProfileMatch | null;
};
