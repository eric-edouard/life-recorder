import { useCustomColor } from "@app/src/contexts/ThemeContext";
import { Button } from "react-native";

type TextButtonProps = {
	title: string;
	onPress: () => void;
};

export const TextButton = ({ title, onPress }: TextButtonProps) => {
	const color = useCustomColor("--accent");
	return <Button color={color} title={title} onPress={onPress} />;
};
