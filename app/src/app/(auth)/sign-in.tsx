import { Button } from "@app/src/components/ui/Buttons/Button";
import { Text } from "@app/src/components/ui/Text";
import { authClient } from "@app/src/services/authClient";
import { useObservable } from "@legendapp/state/react";
import * as Burnt from "burnt";
import { Link, useRouter } from "expo-router";
import React from "react";
import { TextInput, View } from "react-native";

export default function Page() {
	const router = useRouter();
	const emailAddress$ = useObservable("eamilhat@gmail.com");
	const password$ = useObservable("b7ysdbnqk.456LK");

	// Handle the submission of the sign-in form
	const onSignInPress = async () => {
		const { error } = await authClient.signIn.email({
			email: emailAddress$.peek(),
			password: password$.peek(),
		});
		if (error) {
			Burnt.toast({
				title: "Error",
				message: error.message,
				preset: "error",
			});
		} else {
			router.replace("/");
		}
	};

	return (
		<View className="h-full p-5 pt-safe-offset-5">
			<View className="w-full flex flex-1 pt-10 items-center h-full">
				<Text className="text-3xl font-bold mb-2 text-center">Sign in</Text>
				<Text className="text-secondary-label mb-8 text-center">
					Welcome back! Please enter your credentials.
				</Text>
				<View className="w-full gap-4">
					<TextInput
						defaultValue={emailAddress$.peek()}
						autoFocus
						textContentType="emailAddress"
						autoCapitalize="none"
						placeholder="Enter email"
						onChangeText={emailAddress$.set}
						className=" rounded-xl px-4 py-3 mb-2 text-label h-14 bg-secondary-system-grouped-background"
						keyboardType="email-address"
					/>
					<TextInput
						defaultValue={password$.peek()}
						placeholder="Enter password"
						secureTextEntry={true}
						textContentType="password"
						onChangeText={password$.set}
						className=" rounded-xl px-4 py-3 mb-4 text-label h-14 bg-secondary-system-grouped-background"
					/>
					<Button title="Continue" onPress={onSignInPress} />
				</View>
				<View className="flex-row justify-center items-center mt-6 gap-1">
					<Text className="text-secondary-label">Don't have an account?</Text>
					<Link href="/sign-up">
						<Text className=" text-blue font-semibold">Sign up</Text>
					</Link>
				</View>
			</View>
		</View>
	);
}
