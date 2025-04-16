import { View as RNView, type ViewProps } from "react-native";

export const View = ({ style, ...props }: ViewProps) => {
	return <RNView style={[{ borderCurve: "continuous" }, style]} {...props} />;
};
