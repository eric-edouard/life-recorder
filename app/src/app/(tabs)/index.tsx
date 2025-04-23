import React from "react";

import { HomeScreen } from "@app/components/Sreens/HomeScreen";
import { autoScanAndConnect } from "@app/services/deviceService/utils/autoScanAndConnect";
import { useEffect } from "react";

export default function Home() {
	useEffect(() => {
		autoScanAndConnect();
	}, []);
	return <HomeScreen />;
}
