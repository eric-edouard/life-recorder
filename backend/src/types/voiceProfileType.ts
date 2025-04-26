import type { voiceProfilesTable } from "../db/schema";

export type VoiceProfileType =
	(typeof voiceProfilesTable._.columns.type.enumValues)[number];
