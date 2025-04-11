/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { OpusEncoder } from "@discordjs/opus";
import type { Request, Response } from "express";
import { getStorage } from "firebase-admin/storage";
import * as logger from "firebase-functions/logger";
import { onRequest } from "firebase-functions/v2/https";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { WaveFile } from "wavefile";

/**
 * Opus decoder class to convert Opus data to PCM
 */
class OpusDecoder {
	private decoder: OpusEncoder;

	constructor(sampleRate = 16000, channels = 1) {
		this.decoder = new OpusEncoder(sampleRate, channels);
	}

	decodePacket(data: Buffer): Buffer {
		try {
			// Decode Opus to PCM 16-bit
			const pcmData = this.decoder.decode(data);
			return pcmData;
		} catch (e) {
			logger.error("Opus decode error:", e);
			return Buffer.from([]);
		}
	}
}

/**
 * Convert multiple Opus packets to a single WAV file
 */
function opusPacketsToWav(
	opusPackets: Buffer[],
	sampleRate = 16000,
	channels = 1,
): Buffer {
	const decoder = new OpusDecoder(sampleRate, channels);

	// Decode each opus packet to PCM and collect the results
	const allPcmData: Int16Array[] = [];
	let totalSamples = 0;

	for (const packet of opusPackets) {
		// Decode the current packet
		const pcmData = decoder.decodePacket(packet);

		if (pcmData && pcmData.length > 0) {
			// Convert Buffer to Int16Array (PCM 16-bit format)
			const int16Data = new Int16Array(
				pcmData.buffer,
				pcmData.byteOffset,
				pcmData.byteLength / 2,
			);
			allPcmData.push(int16Data);
			totalSamples += int16Data.length;
		}
	}

	// If no packets were successfully decoded, throw error
	if (allPcmData.length === 0) {
		throw new Error("Failed to decode any Opus packets");
	}

	// Combine all PCM data into a single array
	const combinedPcmData = new Int16Array(totalSamples);
	let offset = 0;

	for (const pcmChunk of allPcmData) {
		combinedPcmData.set(pcmChunk, offset);
		offset += pcmChunk.length;
	}

	// Create WAV file
	const wav = new WaveFile();

	// Create a 16-bit PCM WAV file from the combined PCM data
	wav.fromScratch(channels, sampleRate, "16", Array.from(combinedPcmData));

	// Get the WAV file as a buffer
	return Buffer.from(wav.toBuffer());
}

/**
 * Firebase HTTP function to save audio
 */
export const saveAudio = onRequest(
	{
		cors: ["*"],
		region: "europe-west4",
	},
	async (
		// biome-ignore lint/complexity/noBannedTypes: needed for express
		req: Request<{}, {}, { opus_data_packets: string[] }>,
		res: Response,
	): Promise<void> => {
		// Check if request is POST
		if (req.method !== "POST") {
			res.status(405).json({ error: "Method not allowed" });
			return;
		}

		// Get request body
		const requestJson = req.body;

		// Check for opus_data_packets array
		if (
			!requestJson ||
			!requestJson.opus_data_packets ||
			!Array.isArray(requestJson.opus_data_packets)
		) {
			res.status(400).json({
				error:
					"Missing required field: opus_data_packets must be an array of base64 encoded opus packets",
			});
			return;
		}

		try {
			logger.info(
				`Processing ${requestJson.opus_data_packets.length} opus packets`,
			);

			if (requestJson.opus_data_packets.length === 0) {
				res
					.status(400)
					.json({ error: "Empty opus_data_packets array provided" });
				return;
			}

			// Convert base64 strings to Buffers
			const opusPackets = requestJson.opus_data_packets.map((packet: string) =>
				Buffer.from(packet, "base64"),
			);

			// Convert opus packets to WAV
			const wavData = opusPacketsToWav(
				opusPackets.map((bytes) => {
					// Trim the first 3 bytes (header) added by the Omi device
					const trimmedBytes = bytes.length > 3 ? bytes.slice(3) : bytes;
					return trimmedBytes;
				}),
			);

			// Create timestamp-based filename
			const now = new Date();
			const isoString = now
				.toISOString()
				.replace(/:/g, "-")
				.replace(/\./g, "-");
			const filename = `${isoString}.wav`;

			// Create a temp file path
			const tempFilePath = path.join(os.tmpdir(), filename);

			// Write the WAV file to temp directory
			fs.writeFileSync(tempFilePath, wavData);

			// Upload to Firebase Storage
			const bucket = getStorage().bucket();
			const destination = `audio_recordings/${filename}`;

			// Upload the file
			await bucket.upload(tempFilePath, {
				destination,
				metadata: {
					contentType: "audio/wav",
				},
			});

			// Make the file publicly accessible (optional)
			const file = bucket.file(destination);
			await file.makePublic();

			// Get the public URL
			const publicUrl = `https://storage.googleapis.com/${bucket.name}/${destination}`;

			// Clean up the temp file
			fs.unlinkSync(tempFilePath);

			// Return success with file URL
			res.status(200).json({
				status: "success",
				message: "Audio saved successfully",
				packets_processed: requestJson.opus_data_packets.length,
				filename,
				url: publicUrl,
			});
		} catch (e: unknown) {
			const error = e as Error;
			logger.error("Error processing audio:", error);
			res
				.status(500)
				.json({ error: `Failed to process audio: ${error.message}` });
		}
	},
);
