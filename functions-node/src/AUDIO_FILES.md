# Audio Files Documentation

## File Storage Structure

Audio recordings are stored in Firebase Storage under the `audio_recordings/` directory.

## File Naming Convention

Files are named using the following pattern:
```
{ISO_DATE}__${DURATION_MS}[__VOICE_DETECTED].wav
```

- `ISO_DATE`: ISO 8601 date/time string converted to file-safe format
- `DURATION_MS`: Duration of the audio in milliseconds
- `__VOICE_DETECTED` suffix: Added if voice activity was detected in the recording

Example: `2023-04-12T15-30-45-123Z__5000__VOICE_DETECTED.wav`

## File Format

- Format: WAV (Waveform Audio File Format)
- Sample Rate: 16000 Hz
- Channels: 1 (Mono)
- Bit Depth: 16-bit PCM

## Metadata

Each audio file includes the following metadata:

| Field | Type | Description |
|-------|------|-------------|
| `has-voice` | String | `"true"` or `"false"` indicating if voice was detected |
| `duration` | String | Duration of the audio in milliseconds |
| `segments` | String (JSON) | JSON array of voice segments with start/end times in seconds |

### Segments Format

The `segments` field contains a JSON string representing an array of objects with the following structure:

```json
[
  { "start": 1.25, "end": 2.75 },
  { "start": 3.5, "end": 5.0 }
]
```

- `start`: Starting time of the voice segment in seconds
- `end`: Ending time of the voice segment in seconds

If no voice was detected, the segments field will contain an empty array: `[]`

## Processing Pipeline

1. Audio is captured as Opus packets from client devices
2. Function receives base64-encoded Opus packets
3. Packets are decoded to PCM audio
4. PCM audio is saved as a WAV file
5. Voice Activity Detection (VAD) is run on the audio
6. File is named based on timestamp, duration, and voice detection
7. File is uploaded to Firebase Storage with metadata

## Accessing Files

Audio files can be accessed through Firebase Storage APIs using the file path:
```
audio_recordings/{filename}
```
