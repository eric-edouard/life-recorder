import React, { type FC } from "react";

import { RowButton } from "@app/src/components/ui/Buttons/RowButton";
import { Text } from "@app/src/components/ui/Text";
import { authClient } from "@app/src/services/authClient";
import {
	type Speaker,
	speakersService,
} from "@app/src/services/speakersService";
import { trpcQuery } from "@app/src/services/trpc";
import { userService } from "@app/src/services/userService";
import { use$ } from "@legendapp/state/react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { router, useRouter } from "expo-router";
import { Alert, ScrollView, View } from "react-native";

// const VoiceProfileRow = ({
// 	hasProfile,
// 	hideBorder,
// }: {
// 	hasProfile: boolean;
// 	hideBorder?: boolean;
// }) => {
// 	const router = useRouter();

// 	return (
// 		<InsetList.Row
// 			title={`${voiceProfilesLabel[type]} pitch`}
// 			detail={!hasProfile ? "Record" : ""}
// 			accessory={hasProfile ? <SymbolView name="info.circle" /> : null}
// 			hideBorder={hideBorder}
// 			onPress={() => {
// 				hasProfile
// 					? router.push(`/modals/voice-profile?type=${type}`)
// 					: router.push(`/modals/record-voice-profile?type=${type}`);
// 			}}
// 		/>
// 	);
// };

// Add TypeScript type annotations for the VoiceProfileCard component
interface VoiceProfile {
	id: string;
	fileId: string;
	speakerId: string | null;
	languages: string[] | null;
	createdAt: Date;
	duration: number;
}

const VoiceProfileCard: FC<{
	voiceProfile: VoiceProfile;
	speakers: Speaker[];
}> = ({ voiceProfile, speakers }) => {
	const speaker = speakers.find((s) => s.id === voiceProfile.speakerId);

	return (
		<View className="bg-secondary-system-background p-4 rounded-lg mb-4 relative">
			<Text className="text-quaternary-label">
				Created At: {format(voiceProfile.createdAt, " HH:mm:ss dd/MM/yyyy")}
			</Text>
			<Text className="text-secondary-label">
				Speaker: {speaker ? speaker.name : "Unknown Speaker"}
			</Text>
			<Text className="text-secondary-label">
				Duration: {voiceProfile.duration}s
			</Text>
			{!speaker && (
				<RowButton
					title="Assign Speaker"
					onPress={() => {
						router.push(
							`/modals/assign-voice-profile-speaker?voiceProfileId=${voiceProfile.id}`,
						);
					}}
				/>
			)}
			<View className="absolute bottom-2 right-2">
				<RowButton
					title="Play"
					onPress={() => {
						// Logic to play the voice profile
					}}
				/>
			</View>
		</View>
	);
};

export const UserScreen = () => {
	const { data: voiceProfiles, isLoading } = useQuery(
		trpcQuery.voiceProfiles.queryOptions(),
	);
	const router = useRouter();
	const speakers = use$(() => speakersService.speakers$?.get()) ?? [];
	return (
		<ScrollView className="flex-1 px-5 pt-10">
			{/* <InsetList headerText="Voice Profiles" className="mb-5">
				<VoiceProfileRow type="normal" hasProfile={!!voiceProfiles.normal} />
				<VoiceProfileRow type="low" hasProfile={!!voiceProfiles.low} />
				<VoiceProfileRow type="high" hasProfile={!!voiceProfiles.high} />
			</InsetList> */}
			<View className="flex-1 gap-5 mb-5">
				{/* TESTING BUTTONS */}
				<RowButton
					colorStyle="default"
					title="Get User"
					onPress={() => {
						userService.fetchMe().then((user) => {
							Alert.alert("User", JSON.stringify(user, null, 2));
						});
					}}
				/>
				<RowButton
					title="Speakers"
					onPress={() => {
						router.push("/speakers");
					}}
					withChevron
				/>
				<RowButton
					title="Logout"
					colorStyle="destructive"
					onPress={() => {
						authClient.signOut();
						router.replace("/");
					}}
				/>
			</View>
			{voiceProfiles
				?.sort((a, b) => {
					return (
						new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
					);
				})
				.map((voiceProfile) => {
					return (
						<VoiceProfileCard
							key={voiceProfile.id}
							voiceProfile={voiceProfile}
							speakers={speakers}
						/>
					);
				})}
		</ScrollView>
	);
};
