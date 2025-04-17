import { db } from "@/db/db";
import { utterancesTable } from "@/db/schema";
import type { UtteranceWithSpeakerId } from "@/types/UtteranceWithSpeakerId";
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
