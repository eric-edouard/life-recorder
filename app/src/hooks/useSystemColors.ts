import type { SystemColor } from "@app/src/types/colors";
import { useColors } from "react-native-uikit-colors";

export const useSystemColors = () => {
	return useColors() as Record<SystemColor, string>;
};
