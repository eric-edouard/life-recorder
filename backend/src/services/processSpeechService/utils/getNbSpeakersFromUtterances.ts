import type { Utterance } from "@backend/src/types/deepgram";

export const getNbSpeakersFromUtterances = (utterances: Utterance[]) => {
	const speakers = utterances.map((u) => u.speaker);
	return new Set(speakers).size;
};
