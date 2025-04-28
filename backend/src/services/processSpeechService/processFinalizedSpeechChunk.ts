import { db } from "@backend/src/db/db";
import { speakersTable, utterancesTable } from "@backend/src/db/schema";
import { createAndSaveTranscript } from "@backend/src/services/processSpeechService/createAndSaveTranscript";
import { saveAudioToGCS } from "@backend/src/services/processSpeechService/saveAudioToGcs";
import { findMatchingVoiceProfile } from "@backend/src/services/processSpeechService/utils/findMatchingVoiceProfile";
import { getSpeakerEmbeddingFromBuffer } from "@backend/src/services/processSpeechService/utils/getSpeakerEmbeddingFromBuffer";
import { insertNewVoiceProfile } from "@backend/src/services/processSpeechService/utils/insertNewVoiceProfile";
import { socketService } from "@backend/src/services/socketService";
import type { Utterance } from "@backend/src/types/deepgram";
import { convertFloat32ArrayToWavBuffer } from "@backend/src/utils/audio/audioUtils";
import { getWavBufferDuration } from "@backend/src/utils/audio/getWavBufferDuration";
import { generateReadableUUID } from "@backend/src/utils/generateReadableUUID";
import { eq, inArray } from "drizzle-orm";
import fs from "node:fs";

const DEBUG = true;
export const processFinalizedSpeechChunk = async (
	userId: string,
	audio: Float32Array,
	speechStartTime: number,
) => {
	// 1. Convert raw audio to WAV
	const wavBuffer = convertFloat32ArrayToWavBuffer(audio);
	if (DEBUG) fs.writeFileSync(`1-BUFFER.wav`, wavBuffer);

	const durationMs = getWavBufferDuration(wavBuffer);
	if (DEBUG) console.log("🪲 1 DURATION", durationMs);

	const fileId = generateReadableUUID(speechStartTime, durationMs);

	// 2. Transcribe and store utterances
	const utterances = await createAndSaveTranscript(
		userId,
		fileId,
		wavBuffer,
		speechStartTime,
	);
	if (!utterances) return;

	// 3. Extract segments per Deepgram speaker index
	// Example input (utterances):
	// [
	//   { speaker: 0, start: 0.1, end: 1.2 },
	//   { speaker: 1, start: 1.5, end: 2.4 },
	//   { speaker: 0, start: 2.6, end: 3.0 }
	// ]
	// Resulting segmentsBySpeakerIndex:
	// Map {
	//   0 => [{ start: 0.1, end: 1.2 }, { start: 2.6, end: 3.0 }],
	//   1 => [{ start: 1.5, end: 2.4 }]
	// }
	const segmentsBySpeakerIndex = new Map<
		number,
		{ start: number; end: number }[]
	>();
	for (const u of utterances) {
		if (u.speaker === undefined) continue;
		const list = segmentsBySpeakerIndex.get(u.speaker) ?? [];
		list.push({ start: u.start, end: u.end });
		segmentsBySpeakerIndex.set(u.speaker, list);
	}
	if (DEBUG) console.log("🪲 2 segmentsBySpeakerIndex", segmentsBySpeakerIndex);

	// 4. Handle single-speaker audio
	if (segmentsBySpeakerIndex.size === 1) {
		if (DEBUG) console.log("🪲 ONE speaker detected");

		const firstUtterance = utterances[0] as Utterance;
		const embedding = await getSpeakerEmbeddingFromBuffer(wavBuffer);

		// 5. Try to match to existing voiceProfile
		const matched = await findMatchingVoiceProfile(embedding);
		let voiceProfileId: string;

		if (matched) {
			if (DEBUG) console.log("🪲 4 matchedVoiceProfile:", matched);
			voiceProfileId = matched.id;

			if (matched.speakerId) {
				const speakers = await db
					.select()
					.from(speakersTable)
					.where(eq(speakersTable.id, matched.speakerId));
				const speaker = speakers[0];
				socketService.socket?.emit("liveTranscriptSpeakerIdentified", {
					utteranceId: fileId,
					speakerId: voiceProfileId,
					speakerName: speaker?.name,
					matched: true,
				});
			}
		} else {
			socketService.socket?.emit("liveTranscriptSpeakerIdentified", {
				utteranceId: fileId,
				matched: false,
			});
			// 6. No match → create a new voiceProfile
			voiceProfileId = await insertNewVoiceProfile({
				duration: durationMs / 1000,
				language: firstUtterance.languages[0],
				fileId,
				embedding,
			});
			if (DEBUG) console.log("🪲 3 new voiceProfileId:", voiceProfileId);
		}

		// 7. Update utterances with this voiceProfileId
		await db
			.update(utterancesTable)
			.set({ voiceProfileId })
			.where(
				inArray(
					utterancesTable.id,
					utterances.map((u) => u.id),
				),
			);

		if (DEBUG)
			console.log(
				`🪲 5 Linked ${utterances.length} utterances to ${voiceProfileId}`,
			);
	}

	await saveAudioToGCS(fileId, wavBuffer, speechStartTime, durationMs);
};

