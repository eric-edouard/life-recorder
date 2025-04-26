import { db } from "@backend/src/db/db";
import { voiceProfilesTable } from "@backend/src/db/schema";
import { saveAudioToGCS } from "@backend/src/services/processSpeechService/saveAudioToGcs";
import { getSpeakerEmbeddingFromBuffer } from "@backend/src/services/processSpeechService/utils/getSpeakerEmbeddingFromBuffer";
import { convertFloat32ArrayToWavBuffer } from "@backend/src/utils/audio/audioUtils";
import { getWavBufferDuration } from "@backend/src/utils/audio/getWavBufferDuration";
import { generateReadableUUID } from "@backend/src/utils/generateReadableUUID";
import { now } from "@backend/src/utils/now";
import type { VoiceProfileType } from "@shared/sharedTypes";
import fs from "node:fs";

const DEBUG = true;

type Params = {
	audio: Float32Array;
	type: VoiceProfileType;
	userId: string;
	language: string;
};

export const processFinalizedSpeechChunkForVoiceProfile = async ({
	audio,
	type,
	userId,
	language,
}: Params) => {
	const speechStartTime = now();
	// 1. Convert raw audio to WAV
	const wavBuffer = convertFloat32ArrayToWavBuffer(audio);
	if (DEBUG) fs.writeFileSync(`1-BUFFER.wav`, wavBuffer);

	const durationMs = getWavBufferDuration(wavBuffer);
	if (DEBUG) console.log("🪲 1 DURATION", durationMs);

	const id = generateReadableUUID(speechStartTime, durationMs);

	const embedding = await getSpeakerEmbeddingFromBuffer(wavBuffer);

	const voiceProfile = await db.insert(voiceProfilesTable).values({
		id,
		embedding,
		duration: durationMs / 1000,
		createdAt: new Date(),
		updatedAt: new Date(),
		language,
		fileId: id,
		type,
		userId,
	});
	await saveAudioToGCS(id, wavBuffer, speechStartTime, durationMs);

	return voiceProfile;
};
