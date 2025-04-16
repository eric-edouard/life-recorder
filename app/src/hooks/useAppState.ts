import { useEffect, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";

export const useAppState = () => {
	const [appState, setAppState] = useState<AppStateStatus>(
		AppState.currentState,
	);

	useEffect(() => {
		const subscription = AppState.addEventListener("change", (state) => {
			setAppState(state);
		});

		return () => subscription.remove();
	}, []);

	return appState;
};