// Collect all utterances with resolved speaker IDs
// const speakerResolvedUtterances: UtteranceWithSpeakerId[] = [];

// let isMatch = false;
// for (const [speakerIndex, segments] of segmentsBySpeakerIndex.entries()) {
// 	if (DEBUG) {
// 		console.log(">>>> 🪲 3 Processing speaker:", speakerIndex);
// 	}

// 	// Merge adjacent or close segments and extract their audio
// 	const merged = mergeSpeechSegments(segments);

// 	if (DEBUG) {
// 		console.log("🪲 4 Merged segments:", merged);
// 	}

// 	const speakerBuffer = extractSegmentsFromWavBuffer(wavBuffer, merged);

// 	if (!speakerBuffer) continue;

// 	if (DEBUG && speakerBuffer) {
// 		fs.writeFileSync(`2 speaker-${speakerIndex}.wav`, speakerBuffer);
// 		console.log("🪲 5 Wrote speaker buffer to file");
// 	}

// 	const duration = getWavBufferDuration(speakerBuffer) / 1000;

// 	console.log("🪲 6 Duration:", duration);

// 	const embedding = await getSpeakerEmbeddingFromBuffer(speakerBuffer);

// 	const matchedSpeaker = await findMatchingSpeaker(embedding);

// 	console.log("🪲 7 Matched speaker:", matchedSpeaker);

// 	let speakerId: string;

// 	if (matchedSpeaker) {
// 		isMatch = true;
// 		console.log("🔁 Recognized speaker:", matchedSpeaker.name);
// 		speakerId = matchedSpeaker.id;

// 		// If this utterance is longer, update the stored embedding
// 		if (duration > (matchedSpeaker.duration ?? 0)) {
// 			await updateSpeakerEmbedding(speakerId, embedding, duration);
// 			console.log(
// 				`📈 Updated speaker ${speakerId} embedding from ${matchedSpeaker.duration}s to ${duration}s`,
// 			);
// 		}
// 	} else {
// 		// Speaker not recognized — create a new entry in the DB
// 		speakerId = await insertNewSpeaker(embedding, duration);
// 		console.log(`🆕 Inserted new speaker ${speakerId}`);
// 	}

// 	// Attach speakerId to all utterances from this speaker group
// 	const resolvedUtterances = utterances
// 		.filter((u) => u.speaker === speakerIndex)
// 		.map((u) => ({ ...u, speakerId }));

// 	speakerResolvedUtterances.push(...resolvedUtterances);
// }

// if (isMatch) {
// 	// Perform a single DB update for all resolved utterances
// 	await updateUtterancesWithSpeaker(speakerResolvedUtterances);
// 	console.log("🔄 Updated utterances with speaker IDs");
// } else {
// 	console.log("🔄 No matches found");
// }

// Save the audio file to GCS if enabled
// 	await saveAudioToGCS(fileId, wavBuffer, speechStartTime, durationMs);
// };
