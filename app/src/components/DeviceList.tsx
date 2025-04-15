import type { OmiDevice } from "@/src/services/OmiDeviceManager/types";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface DeviceListProps {
	devices: OmiDevice[];
	connected: boolean;
	connectedDeviceId: string | null;
	onConnect: (deviceId: string) => void;
	onDisconnect: () => void;
}

const DeviceList = ({
	devices,
	connected,
	connectedDeviceId,
	onConnect,
	onDisconnect,
}: DeviceListProps) => {
	if (devices.length === 0) return null;

	return (
		<View className="mb-6 p-4 bg-white rounded-lg shadow-sm mt-6">
			<View>
				{devices.map((device) => (
					<View
						key={device.id}
						className="flex-row justify-between items-center py-2.5 border-b border-[#eee]"
					>
						<View>
							<Text className="text-base font-medium text-[#333]">
								{device.name}
							</Text>
							<Text className="text-xs text-[#666] mt-0.5">
								RSSI: {device.rssi} dBm
							</Text>
						</View>
						{connected && connectedDeviceId === device.id ? (
							<TouchableOpacity
								className="bg-[#FF3B30] py-2 px-3 rounded-lg items-center shadow-sm"
								onPress={onDisconnect}
							>
								<Text className="text-white text-base font-semibold">
									Disconnect
								</Text>
							</TouchableOpacity>
						) : (
							<TouchableOpacity
								className={`py-2 px-3 rounded-lg items-center shadow-sm ${connected ? "bg-[#A0A0A0] opacity-70" : "bg-[#007AFF]"}`}
								onPress={() => onConnect(device.id)}
								disabled={connected}
							>
								<Text className="text-white text-base font-semibold">
									Connect
								</Text>
							</TouchableOpacity>
						)}
					</View>
				))}
			</View>
		</View>
	);
};

export default DeviceList;
