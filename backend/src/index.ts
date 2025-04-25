import "dotenv/config";

import { db } from "@backend/db/db";
import { routes } from "@backend/routes";
import { socketService } from "@backend/services/socketService";
import { type Context, publicProcedure, router } from "@backend/services/trpc";
import * as trpcExpress from "@trpc/server/adapters/express";
import { fromNodeHeaders, toNodeHandler } from "better-auth/node";
import cors from "cors";
import express from "express";
import { createServer } from "node:http";
import { auth } from "./auth";

/**
 * Create context for tRPC
 */
export const createContext = async ({
	req,
	res,
}: trpcExpress.CreateExpressContextOptions): Promise<Context> => {
	const session = await auth.api.getSession({
		headers: fromNodeHeaders(req.headers),
	});

	return { session };
};

const appRouter = router({
	userList: publicProcedure.query(async ({ ctx }) => {
		const users = await db.query.usersTable.findMany();
		console.log(users);
		console.log("Session:", ctx.session);
		return users;
	}),
});

export type AppRouter = typeof appRouter;

const app = express();

/**
 * Setup Routes
 */
app.use(routes);

/**
 * Setup TRPc Middleware
 */
app.use(
	"/trpc",
	trpcExpress.createExpressMiddleware({
		router: appRouter,
		createContext,
	}),
);

/**
 * Setup BetterAuth Middleware
 */
app.all("/api/auth/*splat", toNodeHandler(auth));

/**
 * Middleware
 */
app.use(cors());
app.use(express.json());

/**
 * Create HTTP server
 */
const server = createServer(app);

/**
 * Initialize Socket.IO
 */
socketService.initialize(server);

// // Server
server.listen(process.env.PORT || 3000, () => {
	console.log(`Server is running on port ${process.env.PORT || 3000}`);
	console.log("Socket.IO server is running");
});
