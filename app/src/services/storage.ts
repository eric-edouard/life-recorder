import { observable } from "@legendapp/state";
import { createTypedStorage } from "../utils/createTypedStorage";

export type PersistData = {
	pairedDeviceId: string | null;
};

export const storage = createTypedStorage<PersistData>();

export const storage$ = observable<PersistData>({
	pairedDeviceId: storage.get("pairedDeviceId") ?? null,
});

storage$.onChange(({ value, changes }) => {
	for (const { path } of changes) {
		const key = path[0] as keyof PersistData;
		const keyValue = value[key];
		if (!keyValue) {
			storage.delete(key);
		} else {
			storage.set(key, keyValue);
		}
	}
});
