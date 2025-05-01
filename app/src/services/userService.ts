import { backendUrl } from "@app/src/constants/backendUrl";
import { trpcClient } from "@app/src/services/trpc";
import type { InferQueryOutput } from "@app/src/types/trpc";
import { btoa } from "react-native-quick-base64";
import { authClient } from "./authClient";
import { recordAudioDataService } from "./recordAudioDataService";
export type VoiceProfile = InferQueryOutput<"userVoiceProfiles">[number];

export const userService = (() => {
	return {
		async startRecordingVoiceProfile() {
			return recordAudioDataService.startRecording();
		},
		async createVoiceProfileFromRecording() {
			const audioFrames = await recordAudioDataService.stopRecording();

			console.log("received audioFrames", audioFrames.length);

			const opusFramesB64 = audioFrames.map((frame) =>
				btoa(String.fromCharCode(...frame)),
			);

			console.log("opusFramesB64", opusFramesB64.length);

			return trpcClient.createVoiceProfile.mutate({
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
