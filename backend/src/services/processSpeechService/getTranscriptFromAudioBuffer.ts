import { CHANNELS, SAMPLE_RATE } from "@backend/src/constants/audioConstants";
import { deepgram } from "@backend/src/services/external/deepgram";
import type { Utterance } from "@backend/src/types/deepgram";
import type { SyncPrerecordedResponse } from "@deepgram/sdk";

const transcribeWithDeepgram = async (
	audioBuffer: Buffer,
): Promise<SyncPrerecordedResponse | undefined> => {
	const transcription = await deepgram.listen.prerecorded.transcribeFile(
		audioBuffer,
		{
			model: "nova-3",
			encoding: "linear16",
			sample_rate: SAMPLE_RATE,
			channels: CHANNELS,
			language: "multi",
			diarize: true,
			smart_format: true,
			filler_words: true,
			utterances: true,
		},
	);

	if (transcription.error) {
		console.error("Error transcribing audio:", transcription.error);
		return;
	}

	if (!transcription.result) {
		console.error("No transcription result found");
		return;
	}

	return transcription.result;
};

export const getTranscriptFromAudioBuffer = async (
	audioBuffer: Buffer,
): Promise<{ utterances: Utterance[]; transcript: string }> => {
	console.log("Creating and saving transcript...");

	const result = await transcribeWithDeepgram(audioBuffer);

	const utterances = result?.results.utterances as Utterance[];
	const transcript =
		result?.results.channels[0].alternatives[0].transcript ?? "";

	console.log("Transcription content: ", transcript);

	return {
		utterances,
		transcript,
	};
};
