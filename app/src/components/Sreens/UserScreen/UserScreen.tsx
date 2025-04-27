import React from "react";

import { RowButton } from "@app/src/components/ui/Buttons/RowButton";
import { InsetList } from "@app/src/components/ui/Lists/InsetList";
import { voiceProfilesLabel } from "@app/src/constants/voiceProfilesText";
import { authClient } from "@app/src/services/authClient";
import trpc from "@app/src/services/trpc";
import { userService } from "@app/src/services/userService";
import { use$ } from "@legendapp/state/react";
import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Alert, ScrollView, View } from "react-native";

export const UserScreen = () => {
	const voiceProfiles = use$(userService.voiceProfiles$);
	const router = useRouter();
	return (
		<ScrollView className="flex-1 px-5 pt-10">
			<InsetList headerText="Voice Profiles" className="mb-5">
				<InsetList.Row
					title={`${voiceProfilesLabel.normal} pitch`}
					detail={!voiceProfiles.normal ? "Record" : ""}
					accessory={
						voiceProfiles.normal ? <SymbolView name="info.circle" /> : null
					}
					onPress={() => {
						router.push("/record-voice-profile?type=normal");
					}}
				/>
				<InsetList.Row
					title={`${voiceProfilesLabel.low} pitch`}
					detail={!voiceProfiles.low ? "Record" : ""}
					accessory={
						voiceProfiles.low ? <SymbolView name="info.circle" /> : null
					}
					onPress={() => {
						router.push("/record-voice-profile?type=low");
					}}
				/>
				<InsetList.Row
					title={`${voiceProfilesLabel.high} pitch`}
					detail={!voiceProfiles.high ? "Record" : ""}
					accessory={
						voiceProfiles.high ? <SymbolView name="info.circle" /> : null
					}
					onPress={() => {
						router.push("/record-voice-profile?type=high");
					}}
				/>
			</InsetList>
			<View className="flex-1 gap-5">
				{/* TESTING BUTTONS */}
				<RowButton
					title="Get User"
					onPress={() => {
						userService.fetchMe().then((user) => {
							Alert.alert("User", JSON.stringify(user, null, 2));
						});
					}}
				/>

				<RowButton
					title="List users"
					onPress={() => {
						trpc.userList.query().then((users) => {
							Alert.alert("Users", JSON.stringify(users, null, 2));
						});
					}}
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
		</ScrollView>
	);
};
