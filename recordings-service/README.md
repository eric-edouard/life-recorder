# Recordings Service

This service is responsible for converting audio data to WAV format and uploading it to Google Cloud Storage.

## API Endpoints

### POST /save-recording

Saves a recording by converting it to WAV format and uploading it to Google Cloud Storage.

#### Request Body

```json
{
  "audioData": [0.1, 0.2, 0.3, ...], // Array of float values representing audio samples
  "startTime": 1234567890 // Unix timestamp in milliseconds
}
```

#### Response

```json
{
  "success": true,
  "url": "https://storage.googleapis.com/bucket-name/audio_recordings/filename.wav"
}
```

## Environment Variables

- `GCS_SERVICE_ACCOUNT_BASE64`: Base64-encoded Google Cloud Service Account credentials
- `GCS_BUCKET_NAME`: Name of the Google Cloud Storage bucket to upload recordings to
- `PORT`: Port to listen on (default: 3000)

## Railway Deployment

This service is designed to be deployed on Railway and uses Railway's private networking to communicate with other services. The service listens on IPv6 to support Railway's private networking. 