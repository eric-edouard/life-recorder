// src/services/locationService.ts
import { LOCATION_TASK_NAME } from "@app/src/tasks/locationTask";
import * as Location from "expo-location";
import { useBackgroundPermissions } from "expo-location";
import { useEffect } from "react";

export const startBackgroundLocation = async (): Promise<void> => {
	const hasTask =
		await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
	if (hasTask) return;

	console.log("Starting background location");
	await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
		accuracy: Location.Accuracy.Balanced,
		timeInterval: 5 * 60 * 1000, // every 5 minutes
		distanceInterval: 100, // regardless of movement
		showsBackgroundLocationIndicator: false, // iOS indicator
		foregroundService: {
			notificationTitle: "App is recording location",
			notificationBody: "Your app is running in the background",
			notificationColor: "#FF0000",
		},
	});
	console.log("Background location started");
};

export const stopBackgroundLocation = async (): Promise<void> => {
	const hasTask =
		await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
	if (hasTask) {
		await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
	}
};

export const useStartBackgroundLocation = () => {
	const [backgroundPermission, requestBackgroundPermission] =
		useBackgroundPermissions();

	useEffect(() => {
		if (backgroundPermission?.status === Location.PermissionStatus.GRANTED) {
			startBackgroundLocation();
		}
	}, [backgroundPermission?.status, requestBackgroundPermission]);

	return null;
};
