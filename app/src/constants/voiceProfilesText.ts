import type { VoiceProfileType } from "@backend/src/types/VoiceProfileType";

export const voiceProfilesLabel: Record<VoiceProfileType, string> = {
	normal: "Normal",
	slow_deep: "Slow & Deep",
	fast_high: "Fast & High",
};

export const voiceProfilesText: Record<VoiceProfileType, string> = {
	normal:
		"Hi, this is a short voice sample to help create my speech profile. I’m speaking clearly at a normal pace, in a quiet room. My voice may change a bit depending on time of day or mood, but generally will sound like this.",
	slow_deep:
		"This is how I sound when I’ve just woken up or feel low energy. My tone might be a little slower, quieter, or deeper than usual. Just talking naturally here, in a slow and deep voice.",
	fast_high:
		"Here’s a sample of how I talk when I’m outside or more energetic, maybe in a conversation with friends. I might speak faster or with more variation in tone, as if I’m excited or talking to someone !",
};
