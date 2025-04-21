// import type { LocationObject } from "expo-location";
// import * as TaskManager from "expo-task-manager";

// export const LOCATION_TASK_NAME = "BACKGROUND_LOCATION_TASK";

// TaskManager.defineTask<{ locations: LocationObject[] }>(
// 	LOCATION_TASK_NAME,
// 	async ({ data, error }) => {
// 		if (error) {
// 			console.error("Background location task error:", error);
// 			return;
// 		}
// 		if (data && "locations" in data) {
// 			const [loc] = data.locations;
// 			console.log("🛰️ Background location:", loc);
// 			// TODO: send `loc` to your API or persist it
// 		}
// 	},
// );
