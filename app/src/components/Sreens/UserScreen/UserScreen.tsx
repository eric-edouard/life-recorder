import React from "react";

import { RowButton } from "@app/components/ui/Buttons/RowButton";
import { InsetList } from "@app/components/ui/Lists/InsetList";
import { authClient } from "@app/services/authClient";
import { useRouter } from "expo-router";
import { ScrollView } from "react-native";

export const UserScreen = () => {
	const router = useRouter();
	return (
		<ScrollView className="flex-1 px-5 pt-10">
			<InsetList headerText="Voice Profiles" className="mb-5">
				<InsetList.Row title="Normal voice" detail="Record" />
				<InsetList.Row title="Slow & deep voice" detail="Record" />
				<InsetList.Row title="Fast & high voice" detail="Record" />
			</InsetList>
			<RowButton
				title="Logout"
				colorStyle="destructive"
				onPress={() => {
					authClient.signOut();
					router.replace("/");
				}}
			/>
		</ScrollView>
	);
};
