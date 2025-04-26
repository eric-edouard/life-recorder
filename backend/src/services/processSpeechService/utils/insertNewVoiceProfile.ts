import { db } from "@backend/src/db/db";
import { voiceProfilesTable } from "@backend/src/db/schema";
import { generateReadableUUID } from "@backend/src/utils/generateReadableUUID";

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
