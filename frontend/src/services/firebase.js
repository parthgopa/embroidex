import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

// Web app's Firebase configuration loaded from environment variables (.env)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "ai4cs-482314.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "ai4cs-482314",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "ai4cs-482314.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "475491008850",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:475491008850:web:e25cd96c38582647bafa8b",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-GENM5PL9Z2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);

export default app;
