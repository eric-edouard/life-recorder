import { Ionicons } from "@expo/vector-icons";
// InsetListRowExample.tsx
import React from "react";
import { View } from "react-native";
import { InsetList } from "./InsetList";
import { InsetListRow } from "./InsetListRow";

export default function InsetListRowExample() {
	return (
		<View className="flex-1 w-full">
			<InsetList headerText="HEADER TEXT" headerLoading footer="Footer">
				<InsetListRow title="Title" detail="Detail" onPress={() => {}} />
				<InsetListRow
					title="Title"
					accessory={<Ionicons name="information-circle-outline" size={20} />}
					onPress={() => {}}
				/>
				<InsetListRow
					title="Title"
					accessory={<Ionicons name="information-circle-outline" size={20} />}
					onPress={() => {}}
				/>
				<InsetListRow
					title="Title"
					accessory={<Ionicons name="star-outline" size={20} />}
					onPress={() => {}}
				/>
				<InsetListRow
					title="Title"
					accessory={<Ionicons name="checkmark" size={20} />}
					onPress={() => {}}
				/>
				<InsetListRow title="Title" detail="Detail" onPress={() => {}} />
			</InsetList>
		</View>
	);
}
