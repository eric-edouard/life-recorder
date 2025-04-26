import type { PairedDevice } from "@app/src/services/deviceService/types";
import { observable } from "@legendapp/state";
import { createTypedStorage } from "../utils/createTypedStorage";

export type PersistData = {
	pairedDevice: PairedDevice | null;
};

export const storage = createTypedStorage<PersistData>();

export const storage$ = observable<PersistData>({
	pairedDevice: storage.get("pairedDevice") ?? null,
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
