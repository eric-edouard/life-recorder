import React from "react";

import { InsetList } from "@app/components/ui/Lists/InsetList";
import { ScrollView } from "react-native";

export const UserScreen = () => {
	return (
		<ScrollView className="flex-1 px-5 pt-10">
			<InsetList headerText="Voice Profiles">
				<InsetList.Row title="Normal voice" detail="Record" />
				<InsetList.Row title="Slow & deep voice" detail="Record" />
				<InsetList.Row title="Fast & high voice" detail="Record" />
			</InsetList>
		</ScrollView>
	);
};
