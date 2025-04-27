import { type Observable, observable } from "@legendapp/state";

export type ResourceOptions = {
	/**
	 * Whether the resource should be initially enabled.
	 * Takes priority over `enabled$` if both are provided.
	 */
	enabled?: boolean;
	/**
	 * Observable version of enabled.
	 * Only used if `enabled` is not set.
	 */
	enabled$?: Observable<boolean>;
};

export type Fetcher<T> = (() => Promise<T>) | null;
export function createResource$<T>(
	initialFetcher: Fetcher<T> = null,
	options?: ResourceOptions,
) {
	const isLoading$ = observable<boolean>(false);
	const error$ = observable<Error | null>(null);
	const data$ = observable<T | null>(null);
	const fetcher$ = observable<Fetcher<T>>(initialFetcher);

	const enabled$ =
		options?.enabled !== undefined
			? observable(options.enabled)
			: (options?.enabled$ ?? observable(true));

	const refetch = async () => {
		const fetcher = fetcher$.get();
		if (!fetcher) {
			console.warn("Refetch called but no fetcher was provided");
			return;
		}
		console.log("🚀 ~ refetch ~ fetcher:", fetcher);
		isLoading$.set(true);
		try {
			const result = await fetcher();
			// @ts-expect-error - legend state quirk
			data$.set(result);
			error$.set(null);
		} catch (err) {
			console.error("Resource fetching error:", err);
			error$.set(err as Error);
		} finally {
			isLoading$.set(false);
		}
	};

	// Do NOT start observing immediately here

	return {
		data$,
		isLoading$,
		error$,
		refetch,
		enabled$,
		fetcher$,
		// startObserve,
	};
}
