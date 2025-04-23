import { IconAndText } from "@/src/components/ui/IconAndText";
import { scanDevicesService } from "@/src/services/deviceService/scanDevicesService";
import { use$ } from "@legendapp/state/react";
import { Bluetooth } from "lucide-react-native";
import React, { useEffect, useRef } from "react";
import { Animated } from "react-native";
import { useColor } from "react-native-uikit-colors";

type Props = {
	title: string;
	message: string;
};

export function SearchingDevices({ title, message }: Props) {
	const gray2 = useColor("gray2");
	const isScanning = use$(scanDevicesService.scanning$);
	const animatedValue = useRef(new Animated.Value(1)).current;
	const animationRef = useRef<Animated.CompositeAnimation | null>(null);

	useEffect(() => {
		if (!isScanning) {
			if (animationRef.current) {
				animationRef.current.stop();
			}
			Animated.timing(animatedValue, {
				toValue: 1,
				duration: 300,
				useNativeDriver: true,
			}).start();
			return;
		}

		animationRef.current = Animated.loop(
			Animated.sequence([
				Animated.timing(animatedValue, {
					toValue: 0.2,
					duration: 1000,
					useNativeDriver: true,
				}),
				Animated.timing(animatedValue, {
					toValue: 1,
					duration: 1000,
					useNativeDriver: true,
				}),
			]),
		);

		animationRef.current.start();

		return () => {
			if (animationRef.current) {
				animationRef.current.stop();
			}
		};
	}, [isScanning]);

	return (
		<IconAndText
			className="mb-safe-offset-2 mt-2"
			icon={
				<Animated.View style={{ opacity: animatedValue }}>
					<Bluetooth size={56} color={gray2} />
				</Animated.View>
			}
			title={title}
			message={message}
		/>
	);
}
