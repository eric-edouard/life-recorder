import type { Utterance } from "@backend/types/deepgram";

export type UtteranceWithVoiceProfileId = Utterance & {
	voiceProfileId?: string;
};
