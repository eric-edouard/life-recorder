import { Button } from "@app/src/components/ui/Buttons/Button";
import { Text } from "@app/src/components/ui/Text";
import { authClient } from "@app/src/services/authClient";
import { use$, useObservable } from "@legendapp/state/react";
import * as Burnt from "burnt";
import { Link, useRouter } from "expo-router";
import React from "react";
import { TextInput, View } from "react-native";

export default function Page() {
	const router = useRouter();

	const emailAddress$ = useObservable("eamilhat@gmail.com");
	const name$ = useObservable("eamilhat");
	const password$ = useObservable("b7ysdbnqk.456LK");
	const code$ = useObservable("");
	const pendingVerification$ = useObservable(false);
	const pendingVerification = use$(pendingVerification$);

	// Handle submission of sign-up form
	const onSignUpPress = async () => {
		const { error } = await authClient.signUp.email({
			email: emailAddress$.peek(),
			password: password$.peek(),
			name: name$.peek(),
		});
		if (error) {
			console.log(error);
			Burnt.toast({
				title: "Error",
				message: error.message,
				preset: "error",
			});
		} else {
			router.replace("/");
		}
	};

	// Handle submission of verification form
	const onVerifyPress = async () => {};

	if (pendingVerification) {
		return (
			<View className="h-full p-5 pt-safe-offset-5">
				<View className="w-full flex flex-1 pt-10 items-center h-full">
					<Text className="text-3xl font-bold mb-2 text-center">
						Verify your email
					</Text>
					<Text className="text-secondary-label mb-8 text-center">
						We've sent a verification code to your email address.
					</Text>
					<View className="w-full gap-4">
						<TextInput
							autoFocus
							value={code$.get()}
							placeholder="Enter your verification code"
							onChangeText={code$.set}
							className="border border-gray-200 rounded-xl px-4 py-3 mb-2 text-label h-14 bg-secondary-system-grouped-background"
							keyboardType="number-pad"
						/>
						<Button title="Verify" onPress={onVerifyPress} />
					</View>
				</View>
			</View>
		);
	}

	return (
		<View className="h-full p-5 pt-safe-offset-5">
			<View className="w-full flex flex-1 pt-10 items-center h-full">
				<Text className="text-3xl font-bold mb-2 text-center">Sign up</Text>
				<Text className="text-secondary-label mb-8 text-center">
					Create an account to get started.
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
						className="rounded-xl px-4 py-3 mb-4 text-label h-14 bg-secondary-system-grouped-background"
					/>
					<Button title="Continue" onPress={onSignUpPress} />
				</View>
				<View className="flex-row justify-center items-center mt-6 gap-1">
					<Text className="text-secondary-label">Already have an account?</Text>
					<Link href="/sign-in">
						<Text className="text-blue font-semibold">Sign in</Text>
					</Link>
				</View>
			</View>
		</View>
	);
}
