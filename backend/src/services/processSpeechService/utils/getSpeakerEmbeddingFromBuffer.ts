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

	return new Promise((resolve, reject) => {
		const pythonProcess = spawn("python3", [scriptPath, tempFile]);

		let stdout = "";
		let stderr = "";

		pythonProcess.stdout.on("data", (data: Buffer) => {
			stdout += data.toString();
		});

		pythonProcess.stderr.on("data", (data: Buffer) => {
			stderr += data.toString();
		});

		pythonProcess.on("close", async (code: number) => {
			try {
				await unlink(tempFile);
			} catch (_) {
				console.warn(`Could not delete temp file: ${tempFile}`);
			}

			if (code === 0) {
				try {
					const embedding: number[] = JSON.parse(stdout);
					resolve(embedding);
				} catch (err) {
					reject(`JSON parse error: ${err}`);
				}
			} else {
				reject(`Python exited with code ${code}: ${stderr}`);
			}
		});
	});
}
