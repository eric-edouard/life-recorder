import { db } from "@backend/db/db";
import { utterancesTable } from "@backend/db/schema";
import type { UtteranceWithSpeakerId } from "@backend/types/UtteranceWithSpeakerId";
import { eq } from "drizzle-orm";

export const updateUtterancesWithSpeaker = async (
	utterances: UtteranceWithSpeakerId[],
) => {
	await Promise.all(
		utterances.map((u) => {
			if (!u.speakerId) return Promise.resolve(); // skip if still unknown
			return db
				.update(utterancesTable)
				.set({ speaker: u.speakerId })
				.where(eq(utterancesTable.id, u.id));
		}),
	);
};
