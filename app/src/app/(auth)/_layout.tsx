import { Redirect, Stack } from "expo-router";

const isSignedIn = false;
export default function AuthRoutesLayout() {
	if (isSignedIn) {
		return <Redirect href={"/"} />;
	}

	return <Stack screenOptions={{ headerShown: false }} />;
}
