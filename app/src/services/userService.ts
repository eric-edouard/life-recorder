import { backendUrl } from "@app/src/constants/backendUrl";
import trpc from "@app/src/services/trpc";
import type { InferQueryOutput } from "@app/src/types/trpcs";
import type { VoiceProfileType } from "@backend/src/types/VoiceProfileType";
import { observable } from "@legendapp/state";
import { authClient } from "./authClient";

type VoiceProfile = InferQueryOutput<"userVoiceProfiles">[number];
type UserVoiceProfiles = Record<VoiceProfileType, VoiceProfile | null>;

const findUserVoiceProfiles = (
	voiceProfiles: InferQueryOutput<"userVoiceProfiles">,
): UserVoiceProfiles => {
	return {
		normal: voiceProfiles.find((profile) => profile.type === "normal") ?? null,
		slow_deep:
			voiceProfiles.find((profile) => profile.type === "slow_deep") ?? null,
		fast_high:
			voiceProfiles.find((profile) => profile.type === "fast_high") ?? null,
	};
};

export const userService = (() => {
	const voiceProfiles$ = observable<UserVoiceProfiles>({
		normal: null,
		slow_deep: null,
		fast_high: null,
	});
	return {
		voiceProfiles$,
		async fetchCurrentUserVoiceProfiles() {
			voiceProfiles$.set(
				findUserVoiceProfiles(await trpc.userVoiceProfiles.query()),
			);
		},
		async fetchMe() {
			const response = await fetch(`${backendUrl}/api/me`, {
				headers: {
					Cookie: authClient.getCookie(),
				},
			});
			return response.json();
		},
	};
})();
