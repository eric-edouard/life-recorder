import { CHANNELS, SAMPLE_RATE } from "@/constants/audioConstants";
import ffmpeg from "ffmpeg-static";
import { spawn } from "node:child_process";
/**
 * Convert WAV buffer to MP3 using ffmpeg
 */
export async function convertWavToMp3(wavBuffer: Buffer): Promise<Buffer> {
	return new Promise((resolve, reject) => {
		if (!ffmpeg) {
			reject(new Error("ffmpeg-static not found"));
			return;
		}

		const process = spawn(
			ffmpeg,
			[
				"-i",
				"pipe:0",
				"-f",
				"mp3",
				"-acodec",
				"libmp3lame",
				"-ab",
				"128k",
				"-ac",
				String(CHANNELS),
				"-ar",
				String(SAMPLE_RATE),
				"pipe:1",
			],
			{
				stdio: ["pipe", "pipe", "pipe"],
			},
		);

		const chunks: Buffer[] = [];

		process.stdout?.on("data", (chunk: Buffer) => {
			chunks.push(chunk);
		});

		process.stderr?.on("data", (data: Buffer) => {
			console.log(`ffmpeg stderr: ${data.toString()}`);
		});

		process.on("close", (code: number | null) => {
			if (code === 0) {
				resolve(Buffer.concat(chunks));
			} else {
				reject(new Error(`ffmpeg process exited with code ${code}`));
			}
		});

		if (process.stdin) {
			process.stdin.write(wavBuffer);
			process.stdin.end();
		}
	});
}
