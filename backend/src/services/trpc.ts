import type { auth } from "@backend/src/auth";
import { initTRPC } from "@trpc/server";
import type SuperJSON from "superjson";
import type { OpenApiMeta } from "trpc-to-openapi";
const superjson: SuperJSON = require("fix-esm").require("superjson");

// Define context type
export interface Context {
	session: Awaited<ReturnType<typeof auth.api.getSession>>;
}

/**
 * Initialization of tRPC backend
 * Should be done only once per backend!
 */
const t = initTRPC.context<Context>().meta<OpenApiMeta>().create({
	transformer: superjson,
});

/**
 * Export reusable router and procedure helpers
 * that can be used throughout the router
 */
export const router = t.router;
export const publicProcedure = t.procedure;
