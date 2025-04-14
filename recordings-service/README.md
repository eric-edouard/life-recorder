# Backend API

A minimal Node.js with TypeScript and Express backend server.

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

## Project Structure

```
backend/
├── src/             # Source files
│   ├── index.ts     # Entry point
│   └── routes/      # API routes
├── dist/            # Compiled JavaScript (generated)
├── package.json     # Dependencies and scripts
└── tsconfig.json    # TypeScript configuration
``` 