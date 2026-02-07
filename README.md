# TaskFlow - Task Management Application

A full-stack task management application with React Native (Expo) frontend and Firebase backend.

## Project Structure

```
Task_flow/
├── frontend/          # React Native/Expo mobile app
│   ├── app/          # App screens and navigation
│   ├── assets/       # Images and static assets
│   ├── constants/    # App constants and theme
│   ├── contexts/     # React contexts
│   ├── firebase/     # Firebase client configuration
│   ├── services/     # API services
│   ├── types/        # TypeScript type definitions
│   └── utils/        # Utility functions
│
└── backend/          # Firebase Functions backend
    ├── functions/    # Cloud Functions code
    │   └── src/     # TypeScript source files
    └── firebase.json # Firebase configuration
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI
- Firebase CLI (`npm install -g firebase-tools`)

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the Expo development server:
```bash
npm start
```

4. Run on your device:
   - Scan the QR code with Expo Go app (iOS/Android)
   - Press `a` for Android emulator
   - Press `i` for iOS simulator

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
cd functions
npm install
cd ..
```

3. Start Firebase emulators (for local development):
```bash
npm run serve
```

The backend will be available at http://localhost:5001

## Development

### Running Both Frontend and Backend

**Terminal 1 - Backend:**
```bash
cd backend
npm run serve
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

## Deployment

### Backend Deployment

```bash
cd backend
npm run deploy
```

### Frontend Deployment

Follow Expo's deployment guide for publishing to app stores or using EAS Build.

## Features

- User authentication
- Task creation and management
- Admin dashboard
- Push notifications
- Real-time updates with Firestore

## Tech Stack

### Frontend
- React Native
- Expo
- TypeScript
- Expo Router
- Firebase Client SDK

### Backend
- Firebase Functions
- Firebase Firestore
- TypeScript
- Node.js

## License

MIT
