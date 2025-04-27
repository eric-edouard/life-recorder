import {
	type Fetcher,
	type ResourceOptions,
	createResource$,
} from "@app/src/utils/createResource$";
import { observe } from "@legendapp/state";
import { useEffect, useMemo } from "react";

export function useResource$<T>(
	fetcher: Fetcher<T>,
	options?: ResourceOptions,
) {
	const resource = useMemo(() => {
		return createResource$<T>(null, options); // initially no fetcher
	}, []);

	useEffect(() => {
		resource.fetcher$.set(fetcher);
	}, [fetcher]);

	useEffect(() => {
		if (options?.enabled !== undefined) {
			resource.enabled$.set(options.enabled);
		}
	}, [options?.enabled]);

	// Only after both fetcher and enabled are stable, start observing
	useEffect(() => {
		const dispose = observe(() => {
			const isEnabled = resource.enabled$.get();
			const hasFetcher = !!resource.fetcher$.get();
			if (isEnabled && hasFetcher) {
				resource.refetch();
			}
		});
		return dispose;
	}, []); // only once after mount

	return resource;
}
