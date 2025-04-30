import { auth } from "@backend/src/auth";
import { routesApp } from "@backend/src/routes"; // Import Hono app from routes.ts
import { appRouter } from "@backend/src/trpc/appRouter";
import { createTrpcContext } from "@backend/src/trpc/createTrpcContext";
import type { HonoEnv } from "@backend/src/types/honoEnv";
import { trpcServer } from "@hono/trpc-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

export const createHonoApp = () => {
	const app = new Hono<HonoEnv>();

	// 1. CORS and Logger Middleware
	app.use("*", cors());
	app.use("*", logger());

	// 2. BetterAuth Session Middleware (must run before routes that need session)
	app.use("*", async (c, next) => {
		const session = await auth.api.getSession({ headers: c.req.raw.headers });
		if (!session) {
			c.set("user", null);
			c.set("session", null);
		} else {
			c.set("user", session.user);
			c.set("session", session.session);
		}
		await next();
	});

	// 3. BetterAuth Handler
	app.on(["POST", "GET"], "/api/auth/*", (c) => {
		return auth.handler(c.req.raw);
	});

	// 4. Application Routes (from routes.ts)
	app.route("/", routesApp);

	// 5. tRPC Middleware
	app.use(
		"/trpc/*",
		trpcServer({
			router: appRouter,
			createContext: createTrpcContext,
		}),
	);

	return app;
};
