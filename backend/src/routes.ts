import type { HonoEnv } from "@backend/src/types/honoEnv";
import { Hono } from "hono";

// Define the Hono app for these routes with typed context
export const routesApp = new Hono<HonoEnv>();

// Health check endpoint
routesApp.get("/health", (c) => {
	return c.json({ status: "ok" }, 200);
});

// Get current user
// Assumes BetterAuth middleware has run and set 'session' in context
routesApp.get("/api/me", async (c) => {
	const session = c.get("session");
	// We need to handle the case where session might be null if the user is not logged in
	if (!session) {
		return c.json(null, 401);
	}
	return c.json(session);
});
