import { createAndSaveTranscript } from "@/services/processSpeechService/createAndSaveTranscript";
import { saveAudioToGCS } from "@/services/processSpeechService/saveAudioToGcs";
import { findMatchingSpeaker } from "@/services/processSpeechService/utils/findMatchingSpeaker";
import { getNbSpeakersFromUtterances } from "@/services/processSpeechService/utils/getNbSpeakersFromUtterances";
import { getSpeakerEmbeddingFromBuffer } from "@/services/processSpeechService/utils/getSpeakerEmbeddingFromBuffer";
import { insertNewSpeaker } from "@/services/processSpeechService/utils/insertNewSpeaker";
import { updateSpeakerEmbedding } from "@/services/processSpeechService/utils/updateSpeakerEmbedding";
import { convertFloat32ArrayToWavBuffer } from "@/utils/audio/audioUtils";
import { getWavBufferDuration } from "@/utils/audio/getWavBufferDuration";
import { generateReadableUUID } from "@/utils/generateReadableUUID";

export const handleSpeechEndAudio = async (
	audio: Float32Array,
	speechStartTime: number,
) => {
	const wavBuffer = convertFloat32ArrayToWavBuffer(audio);
	const durationMs = getWavBufferDuration(wavBuffer);
	const fileId = generateReadableUUID(speechStartTime, durationMs);

	const utterances = await createAndSaveTranscript(
		fileId,
		wavBuffer,
		speechStartTime,
	);

	if (!utterances) {
		return;
	}

	const nbSpeakers = getNbSpeakersFromUtterances(utterances);
	if (nbSpeakers === 1) {
		const embedding = await getSpeakerEmbeddingFromBuffer(wavBuffer);
		const durationSeconds = getWavBufferDuration(wavBuffer) / 1000; // convert ms to seconds

		const speaker = await findMatchingSpeaker(embedding);

		let speakerId: string;

		if (speaker) {
			console.log("🔁 Recognized speaker:", speaker.name);
			speakerId = speaker.id;

			if (durationSeconds > (speaker.duration ?? 0)) {
				await updateSpeakerEmbedding(speakerId, embedding, durationSeconds);
				console.log(
					`📈 Updated speaker ${speaker.id} embedding from ${speaker.duration}s to ${durationSeconds}s`,
				);
			}
		} else {
			console.log("🆕 New speaker detected");
			speakerId = await insertNewSpeaker(embedding, durationSeconds);
			console.log(
				`📈 Inserted new speaker ${speakerId} with duration ${durationSeconds}s`,
			);
		}
	}

	await saveAudioToGCS(fileId, wavBuffer, speechStartTime, durationMs);
};
