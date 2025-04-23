import { VideoView, useVideoPlayer } from "expo-video";
import { useColorScheme } from "react-native";

const darkAssetId = require("../../assets/videos/omi_dark.mov");
const lightAssetId = require("../../assets/videos/omi_light.mov");

export const DeviceAnimation = () => {
	const isDarkMode = useColorScheme() === "dark";
	const player = useVideoPlayer(
		{
			assetId: isDarkMode ? darkAssetId : lightAssetId,
		},
		(p) => {
			p.audioMixingMode = "mixWithOthers";
			p.loop = true;
			p.play();
		},
	);

	return (
		<VideoView
			player={player}
			nativeControls={false}
			style={{ width: "100%", height: "100%" }}
		/>
	);
};
