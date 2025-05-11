import { Text } from "@app/src/components/ui/Text";
import { queryClient } from "@app/src/services/reactQuery";
import { trpcClient, trpcQuery } from "@app/src/services/trpc";
import { useQuery } from "@tanstack/react-query";
import { toast } from "burnt";
import { router, useLocalSearchParams } from "expo-router";
import { FlatList, TouchableOpacity, View } from "react-native";

export default function AssignVoiceProfileSpeakerModal() {
	const { voiceProfileId } = useLocalSearchParams<{ voiceProfileId: string }>();
	const { data: speakers } = useQuery(trpcQuery.speakers.queryOptions());

	return (
		<View className="flex-1">
			<Text>Assign Voice Profile Speaker</Text>
			<Text>{voiceProfileId ?? "No voice profile id !!!"}</Text>
			<FlatList
				data={speakers}
				renderItem={({ item }) => (
					<TouchableOpacity
						className="p-4 border border-gray-300 rounded-md"
						onPress={async () => {
							if (!voiceProfileId) {
								toast({
									preset: "error",
									title: "No voice profile id !!!",
									message: "Please select a voice profile first",
								});
								return;
							}
							await trpcClient.assignVoiceProfileSpeaker.mutate({
								voiceProfileId,
								speakerId: item.id,
							});
							await queryClient.invalidateQueries({
								queryKey: trpcQuery.voiceProfiles.queryKey(),
							});
							router.back();
						}}
					>
						<Text className="text-2xl font-bold">{item.name}</Text>
					</TouchableOpacity>
				)}
				className="flex-1 px-5 pt-10 "
			/>
		</View>
	);
}
