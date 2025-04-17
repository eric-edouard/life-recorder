// // Assume `embeddingFromResemblyzer` is a function returning a Promise<number[]>
// // and `compareEmbeddings` is a function that returns a similarity score between two embeddings.

// import type { Utterance } from "@/types/deepgram";
// import { generateUtteranceId } from "@/utils/generateUtteranceId";

// async function processAndSaveUtterance(
// 	utterance: Utterance,
// 	recordingStartTime: number,
// 	fileId: string,
// ) {
// 	// Generate a unique ID for the utterance
// 	const utteranceId = generateUtteranceId(
// 		recordingStartTime,
// 		utterance.start,
// 		utterance.end,
// 	);

// 	// Get the embedding for this utterance's audio segment
// 	const embedding = await embeddingFromResemblyzer(utterance.audioSegment);

// 	// Look for a matching speaker
// 	let speakerId: string | undefined;
// 	const existingSpeakers = await db.select().from(speakersTable);

// 	for (const speaker of existingSpeakers) {
// 		const similarity = compareEmbeddings(embedding, speaker.embedding);
// 		// Assume a threshold, e.g., similarity > 0.8 means a match
// 		if (similarity > 0.8) {
// 			speakerId = speaker.id;
// 			break;
// 		}
// 	}

// 	// If no match, create a new speaker record
// 	if (!speakerId) {
// 		speakerId = generateNewSpeakerId(); // similar to generateReadableUUID or other method
// 		await db.insert(speakersTable).values({
// 			id: speakerId,
// 			name: null, // Or assign a default name
// 			embedding, // Store embedding array as JSONB
// 			createdAt: new Date(),
// 		});
// 	}

// 	// Now save the utterance with the identified speaker
// 	await db.insert(utterancesTable).values({
// 		id: utteranceId,
// 		fileId,
// 		start: utterance.start,
// 		end: utterance.end,
// 		transcript: utterance.transcript,
// 		confidence: utterance.confidence,
// 		speaker: speakerId,
// 		non_identified_speaker: utterance.non_identified_speaker,
// 		words: utterance.words,
// 		location: utterance.location,
// 		latitude: utterance.latitude,
// 		longitude: utterance.longitude,
// 		createdAt: new Date(recordingStartTime),
// 	});
// }
