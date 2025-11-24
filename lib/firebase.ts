import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

// Configuration
// Vite replaces these statically at build time. DO NOT use dynamic access (e.g. env[key]).
const firebaseConfig = {
  // @ts-ignore
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  // @ts-ignore
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  // @ts-ignore
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  // @ts-ignore
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  // @ts-ignore
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  // @ts-ignore
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let isInitialized = false;

try {
  // Check if critical config is present before initializing
  if (!firebaseConfig.apiKey) {
      console.warn("Firebase API Key missing. Check your .env file or Vercel Environment Variables.");
  } else {
      app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
      auth = getAuth(app);
      db = getFirestore(app);

      setPersistence(auth, browserLocalPersistence).catch((err) => {
        console.warn("Auth persistence warning:", err);
      });

      isInitialized = true;
  }
} catch (error) {
  console.error("Firebase initialization failed:", error);
  // fallback minimal
  // @ts-ignore
  app = {};
  // @ts-ignore
  auth = {};
  // @ts-ignore
  db = {};
}

export { app, auth, db, isInitialized };