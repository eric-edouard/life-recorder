import { saveRecording } from "@/services/saveRecording";
import express, { type Request, type Response } from "express";

const router = express.Router();

// Hello world endpoint
router.get("/hello", (req: Request, res: Response) => {
	res.json({ message: "Hello, World!" });
});

// Health check endpoint
router.get("/health", (req: Request, res: Response) => {
	res.status(200).json({ status: "ok" });
});

// Save recording endpoint
router.post("/save-recording", async (req: Request, res: Response) => {
	try {
		const { audioData, startTime } = req.body;

		if (!audioData || !Array.isArray(audioData) || startTime === undefined) {
			return res.status(400).json({
				error:
					"Missing required fields: audioData (array) and startTime (number)",
			});
		}

		// Convert array to Float32Array
		const float32Audio = new Float32Array(audioData);

		// Process the audio data
		const publicUrl = await saveRecording(float32Audio, startTime);

		// Return the public URL
		res.status(200).json({
			success: true,
			url: publicUrl,
		});
	} catch (error) {
		console.error("Error saving recording:", error);
		res.status(500).json({
			error: "Failed to save recording",
		});
	}
});

export const routes = router;
