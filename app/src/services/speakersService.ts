import { trpcClient } from "@app/src/services/trpc";
import type { InferQueryOutput } from "@app/src/types/trpc";
import { observable } from "@legendapp/state";
export type Speaker = InferQueryOutput<"speakers">[number];

export const speakersService = (() => {
	const speakers$ = observable<Speaker[] | null>(null);

	return {
		async fetchSpeakers() {
			const res = await trpcClient.speakers.query();
			console.log("speakersService >>>>>>", res);
			speakers$.set(res);
		},
		speakers$,
	};
})();
