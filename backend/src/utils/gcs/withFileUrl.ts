import { getSignedUrl } from "./getSignedUrl";

export const withFileUrl = async <T extends { fileId: string }>(
	obj: T,
): Promise<T & { fileUrl: string }> => {
	const fileUrl = await getSignedUrl(obj.fileId);
	return {
		...obj,
		fileUrl,
	};
};
