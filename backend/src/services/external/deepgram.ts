import { createClient } from "@deepgram/sdk";

if (!process.env.DEEPGRAM_API_KEY) {
	throw new Error("DEEPGRAM_API_KEY is not set");
}

export const deepgram = createClient(process.env.DEEPGRAM_API_KEY);
