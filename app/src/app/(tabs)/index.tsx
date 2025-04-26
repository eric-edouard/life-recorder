import React from "react";

import { HomeScreen } from "@app/src/components/Sreens/HomeScreen";
import { autoScanAndConnect } from "@app/src/services/deviceService/utils/autoScanAndConnect";
import { useEffect } from "react";

export default function Home() {
	useEffect(() => {
		autoScanAndConnect();
	}, []);
	return <HomeScreen />;
}
