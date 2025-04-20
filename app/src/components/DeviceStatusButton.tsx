import { Dot } from "@/src/components/Dot";
import { PressableLayer } from "@/src/components/PressableLayer";
import { Text } from "@/src/components/Text";
import { View } from "react-native";

export const DeviceStatusButton = () => {
	return (
		<PressableLayer>
			<View className="flex-row gap-3 justify-center items-center py-3 px-4">
				<Dot color="green" />
				<Text className="text-md font-bold text-secondary-label">76%</Text>
			</View>
		</PressableLayer>
	);
};
