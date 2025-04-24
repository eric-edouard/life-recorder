import React from "react";
import { View } from "react-native";

import { ScreenScrollView } from "@app/components/ScreenScrollView/ScreenScrollView";
import { InsetList } from "@app/components/ui/Lists/InsetList";
import { Text } from "@app/components/ui/Text";

export const UserScreen = () => {
	return (
		<ScreenScrollView.Container title="Account" className="pt-5">
			<View className="px-lg w-full flex items-start gap-3">
				<ScreenScrollView.Title>
					<View className=" w-full flex-row flex-1 justify-between items-end mb-4">
						<View className="flex items-start gap-3">
							<View className=" flex-row justify-between items-center w-full">
								<Text className="text-4xl font-extrabold text-label">
									Account
								</Text>
							</View>
						</View>
					</View>
				</ScreenScrollView.Title>
				<InsetList headerText="Voice Profiles">
					<InsetList.Row title="Normal voice" detail="Account" />
					<InsetList.Row title="Slow & deep voice" detail="Account" />
					<InsetList.Row title="Fast & high voice" detail="Account" />
				</InsetList>
			</View>
		</ScreenScrollView.Container>
	);
};
