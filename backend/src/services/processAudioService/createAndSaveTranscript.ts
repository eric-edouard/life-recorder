import { db } from "@/db/db";
import { memoriesTable } from "@/db/schema";
import { assemblyAi } from "@/services/assemblyAi";

export const createAndSaveTranscript = async (
	audioBuffer: Buffer,
	startTime: number,
): Promise<void> => {
	console.log("Creating and saving transcript...");
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

	const content =
		transcription.utterances && transcription.utterances.length > 0
			? transcription.utterances
					.map((u) => `Speaker ${u.speaker}: ${u.text}`)
					.join("\n")
			: transcription.text;

	console.log("Transcription content: ", content);

	await db.insert(memoriesTable).values({
		content,
		createdAt: new Date(startTime),
	});

	console.log("Transcript created and saved !");
};
