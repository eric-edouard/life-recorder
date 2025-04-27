import { BouncyPressable } from "@app/src/components/ui/Buttons/BouncyPressable";
import { useCustomColor } from "@app/src/contexts/ThemeContext";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { SymbolView } from "expo-symbols";
import React from "react";
import { Text, View } from "react-native";

// Helper function to format time in minutes:seconds
const formatTime = (timeInSeconds: number) => {
	const minutes = Math.floor(timeInSeconds / 60);
	const seconds = Math.floor(timeInSeconds % 60);
	return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

interface AudioPlayerProps {
	fileUrl: string;
	title: string;
}

export function AudioPlayer({ fileUrl, title }: AudioPlayerProps) {
	const player = useAudioPlayer({ uri: fileUrl });
	const status = useAudioPlayerStatus(player);

	const formattedCurrentTime = formatTime(status.currentTime);
	const formattedDuration = formatTime(status.duration);

	const accentColor = useCustomColor("--accent");
	const handlePlayPause = () => {
		if (status.playing) {
			player.pause();
		} else {
			player.play();
		}
	};

	const handleSeekBackward = async () => {
		await player.seekTo(Math.max(0, status.currentTime - 10));
	};

	const handleSeekForward = async () => {
		await player.seekTo(Math.min(status.duration, status.currentTime + 10));
	};

	const calculateProgressWidth = () => {
		if (status.duration === 0) return 0;
		return (status.currentTime / status.duration) * 100;
	};

	return (
		<View className="w-full flex-1 flex justify-center  rounded-3xl p-4 shadow-sm">
			<Text className="text-lg font-semibold text-label mb-4 text-center">
				{title}
			</Text>

			<View className="mb-4">
				<View className="h-2 bg-secondary-system-fill rounded-full overflow-hidden relative">
					<View
						className="h-full  bg-red rounded-full"
						style={{ width: `${calculateProgressWidth()}%` }}
					/>
				</View>
				<View className="flex-row justify-between mt-1.5">
					<Text className="text-xs text-secondary-label">
						{formattedCurrentTime}
					</Text>
					<Text className="text-xs text-secondary-label">
						{formattedDuration}
					</Text>
				</View>
			</View>

			<View className="flex-row justify-center gap-12 items-center">
				<BouncyPressable speed="fast" onPress={handleSeekBackward}>
					<SymbolView
						name={"10.arrow.trianglehead.counterclockwise"}
						size={30}
						tintColor={accentColor}
					/>
				</BouncyPressable>
				<BouncyPressable speed="fast" onPress={handlePlayPause}>
					<SymbolView
						name={status.playing ? "pause.fill" : "play.fill"}
						size={56}
						tintColor={accentColor}
					/>
				</BouncyPressable>

				<BouncyPressable speed="fast" onPress={handleSeekForward}>
					<SymbolView
						name={"10.arrow.trianglehead.clockwise"}
						size={30}
						tintColor={accentColor}
					/>
				</BouncyPressable>
			</View>
		</View>
	);
}
