import type { HonoEnv } from "@backend/src/types/honoEnv";
import { Hono } from "hono";

// Define the Hono app for these routes with typed context
export const routesApp = new Hono<HonoEnv>();

// Health check endpoint
routesApp.get("/health", (c) => {
	return c.json({ status: "ok" }, 200);
});

routesApp.get("/health-private", (c) => {
	const session = c.get("session");
	if (!session) {
		return c.json(null, 401);
	}
	return c.json({ status: "ok" }, 200);
});

// Get current user
routesApp.get("/api/me", async (c) => {
	const session = c.get("session");
	if (!session) {
		return c.json(null, 401);
	}
	return c.json(session);
});
