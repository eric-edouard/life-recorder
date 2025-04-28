import { socketService } from "@app/src/services/socketService";
import { observable } from "@legendapp/state";
import type { GetUtterancesResponse } from "@shared/socketEvents";

export const utterancesService = (() => {
	const loading$ = observable<boolean>(false);
	const utterances$ = observable<GetUtterancesResponse["utterances"] | null>(
		null,
	);

	return {
		loading$,
		utterances$,
		fetchUtterances: async (from: number, to: number) => {
			loading$.set(true);
			socketService
				.getSocket()
				.emit("getUtterances", { from, to }, (data: GetUtterancesResponse) => {
					loading$.set(false);
					utterances$.set(data.utterances);
				});
		},
	};
})();
