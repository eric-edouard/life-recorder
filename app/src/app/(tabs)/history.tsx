import { HistoryScreen } from "@app/src/components/Sreens/HistoryScreen/HistoryScreen";

export default function HistoryTab() {
	return <HistoryScreen />;
	// const utterances = use$(utterancesService.utterances$);
	// const loading = use$(utterancesService.loading$);
	// useEffect(() => {
	// 	utterancesService.fetchUtterances(0, new Date().getTime());
	// }, []);
	// return (
	// 	<View className="flex-1 w-full ">
	// 		{loading && <Text>Loading...</Text>}
	// 		<FlatList
	// 			contentContainerClassName="mt-safe-offset-5 p-5 flex-1 h-full mb-safe-offset-0 "
	// 			ListHeaderComponent={
	// 				<Text className=" text-3xl font-extrabold mb-4 text-label">
	// 					Time machine
	// 				</Text>
	// 			}
	// 			data={utterances}
	// 			renderItem={({ item }) => (
	// 				<View className="flex mb-4">
	// 					<Text className="text-xs text-secondary-label">
	// 						{new Date(item.createdAt).toLocaleString()}
	// 					</Text>
	// 					<Text className="text-md text-label">{item.transcript}</Text>
	// 				</View>
	// 			)}
	// 			ListEmptyComponent={
	// 				<IconAndText
	// 					className="flex-1 h-full justify-center items-center "
	// 					title="No history yet"
	// 					message="Start using your omi device to record your life"
	// 					icon={<AudioLines color="gray" size={56} />}
	// 				/>
	// 			}
	// 		/>
	// 	</View>
	// );
}
