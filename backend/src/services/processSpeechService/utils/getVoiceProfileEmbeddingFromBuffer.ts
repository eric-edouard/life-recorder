// voice-embedder.ts
import { spawn } from "node:child_process";
import path from "node:path";
import readline from "node:readline";

const scriptPath = path.resolve(
	__dirname,
	"../../../../resemblyzer/create_embedding.py",
);
const pythonProcess = spawn("python3", [scriptPath]);

// --- one single line-oriented reader for the lifetime of the process ---
const rl = readline.createInterface({ input: pythonProcess.stdout });

let nextId = 0;
const pending = new Map<
	number,
	{ resolve: (v: number[]) => void; reject: (e: Error) => void }
>();

rl.on("line", (line) => {
	try {
		const msg = JSON.parse(line) as {
			id: number;
			embedding?: number[];
			error?: string;
		};
		const handlers = pending.get(msg.id);
		if (!handlers) return; // unknown id → ignore

		pending.delete(msg.id);
		if (msg.error) handlers.reject(new Error(msg.error));
		else handlers.resolve(msg.embedding!);
	} catch (e) {
		// malformed JSON – log and swallow
		console.error(
			"[getVoiceProfileEmbeddingFromBuffer] Invalid JSON from Python:",
			e,
		);
	}
});

pythonProcess.stderr.pipe(process.stderr);

export function getVoiceProfileEmbeddingFromBuffer(
	wav: Buffer,
): Promise<number[]> {
	return new Promise((resolve, reject) => {
		const id = nextId++;
		pending.set(id, { resolve, reject });

		const header = Buffer.alloc(8);
		header.writeUInt32BE(id, 0); // 4-byte request ID
		header.writeUInt32BE(wav.length, 4); // 4-byte payload length

		// Write header + payload in a single syscall to avoid interleaving
		pythonProcess.stdin.write(Buffer.concat([header, wav]));
	});
}
