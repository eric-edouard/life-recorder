import { OmiConnection } from "@/src/services/OmiConnection/OmiConnection";
import type { OmiDevice } from "@/src/services/OmiConnection/types";
import { storage } from "@/src/services/storage";
import { observable, observe, when } from "@legendapp/state";
import { Alert, Linking, Platform } from "react-native";
import { BleManager, State, type Subscription } from "react-native-ble-plx";

export class DeviceConnectionManager {
	// Observable state
	public bluetoothState$ = observable(State.Unknown);
	public permissionGranted$ = observable(false);
	public scanning$ = observable(false);
	public devices$ = observable<OmiDevice[]>([]);
	public connectedToDevice$ = observable<string | null>(null);

	// Connection objects
	public omiConnection: OmiConnection;
	private bleManager: BleManager;
	private bleSubscription: Subscription;
	private stopScanCallback: () => void = () => {};

	constructor() {
		console.log("DEVICE CONNECTION MANAGER: constructor");
		this.omiConnection = new OmiConnection();
		this.bleManager = new BleManager();

		this.bleSubscription = this.bleManager.onStateChange((state) => {
			this.bluetoothState$.set(state);
			if (state === State.PoweredOn) {
				// Bluetooth is on, now we can request permission
				this.requestBluetoothPermission();
			}
		}, true);

		when(
			() =>
				this.permissionGranted$.get() === true &&
				this.bluetoothState$.get() === State.PoweredOn,
			() => setTimeout(() => this.startScan(), 0),
		);

		observe(this.permissionGranted$, (permissionGranted) => {
			console.log(
				"DEVICE CONNECTION MANAGER: permissionGranted value",
				permissionGranted.value,
			);
		});

		observe(this.bluetoothState$, (bluetoothState) => {
			console.log(
				"DEVICE CONNECTION MANAGER: bluetoothState value",
				bluetoothState.value,
			);
		});
	}

	requestBluetoothPermission: () => boolean = () => {
		console.log("DEVICE CONNECTION MANAGER: requestBluetoothPermission");
		try {
			if (Platform.OS === "ios") {
				this.bleManager.startDeviceScan(null, null, (error) => {
					if (error) {
						console.error("Permission error:", error);
						this.permissionGranted$.set(false);
						Alert.alert(
							"Bluetooth Permission",
							"Please enable Bluetooth permission in your device settings to use this feature.",
							[
								{ text: "Cancel", style: "cancel" },
								{
									text: "Open Settings",
									onPress: () => Linking.openSettings(),
								},
							],
						);
					} else {
						this.permissionGranted$.set(true);
					}
					// Stop scanning immediately after permission check
					this.bleManager.stopDeviceScan();
					return true;
				});
			} else if (Platform.OS === "android") {
				// On Android, we need to check for location and bluetooth permissions
				try {
					// This will trigger the permission dialog
					this.bleManager.startDeviceScan(null, null, (error) => {
						if (error) {
							console.error("Permission error:", error);
							this.permissionGranted$.set(false);
							Alert.alert(
								"Bluetooth Permission",
								"Please enable Bluetooth and Location permissions in your device settings to use this feature.",
								[
									{ text: "Cancel", style: "cancel" },
									{
										text: "Open Settings",
										onPress: () => Linking.openSettings(),
									},
								],
							);
						} else {
							this.permissionGranted$.set(true);
						}
						// Stop scanning immediately after permission check
						this.bleManager.stopDeviceScan();
						return true;
					});
				} catch (error) {
					console.error("Error requesting permissions:", error);
					this.permissionGranted$.set(false);
				}
			}
			return false;
		} catch (error) {
			console.error("Error in requestBluetoothPermission:", error);
			this.permissionGranted$.set(false);
			return false;
		}
	};

	startScan = () => {
		console.log("DEVICE CONNECTION MANAGER: startScan");
		const deviceId = storage.get("connectedDeviceId");
		// Check if Bluetooth is on and permission is granted
		if (this.bluetoothState$.peek() !== State.PoweredOn) {
			Alert.alert(
				"Bluetooth is Off",
				"Please turn on Bluetooth to scan for devices.",
				[
					{ text: "Cancel", style: "cancel" },
					{ text: "Open Settings", onPress: () => Linking.openSettings() },
				],
			);
			return;
		}

		if (!this.permissionGranted$.peek()) {
			console.warn(
				"DEVICE CONNECTION MANAGER: startScan: permissionGranted is false",
			);
			this.requestBluetoothPermission();
			return;
		}

		// Don't clear devices list, just start scanning
		this.scanning$.set(true);

		this.stopScanCallback = this.omiConnection.scanForDevices(
			(device) => {
				this.devices$.set((prev) => {
					// Check if device already exists
					if (prev.some((d) => d.id === device.id)) {
						return prev;
					}
					if (deviceId && device.id === deviceId) {
						this.connectToDevice(device.id);
					}
					return [...prev, device];
				});
			},
			30000, // 30 seconds timeout
		);

		// Auto-stop after 30 seconds
		setTimeout(() => {
			this.stopScan();
		}, 30000);
	};

	stopScan = () => {
		console.log("DEVICE CONNECTION MANAGER: stopScan");
		this.scanning$.set(false);
		if (this.stopScanCallback) {
			this.stopScanCallback();
			this.stopScanCallback = () => {};
		}
	};

	connectToDevice = async (deviceId: string) => {
		console.log("DEVICE CONNECTION MANAGER: connectToDevice ", deviceId);
		try {
			// First check if we're already connected to a device
			if (this.connectedToDevice$.peek()) {
				// Disconnect from the current device first
				await this.disconnectFromDevice();
			}

			const success = await this.omiConnection.connect(
				deviceId,
				(id, state) => {
					console.log(`Device ${id} connection state: ${state}`);
					const isConnected = state === "connected";
					this.connectedToDevice$.set(isConnected ? deviceId : null);
				},
			);

			// Auto-stop scanning when connected successfully
			if (success && this.scanning$.peek()) {
				this.stopScan();
			}

			if (success) {
				// Set connecting state
				this.connectedToDevice$.set(deviceId);
				storage.set("connectedDeviceId", deviceId);
			} else {
				this.connectedToDevice$.set(null);
				Alert.alert("Connection Failed", "Could not connect to device");
			}
		} catch (error) {
			console.error("Connection error:", error);
			this.connectedToDevice$.set(null);
			Alert.alert("Connection Error", String(error));
		}
	};

	disconnectFromDevice = async () => {
		console.log("DEVICE CONNECTION MANAGER: disconnectFromDevice");
		await this.omiConnection.disconnect();
		this.connectedToDevice$.set(null);
		storage.set("connectedDeviceId", null);
	};

	destroy = () => {
		console.log("DEVICE CONNECTION MANAGER: destroy");
		this.bleSubscription.remove();
		this.bleManager.destroy();
	};
}

export const deviceConnectionManager = new DeviceConnectionManager();
