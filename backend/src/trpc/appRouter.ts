import { CHANNELS, SAMPLE_RATE } from "@backend/src/constants/audioConstants";
import { db } from "@backend/src/db/db";
import {
	speakersTable,
	utterancesTable,
	voiceProfilesTable,
} from "@backend/src/db/schema";
import { processFinalizedSpeechChunkForVoiceProfile } from "@backend/src/services/processSpeechService/processFinalizedSpeechChunkForVoiceProfile";
import {
	protectedProcedure,
	publicProcedure,
	router,
	timingMiddleware,
} from "@backend/src/services/trpc";
import { convertPcmToFloat32Array } from "@backend/src/utils/audio/audioUtils";
import { getSignedUrl } from "@backend/src/utils/gcs/getSignedUrl";
import { OpusEncoder } from "@discordjs/opus";
import { and, eq } from "drizzle-orm";
import { endTime, startTime } from "hono/timing";
import z from "zod";

export const appRouter = router({
	health: publicProcedure.query(async () => {
		return "ok";
	}),
	healthPrivate: protectedProcedure.query(async () => {
		return "ok";
	}),
	utterances: protectedProcedure
		.use(timingMiddleware)
		.query(async ({ ctx }) => {
			startTime(ctx.c, "DB utterances");
			const userId = ctx.user.id;
			const utterances = await db
				.select({
					utterance: utterancesTable,
					speaker: speakersTable,
				})
				.from(utterancesTable)
				.leftJoin(
					voiceProfilesTable,
					eq(utterancesTable.voiceProfileId, voiceProfilesTable.id),
				)
				.leftJoin(
					speakersTable,
					eq(voiceProfilesTable.speakerId, speakersTable.id),
				)
				.where(eq(utterancesTable.userId, userId));
			endTime(ctx.c, "DB utterances");
			return utterances;
		}),
	fileUrl: protectedProcedure.input(z.string()).query(async ({ input }) => {
		return await getSignedUrl(input);
	}),
	userVoiceProfiles: protectedProcedure
		.use(timingMiddleware)
		.query(async ({ ctx }) => {
			startTime(ctx.c, "DB speaker");
			// Find the speaker record for the current user
			const speaker = await db
				.select()
				.from(speakersTable)
				.where(
					and(
						eq(speakersTable.userId, ctx.user.id),
						eq(speakersTable.isUser, true),
					),
				)
				.then((rows) => rows[0]);
			endTime(ctx.c, "DB speaker");

			if (!speaker) throw new Error("User speaker not found");
			// Fetch the 3 special voice profiles for this speaker
			startTime(ctx.c, "DB profiles");
			const profiles = await db
				.select({
					id: voiceProfilesTable.id,
					fileId: voiceProfilesTable.fileId,
					speakerId: voiceProfilesTable.speakerId,
					languages: voiceProfilesTable.languages,
				})
				.from(voiceProfilesTable)
				.where(and(eq(voiceProfilesTable.speakerId, speaker.id)));
			endTime(ctx.c, "DB profiles");
			return profiles;
		}),
	createVoiceProfile: protectedProcedure
		.input(
			z.object({
				opusFramesB64: z.array(z.string()),
			}),
		)
		.mutation(async ({ ctx, input }) => {
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
				userId: ctx.user.id,
			});
		}),
	deleteVoiceProfile: protectedProcedure
		.input(z.string())
		.mutation(async ({ ctx, input }) => {
			return await db
				.delete(voiceProfilesTable)
				.where(
					and(
						eq(voiceProfilesTable.userId, ctx.user.id),
						eq(voiceProfilesTable.id, input),
					),
				);
		}),
});

export type AppRouter = typeof appRouter;
