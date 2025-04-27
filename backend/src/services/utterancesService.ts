import type { GetUtterancesResponse } from "@shared/socketEvents.js";

import { db } from "@backend/src/db/db.js";
import { utterancesTable } from "@backend/src/db/schema.js";
import type { GetUtterancesParams } from "@shared/socketEvents.js";
import { and, between } from "drizzle-orm";

export const getUtterances = async (
	params: GetUtterancesParams,
): Promise<GetUtterancesResponse> => {
	const utterances = await db.query.utterancesTable.findMany({
		where: and(between(utterancesTable.start, params.from, params.to)),
	});
	return {
		utterances: utterances.map((utterance) => ({
			id: utterance.id,
			transcript: utterance.transcript,
			createdAt: utterance.createdAt.getTime(),
			nonIdentifiedSpeaker: utterance.nonIdentifiedSpeaker,
			speaker: utterance.voiceProfileId,
			words: utterance.words as { word: string; start: number; end: number }[],
		})),
	};
};
