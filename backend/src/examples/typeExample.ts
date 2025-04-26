import type { VoiceProfileType } from "../db/schema";

// Example function that works with voice profile types
function processVoiceProfile(profileType: VoiceProfileType) {
	switch (profileType) {
		case "normal":
			console.log("Processing normal voice profile");
			break;
		case "slow_deep":
			console.log("Processing slow and deep voice profile");
			break;
		case "fast_high":
			console.log("Processing fast and high voice profile");
			break;
		default:
			// TypeScript knows this is unreachable because we've covered all cases
			const exhaustiveCheck: never = profileType;
			throw new Error(`Unhandled profile type: ${exhaustiveCheck}`);
	}
}

// Usage example
const normalProfile: VoiceProfileType = "normal";
processVoiceProfile(normalProfile);

// Type safety prevents incorrect values
// This would cause a TypeScript error:
// const invalidProfile: VoiceProfileType = "something_else";
