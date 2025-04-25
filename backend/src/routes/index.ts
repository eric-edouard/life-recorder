import { auth } from "@backend/auth";
import { fromNodeHeaders } from "better-auth/node";
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

router.get("/api/me", async (req, res) => {
	const session = await auth.api.getSession({
		headers: fromNodeHeaders(req.headers),
	});
	return res.json(session);
});

export const routes = router;
