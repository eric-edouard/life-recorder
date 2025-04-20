import { PressableLayer } from "@/src/components/PressableLayer";
import { Text } from "@/src/components/ui/Text";

export const RowButton = ({
	title,
	onPress,
}: { title: string; onPress: () => void }) => {
	return (
		<PressableLayer
			onPress={onPress}
			className="px-4 py-3 w-full flex justify-center h-row"
		>
			<Text className="text-red text-lg">{title}</Text>
		</PressableLayer>
	);
};
