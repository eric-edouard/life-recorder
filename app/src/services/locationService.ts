// src/services/locationService.ts
import { LOCATION_TASK_NAME } from "@/src/tasks/locationTask";
import * as Location from "expo-location";
import { PermissionStatus } from "expo-location";

export async function requestPermissions(): Promise<boolean> {
	const { status: fgStatus } =
		await Location.requestForegroundPermissionsAsync();
	if (fgStatus !== PermissionStatus.GRANTED) return false;

	const { status: bgStatus } =
		await Location.requestBackgroundPermissionsAsync();
	if (bgStatus !== PermissionStatus.GRANTED) return false;

	return true;
}

export async function startBackgroundLocation(): Promise<void> {
	const hasTask =
		await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
	if (hasTask) return;

	await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
		accuracy: Location.Accuracy.BestForNavigation,
		timeInterval: 5 * 60 * 1000, // every 5 minutes
		distanceInterval: 0, // regardless of movement
		showsBackgroundLocationIndicator: true, // iOS indicator
		foregroundService: {
			notificationTitle: "App is recording location",
			notificationBody: "Your app is running in the background",
			notificationColor: "#FF0000",
		},
	});
}

export async function stopBackgroundLocation(): Promise<void> {
	const hasTask =
		await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
	if (hasTask) {
		await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
	}
}

export async function checkPermissions(): Promise<{
	foreground: PermissionStatus;
	background: PermissionStatus;
}> {
	const fg = await Location.getForegroundPermissionsAsync();
	const bg = await Location.getBackgroundPermissionsAsync();
	return { foreground: fg.status, background: bg.status };
}
