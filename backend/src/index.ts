import { createHonoApp } from "@backend/src/hono";
import { socketService } from "@backend/src/services/socketService/socketService";
import { serve } from "@hono/node-server";
import "dotenv/config";
import type { Server as HttpServer } from "node:http";

const app = createHonoApp();

const server = serve(
	{
		fetch: app.fetch,
		port: Number.parseInt(process.env.PORT || "3000", 10),
	},
	(info) => {
		console.log(`Listening on http://localhost:${info.port}`);
	},
);

socketService.initialize(server as HttpServer);

// Export tRPC routers for client use
export { appRouter } from "@backend/src/trpc/appRouter";
export type { AppRouter } from "@backend/src/trpc/appRouter";
