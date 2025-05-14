export async function tryCatch<T>(promise: T | Promise<T>) {
	try {
		const result = await promise;
		return [result, null] as const;
	} catch (err: unknown) {
		const error = err instanceof Error ? err : new Error(String(err));
		return [null, error] as const;
	}
}
