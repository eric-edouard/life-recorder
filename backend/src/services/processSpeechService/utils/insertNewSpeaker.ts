import { db } from "@backend/db/db";
import { speakersTable } from "@backend/db/schema";
import { generateReadableUUID } from "@backend/utils/generateReadableUUID";

export const insertNewSpeaker = async (
	embedding: number[],
	duration: number,
): Promise<string> => {
	const speakerId = generateReadableUUID(Date.now());

	await db.insert(speakersTable).values({
		id: speakerId,
		embedding,
		duration,
	});

	return speakerId;
};
