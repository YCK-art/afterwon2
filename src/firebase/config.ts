// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAdc40yvKBTLkK7yEFP1yAfEqQXBFu9PjU",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "afterwon-1c5c8.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "afterwon-1c5c8",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "afterwon-1c5c8.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "498808317864",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:498808317864:web:082405d159798635085f9d",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-JEVQKH6LE7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const db = getFirestore(app);
const storage = getStorage(app);

export { app, analytics, auth, googleProvider, db, storage }; 