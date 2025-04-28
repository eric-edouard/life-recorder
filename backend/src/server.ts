import { auth } from "@backend/src/auth";
import { routes } from "@backend/src/routes";
import { socketService } from "@backend/src/services/socketService";
import { createContext } from "@backend/src/trpc/context";
import { appRouter } from "@backend/src/trpc/router";
import * as trpcExpress from "@trpc/server/adapters/express";
import { toNodeHandler } from "better-auth/node";
import cors from "cors";
import express from "express";
import { createServer } from "node:http";

export const createAppServer = () => {
	const app = express();

	// Middleware
	app.use(cors());
	app.use(express.json());

	// Routes
	app.use(routes);

	// tRPC
	app.use(
		"/trpc",
		trpcExpress.createExpressMiddleware({
			router: appRouter,
			createContext,
		}),
	);

	// BetterAuth
	app.all("/api/auth/*splat", toNodeHandler(auth));

	// Create HTTP server
	const server = createServer(app);

	// Initialize Socket.IO
	socketService.initialize(server);

	return server;
};
