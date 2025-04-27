import type { Utterance } from "@backend/src/types/deepgram.js";

export type UtteranceWithVoiceProfileId = Utterance & {
	voiceProfileId?: string;
};
