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

export const routes = router;
