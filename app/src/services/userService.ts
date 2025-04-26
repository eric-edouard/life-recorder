import { backendUrl } from "@app/src/constants/backendUrl";
import trpc from "@app/src/services/trpc";
import type { InferQueryOutput } from "@app/src/types/trpcs";
import { observable } from "@legendapp/state";
import { authClient } from "./authClient";

const findUserVoiceProfiles = (
	voiceProfiles: InferQueryOutput<"userVoiceProfiles">,
) => {
	return {
		normal: voiceProfiles.find((profile) => profile.type === "normal") ?? null,
		slowDeep:
			voiceProfiles.find((profile) => profile.type === "slow_deep") ?? null,
		fastHigh:
			voiceProfiles.find((profile) => profile.type === "fast_high") ?? null,
	};
};

type VoiceProfile = InferQueryOutput<"userVoiceProfiles">[number];
type UserVoiceProfiles = {
	normal: VoiceProfile | null;
	slowDeep: VoiceProfile | null;
	fastHigh: VoiceProfile | null;
};
export const userService = (() => {
	const voiceProfiles$ = observable<UserVoiceProfiles>({
		normal: null,
		slowDeep: null,
		fastHigh: null,
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
