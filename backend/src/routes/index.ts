import express, { type Request, type Response } from "express";

const router = express.Router();

// Hello world endpoint
router.get("/hello", (req: Request, res: Response) => {
	res.json({ message: "Hello, World!" });
});

export const routes = router;
