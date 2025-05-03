import { db } from "@backend/src/db/db";
import { utterancesTable, voiceProfilesTable } from "@backend/src/db/schema";
import { getTranscriptFromAudioBuffer } from "@backend/src/services/processSpeechService/getTranscriptFromAudioBuffer";
import { saveAudioToGCS } from "@backend/src/services/processSpeechService/saveAudioToGcs";
import { findNearestVoiceProfile } from "@backend/src/services/processSpeechService/utils/findNearestVoiceProfile";
import { getVoiceProfileEmbeddingFromBuffer } from "@backend/src/services/processSpeechService/utils/getVoiceProfileEmbeddingFromBuffer";
import type { TypedSocket } from "@backend/src/types/socket-events";
import { convertFloat32ArrayToWavBuffer } from "@backend/src/utils/audio/audioUtils";
import { getWavBufferDuration } from "@backend/src/utils/audio/getWavBufferDuration";
import { generateReadableUUID } from "@backend/src/utils/generateReadableUUID";
import { generateUtteranceId } from "@backend/src/utils/generateUtteranceId";

const DEBUG = true;

type ProcessFinalizedSpeechChunkParams = {
	id: string;
	userId: string;
	socket: TypedSocket;
	audio: Float32Array;
	speechStartTime: number;
};

export const processFinalizedSpeechChunk = async ({
	id,
	userId,
	audio,
	speechStartTime,
	socket,
}: ProcessFinalizedSpeechChunkParams) => {
	// 1. Convert raw audio to WAV
	const wavBuffer = convertFloat32ArrayToWavBuffer(audio);
	const durationMs = getWavBufferDuration(wavBuffer);
	const fileId = generateReadableUUID(speechStartTime, durationMs);

	if (DEBUG) {
		console.log("🪲 1 DURATION", durationMs);
		// fs.writeFileSync(`${fileId}.wav`, wavBuffer);
	}

	socket.emit("processingSpeechUpdate", {
		phase: "3-transcribing",
		id,
	});

	// 2. Transcribe
	const { utterances, transcript } =
		await getTranscriptFromAudioBuffer(wavBuffer);

	if (utterances.length === 0 || transcript.length === 0) {
		console.warn("No utterances or transcript found");
		socket.emit("processingSpeechUpdate", {
			phase: "3.5-no-speech-detected",
			id,
		});
		return;
	}

	socket.emit("processingSpeechUpdate", {
		phase: "4-matching-speakers",
		id,
		utterances: utterances.map((u) => ({
			utteranceId: u.id,
			fileId,
			speechStart: u.start,
			speechEnd: u.end,
			transcript: u.transcript,
		})),
	});

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

	if (segmentsBySpeakerIndex.size === 0) {
		throw new Error(
			"[processFinalizedSpeechChunk] No segments by speaker index found",
		);
	}

	if (segmentsBySpeakerIndex.size > 1) {
		// TODO: Not handled yet
		return;
	}

	// 4. Handle single-speaker audio
	if (DEBUG) console.log("🪲 ONE speaker detected");

	const embedding = await getVoiceProfileEmbeddingFromBuffer(wavBuffer);

	// 5. Try to match to existing voiceProfile
	const matchedVoiceProfile = await findNearestVoiceProfile(embedding);
	if (DEBUG) {
		console.log(
			`🪲 ---  MATCHED USER ? ${matchedVoiceProfile?.speaker_id ?? "NO"}`,
		);
		console.log(
			`🪲 ---  MATCHED VOICE PROFILE ? ${matchedVoiceProfile?.id ?? "NO"}`,
		);
	}

	socket.emit("processingSpeechUpdate", {
		phase: "5-done",
		id,
		utterances: utterances.map((u) => ({
			utteranceId: u.id,
			speakerId: matchedVoiceProfile?.speaker_id ?? null,
			voiceProfileId: matchedVoiceProfile?.id ?? null,
		})),
	});

	let voiceProfileId = matchedVoiceProfile?.id;

	// 6. If no match, insert a new voiceProfile
	if (!voiceProfileId) {
		const [{ id }] = await db
			.insert(voiceProfilesTable)
			.values({
				id: fileId,
				fileId,
				speakerId: null,
				embedding,
				duration: durationMs / 1000,
				createdAt: new Date(speechStartTime),
				userId,
			})
			.returning({ id: voiceProfilesTable.id });

		voiceProfileId = id;

		console.log(`🪲 ---  Created new voice profile ${voiceProfileId}`);
	}

	await Promise.all(
		utterances.map((u) =>
			db.insert(utterancesTable).values({
				id: generateUtteranceId(speechStartTime, u.start, u.end),
				fileId,
				fileStart: u.start,
				fileEnd: u.end,
				transcript: u.transcript,
				confidence: u.confidence,
				words: u.words,
				languages: u.languages,
				userId,
				voiceProfileId,
			}),
		),
	);

	console.log(`🪲 ---  Created ${utterances.length} new Utterances`);

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
