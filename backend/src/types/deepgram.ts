import type { SyncPrerecordedResponse } from "@deepgram/sdk";

export interface DeepgramResult {
	type: string;
	channel_index: number[];
	duration: number;
	start: number;
	is_final: boolean;
	speech_final: boolean;
	channel: Channel;
	metadata: Metadata;
	from_finalize: boolean;
}

export interface Channel {
	alternatives: Alternatives[];
}

export interface Alternatives {
	transcript: string;
	confidence: number;
	words: Word[];
}

export interface Word {
	word: string;
	start: number;
	end: number;
	confidence: number;
	punctuated_word: string;
}

export interface Metadata {
	request_id: string;
	model_info: ModelInfo;
	model_uuid: string;
}

export interface ModelInfo {
	name: string;
	version: string;
	arch: string;
}

export type Utterances = SyncPrerecordedResponse["results"]["utterances"];
export type Utterance = NonNullable<
	SyncPrerecordedResponse["results"]["utterances"]
>[number];
