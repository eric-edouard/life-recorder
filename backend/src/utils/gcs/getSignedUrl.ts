import {
	RECORDINGS_FOLDER,
	gcsBucket,
} from "@backend/src/services/external/gcs";

export const getSignedUrl = async (filename: string) => {
	const file = gcsBucket.file(`${RECORDINGS_FOLDER}/${filename}.mp3`);
	const [url] = await file.getSignedUrl({
		version: "v4",
		action: "read",
		expires: Date.now() + 60 * 60 * 1000, // 1 hour
	});
	return url;
};
