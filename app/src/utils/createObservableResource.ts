import { observable } from "@legendapp/state";

export function createObservableResource<T>(fetcher: () => Promise<T>) {
	const isLoading$ = observable<boolean>(false);
	const error$ = observable<Error | null>(null);
	const data$ = observable<T | null>(null);

	const refetch = async () => {
		isLoading$.set(true);
		try {
			const result = await fetcher();
			// @ts-ignore - legend state quirk
			data$.set(result);
			error$.set(null); // ✅ clear error if success
		} catch (err) {
			console.error("Resource fetching error:", err);
			error$.set(err as Error);
			// (optional: you could data$.set(null) here if you want to clear data on error)
		} finally {
			isLoading$.set(false);
		}
	};

	// Immediately trigger first fetch
	refetch();

	return { data$, isLoading$, error$, refetch };
}
