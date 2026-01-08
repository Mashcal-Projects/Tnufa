
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCv8LLSVDTfztYIt7X1NJGNd3EqxdpMasA",
  authDomain: "tnufa-a6919.firebaseapp.com",
  projectId: "tnufa-a6919",
  storageBucket: "tnufa-a6919.firebasestorage.app",
  messagingSenderId: "646837456738",
  appId: "1:646837456738:web:675bbdf0890862ae18a63b"
};

// Singleton pattern for Firebase initialization to prevent crashes on hot-reload
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
