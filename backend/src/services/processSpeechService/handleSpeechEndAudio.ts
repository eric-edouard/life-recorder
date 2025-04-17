import { createAndSaveTranscript } from "@/services/processSpeechService/createAndSaveTranscript";
import { saveAudioToGCS } from "@/services/processSpeechService/saveAudioToGcs";
import { findMatchingSpeaker } from "@/services/processSpeechService/utils/findMatchingSpeaker";
import { getSpeakerEmbeddingFromBuffer } from "@/services/processSpeechService/utils/getSpeakerEmbeddingFromBuffer";
import { insertNewSpeaker } from "@/services/processSpeechService/utils/insertNewSpeaker";
import { mergeSpeechSegments } from "@/services/processSpeechService/utils/mergeSegments";
import { updateSpeakerEmbedding } from "@/services/processSpeechService/utils/updateSpeakerEmbedding";
import { updateUtterancesWithSpeaker } from "@/services/processSpeechService/utils/updateUtterancesWithSpeaker";
import type { UtteranceWithSpeakerId } from "@/types/UtteranceWithSpeakerId";
import { convertFloat32ArrayToWavBuffer } from "@/utils/audio/audioUtils";
import { extractSegmentsFromWavBuffer } from "@/utils/audio/extractSegmentsFromWavBuffer";
import { getWavBufferDuration } from "@/utils/audio/getWavBufferDuration";
import { generateReadableUUID } from "@/utils/generateReadableUUID";

export const processFinalizedSpeechChunk = async (
	audio: Float32Array,
	speechStartTime: number,
) => {
	// Convert the raw audio into a WAV buffer
	const wavBuffer = convertFloat32ArrayToWavBuffer(audio);

	// Get total duration and create a unique ID for the file
	const durationMs = getWavBufferDuration(wavBuffer);
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

	// Collect all utterances with resolved speaker IDs
	const speakerResolvedUtterances: UtteranceWithSpeakerId[] = [];

	for (const [speakerIndex, segments] of segmentsBySpeakerIndex.entries()) {
		// Merge adjacent or close segments and extract their audio
		const merged = mergeSpeechSegments(segments);
		const speakerBuffer = extractSegmentsFromWavBuffer(wavBuffer, merged);
		if (!speakerBuffer) continue;

		// Generate speaker embedding and calculate duration
		const embedding = await getSpeakerEmbeddingFromBuffer(speakerBuffer);
		const duration = getWavBufferDuration(speakerBuffer) / 1000;

		// Try to match this speaker to one already in the DB
		const matchedSpeaker = await findMatchingSpeaker(embedding);

		let speakerId: string;

		if (matchedSpeaker) {
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

	// Perform a single DB update for all resolved utterances
	await updateUtterancesWithSpeaker(speakerResolvedUtterances);
	console.log("🔄 Updated utterances with speaker IDs");

	// Save the audio file to GCS if enabled
	await saveAudioToGCS(fileId, wavBuffer, speechStartTime, durationMs);
};
