import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

// Supporte Vite (import.meta.env), Next.js/CRA (process.env)
const getEnv = (key: string): string | undefined => {
  try {
    // 1. Essayer Vite (si disponible)
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[`VITE_${key}`]) {
      // @ts-ignore
      return import.meta.env[`VITE_${key}`];
    }
    
    // 2. Essayer process.env (Standard Node/CRA/Next)
    if (typeof process !== 'undefined' && process.env) {
      return process.env[`NEXT_PUBLIC_${key}`] || 
             process.env[`REACT_APP_${key}`] || 
             process.env[key];
    }
  } catch (e) {
    console.warn("Error reading env vars:", e);
  }
  return undefined;
};

// Configuration
const firebaseConfig = {
  apiKey: getEnv('FIREBASE_API_KEY'),
  authDomain: getEnv('FIREBASE_AUTH_DOMAIN'),
  projectId: getEnv('FIREBASE_PROJECT_ID'),
  messagingSenderId: getEnv('FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnv('FIREBASE_APP_ID'),
  measurementId: getEnv('FIREBASE_MEASUREMENT_ID')
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let isInitialized = false;

try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);

  setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.warn("Auth persistence warning:", err);
  });

  isInitialized = true;
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
