import React from "react";

import { RowButton } from "@app/src/components/ui/Buttons/RowButton";
import { InsetList } from "@app/src/components/ui/Lists/InsetList";
import { authClient } from "@app/src/services/authClient";
import { userService } from "@app/src/services/userService";
import { useRouter } from "expo-router";
import { Alert, ScrollView, View } from "react-native";

export const UserScreen = () => {
	const router = useRouter();
	return (
		<ScrollView className="flex-1 px-5 pt-10">
			<InsetList headerText="Voice Profiles" className="mb-5">
				<InsetList.Row title="Normal voice" detail="Record" />
				<InsetList.Row title="Slow & deep voice" detail="Record" />
				<InsetList.Row title="Fast & high voice" detail="Record" />
			</InsetList>
			<View className="flex-1 gap-5">
				<RowButton
					title="Get User"
					onPress={() => {
						userService.getUser().then((user) => {
							Alert.alert("User", JSON.stringify(user, null, 2));
						});
					}}
				/>

				<RowButton
					title="List users"
					onPress={() => {
						userService.listUsers().then((users) => {
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
