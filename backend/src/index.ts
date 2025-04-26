import "dotenv/config";

import { auth } from "@backend/src/auth";
import { db } from "@backend/src/db/db";
import { speakersTable, voiceProfilesTable } from "@backend/src/db/schema";
import { socketService } from "@backend/src/services/socketService";
import {
	type Context,
	publicProcedure,
	router,
} from "@backend/src/services/trpc";
import * as trpcExpress from "@trpc/server/adapters/express";
import { fromNodeHeaders, toNodeHandler } from "better-auth/node";
import cors from "cors";
import { and, eq } from "drizzle-orm";
import express, { type Request, type Response } from "express";
import { createServer } from "node:http";

const appRouter = router({
	userList: publicProcedure.query(async ({ ctx }) => {
		const users = await db.query.usersTable.findMany();
		console.log(users);
		console.log("Session:", ctx.session);
		return users;
	}),

	userVoiceProfiles: publicProcedure.query(async ({ ctx }) => {
		if (!ctx.session?.user?.id) throw new Error("Not authenticated");
		// Find the speaker record for the current user
		const speaker = await db
			.select()
			.from(speakersTable)
			.where(
				and(
					eq(speakersTable.userId, ctx.session.user.id),
					eq(speakersTable.isUser, true),
				),
			)
			.then((rows) => rows[0]);
		if (!speaker) throw new Error("User speaker not found");
		// Fetch the 3 special voice profiles for this speaker
		const profiles = await db
			.select()
			.from(voiceProfilesTable)
			.where(and(eq(voiceProfilesTable.speakerId, speaker.id)));
		return profiles;
	}),

	// createVoiceProfile: publicProcedure
	// 	.input(octetInputParser)
	// 	.mutation(async ({ ctx, input }) => {
	// 		const chunks = [];

	// 		const reader = input.getReader();
	// 		while (true) {
	// 			const { done, value } = await reader.read();
	// 			if (done) {
	// 				break;
	// 			}
	// 			chunks.push(value);
	// 		}

	// 		const content = Buffer.concat(chunks).toString("utf-8");

	// 		console.log("File: ", content);
	// 		// const speaker = await db
	// 		// 	.select()
	// 		// 	.from(speakersTable)
	// 		// 	.where(eq(speakersTable.id, speakerId));
	// 		// if (!speaker) throw new Error("Speaker not found");
	// 		// const voiceProfile = await db.insert(voiceProfilesTable).values({
	// 		// 	id: generateReadableUUID(),
	// 		// 	speakerId,
	// 		// 	duration: 0,
	// 		// 	embedding: [],
	// 		// 	fileId: "",
	// 		// 	language: "",
	// 		// 	userId: ctx.session?.user?.id,
	// 		// 	type,
	// 		// });
	// 		// return voiceProfile;
	// 	}),
});

export type AppRouter = typeof appRouter;

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

const app = express();

/**
 * Setup Routes
 */
const routes = express.Router();
// Health check endpoint
routes.get("/health", (req: Request, res: Response) => {
	res.status(200).json({ status: "ok" });
});
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
