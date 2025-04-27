import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

export async function getSpeakerEmbeddingFromBuffer(
	wavBuffer: Buffer,
): Promise<number[]> {
	const tempFile = path.join(tmpdir(), `${randomUUID()}.wav`);
	await writeFile(tempFile, wavBuffer);

	const scriptPath = path.resolve(
		__dirname,
		"../../../../resemblyzer/create_embedding.py",
	);

	console.log(
		`[SpeakerEmbedding] Starting Python process with script: ${scriptPath}`,
	);
	console.log(`[SpeakerEmbedding] Using temp file: ${tempFile}`);

	return new Promise((resolve, reject) => {
		const pythonProcess = spawn("python3", [scriptPath, tempFile]);
		console.log(
			`[SpeakerEmbedding] Process spawned with PID: ${pythonProcess.pid}`,
		);

		let stdout = "";
		let stderr = "";

		pythonProcess.stdout.on("data", (data: Buffer) => {
			const chunk = data.toString();
			console.log(
				`[SpeakerEmbedding] stdout: ${chunk.substring(0, 100)}${chunk.length > 100 ? "..." : ""}`,
			);
			stdout += chunk;
		});

		pythonProcess.stderr.on("data", (data: Buffer) => {
			const chunk = data.toString();
			console.log(`[SpeakerEmbedding] stderr: ${chunk}`);
			stderr += chunk;
		});

		pythonProcess.on("error", (error) => {
			console.error(`[SpeakerEmbedding] Process error: ${error.message}`);
			reject(`Process error: ${error.message}`);
		});

		pythonProcess.on("close", async (code: number) => {
			console.log(`[SpeakerEmbedding] Process exited with code: ${code}`);

			try {
				await unlink(tempFile);
				console.log(`[SpeakerEmbedding] Temp file deleted: ${tempFile}`);
			} catch (_) {
				console.warn(
					`[SpeakerEmbedding] Could not delete temp file: ${tempFile}`,
				);
			}

			if (code === 0) {
				try {
					console.log(
						`[SpeakerEmbedding] Parsing stdout as JSON, length: ${stdout.length}`,
					);
					const embedding: number[] = JSON.parse(stdout);
					console.log(
						`[SpeakerEmbedding] Successfully parsed embedding with ${embedding.length} dimensions`,
					);
					resolve(embedding);
				} catch (err) {
					console.error(`[SpeakerEmbedding] JSON parse error: ${err}`);
					reject(`JSON parse error: ${err}`);
				}
			} else {
				console.error(
					`[SpeakerEmbedding] Python exited with code ${code}: ${stderr}`,
				);
				reject(`Python exited with code ${code}: ${stderr}`);
			}
		});
	});
}
