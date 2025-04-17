import { CHANNELS, SAMPLE_RATE } from "@/constants/audioConstants";
import { SAVE_RECORDINGS_TO_GCS_ENABLED } from "@/constants/features";
import { db } from "@/db/db";
import { utterancesTable } from "@/db/schema";
import { deepgram } from "@/services/external/deepgram";
import { socketService } from "@/services/socketService";
import type { Utterance } from "@/types/deepgram";
import { generateUtteranceId } from "@/utils/generateUtteranceId";
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

export const createAndSaveTranscript = async (
	fileId: string,
	audioBuffer: Buffer,
	startTime: number,
): Promise<Utterance[] | undefined> => {
	console.log("Creating and saving transcript...");

	socketService.socket?.emit("processingAudioUpdate", "2-transcribing");
	const result = await transcribeWithDeepgram(audioBuffer);
	socketService.socket?.emit("processingAudioUpdate", "3-done");

	const utterances = result?.results.utterances;
	const transcript = result?.results.channels[0].alternatives[0].transcript;

	console.log("Transcription content: ", transcript);

	if (!utterances || !transcript) {
		console.error("Missing transcript or utterances", { result });
		return;
	}

	socketService.socket?.emit("transcriptReceived", transcript, startTime);

	await Promise.all(
		utterances.map((u) =>
			db.insert(utterancesTable).values({
				id: generateUtteranceId(startTime, u.start, u.end),
				fileId: SAVE_RECORDINGS_TO_GCS_ENABLED ? fileId : undefined,
				start: u.start,
				end: u.end,
				transcript: u.transcript,
				confidence: u.confidence,
				createdAt: new Date(startTime),
				words: u.words,
				non_identified_speaker: u.speaker,
			}),
		),
	);

	console.log(`Saved ${utterances.length} utterances`);
	return utterances;
};
