import { generateOpenApiDocument } from "trpc-to-openapi";
import { appRouter } from "../index";

/* 👇 */
export const openApiDocument = generateOpenApiDocument(appRouter, {
	title: "tRPC OpenAPI",
	version: "1.0.0",
	baseUrl: "http://localhost:3030",
});
