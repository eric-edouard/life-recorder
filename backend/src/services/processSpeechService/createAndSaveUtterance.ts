import { CHANNELS, SAMPLE_RATE } from "@backend/src/constants/audioConstants";
import { db } from "@backend/src/db/db";
import { utterancesTable } from "@backend/src/db/schema";
import { deepgram } from "@backend/src/services/external/deepgram";
import type { Utterance } from "@backend/src/types/deepgram";
import type { TypedSocket } from "@backend/src/types/socket-events";
import { generateUtteranceId } from "@backend/src/utils/generateUtteranceId";
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

export const createAndSaveUtterance = async (
	socket: TypedSocket,
	fileId: string,
	audioBuffer: Buffer,
	startTime: number,
): Promise<Utterance[] | undefined> => {
	console.log("Creating and saving transcript...");

	socket.emit("processingAudioUpdate", "2-transcribing");
	const result = await transcribeWithDeepgram(audioBuffer);
	socket.emit("processingAudioUpdate", "3-done");

	const utterances = result?.results.utterances;
	const transcript = result?.results.channels[0].alternatives[0].transcript;

	console.log("Transcription content: ", transcript);
	console.log("Transcription result: ", JSON.stringify(result, null, 2));

	if (!utterances || !transcript) {
		console.error("Missing transcript or utterances", JSON.stringify(result));
		return;
	}

	socket.emit("liveTranscript", {
		startTime,
		transcript,
		utteranceId: fileId,
	});

	await Promise.all(
		utterances.map((u) =>
			db.insert(utterancesTable).values({
				status: "1_pending_voice_profile",
				id: generateUtteranceId(startTime, u.start, u.end),
				fileId,
				start: u.start,
				end: u.end,
				transcript: u.transcript,
				confidence: u.confidence,
				createdAt: new Date(startTime),
				words: u.words,
				nonIdentifiedDeepgramSpeaker: u.speaker!,
				// Deepgram does return this in  the data but it's not typed by their SDK
				languages: (u as Utterance & { languages: string[] }).languages,
				userId: socket.data.auth.user.id,
			}),
		),
	);

	console.log(`Saved ${utterances.length} utterances`);
	return utterances as Utterance[];
};
