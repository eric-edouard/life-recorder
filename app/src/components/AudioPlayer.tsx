import { Ionicons } from "@expo/vector-icons";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import React, { useEffect, useRef } from "react";
import {
	Animated,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";

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
		<View style={styles.container}>
			<Text style={styles.title}>{title}</Text>

			<View style={styles.progressContainer}>
				<View style={styles.progressBar}>
					<Animated.View style={[styles.progress, { width: widthPercent }]} />
				</View>
				<View style={styles.timeContainer}>
					<Text style={styles.timeText}>{formattedCurrentTime}</Text>
					<Text style={styles.timeText}>{formattedDuration}</Text>
				</View>
			</View>

			<View style={styles.controls}>
				<TouchableOpacity
					onPress={handleSeekBackward}
					style={styles.controlButton}
				>
					<Ionicons name="play-back" size={24} color="#333" />
					<Text style={styles.controlText}>-10s</Text>
				</TouchableOpacity>

				<TouchableOpacity
					onPress={handlePlayPause}
					style={styles.playPauseButton}
				>
					<Ionicons
						name={status.playing ? "pause" : "play"}
						size={32}
						color="#fff"
					/>
				</TouchableOpacity>

				<TouchableOpacity
					onPress={handleSeekForward}
					style={styles.controlButton}
				>
					<Ionicons name="play-forward" size={24} color="#333" />
					<Text style={styles.controlText}>+10s</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		backgroundColor: "#fff",
		borderRadius: 12,
		padding: 16,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 2,
		width: "100%",
	},
	title: {
		fontSize: 18,
		fontWeight: "600",
		marginBottom: 16,
		textAlign: "center",
	},
	progressContainer: {
		marginBottom: 16,
	},
	progressBar: {
		height: 8,
		backgroundColor: "#E0E0E0",
		borderRadius: 4,
		overflow: "hidden",
		position: "relative",
	},
	progress: {
		height: "100%",
		backgroundColor: "#3D7DFF",
		borderRadius: 4,
	},
	timeContainer: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginTop: 6,
	},
	timeText: {
		fontSize: 12,
		color: "#666",
	},
	controls: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	controlButton: {
		alignItems: "center",
	},
	controlText: {
		fontSize: 12,
		marginTop: 4,
		color: "#666",
	},
	playPauseButton: {
		backgroundColor: "#3D7DFF",
		width: 64,
		height: 64,
		borderRadius: 32,
		justifyContent: "center",
		alignItems: "center",
	},
});
