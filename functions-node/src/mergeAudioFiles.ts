import { getStorage } from "firebase-admin/storage";
import * as logger from "firebase-functions/logger";
import * as functions from "firebase-functions/v2";
import * as child_process from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import * as util from "node:util";

// Configuration parameters
const MAX_SILENCE_MS = 3000; // Maximum silence between recordings to be considered same conversation
const OUTPUT_FOLDER = "merged_recordings"; // Destination folder for merged recordings
const LOOKBACK_WINDOW_MS = 60000; // Look back 1 minute for related recordings
const CLEANUP_ORIGINALS = false; // Whether to delete original files after merging

const exec = util.promisify(child_process.exec);

/**
 * Helper function to extract timestamp and voice detection from filename
 */
function parseFilename(filename: string): {
	timestamp: Date;
	durationMs: number;
	hasVoice: boolean;
} | null {
	// Example filename: 2025-04-12T10:57:24.222Z__6000__VOICE_DETECTED.wav
	const regex = /^(.+?)__(\d+)(?:__VOICE_DETECTED)?\.wav$/;
	const match = filename.match(regex);

	if (!match) return null;

	const [, timestampStr, durationStr] = match;
	const hasVoice = filename.includes("__VOICE_DETECTED");

	try {
		const timestamp = new Date(timestampStr);
		const durationMs = Number.parseInt(durationStr, 10);

		return {
			timestamp,
			durationMs,
			hasVoice,
		};
	} catch (e) {
		logger.error("Error parsing filename:", e);
		return null;
	}
}

/**
 * Check if two recordings should be merged based on their timestamps
 */
function shouldMergeFiles(
	file1: { timestamp: Date },
	file2: { timestamp: Date },
): boolean {
	const timeDiff = Math.abs(
		file1.timestamp.getTime() - file2.timestamp.getTime(),
	);
	return timeDiff <= MAX_SILENCE_MS;
}

/**
 * Merge audio files using ffmpeg
 */
async function mergeAudioWithFfmpeg(
	filePaths: string[],
	outputPath: string,
): Promise<void> {
	// Create a temporary file list
	const tempFilePath = path.join(os.tmpdir(), "filelist.txt");

	// Create file content for ffmpeg concat
	const fileContent = filePaths
		.map((filePath) => `file '${filePath}'`)
		.join("\n");
	fs.writeFileSync(tempFilePath, fileContent);

	// Execute ffmpeg to merge files
	try {
		await exec(
			`ffmpeg -f concat -safe 0 -i "${tempFilePath}" -c copy "${outputPath}"`,
		);
		logger.info(
			`Successfully merged ${filePaths.length} files to ${outputPath}`,
		);
	} catch (error) {
		logger.error("Error merging files with ffmpeg:", error);
		throw error;
	} finally {
		// Clean up temp file
		if (fs.existsSync(tempFilePath)) {
			fs.unlinkSync(tempFilePath);
		}
	}
}

/**
 * Cloud function that merges audio files with voice when a new file is uploaded
 */
