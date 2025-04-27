import { backendUrl } from "@app/src/constants/backendUrl";
import { trpcClient } from "@app/src/services/trpc";
import type { InferQueryOutput } from "@app/src/types/trpcs";
import { observable } from "@legendapp/state";
import { SupportedLanguage, type VoiceProfileType } from "@shared/sharedTypes";
import { btoa } from "react-native-quick-base64";
import { authClient } from "./authClient";
import { recordAudioDataService } from "./recordAudioDataService";
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
				findUserVoiceProfiles(await trpcClient.userVoiceProfiles.query()),
			);
		},
		async startRecordingVoiceProfile() {
			return recordAudioDataService.startRecording();
		},
		async createVoiceProfileFromRecording(type: VoiceProfileType) {
			const audioFrames = await recordAudioDataService.stopRecording();

			console.log("received audioFrames", audioFrames.length);

			const opusFramesB64 = audioFrames.map((frame) =>
				btoa(String.fromCharCode(...frame)),
			);

			console.log("opusFramesB64", opusFramesB64.length);

			return trpcClient.createVoiceProfile.mutate({
				language: SupportedLanguage.English,
				type,
				opusFramesB64,
			});
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
