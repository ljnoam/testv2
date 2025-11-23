import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

// Configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Validation stricte pour éviter le crash "auth/invalid-api-key"
const validateConfig = () => {
  if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
    if (process.env.NODE_ENV === 'production') {
      // En prod, on ne veut pas crasher silencieusement, mais l'app ne peut pas fonctionner sans
      console.error("Firebase config is missing critical keys. Check Vercel Environment Variables.");
    }
    return false;
  }
  return true;
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

if (validateConfig()) {
  // Initialisation Singleton
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);

  // Configuration de la persistance
  setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.warn("Auth persistence error:", err);
  });
} else {
  // Fallback pour éviter que l'import ne fasse planter toute l'app si les envs sont manquantes
  // Cela permet d'afficher une UI d'erreur plus tard si nécessaire
  // @ts-ignore - On triche légèrement pour éviter le crash au build time si les variables ne sont pas encore là
  app = {} as FirebaseApp; 
  auth = {} as Auth;
  db = {} as Firestore;
}

export { app, auth, db };
export default app;
