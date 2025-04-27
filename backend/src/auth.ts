import { expo } from "@better-auth/expo";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createAuthMiddleware } from "better-auth/api";
import { db } from "./db/db";
import {
	accountsTable,
	sessionsTable,
	speakersTable,
	usersTable,
	verificationsTable,
} from "./db/schema";

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",
		schema: {
			user: usersTable,
			session: sessionsTable,
			account: accountsTable,
			verification: verificationsTable,
		},
	}),
	emailAndPassword: {
		enabled: true,
	},
	plugins: [expo()],
	trustedOrigins: ["life-recorder://"],
	hooks: {
		after: createAuthMiddleware(async (ctx) => {
			if (ctx.path.startsWith("/sign-up")) {
				const newSession = ctx.context.newSession;
				if (newSession) {
					await db.insert(speakersTable).values({
						id: newSession.user.id,
						name: newSession.user.name,
						createdAt: new Date(),
						updatedAt: new Date(),
						userId: newSession.user.id,
						isUser: true,
					});
				}
			}
		}),
	},
});
