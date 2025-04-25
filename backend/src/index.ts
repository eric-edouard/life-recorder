import "dotenv/config";

import { db } from "@backend/db/db";
import { routes } from "@backend/routes";
import { socketService } from "@backend/services/socketService";
import { publicProcedure, router } from "@backend/services/trpc";
import * as trpcExpress from "@trpc/server/adapters/express";
import { toNodeHandler } from "better-auth/node";
import cors from "cors";
import express from "express";
import { createServer } from "node:http";
import { auth } from "./auth";

const createContext = ({
	req,
	res,
}: trpcExpress.CreateExpressContextOptions) => ({}); // no context
type Context = Awaited<ReturnType<typeof createContext>>;

const appRouter = router({
	userList: publicProcedure.query(async () => {
		const users = await db.query.usersTable.findMany();
		console.log(users);
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
