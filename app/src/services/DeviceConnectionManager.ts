import { OmiConnection } from "@/src/services/OmiConnection/OmiConnection";

export class DeviceConnectionManager {
	private omiConnection: OmiConnection;

	constructor() {
		this.omiConnection = new OmiConnection();
	}
}
