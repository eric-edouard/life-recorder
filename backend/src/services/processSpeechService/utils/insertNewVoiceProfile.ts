import { db } from "@backend/db/db";
import { voiceProfilesTable } from "@backend/db/schema";
import { generateReadableUUID } from "@backend/utils/generateReadableUUID";

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
