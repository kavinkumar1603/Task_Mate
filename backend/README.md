# TaskFlow Backend

This is the backend service for the TaskFlow application using Firebase Functions.

## Setup

1. Install dependencies:
```bash
cd backend/functions
npm install
```

2. Build the TypeScript code:
```bash
npm run build
```

## Running Locally

Start the Firebase emulator:
```bash
cd backend
npm run serve
```

This will start the Firebase Functions emulator on http://localhost:5001

## Available Endpoints

- **Health Check**: `GET /health`
- **Get Tasks**: Cloud Function `getTasks`
- **Create Task**: Cloud Function `createTask`

## Deployment

To deploy to Firebase:
```bash
cd backend
npm run deploy
```

## Development

Watch mode for automatic rebuilds:
```bash
cd backend/functions
npm run build:watch
```
