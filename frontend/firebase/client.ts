import { getApps, initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import Constants from 'expo-constants';

// Read Firebase config from app.json -> expo.extra.firebase
const firebaseConfig = (Constants.expoConfig?.extra as any)?.firebase || {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
};

// Initialize Firebase only once
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

// Only initialize Firestore (we're using Firestore-based auth, not Firebase Auth)
export const db = getFirestore(app);
export default app;
