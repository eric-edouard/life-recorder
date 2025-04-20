import { Dot } from "@/src/components/Dot";
import { RowButton } from "@/src/components/ui/Buttons/RowButton";
import { InsetList } from "@/src/components/ui/Lists/InsetList";
import { InsetListRow } from "@/src/components/ui/Lists/InsetListRow";
import { Text } from "@/src/components/ui/Text";
import { StatusBar } from "expo-status-bar";
import { Bluetooth } from "lucide-react-native";
import { useState } from "react";
import { Platform, View } from "react-native";
export default function DeviceModal() {
	const [isConnected, setIsConnected] = useState(true);

	return (
		<View className="flex-1 items-center p-6 bg-system-grouped-background">
			<InsetList
				headerText="My device"
				listHeader={
					<View className="items-center mb-4 pt-12">
						<View className="bg-secondary-system-fill p-4 rounded-full mb-4 ">
							<Bluetooth size={24} color="white" />
						</View>
						<Text className="text-2xl font-bold mb-6">Omi Dev Kit 2</Text>
					</View>
				}
			>
				<InsetListRow
					title="Status"
					accessory={
						<View className="flex-row items-center">
							<Text className="mr-2 text-secondary-label text-lg">
								{isConnected ? "Connected" : "Disconnected"}
							</Text>
							<Dot color={isConnected ? "green" : "red"} />
						</View>
					}
				/>
				<InsetListRow title="Battery Level" detail="67%" />
				<InsetListRow title="Signal Strength" detail="Strong" />
			</InsetList>

			<View className="mt-4 w-full">
				<RowButton
					colorStyle="destructive"
					title="Unpair This Device"
					onPress={() => {}}
				/>
			</View>
			<StatusBar style={Platform.OS === "ios" ? "light" : "auto"} />
		</View>
	);
}
