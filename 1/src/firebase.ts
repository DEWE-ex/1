import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import type { FirebaseApp } from 'firebase/app';
import type { Database } from 'firebase/database';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const isFirebaseConfigured = !!firebaseConfig.apiKey && firebaseConfig.apiKey !== 'your_api_key';

let app: FirebaseApp | undefined;
let db: Database | undefined;

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig);
  db = getDatabase(app);
} else {
  console.warn("Firebase is not configured. Please update your .env file.");
}

export { db, isFirebaseConfigured };