export const mergeAudioFiles = functions.storage.onObjectFinalized(
	{
		timeoutSeconds: 300, // 5 minutes
		memory: "1GiB",
		region: "europe-west4", // Same region as saveAudio function
	},
	async (event) => {
		// Check if file is in the audio_recordings folder
		if (!event.data.name?.startsWith("audio_recordings/")) {
			logger.info("File not in audio_recordings folder, skipping");
			return;
		}

		// Get the filename from the path
		const fullPath = event.data.name;
		const filename = path.basename(fullPath);

		// Parse the filename to get metadata
		const fileInfo = parseFilename(filename);
		if (!fileInfo) {
			logger.error(`Unable to parse filename: ${filename}`);
			return;
		}

		// If the file doesn't have voice, ignore it
		if (!fileInfo.hasVoice) {
			logger.info(`File ${filename} doesn't have voice, skipping`);
			return;
		}

		logger.info(`Processing file with voice: ${filename}`);

		// Get storage bucket
		const bucket = getStorage().bucket(event.data.bucket);

		// List files in audio_recordings folder
		const [files] = await bucket.getFiles({
			prefix: "audio_recordings/",
		});

		// Filter and parse files
		const audioFiles = files
			.map((file) => {
				const fileName = path.basename(file.name);
				const info = parseFilename(fileName);
				if (!info) return null;

				return {
					file,
					name: fileName,
					path: file.name,
					timestamp: info.timestamp,
					durationMs: info.durationMs,
					hasVoice: info.hasVoice,
				};
			})
			.filter((file) => file !== null) as Array<{
			file: {
				download: (options: { destination: string }) => Promise<unknown>;
				delete: () => Promise<unknown>;
				name: string;
			};
			name: string;
			path: string;
			timestamp: Date;
			durationMs: number;
			hasVoice: boolean;
		}>;

		// Filter voice files within lookback window
		const currentFileTime = fileInfo.timestamp.getTime();
		const recentVoiceFiles = audioFiles
			.filter((file) => file.hasVoice)
			.filter((file) => {
				const timeDiff = Math.abs(file.timestamp.getTime() - currentFileTime);
				return timeDiff <= LOOKBACK_WINDOW_MS;
			})
			.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

		// If there's only one file (the current one), no need to merge
		if (recentVoiceFiles.length <= 1) {
			logger.info("No other recent voice recordings found to merge");
			return;
		}

		// Group files that should be merged together
		const fileSets: Array<typeof recentVoiceFiles> = [];
		let currentSet: typeof recentVoiceFiles = [recentVoiceFiles[0]];

		for (let i = 1; i < recentVoiceFiles.length; i++) {
			const prevFile = recentVoiceFiles[i - 1];
			const currentFile = recentVoiceFiles[i];

			if (shouldMergeFiles(prevFile, currentFile)) {
				currentSet.push(currentFile);
			} else {
				fileSets.push([...currentSet]);
				currentSet = [currentFile];
			}
		}

		// Add the last set if it has files
		if (currentSet.length > 0) {
			fileSets.push(currentSet);
		}

		// Process each set of files to merge
		for (const fileSet of fileSets) {
			// Only process sets that contain the current file
			if (!fileSet.some((file) => file.name === filename)) {
				continue;
			}

			// Skip sets with only one file
			if (fileSet.length <= 1) {
				continue;
			}

			logger.info(`Merging set of ${fileSet.length} files`);

			// Create temp directory for processing
			const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "audio-merge-"));
			const tempFiles: string[] = [];

			try {
				// Download all files to temp directory
				for (const file of fileSet) {
					const tempFilePath = path.join(tempDir, file.name);
					tempFiles.push(tempFilePath);

					await file.file.download({
						destination: tempFilePath,
					});
				}

				// Determine output filename
				const firstFile = fileSet[0];
				// const lastFile = fileSet[fileSet.length - 1];
				const totalDuration = fileSet.reduce(
					(sum, file) => sum + file.durationMs,
					0,
				);

				const outputFileName = `${firstFile.timestamp.toISOString()}__${totalDuration}__MERGED_VOICE.wav`;
				const outputTempPath = path.join(tempDir, outputFileName);

				// Merge files with ffmpeg
				await mergeAudioWithFfmpeg(tempFiles, outputTempPath);

				// Upload merged file
				const outputPath = `${OUTPUT_FOLDER}/${outputFileName}`;
				await bucket.upload(outputTempPath, {
					destination: outputPath,
					metadata: {
						contentType: "audio/wav",
						metadata: {
							"has-voice": "true",
							duration: totalDuration.toString(),
							merged: "true",
							"source-files": fileSet.map((f) => f.name).join(","),
						},
					},
				});

				logger.info(`Successfully uploaded merged file to ${outputPath}`);

				// If configured, delete original files
				if (CLEANUP_ORIGINALS) {
					for (const file of fileSet) {
						await file.file.delete();
						logger.info(`Deleted original file: ${file.path}`);
					}
				}
			} catch (error) {
				logger.error("Error processing file set:", error);
			} finally {
				// Clean up temp directory
				for (const tempFile of tempFiles) {
					if (fs.existsSync(tempFile)) {
						fs.unlinkSync(tempFile);
					}
				}

				if (fs.existsSync(tempDir)) {
					fs.rmdirSync(tempDir, { recursive: true });
				}
			}
		}

		logger.info("Audio merge processing completed");
	},
);
