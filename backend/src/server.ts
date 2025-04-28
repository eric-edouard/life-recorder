import { createServer } from "node:http";
import { auth } from "@backend/src/auth";
import { routes } from "@backend/src/routes";
import { socketService } from "@backend/src/services/socketService/socketService";
import { appRouter } from "@backend/src/trpc/appRouter";
import { createContext } from "@backend/src/trpc/context";
import * as trpcExpress from "@trpc/server/adapters/express";
import { toNodeHandler } from "better-auth/node";
import cors from "cors";
import express from "express";

export const createAppServer = () => {
	const app = express();

	// BetterAuth
	app.all("/api/auth/*splat", toNodeHandler(auth));

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

	// Middleware
	app.use(cors());
	app.use(express.json());

	// Create HTTP server
	const server = createServer(app);

	// Initialize Socket.IO
	socketService.initialize(server);

	return server;
};
