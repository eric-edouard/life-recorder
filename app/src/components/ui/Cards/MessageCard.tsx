import { Text } from "@/src/components/ui/Text";
import { View } from "react-native";
import { twMerge } from "tailwind-merge";

type MessageCardProps = {
	className?: string;
	icon: React.ReactNode;
	title: string;
	message: string;
	transparent?: boolean;
	content?: React.ReactNode;
};

export const MessageCard = ({
	icon,
	title,
	message,
	className,
	transparent = false,
	content,
}: MessageCardProps) => {
	return (
		<View
			className={twMerge(
				"bg-secondary-system-grouped-background rounded-xl p-8 flex items-center gap-2 ",
				transparent && "bg-transparent",
				className,
			)}
		>
			{icon}
			<View>
				<Text className="text-xl font-bold text-center mb-2 text-gray-2">
					{title}
				</Text>
				<Text className="text-md text-tertiary-label text-center px-4">
					{message}
				</Text>
			</View>
			{content}
		</View>
	);
};
