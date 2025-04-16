import { spawn } from "node:child_process";
import path from "node:path";

export function getSpeakerEmbedding(audioFilePath: string): Promise<number[]> {
	return new Promise((resolve, reject) => {
		const scriptPath = path.resolve(
			__dirname,
			"../../resemblyzer/create_embedding.py",
		);
		const pythonProcess = spawn("python3", [scriptPath, audioFilePath]);

		let stdout = "";
		let stderr = "";

		pythonProcess.stdout.on("data", (data: Buffer) => {
			stdout += data.toString();
		});

		pythonProcess.stderr.on("data", (data: Buffer) => {
			stderr += data.toString();
		});

		pythonProcess.on("close", (code: number) => {
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
