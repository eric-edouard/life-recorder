import { CHANNELS, SAMPLE_RATE } from "@backend/constants/audioConstants";
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
			String(CHANNELS),
			"-ar",
			String(SAMPLE_RATE),
			"pipe:1", // output to stdout
		];

		const proc = spawn(ffmpeg, ffmpegArgs, {
			stdio: ["pipe", "pipe", "pipe"],
		});

		const outChunks: Buffer[] = [];
		const errChunks: Buffer[] = [];

		// collect stdout
		proc.stdout?.on("data", (chunk: Buffer) => {
			outChunks.push(chunk);
		});

		// collect stderr (but don't log immediately)
		proc.stderr?.on("data", (chunk: Buffer) => {
			errChunks.push(chunk);
		});

		proc.on("close", (code: number | null) => {
			if (code === 0) {
				resolve(Buffer.concat(outChunks));
			} else {
				const errMsg = Buffer.concat(errChunks).toString().trim();
				reject(
					new Error(
						`ffmpeg exited with code ${code}${errMsg ? `: ${errMsg}` : ""}`,
					),
				);
			}
		});

		proc.on("error", (err) => {
			proc.stdin?.end();
			reject(err);
		});

		// kick it off
		proc.stdin?.write(wavBuffer);
		proc.stdin?.end();
	});
}
