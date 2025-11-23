import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

// Helper sécurisé pour récupérer les variables d'environnement
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

// Validation stricte
const validateConfig = () => {
  return !!firebaseConfig.apiKey && !!firebaseConfig.authDomain && !!firebaseConfig.projectId;
};

if (validateConfig()) {
  try {
    // Initialisation Singleton
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    
    // Configuration de la persistance
    setPersistence(auth, browserLocalPersistence).catch((err) => {
      console.warn("Auth persistence warning:", err);
    });
    
    isInitialized = true;
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
} else {
  console.warn("Firebase configuration missing. App running in offline/demo mode UI.");
  // Fallback objets vides pour éviter les crashs immédiats d'import
  // @ts-ignore
  app = {}; 
  // @ts-ignore
  auth = {}; 
  // @ts-ignore
  db = {};
}

export { app, auth, db, isInitialized };
export default app;