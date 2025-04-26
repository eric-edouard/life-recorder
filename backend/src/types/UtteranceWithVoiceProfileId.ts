import type { Utterance } from "@backend/src/types/deepgram";

export type UtteranceWithVoiceProfileId = Utterance & {
	voiceProfileId?: string;
};
