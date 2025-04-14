import { AssemblyAI } from "assemblyai";
import "dotenv/config";

if (!process.env.ASSEMBLYAI_API_KEY) {
	throw new Error("ASSEMBLYAI_API_KEY is not set");
}

export const assemblyAi = new AssemblyAI({
	apiKey: process.env.ASSEMBLYAI_API_KEY,
	// Use EU endpoint
	baseUrl: "https://api.eu.assemblyai.com",
});
