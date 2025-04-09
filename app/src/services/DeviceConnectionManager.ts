import { OmiConnection } from "@/src/services/OmiConnection/OmiConnection";
import type { OmiDevice } from "@/src/services/OmiConnection/types";
import { observable } from "@legendapp/state";
import { Alert, Linking, Platform } from "react-native";
import { BleManager, State, type Subscription } from "react-native-ble-plx";

export class DeviceConnectionManager {
	// Observable state
	public devices$ = observable<OmiDevice[]>([]);
	public scanning$ = observable(false);
	public connected$ = observable(false);
	public bluetoothState$ = observable(State.Unknown);
	public permissionGranted$ = observable(false);

	// Connection objects
	public omiConnection: OmiConnection;
	private bleManager: BleManager;
	private bleSubscription: Subscription;
	private stopScanCallback: () => void = () => {};

	constructor() {
		console.log(">>>>>>> bluetoothState$", this.bluetoothState$.peek());
		this.omiConnection = new OmiConnection();
		this.bleManager = new BleManager();

		this.bleSubscription = this.bleManager.onStateChange((state) => {
			console.log("Bluetooth state:", state);
			this.bluetoothState$.set(state);

			console.log(">>>>>>> bluetoothState$", this.bluetoothState$);

			if (state === State.PoweredOn) {
				// Bluetooth is on, now we can request permission
				this.requestBluetoothPermission();
			}
		}, true);
	}

	requestBluetoothPermission = () => {
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
					});
				} catch (error) {
					console.error("Error requesting permissions:", error);
					this.permissionGranted$.set(false);
				}
			}
		} catch (error) {
			console.error("Error in requestBluetoothPermission:", error);
			this.permissionGranted$.set(false);
		}
	};

	startScan = () => {
		console.log(">>>>>>> startScan", this.bluetoothState$);

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
		this.scanning$.set(false);
		if (this.stopScanCallback) {
			this.stopScanCallback();
			this.stopScanCallback = () => {};
		}
	};

	connectToDevice = async (deviceId: string) => {
		try {
			// First check if we're already connected to a device
			if (this.connected$.peek()) {
				// Disconnect from the current device first
				await this.disconnectFromDevice();
			}

			// Set connecting state
			this.connected$.set(false);

			const success = await this.omiConnection.connect(
				deviceId,
				(id, state) => {
					console.log(`Device ${id} connection state: ${state}`);
					const isConnected = state === "connected";
					this.connected$.set(isConnected);
				},
			);

			// Auto-stop scanning when connected successfully
			if (success && this.scanning$.peek()) {
				this.stopScan();
			}

			if (success) {
				this.connected$.set(true);
			} else {
				this.connected$.set(false);
				Alert.alert("Connection Failed", "Could not connect to device");
			}
		} catch (error) {
			console.error("Connection error:", error);
			this.connected$.set(false);
			Alert.alert("Connection Error", String(error));
		}
	};

	disconnectFromDevice = async () => {
		await this.omiConnection.disconnect();
		this.connected$.set(false);
	};

	destroy = () => {
		this.bleSubscription.remove();
		this.bleManager.destroy();
	};
}

export const deviceConnectionManager = new DeviceConnectionManager();
