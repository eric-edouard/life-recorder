import { db } from "@/db/db";
import { memoriesTable } from "@/db/schema";
import { assemblyAi } from "@/services/assemblyAi";

export const createAndSaveTranscript = async (
	audio: Float32Array,
	startTime: number,
): Promise<void> => {
	const transcription = await assemblyAi.transcripts.transcribe({
		audio,
	});

	if (transcription.error) {
		console.error("Error transcribing audio:", transcription.error);
		return;
	}

	if (!transcription.text) {
		console.error("No transcription text found");
		return;
	}

	await db.insert(memoriesTable).values({
		content: transcription.text,
		createdAt: new Date(startTime),
	});
};
