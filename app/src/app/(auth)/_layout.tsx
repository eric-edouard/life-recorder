import { authClient } from "@app/src/services/authClient";
import { Redirect, Stack } from "expo-router";

export default function AuthRoutesLayout() {
	const { data: session } = authClient.useSession();

	const isSignedIn = session?.user;

	if (isSignedIn) {
		return <Redirect href={"/"} />;
	}

	return <Stack screenOptions={{ headerShown: false }} />;
}
