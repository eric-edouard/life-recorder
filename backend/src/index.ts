import "dotenv/config";

import { auth } from "@backend/src/auth";
import { CHANNELS, SAMPLE_RATE } from "@backend/src/constants/audioConstants";
import { db } from "@backend/src/db/db";
import { speakersTable, voiceProfilesTable } from "@backend/src/db/schema";
import { processFinalizedSpeechChunkForVoiceProfile } from "@backend/src/services/processSpeechService/processFinalizedSpeechChunkForVoiceProfile";
import { socketService } from "@backend/src/services/socketService";
import {
	type Context,
	publicProcedure,
	router,
} from "@backend/src/services/trpc";
import { convertPcmToFloat32Array } from "@backend/src/utils/audio/audioUtils";
import { getSignedUrl } from "@backend/src/utils/gcs/getSignedUrl";
import { OpusEncoder } from "@discordjs/opus";
import { SupportedLanguage, VoiceProfileType } from "@shared/sharedTypes";
import { TRPCError } from "@trpc/server";
import * as trpcExpress from "@trpc/server/adapters/express";
import { fromNodeHeaders, toNodeHandler } from "better-auth/node";
import cors from "cors";
import { and, eq } from "drizzle-orm";
import express, { type Request, type Response } from "express";
import { createServer } from "node:http";
import z from "zod";

const appRouter = router({
	userList: publicProcedure.query(async ({ ctx }) => {
		const users = await db.query.usersTable.findMany();
		console.log(users);
		console.log("Session:", ctx.session);
		return users;
	}),
	fileUrl: publicProcedure.input(z.string()).query(async ({ input }) => {
		return await getSignedUrl(input);
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
		console.log("🪲 SPEAKER", speaker);
		if (!speaker) throw new Error("User speaker not found");
		// Fetch the 3 special voice profiles for this speaker
		const profiles = await db
			.select({
				id: voiceProfilesTable.id,
				type: voiceProfilesTable.type,
				fileId: voiceProfilesTable.fileId,
				speakerId: voiceProfilesTable.speakerId,
				language: voiceProfilesTable.language,
			})
			.from(voiceProfilesTable)
			.where(and(eq(voiceProfilesTable.speakerId, speaker.id)));
		return profiles;
	}),

	test: publicProcedure
		.input(
			z.object({
				opusFramesB64: z.string(),
				type: z.enum(VoiceProfileType),
				language: z.enum(SupportedLanguage),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return input;
		}),
	createVoiceProfile: publicProcedure
		.input(
			z.object({
				opusFramesB64: z.array(z.string()),
				type: z.enum(VoiceProfileType),
				language: z.enum(SupportedLanguage),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			if (!ctx.session?.user?.id)
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "Not authenticated",
				});
			const opusEncoder = new OpusEncoder(SAMPLE_RATE, CHANNELS);

			const float32Array = input.opusFramesB64.map((frame) =>
				convertPcmToFloat32Array(
					opusEncoder.decode(Buffer.from(frame, "base64")),
				),
			);
			console.log("float32Array", float32Array.length);

			// Concatenate the Float32Arrays into a single Float32Array
			const totalLength = float32Array.reduce(
				(acc, arr) => acc + arr.length,
				0,
			);
			const concatenatedAudio = new Float32Array(totalLength);
			let offset = 0;

			for (const chunk of float32Array) {
				concatenatedAudio.set(chunk, offset);
				offset += chunk.length;
			}

			return await processFinalizedSpeechChunkForVoiceProfile({
				audio: concatenatedAudio,
				type: input.type,
				userId: ctx.session.user.id,
				language: input.language,
			});
		}),
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
// Get current user
app.get("/api/me", async (req, res) => {
	const session = await auth.api.getSession({
		headers: fromNodeHeaders(req.headers),
	});
	return res.json(session);
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
