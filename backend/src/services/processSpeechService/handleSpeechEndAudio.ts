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

export const handleSpeechEndAudio = async (
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

	// Group utterance segments by speaker index provided by Deepgram
	const utterancesBySpeaker = new Map<
		number,
		{ start: number; end: number }[]
	>();

	for (const u of utterances) {
		if (u.speaker === undefined) continue;
		const list = utterancesBySpeaker.get(u.speaker) ?? [];
		list.push({ start: u.start, end: u.end });
		utterancesBySpeaker.set(u.speaker, list);
	}

	// To collect all enriched utterances with proper speaker IDs
	const allUtterancesWithSpeakerId: UtteranceWithSpeakerId[] = [];

	// For each detected speaker group, generate an embedding and match to known speakers
	for (const [speakerIndex, segments] of utterancesBySpeaker.entries()) {
		// Merge adjacent segments and extract audio
		const merged = mergeSpeechSegments(segments);
		const speakerBuffer = extractSegmentsFromWavBuffer(wavBuffer, merged);
		if (!speakerBuffer) continue;

		// Get embedding and duration for the current speaker's speech
		const embedding = await getSpeakerEmbeddingFromBuffer(speakerBuffer);
		const duration = getWavBufferDuration(speakerBuffer) / 1000;

		// Try to match this speaker to an existing one in the DB
		const match = await findMatchingSpeaker(embedding);

		let speakerId: string;

		if (match) {
			console.log("🔁 Recognized speaker:", match.name);
			speakerId = match.id;

			// If the new segment is longer, update stored embedding
			if (duration > (match.duration ?? 0)) {
				await updateSpeakerEmbedding(speakerId, embedding, duration);
				console.log(
					`📈 Updated speaker ${speakerId} embedding from ${match.duration}s to ${duration}s`,
				);
			}
		} else {
			// Insert this as a brand new speaker in DB
			speakerId = await insertNewSpeaker(embedding, duration);
			console.log(`🆕 Inserted new speaker ${speakerId}`);
		}

		// Attach the resolved speakerId to the current speaker's utterances
		const enriched = utterances
			.filter((u) => u.speaker === speakerIndex)
			.map((u) => ({ ...u, speakerId }));

		allUtterancesWithSpeakerId.push(...enriched);
	}

	// Apply all speaker updates to the utterances table in one go
	await updateUtterancesWithSpeaker(allUtterancesWithSpeakerId);

	// Optionally save the audio file to GCS
	await saveAudioToGCS(fileId, wavBuffer, speechStartTime, durationMs);
};
