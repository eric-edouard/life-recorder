import type { Utterance } from "@/types/deepgram";

export type UtteranceWithSpeakerId = Utterance & {
	speakerId?: string;
};
