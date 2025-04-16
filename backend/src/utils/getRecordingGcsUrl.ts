import { RECORDINGS_FOLDER } from "@/services/external/gcs";

export const getRecordingGcsUrl = (id: string) => {
	return `https://storage.googleapis.com/${process.env.GCS_BUCKET}/${RECORDINGS_FOLDER}/${id}`;
};
