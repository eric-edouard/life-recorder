import { Card } from "@app/src/components/Card";
import { Text } from "@app/src/components/ui/Text";
import {
	PermissionStatus,
	useBackgroundPermissions,
	useForegroundPermissions,
} from "expo-location";
import { Linking } from "react-native";

export const LocationPermissionsBanner = () => {
	const [backgroundPermission, requestBackgroundPermission] =
		useBackgroundPermissions();
	const [foregroundPermission, requestForegroundPermission] =
		useForegroundPermissions();

	const handlePress = async () => {
		if (foregroundPermission?.status !== PermissionStatus.GRANTED) {
			const result = await requestForegroundPermission();
			if (result.status !== PermissionStatus.GRANTED) {
				Linking.openSettings();
				return;
			}
		}
		if (backgroundPermission?.status !== PermissionStatus.GRANTED) {
			const result = await requestBackgroundPermission();
			if (result.status !== PermissionStatus.GRANTED) {
				Linking.openSettings();
			}
		}
	};

	if (
		foregroundPermission?.status === PermissionStatus.GRANTED &&
		backgroundPermission?.status === PermissionStatus.GRANTED
	) {
		return null;
	}

	const message =
		foregroundPermission?.status !== PermissionStatus.GRANTED
			? "Location permission is required to keep recording when the app is backgrounded."
			: "Background location permission is required to keep recording when the app is backgrounded.";

	return (
		<Card onPress={handlePress}>
			<Text>{message}</Text>
		</Card>
	);
};
