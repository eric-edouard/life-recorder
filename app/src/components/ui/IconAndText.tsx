import { Text } from "@/src/components/ui/Text";
import { View } from "react-native";
import { twMerge } from "tailwind-merge";

type MessageCardProps = {
	className?: string;
	icon: React.ReactNode;
	title: string;
	message: string;
	content?: React.ReactNode;
};

export const IconAndText = ({
	icon,
	title,
	message,
	className,
	content,
}: MessageCardProps) => {
	return (
		<View
			className={twMerge(
				"flex items-center gap-2 pt-24 pb-safe-offset-10 ",
				className,
			)}
		>
			{icon}
			<View>
				<Text className="text-2xl font-bold text-center mb-2 mt-4 text-gray-2">
					{title}
				</Text>
				<Text className="text-lg text-tertiary-label text-center mx-8 mb-6">
					{message}
				</Text>
			</View>
			{content}
		</View>
	);
};
