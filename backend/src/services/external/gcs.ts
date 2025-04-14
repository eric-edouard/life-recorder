import { Storage } from "@google-cloud/storage";

export function initializeGoogleCloudStorage(): Storage {
	// Check if we have base64-encoded credentials in environment variable
	if (!process.env.GCS_SERVICE_ACCOUNT_BASE64) {
		throw new Error("No GCS_SERVICE_ACCOUNT_BASE64 environment variable found");
	}

	// Decode the base64 string to get the JSON content
	const credentialsJson = Buffer.from(
		process.env.GCS_SERVICE_ACCOUNT_BASE64,
		"base64",
	).toString();

	// Parse the JSON to get the credentials object
	const credentials = JSON.parse(credentialsJson);

	// Initialize Storage with the credentials
	return new Storage({
		credentials,
	});
}

// Singleton storage instance
export const gcs = initializeGoogleCloudStorage();

const bucketName = process.env.GCS_BUCKET_NAME;
if (!bucketName) {
	throw new Error("No GCS_BUCKET_NAME environment variable found");
}

export const gcsBucket = gcs.bucket(bucketName);
