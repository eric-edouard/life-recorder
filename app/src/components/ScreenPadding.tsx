import { View } from "react-native";

export const ScreenPadding = ({ children }: { children: React.ReactNode }) => {
	return <View className="flex-1 px-5">{children}</View>;
};
