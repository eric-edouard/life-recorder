import { db } from "@backend/src/db/db.js";
import { utterancesTable } from "@backend/src/db/schema.js";
import type { UtteranceWithVoiceProfileId } from "@backend/src/types/UtteranceWithVoiceProfileId.js";
import { eq } from "drizzle-orm";

export const updateUtterancesWithVoiceProfile = async (
	utterances: UtteranceWithVoiceProfileId[],
) => {
	await Promise.all(
		utterances.map((u) => {
			if (!u.voiceProfileId) return Promise.resolve(); // skip if still unknown
			return db
				.update(utterancesTable)
				.set({ voiceProfileId: u.voiceProfileId })
				.where(eq(utterancesTable.id, u.id));
		}),
	);
};
