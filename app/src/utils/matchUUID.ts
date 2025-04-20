export const matchUuid = (uuid: string) => (target: { uuid: string }) =>
	target.uuid.toLowerCase() === uuid.toLowerCase();
