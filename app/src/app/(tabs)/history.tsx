import { ScreenScrollView } from "@app/components/ScreenScrollView/ScreenScrollView";
import { utterancesService } from "@app/services/utterancesService";
import { use$ } from "@legendapp/state/react";
import { useEffect } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { Text } from "../../components/ui/Text";

export default function HistoryScreen() {
	const utterances = use$(utterancesService.utterances$);
	const loading = use$(utterancesService.loading$);
	useEffect(() => {
		utterancesService.fetchUtterances(0, new Date().getTime());
	}, []);
	return (
		<ScreenScrollView.Container title="Time machine" className="pt-5">
			<View className="px-lg w-full flex items-start gap-3">
				<ScreenScrollView.Title>
					<View className="flex items-start gap-3 mt-4">
						<Text className="text-3xl font-extrabold mb-4 text-label">
							Time machine
						</Text>
					</View>
				</ScreenScrollView.Title>
				<View className="flex-1 w-full ">
					{loading && <Text>Loading...</Text>}
					<FlatList
						data={utterances}
						renderItem={({ item }) => (
							<View className="flex mb-4">
								<Text className="text-xs text-secondary-label">
									{new Date(item.createdAt).toLocaleString()}
								</Text>
								<Text className="text-md text-label">{item.transcript}</Text>
							</View>
						)}
					/>
				</View>
			</View>
		</ScreenScrollView.Container>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	title: {
		fontSize: 20,
		fontWeight: "bold",
	},
	separator: {
		marginVertical: 30,
		height: 1,
		width: "80%",
	},
});
