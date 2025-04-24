import { db } from "@backend/db/db";
import { utterancesTable } from "@backend/db/schema";
import type { UtteranceWithVoiceProfileId } from "@backend/types/UtteranceWithVoiceProfileId";
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
