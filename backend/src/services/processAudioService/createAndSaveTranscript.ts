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
	});

	if (transcription.error) {
		console.error("Error transcribing audio:", transcription.error);
		return;
	}

	if (!transcription.text) {
		console.error("No transcription text found");
		return;
	}

	console.log("Transcript: ", transcription.text);

	await db.insert(memoriesTable).values({
		content: transcription.text,
		createdAt: new Date(startTime),
	});

	console.log("Transcript created and saved !");
};
