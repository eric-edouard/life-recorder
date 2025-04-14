# Backend API

A Node.js with TypeScript and Express backend server that handles real-time audio processing and voice activity detection.

## Setup

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## API Endpoints

- `GET /api/hello` - Returns a hello world message
- `GET /api/health` - Health check endpoint

## WebSocket Events

- `audioData` - Receives audio data from the client

## Environment Variables

- `PORT`: Port to listen on (default: 3000)
- `RECORDINGS_SERVICE_URL`: URL of the recordings service (default: http://recordings-service.railway.internal:3000)

## Project Structure

```
backend/
├── src/             # Source files
│   ├── index.ts     # Entry point
│   ├── routes/      # API routes
│   ├── services/    # Business logic
│   └── types/       # TypeScript type definitions
├── dist/            # Compiled JavaScript (generated)
├── package.json     # Dependencies and scripts
└── tsconfig.json    # TypeScript configuration
```

## Communication with Recordings Service

The backend uses the RealTimeVAD library to detect speech in audio data. When speech is detected, the audio data is sent to the recordings service, which converts it to WAV format and uploads it to Google Cloud Storage.

The communication between the backend and the recordings service happens over Railway's private networking, using the internal DNS name of the recordings service. 