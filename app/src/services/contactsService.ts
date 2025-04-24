import { observable } from "@legendapp/state";
import * as Contacts from "expo-contacts";

export const contactsService = (() => {
	const loading$ = observable(false);
	const contacts$ = observable<Contacts.Contact[]>([]);

	return {
		contacts$,
		fetchContacts: async () => {
			loading$.set(true);
			const contacts = await Contacts.getContactsAsync();
			contacts$.set(contacts.data);
			loading$.set(false);
		},
	};
})();
