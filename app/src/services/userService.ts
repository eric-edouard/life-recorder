import { backendUrl } from "@app/src/constants/backendUrl";
import trpc from "@app/src/services/trpc";
import type { InferQueryOutput } from "@app/src/types/trpcs";
import { observable } from "@legendapp/state";
import type { VoiceProfileType } from "@shared/sharedTypes";
import { authClient } from "./authClient";

type VoiceProfile = InferQueryOutput<"userVoiceProfiles">[number];
type UserVoiceProfiles = Record<VoiceProfileType, VoiceProfile | null>;

const findUserVoiceProfiles = (
	voiceProfiles: InferQueryOutput<"userVoiceProfiles">,
): UserVoiceProfiles => {
	return {
		normal: voiceProfiles.find((profile) => profile.type === "normal") ?? null,
		low: voiceProfiles.find((profile) => profile.type === "low") ?? null,
		high: voiceProfiles.find((profile) => profile.type === "high") ?? null,
	};
};

export const userService = (() => {
	const voiceProfiles$ = observable<UserVoiceProfiles>({
		normal: null,
		low: null,
		high: null,
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
