import { createTypedStorage } from "../utils/createTypedStorage";

type PersistData = {
	connectedDeviceId: string | null;
};

export const storage = createTypedStorage<PersistData>();
