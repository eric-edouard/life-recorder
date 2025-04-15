import { CHANNELS, SAMPLE_RATE } from "@/constants/audioConstants";
import { TRANSCRIPTION_SERVICE } from "@/constants/features";
import { db } from "@/db/db";
import { memoriesTable } from "@/db/schema";
import { assemblyAi } from "@/services/external/assemblyAi";
import { deepgram } from "@/services/external/deepgram";
import { socketService } from "@/services/socketService";

const transcribeWithAssemblyAi = async (
	audioBuffer: Buffer,
): Promise<string | undefined> => {
	const transcription = await assemblyAi.transcripts.transcribe({
		audio: audioBuffer,
		speaker_labels: true,
		speech_model: "best",
		language_detection: true,
	});

	if (transcription.error) {
		console.error("Error transcribing audio:", transcription.error);
		return;
	}
	if (
		!transcription.text ||
		!transcription.utterances ||
		transcription.utterances.length === 0
	) {
		console.error("No transcription text or utterances found");
		return;
	}

	return transcription.utterances && transcription.utterances.length > 0
		? transcription.utterances
				.map((u) => `Speaker ${u.speaker}: ${u.text}`)
				.join("\n")
		: transcription.text;
};

const transcribeWithDeepgram = async (
	audioBuffer: Buffer,
): Promise<string | undefined> => {
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

	return transcription.result.results.channels[0].alternatives[0].transcript;
};
export const createAndSaveTranscript = async (
	audioBuffer: Buffer,
	startTime: number,
): Promise<void> => {
	console.log("Creating and saving transcript...");
	const content =
		TRANSCRIPTION_SERVICE === "ASSEMBLYAI"
			? await transcribeWithAssemblyAi(audioBuffer)
			: await transcribeWithDeepgram(audioBuffer);

	console.log("Transcription content: ", content);

	if (!content) {
		console.error("No transcription content found");
		return;
	}

	socketService.socket?.emit("transcriptReceived", content, startTime);

	await db.insert(memoriesTable).values({
		content,
		createdAt: new Date(startTime),
	});

	console.log("Transcript created and saved !");
};
