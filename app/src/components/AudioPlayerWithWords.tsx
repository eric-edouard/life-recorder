import { BouncyPressable } from "@app/src/components/ui/Buttons/BouncyPressable";
import type { Words } from "@app/src/types/words";
import { formatTime } from "@app/src/utils/formatTime";
import { rgbaToHex } from "@app/src/utils/rgbaToHex";
import { format } from "date-fns";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { SymbolView } from "expo-symbols";
import React, { useMemo } from "react";
import { ScrollView, Text, View } from "react-native";
import { useColor } from "react-native-uikit-colors";

interface AudioPlayerWithWordsProps {
	fileUrl: string;
	date: Date;
	duration: number;
	closeModal: () => void;
	words: Words;
}

const OFFSET = -0.74;
export function AudioPlayerWithWords({
	fileUrl,
	duration,
	date,
	closeModal,
	words,
}: AudioPlayerWithWordsProps) {
	const player = useAudioPlayer({ uri: fileUrl }, 100);
	const status = useAudioPlayerStatus(player);

	const formattedCurrentTime = formatTime(status.currentTime);
	const formattedDuration = formatTime(status.duration);
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

	const getCurrentWordIndex = useMemo(() => {
		if (!words || words.length === 0) return -1;

		for (let i = 0; i < words.length; i++) {
			if (
				status.currentTime >= words[i].start + OFFSET &&
				status.currentTime <= words[i].end + OFFSET
			) {
				return i;
			}
		}

		// If no word is currently being spoken, find the next word
		for (let i = 0; i < words.length; i++) {
			if (status.currentTime < words[i].start) {
				return -1;
			}
		}

		return -1;
	}, [words, status.currentTime]);

	return (
		<View className="w-full flex-1 flex rounded-3xl ">
			<View className="px-5 flex-1 h-full flex justify-center my-20 flex-row items-center">
				<View className="w-7" />
				<View className="flex-1">
					<ScrollView
						contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
					>
						<View className="flex-row flex-wrap justify-center">
							{words?.map((word, index) => (
								<Text
									key={`${word.word}-${index}`}
									className={`text-3xl font-semibold ${index === getCurrentWordIndex ? "text-red" : "text-label"} mr-1`}
								>
									{word.punctuated_word}
								</Text>
							))}
						</View>
					</ScrollView>
					<View className="flex-row justify-center gap-2 items-center">
						<Text className="text-md font-bold text-secondary-label text-center">
							{format(date, "dd MMM yyyy")}
						</Text>
						<Text className="text-md text-secondary-label text-center">
							{formatTime(duration)}
						</Text>
					</View>
				</View>
				<View className="w-7">
					{/* <ContextMenu
						style={{
							width: 30,
							height: 30,
						}}
					>
						<ContextMenu.Items>
							<Button
								role="destructive"
								systemImage="trash"
								onPress={async () => {
									await trpcClient.deleteVoiceProfile.mutate(type);
									await userService.fetchCurrentUserVoiceProfiles();
									closeModal();
								}}
							>
								Delete recording
							</Button>
							<Button
								systemImage="arrow.left.arrow.right"
								onPress={async () => {
									router.push(`/modals/record-voice-profile?fileId=${fileId}`);
								}}
							>
								Replace recording
							</Button>
						</ContextMenu.Items>
						<ContextMenu.Trigger>
							<View className="w-7 h-7 flex justify-center items-center ">
								<SymbolView
									name="ellipsis.circle"
									size={24}
									tintColor={rgbaToHex(fillColor)}
								/>
							</View>
						</ContextMenu.Trigger>
					</ContextMenu> */}
				</View>
			</View>

			<View className="mb-safe-offset-20 left-0 right-0 px-5 ">
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
							name={
								status.playing && !status.didJustFinish
									? "pause.fill"
									: "play.fill"
							}
							size={46}
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
