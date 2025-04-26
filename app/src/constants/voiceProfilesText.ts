import type { VoiceProfileType } from "@backend/src/types/VoiceProfileType";

export const voiceProfilesLabel: Record<VoiceProfileType, string> = {
	normal: "Normal",
	low: "Low",
	high: "High",
};

export const voiceProfilesText: Record<VoiceProfileType, string> = {
	normal:
		"Hi, this is a short voice sample to help create my speech profile. I’m speaking clearly at a normal pace, in a quiet room.",
	low: "This is how I sound with a lower tone. It might be a little slower, or deeper than usual. Just talking naturally here, in a slow and deep voice.",
	high: "Here’s a sample of how I talk when I’m more energetic, maybe in a conversation with friends. I might speak faster or as if I’m excited !",
};
