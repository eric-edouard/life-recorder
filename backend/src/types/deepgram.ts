import type { SyncPrerecordedResponse } from "@deepgram/sdk";

export type Utterances = SyncPrerecordedResponse["results"]["utterances"];
export type Utterance = NonNullable<Utterances>[number];
