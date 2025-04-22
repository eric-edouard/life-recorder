import React from "react";

import { HomeScreen } from "@/src/components/Sreens/HomeScreen";
import { autoScanAndConnect } from "@/src/services/deviceService/utils/autoScanAndConnect";
import { useEffect } from "react";

export default function Home() {
	useEffect(() => {
		autoScanAndConnect();
	}, []);
	return <HomeScreen />;
}
