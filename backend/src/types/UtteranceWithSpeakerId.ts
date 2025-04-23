import type { Utterance } from "@backend/types/deepgram";

export type UtteranceWithSpeakerId = Utterance & {
	speakerId?: string;
};
