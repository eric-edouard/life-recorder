import { Dot } from "@/src/components/Dot";
import { Bluetooth } from "lucide-react-native";
import React from "react";
import { View } from "react-native";
import { Row } from "../ui/Row";
import { Text } from "../ui/Text";
export const DeviceCard = ({
	deviceName,
	connected,
	signalStrength,
}: {
	deviceName: string;
	connected: boolean;
	signalStrength: string;
}) => {
	return (
		<View className="pb-1 pt-8 rounded-xl bg-secondary-system-background w-full">
			<View className="items-center mb-4">
				<View className="bg-secondary-system-fill p-4 rounded-full mb-4">
					<Bluetooth size={24} color="white" />
				</View>
				<Text className="text-2xl font-bold mb-6">{deviceName}</Text>
			</View>

			<Row
				title="Status"
				detailComponent={
					<View className="flex-row items-center">
						<Text className="mr-2 text-secondary-label text-lg">
							{connected ? "Connected" : "Disconnected"}
						</Text>
						<Dot color={connected ? "green" : "red"} />
					</View>
				}
			/>

			<Row title="Signal Strength" detailText={signalStrength} hideUnderline />
		</View>
	);
};
