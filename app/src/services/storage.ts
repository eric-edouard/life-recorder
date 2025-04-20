import { createTypedStorage } from "../utils/createTypedStorage";

type PersistData = {
	pairedDeviceId: string | null;
};

export const storage = createTypedStorage<PersistData>();
