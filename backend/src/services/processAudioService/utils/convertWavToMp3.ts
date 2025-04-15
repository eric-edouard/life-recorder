import { CHANNELS, SAMPLE_RATE } from "@/constants/audioConstants";
import ffmpeg from "ffmpeg-static";
import { spawn } from "node:child_process";

/**
 * Convert WAV buffer to MP3 using ffmpeg
 */
export async function convertWavToMp3(wavBuffer: Buffer): Promise<Buffer> {
	return new Promise((resolve, reject) => {
		if (!ffmpeg) {
			return reject(new Error("ffmpeg-static not found"));
		}

		const ffmpegArgs = [
			"-y", // overwrite output if needed
			"-i",
			"pipe:0", // input from stdin
			"-f",
			"mp3", // output format
			"-c:a",
			"libmp3lame", // audio codec
			"-b:a",
			"32k", // target bitrate
			"-ac",
			String(CHANNELS), // audio channels
			"-ar",
			String(SAMPLE_RATE), // sample rate
			"pipe:1", // output to stdout
		];

		const process = spawn(ffmpeg, ffmpegArgs, {
			stdio: ["pipe", "pipe", "pipe"],
		});

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
				reject(new Error(`ffmpeg exited with code ${code}`));
			}
		});

		process.on("error", (err) => {
			process.stdin?.end();
			reject(err);
		});

		process.stdin?.write(wavBuffer);
		process.stdin?.end();
	});
}
