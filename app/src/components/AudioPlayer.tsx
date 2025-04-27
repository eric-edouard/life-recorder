import { Ionicons } from "@expo/vector-icons";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import React, { useEffect, useRef } from "react";
import { Animated, Text, TouchableOpacity, View } from "react-native";

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
	const progressWidthAnimation = useRef(new Animated.Value(0)).current;

	const formattedCurrentTime = formatTime(status.currentTime);
	const formattedDuration = formatTime(status.duration);

	useEffect(() => {
		// Animate progress when currentTime changes
		Animated.timing(progressWidthAnimation, {
			toValue: calculateProgressWidth(),
			duration: 250,
			useNativeDriver: false, // width cannot use native driver
		}).start();
	}, [status.currentTime, status.duration]);

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
		return status.currentTime / status.duration;
	};

	// Calculate width percentage for progress bar
	const widthPercent = progressWidthAnimation.interpolate({
		inputRange: [0, 1],
		outputRange: ["0%", "100%"],
		extrapolate: "clamp",
	});

	return (
		<View className="w-full bg-system-background rounded-3xl p-4 shadow-sm">
			<Text className="text-lg font-semibold text-label mb-4 text-center">
				{title}
			</Text>

			<View className="mb-4">
				<View className="h-2 bg-secondary-system-fill rounded-full overflow-hidden relative">
					<Animated.View
						className="h-full bg-blue rounded-full"
						style={{ width: widthPercent }}
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

			<View className="flex-row justify-between items-center">
				<TouchableOpacity onPress={handleSeekBackward} className="items-center">
					<Ionicons name="play-back" size={24} color="#333" />
					<Text className="text-xs text-secondary-label mt-1">-10s</Text>
				</TouchableOpacity>

				<TouchableOpacity
					onPress={handlePlayPause}
					className="bg-blue w-16 h-16 rounded-full justify-center items-center"
				>
					<Ionicons
						name={status.playing ? "pause" : "play"}
						size={32}
						color="#fff"
					/>
				</TouchableOpacity>

				<TouchableOpacity onPress={handleSeekForward} className="items-center">
					<Ionicons name="play-forward" size={24} color="#333" />
					<Text className="text-xs text-secondary-label mt-1">+10s</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
}
