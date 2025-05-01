import "dotenv/config";
import { eq } from "drizzle-orm";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { db } from "../src/db/db";
import { speakersTable, voiceProfilesTable } from "../src/db/schema";

/**
 * Script to fetch all voice profile embeddings and project them into 2D space
 * using a Python script for visualization.
 */
async function main() {
	console.log("Fetching voice profile embeddings from database...");

	// Fetch all voice profiles with their embeddings and speaker IDs
	const voiceProfiles = await db
		.select({
			id: voiceProfilesTable.id,
			embedding: voiceProfilesTable.embedding,
			speakerId: voiceProfilesTable.speakerId,
			createdAt: voiceProfilesTable.createdAt,
		})
		.from(voiceProfilesTable);

	console.log(`Found ${voiceProfiles.length} voice profiles`);

	if (voiceProfiles.length === 0) {
		console.log("No voice profiles found. Exiting.");
		return;
	}

	// Get speaker names for each profile
	const speakerMap = new Map();
	for (const profile of voiceProfiles) {
		if (profile.speakerId && !speakerMap.has(profile.speakerId)) {
			const speaker = await db
				.select({ name: speakersTable.name })
				.from(speakersTable)
				.where(eq(speakersTable.id, profile.speakerId))
				.limit(1);

			if (speaker.length > 0) {
				speakerMap.set(profile.speakerId, speaker[0].name);
			}
		}
	}

	// Prepare data for Python script
	const data = {
		embeddings: voiceProfiles.map((profile) => profile.embedding),
		labels: voiceProfiles.map((profile) => {
			const speakerName = profile.speakerId
				? speakerMap.get(profile.speakerId) || profile.speakerId
				: "unknown";
			const dateTime = profile.createdAt
				? new Date(profile.createdAt).toLocaleString()
				: "";
			const type = profile.type ? `-${profile.type}` : "";
			return `${speakerName}${type} (${dateTime})`;
		}),
		ids: voiceProfiles.map((profile) => profile.id),
	};

	// Write the embeddings to a temporary JSON file
	const tempFile = path.resolve(
		__dirname,
		"../resemblyzer/temp_embeddings.json",
	);
	await fs.writeFile(tempFile, JSON.stringify(data));

	console.log(`Embeddings saved to ${tempFile}`);
	console.log("Running Python script to visualize embeddings...");

	// Path to the Python script
	const scriptPath = path.resolve(
		__dirname,
		"../resemblyzer/project_embeddings.py",
	);

	// Spawn Python process
	const pythonProcess = spawn("python3", [scriptPath, tempFile]);

	// Handle process output
	pythonProcess.stdout.on("data", (data: Buffer) => {
		console.log(data.toString());
	});

	pythonProcess.stderr.on("data", (data: Buffer) => {
		console.error(`Error: ${data.toString()}`);
	});

	// Handle process completion
	pythonProcess.on("close", async (code: number) => {
		console.log(`Python process exited with code ${code}`);

		// Clean up temporary file
		try {
			await fs.unlink(tempFile);
			console.log("Temporary file deleted");
		} catch (error) {
			console.warn("Could not delete temporary file:", error);
		}

		if (code === 0) {
			console.log(
				"Embeddings visualization complete. Output saved to embeddings_projection.png",
			);
		} else {
			console.error("Failed to visualize embeddings");
		}
	});
}

main().catch((error) => {
	console.error("Error:", error);
	process.exit(1);
});
