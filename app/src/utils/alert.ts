import { Alert, type AlertButton, type AlertOptions } from "react-native";

export type AlertParams = {
	title: string;
	message?: string;
	buttons?: AlertButton[];
	options?: AlertOptions;
};

export const alert = ({ title, message, buttons, options }: AlertParams) => {
	const _title = typeof title !== "string" ? JSON.stringify(title) : title;
	const _message =
		typeof message !== "string" ? JSON.stringify(message) : message;
	return Alert.alert(_title, _message, buttons, options);
};
