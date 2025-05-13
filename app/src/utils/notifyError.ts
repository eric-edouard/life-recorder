import * as Burnt from "burnt";

export const notifyError = (
	serviceName: string,
	prefix = "",
	error: unknown | never = undefined,
) => {
	console.error(`[${serviceName}] ${prefix}`, error);
	Burnt.toast({
		preset: "error",
		title: `Error in ${serviceName}`,
		message:
			error instanceof Error ? error.message : (prefix ?? "Unknown error"),
	});
};
