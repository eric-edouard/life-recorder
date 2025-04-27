import { BouncyPressable } from "@app/src/components/ui/Buttons/BouncyPressable";
import { useCustomColor } from "@app/src/contexts/ThemeContext";
import { rgbaToHex } from "@app/src/utils/rgbaToHex";
import { format } from "date-fns";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { SymbolView } from "expo-symbols";
import React from "react";
import { Text, View } from "react-native";
import { useColor } from "react-native-uikit-colors";

// Helper function to format time in minutes:seconds
const formatTime = (timeInSeconds: number) => {
	const minutes = Math.floor(timeInSeconds / 60);
	const seconds = Math.floor(timeInSeconds % 60);
	return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

interface AudioPlayerProps {
	fileUrl: string;
	title: string;
	date: Date;
	duration: number;
}

export function AudioPlayer({
	fileUrl,
	title,
	duration,
	date,
}: AudioPlayerProps) {
	const player = useAudioPlayer({ uri: fileUrl });
	const status = useAudioPlayerStatus(player);

	const formattedCurrentTime = formatTime(status.currentTime);
	const formattedDuration = formatTime(status.duration);

	const accentColor = useCustomColor("--accent");
	const fillColor = useColor("label");

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
		<View className="w-full flex-1 flex rounded-3xl p-4 shadow-sm">
			<View className="mb-4 px-5 flex-1 h-full flex justify-center">
				<Text className="text-3xl font-semibold text-label text-center">
					{title}
				</Text>
				<View className="flex-row justify-center gap-2 items-center">
					<Text className="mt-3 text-md font-bold text-secondary-label text-center">
						{format(date, "dd MMM yyyy")}
					</Text>
					<Text className="mt-3 text-md text-secondary-label text-center">
						{formatTime(duration)}
					</Text>
				</View>
			</View>

			<View className="mb-safe-offset-20 left-0 right-0 px-5">
				<View className="px-3 mb-14">
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

				<View className="flex-row justify-center gap-16 items-center">
					<BouncyPressable speed="fast" onPress={handleSeekBackward}>
						<SymbolView
							name={"10.arrow.trianglehead.counterclockwise"}
							size={32}
							tintColor={rgbaToHex(fillColor)}
						/>
					</BouncyPressable>
					<BouncyPressable speed="fast" onPress={handlePlayPause}>
						<SymbolView
							name={status.playing ? "pause.fill" : "play.fill"}
							size={50}
							tintColor={rgbaToHex(fillColor)}
						/>
					</BouncyPressable>

					<BouncyPressable speed="fast" onPress={handleSeekForward}>
						<SymbolView
							name={"10.arrow.trianglehead.clockwise"}
							size={32}
							tintColor={rgbaToHex(fillColor)}
						/>
					</BouncyPressable>
				</View>
			</View>
		</View>
	);
}
