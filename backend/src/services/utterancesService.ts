import type { GetUtterancesResponse } from "@shared/socketEvents";

import { db } from "@backend/db/db";
import { utterancesTable } from "@backend/db/schema";
import type { GetUtterancesParams } from "@shared/socketEvents";
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
			nonIdentifiedSpeaker: utterance.non_identified_speaker,
			speaker: utterance.speaker,
			words: utterance.words as { word: string; start: number; end: number }[],
		})),
	};
};
