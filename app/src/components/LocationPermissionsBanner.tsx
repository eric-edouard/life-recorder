import { Card } from "@/src/components/Card";
import { Text } from "@/src/components/Text";
import { PermissionStatus } from "expo-location";
import type React from "react";
import { useEffect, useState } from "react";
import { Linking } from "react-native";
import {
	checkPermissions,
	requestPermissions,
	startBackgroundLocation,
} from "../services/locationService";

export const LocationPermissionsBanner: React.FC = () => {
	const [permissions, setPermissions] = useState<{
		foreground: PermissionStatus | null;
		background: PermissionStatus | null;
	}>({ foreground: null, background: null });

	useEffect(() => {
		checkPermissions().then(({ foreground, background }) => {
			setPermissions({ foreground, background });
		});
	}, []);

	const handlePress = async () => {
		const ok = await requestPermissions();
		if (!ok) {
			Linking.openSettings();
			return;
		}
		await startBackgroundLocation();
		const { foreground, background } = await checkPermissions();
		setPermissions({ foreground, background });
	};

	if (
		permissions.foreground === PermissionStatus.GRANTED &&
		permissions.background === PermissionStatus.GRANTED
	) {
		return null;
	}

	const message =
		permissions.foreground !== PermissionStatus.GRANTED
			? "Location permission is required to keep recording when the app is backgrounded."
			: "Background location permission is required to keep recording when the app is backgrounded.";

	return (
		<Card onPress={handlePress}>
			<Text>{message}</Text>
		</Card>
	);
};
