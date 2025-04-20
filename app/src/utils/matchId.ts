export const matchId = (id: string) => (target: { id: string }) =>
	target.id.toLowerCase() === id.toLowerCase();
