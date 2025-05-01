import { spawn } from "node:child_process";
import path from "node:path";

// At startup:
const scriptPath = path.resolve(
	__dirname,
	"../../../../resemblyzer/create_embedding.py",
);
const pythonProcess = spawn("python3", [scriptPath]);
pythonProcess.stdout.setEncoding("utf-8");
pythonProcess.stderr.setEncoding("utf-8");

// Then, to send a buffer and wait for a result:
export const getSpeakerEmbeddingFromBuffer = (
	wavBuffer: Buffer,
): Promise<number[]> => {
	return new Promise((resolve, reject) => {
		let stdout = "";
		let stderr = "";

		const onData = (data: string) => {
			stdout += data;
			if (stdout.endsWith("\n")) {
				// Assuming Python outputs JSON + newline
				cleanup();
				try {
					resolve(JSON.parse(stdout));
				} catch (err) {
					reject(err);
				}
			}
		};

		const onError = (data: string) => {
			stderr += data;
		};

		const onExit = (code: number) => {
			cleanup();
			reject(new Error(`Python exited with code ${code}: ${stderr}`));
		};

		const cleanup = () => {
			pythonProcess.stdout.off("data", onData);
			pythonProcess.stderr.off("data", onError);
			pythonProcess.off("exit", onExit);
		};

		pythonProcess.stdout.on("data", onData);
		pythonProcess.stderr.on("data", onError);
		pythonProcess.on("exit", onExit);

		// Send the size first (optional, but clean)
		const sizeBuffer = Buffer.alloc(4);
		sizeBuffer.writeUInt32BE(wavBuffer.length, 0);
		pythonProcess.stdin.write(sizeBuffer);
		pythonProcess.stdin.write(wavBuffer);
	});
};
