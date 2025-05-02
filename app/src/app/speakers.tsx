import React from "react";

import { Text } from "@app/src/components/ui/Text";
import { trpcQuery } from "@app/src/services/trpc";
import { useQuery } from "@tanstack/react-query";
import { FlatList } from "react-native";

export default function SpeakersScreen() {
	const { data: speakers, isLoading } = useQuery(
		trpcQuery.speakers.queryOptions(),
	);

	return (
		<FlatList
			data={speakers}
			renderItem={({ item }) => (
				<Text className="text-2xl font-bold">{item.name}</Text>
			)}
			className="flex-1 px-5 pt-10 "
		/>
	);
}
