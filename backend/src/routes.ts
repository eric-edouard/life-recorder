import { auth } from "@backend/src/auth";
import { fromNodeHeaders } from "better-auth/node";
import express, { type Request, type Response } from "express";

export const routes = express.Router();

// Health check endpoint
routes.get("/health", (req: Request, res: Response) => {
	res.status(200).json({ status: "ok" });
});

// Get current user
routes.get("/api/me", async (req, res) => {
	const session = await auth.api.getSession({
		headers: fromNodeHeaders(req.headers),
	});
	return res.json(session);
});
