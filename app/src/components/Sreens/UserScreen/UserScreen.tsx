import React from "react";

import { RowButton } from "@app/src/components/ui/Buttons/RowButton";
import { InsetList } from "@app/src/components/ui/Lists/InsetList";
import { authClient } from "@app/src/services/authClient";
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
					title="Normal voice"
					detail={!voiceProfiles.normal ? "Record" : ""}
					accessory={
						voiceProfiles.normal ? <SymbolView name="info.circle" /> : null
					}
					onPress={() => {
						router.push("/record-voice-profile?type=normal");
					}}
				/>
				<InsetList.Row
					title="Slow & deep voice"
					detail={!voiceProfiles.slowDeep ? "Record" : ""}
					accessory={
						voiceProfiles.slowDeep ? <SymbolView name="info.circle" /> : null
					}
					onPress={() => {
						router.push("/record-voice-profile?type=slow-deep");
					}}
				/>
				<InsetList.Row
					title="Fast & high voice"
					detail={!voiceProfiles.fastHigh ? "Record" : ""}
					accessory={
						voiceProfiles.fastHigh ? <SymbolView name="info.circle" /> : null
					}
					onPress={() => {
						router.push("/record-voice-profile?type=fast-high");
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

				{/* <RowButton
					title="List users"
					onPress={() => {
						userService.listUsers().then((users) => {
							Alert.alert("Users", JSON.stringify(users, null, 2));
						});
					}}
				/> */}

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
