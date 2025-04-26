import { Card } from "@app/src/components/Card";
import React from "react";
import { Text } from "./ui/Text";

type BackendStatusCardProps = {
	onPress: () => void;
};

export const BackendStatusCard = ({ onPress }: BackendStatusCardProps) => {
	return (
		<Card onPress={onPress} containerClassName="">
			<Text className="text-base font-semibold text-label mb-1">
				Backend Status
			</Text>
		</Card>
	);
};
