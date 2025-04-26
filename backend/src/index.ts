import "dotenv/config";

import { auth } from "@backend/src/auth";
import { db } from "@backend/src/db/db";
import { publicProcedure, router } from "@backend/src/services/trpc";
import type { CreateFastifyContextOptions } from "@trpc/server/adapters/fastify";
import {
	type FastifyTRPCPluginOptions,
	fastifyTRPCPlugin,
} from "@trpc/server/adapters/fastify";
import { fromNodeHeaders } from "better-auth/node";
import Fastify from "fastify";
import fastifyIO from "fastify-socket.io";

const appRouter = router({
	userList: publicProcedure.query(async ({ ctx }) => {
		const users = await db.query.usersTable.findMany();
		console.log(users);
		console.log("Session:", ctx.session);
		return users;
	}),
});

export type AppRouter = typeof appRouter;

export async function createContext({ req, res }: CreateFastifyContextOptions) {
	const session = await auth.api.getSession({
		headers: fromNodeHeaders(req.headers),
	});

	return { session };
}

export type Context = Awaited<ReturnType<typeof createContext>>;

const fastify = Fastify({
	logger: true,
});

fastify.register(fastifyIO);

fastify.register(fastifyTRPCPlugin, {
	prefix: "/trpc",
	trpcOptions: {
		router: appRouter,
		createContext,
		onError({ path, error }) {
			// report to error monitoring
			console.error(`Error in tRPC handler on path '${path}':`, error);
		},
	} satisfies FastifyTRPCPluginOptions<AppRouter>["trpcOptions"],
});

// Declare a route
fastify.get("/health", (request, reply) => {
	reply.send({ status: "ok" });
});

// Run the server!
fastify.listen({ port: Number(process.env.PORT ?? "3000") }, (err, address) => {
	if (err) {
		fastify.log.error(err);
		process.exit(1);
	}
	console.log(`Server is running on port ${process.env.PORT || 3000}`);
});
