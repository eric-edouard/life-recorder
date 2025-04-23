import { createAndSaveTranscript } from "@backend/services/processSpeechService/createAndSaveTranscript";
import { saveAudioToGCS } from "@backend/services/processSpeechService/saveAudioToGcs";
import { findMatchingSpeaker } from "@backend/services/processSpeechService/utils/findMatchingSpeaker";
import { getSpeakerEmbeddingFromBuffer } from "@backend/services/processSpeechService/utils/getSpeakerEmbeddingFromBuffer";
import { insertNewSpeaker } from "@backend/services/processSpeechService/utils/insertNewSpeaker";
import { mergeSpeechSegments } from "@backend/services/processSpeechService/utils/mergeSegments";
import { updateSpeakerEmbedding } from "@backend/services/processSpeechService/utils/updateSpeakerEmbedding";
import { updateUtterancesWithSpeaker } from "@backend/services/processSpeechService/utils/updateUtterancesWithSpeaker";
import type { UtteranceWithSpeakerId } from "@backend/types/UtteranceWithSpeakerId";
import { convertFloat32ArrayToWavBuffer } from "@backend/utils/audio/audioUtils";
import { extractSegmentsFromWavBuffer } from "@backend/utils/audio/extractSegmentsFromWavBuffer";
import { getWavBufferDuration } from "@backend/utils/audio/getWavBufferDuration";
import { generateReadableUUID } from "@backend/utils/generateReadableUUID";
import fs from "node:fs";

const DEBUG = true;
export const processFinalizedSpeechChunk = async (
	audio: Float32Array,
	speechStartTime: number,
) => {
	// Convert the raw audio into a WAV buffer
	const wavBuffer = convertFloat32ArrayToWavBuffer(audio);

	if (DEBUG) {
		fs.writeFileSync(`1-BUFFER.wav`, wavBuffer);
	}

	// Get total duration and create a unique ID for the file
	const durationMs = getWavBufferDuration(wavBuffer);

	if (DEBUG) {
		console.log("🪲 1 DURATION", durationMs);
	}

	const fileId = generateReadableUUID(speechStartTime, durationMs);

	// Transcribe the WAV using Deepgram and store utterances immediately
	const utterances = await createAndSaveTranscript(
		fileId,
		wavBuffer,
		speechStartTime,
	);

	if (!utterances) return;

	// Group utterance time segments by speaker index provided by Deepgram
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

	if (DEBUG) {
		console.log("🪲 2 segmentsBySpeakerIndex", segmentsBySpeakerIndex);
	}

	// Collect all utterances with resolved speaker IDs
	const speakerResolvedUtterances: UtteranceWithSpeakerId[] = [];

	let isMatch = false;
	for (const [speakerIndex, segments] of segmentsBySpeakerIndex.entries()) {
		if (DEBUG) {
			console.log(">>>> 🪲 3 Processing speaker:", speakerIndex);
		}

		// Merge adjacent or close segments and extract their audio
		const merged = mergeSpeechSegments(segments);

		if (DEBUG) {
			console.log("🪲 4 Merged segments:", merged);
		}

		const speakerBuffer = extractSegmentsFromWavBuffer(wavBuffer, merged);

		if (!speakerBuffer) continue;

		if (DEBUG && speakerBuffer) {
			fs.writeFileSync(`2 speaker-${speakerIndex}.wav`, speakerBuffer);
			console.log("🪲 5 Wrote speaker buffer to file");
		}

		const duration = getWavBufferDuration(speakerBuffer) / 1000;

		console.log("🪲 6 Duration:", duration);

		const embedding = await getSpeakerEmbeddingFromBuffer(speakerBuffer);

		const matchedSpeaker = await findMatchingSpeaker(embedding);

		console.log("🪲 7 Matched speaker:", matchedSpeaker);

		let speakerId: string;

		if (matchedSpeaker) {
			isMatch = true;
			console.log("🔁 Recognized speaker:", matchedSpeaker.name);
			speakerId = matchedSpeaker.id;

			// If this utterance is longer, update the stored embedding
			if (duration > (matchedSpeaker.duration ?? 0)) {
				await updateSpeakerEmbedding(speakerId, embedding, duration);
				console.log(
					`📈 Updated speaker ${speakerId} embedding from ${matchedSpeaker.duration}s to ${duration}s`,
				);
			}
		} else {
			// Speaker not recognized — create a new entry in the DB
			speakerId = await insertNewSpeaker(embedding, duration);
			console.log(`🆕 Inserted new speaker ${speakerId}`);
		}

		// Attach speakerId to all utterances from this speaker group
		const resolvedUtterances = utterances
			.filter((u) => u.speaker === speakerIndex)
			.map((u) => ({ ...u, speakerId }));

		speakerResolvedUtterances.push(...resolvedUtterances);
	}

	if (isMatch) {
		// Perform a single DB update for all resolved utterances
		await updateUtterancesWithSpeaker(speakerResolvedUtterances);
		console.log("🔄 Updated utterances with speaker IDs");
	} else {
		console.log("🔄 No matches found");
	}

	// Save the audio file to GCS if enabled
	await saveAudioToGCS(fileId, wavBuffer, speechStartTime, durationMs);
};
