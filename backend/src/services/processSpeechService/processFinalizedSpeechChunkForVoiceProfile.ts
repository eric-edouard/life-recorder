import { db } from "@backend/src/db/db";
import { speakersTable, voiceProfilesTable } from "@backend/src/db/schema";
import { saveAudioToGCS } from "@backend/src/services/processSpeechService/saveAudioToGcs";
import { getVoiceProfileEmbeddingFromBuffer } from "@backend/src/services/processSpeechService/utils/getVoiceProfileEmbeddingFromBuffer";
import { convertFloat32ArrayToWavBuffer } from "@backend/src/utils/audio/audioUtils";
import { getWavBufferDuration } from "@backend/src/utils/audio/getWavBufferDuration";
import { generateReadableUUID } from "@backend/src/utils/generateReadableUUID";
import { now } from "@backend/src/utils/now";
import { eq } from "drizzle-orm";
import fs from "node:fs";

const DEBUG = true;

type Params = {
	audio: Float32Array;
	userId: string;
};

export const processFinalizedSpeechChunkForVoiceProfile = async ({
	audio,
	userId,
}: Params) => {
	const speechStartTime = now();
	const wavBuffer = convertFloat32ArrayToWavBuffer(audio);
	if (DEBUG) fs.writeFileSync(`1-BUFFER.wav`, wavBuffer);

	const durationMs = getWavBufferDuration(wavBuffer);
	if (DEBUG) console.log("🪲 1 DURATION", durationMs);

	const id = generateReadableUUID(speechStartTime, durationMs);
	console.log("🪲 1 ID", id);
	const embedding = await getVoiceProfileEmbeddingFromBuffer(wavBuffer);
	console.log("🪲 2 EMBEDDING", embedding.length);
	const speaker = await db.query.speakersTable.findFirst({
		where: eq(speakersTable.userId, userId),
	});
	if (!speaker) throw new Error("Speaker not found");
	const voiceProfile = await db.insert(voiceProfilesTable).values({
		id,
		embedding,
		duration: durationMs / 1000,
		fileId: id,
		userId,
		speakerId: speaker.id,
	});
	console.log("🪲 3 VOICE PROFILE", voiceProfile);
	await saveAudioToGCS(id, wavBuffer, speechStartTime, durationMs);
	console.log("🪲 4 SAVED AUDIO TO GCS");
	return { fileId: id };
};
