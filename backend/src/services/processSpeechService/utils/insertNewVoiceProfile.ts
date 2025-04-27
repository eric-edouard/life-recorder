import { db } from "@backend/src/db/db.js";
import { voiceProfilesTable } from "@backend/src/db/schema.js";
import { generateReadableUUID } from "@backend/src/utils/generateReadableUUID.js";

type InsertNewVoiceProfileParams = {
	embedding: number[];
	duration: number;
	language: string;
	fileId: string;
};

export const insertNewVoiceProfile = async ({
	embedding,
	duration,
	language,
	fileId,
}: InsertNewVoiceProfileParams): Promise<string> => {
	const speakerId = generateReadableUUID(Date.now());

	await db.insert(voiceProfilesTable).values({
		id: speakerId,
		embedding,
		duration,
		createdAt: new Date(),
		updatedAt: new Date(),
		language,
		fileId,
	});

	return speakerId;
};
