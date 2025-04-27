import { userService } from "@app/src/services/userService";

export const prefetch = () => {
	userService.fetchCurrentUserVoiceProfiles();
};
