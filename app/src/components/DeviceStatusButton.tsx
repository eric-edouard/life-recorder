import { Dot } from "@/src/components/Dot";
import { PressableLayer } from "@/src/components/PressableLayer";
import { Text } from "@/src/components/ui/Text";
import { router } from "expo-router";
import { View } from "react-native";

export const DeviceStatusButton = () => {
	return (
		<PressableLayer onPress={() => router.push("/modals/device")}>
			<View className="flex-row gap-3 justify-center items-center py-3 px-4">
				<Dot color="green" />
				<Text className="text-md font-bold text-secondary-label">76%</Text>
			</View>
		</PressableLayer>
	);
};
