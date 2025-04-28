/**
 * Filters an array of objects to keep only unique entries based on a specified key
 * @param array The array to filter
 * @param key The key to check for uniqueness
 * @returns A new array with unique entries based on the specified key
 */
export const filterUniqueById = <
	T extends Record<K, string | number>,
	K extends keyof T,
>(
	array: T[],
	key: K,
): T[] => {
	const seen = new Set<string | number>();
	return array.filter((item) => {
		const value = item[key];
		if (seen.has(value)) {
			return false;
		}
		seen.add(value);
		return true;
	});
};
