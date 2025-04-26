import type { AppRouter } from "@backend/src/index";
// trpc-helper.ts
// Import AppRouter from your main server router
import type { inferProcedureInput, inferProcedureOutput } from "@trpc/server";
/**
 * Enum containing all api query paths
 */
export type TQuery = keyof AppRouter["_def"]["procedures"];

/**
 * This is a helper method to infer the output of a query resolver
 * @example type HelloOutput = InferQueryOutput<'hello'>
 */
export type InferQueryOutput<TRouteKey extends TQuery> = inferProcedureOutput<
	AppRouter["_def"]["procedures"][TRouteKey]
>;
/**
 * This is a helper method to infer the input of a query resolver
 * @example type HelloInput = InferQueryInput<'hello'>
 */
export type InferQueryInput<TRouteKey extends TQuery> = inferProcedureInput<
	AppRouter["_def"]["procedures"][TRouteKey]
>;
