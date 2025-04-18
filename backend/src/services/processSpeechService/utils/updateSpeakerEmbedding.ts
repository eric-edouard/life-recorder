import { db } from "@/db/db";
import { speakersTable } from "@/db/schema";
import { eq } from "drizzle-orm";

export const updateSpeakerEmbedding = async (
	speakerId: string,
	newEmbedding: number[],
	newDuration: number,
): Promise<void> => {
	await db
		.update(speakersTable)
		.set({
			embedding: newEmbedding,
			duration: newDuration,
		})
		.where(eq(speakersTable.id, speakerId));
};
