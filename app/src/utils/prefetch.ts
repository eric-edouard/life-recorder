import { speakersService } from "@app/src/services/speakersService";

export const prefetch = () => {
	speakersService.fetchSpeakers();
};
