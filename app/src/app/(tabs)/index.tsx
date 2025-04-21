import React from "react";

import { HomeScreen } from "@/src/components/Sreens/HomeScreen";
import { scanAndAutoConnect } from "@/src/services/deviceService/deviceService";
import { useEffect } from "react";

export default function Home() {
	useEffect(() => {
		scanAndAutoConnect();
	}, []);
	return <HomeScreen />;
}
