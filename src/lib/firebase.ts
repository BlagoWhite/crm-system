// Import the functions you need from the SDKs you need
import { initializeApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
  // measurementId is optional
  ...(process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID 
    ? { measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID } 
    : {})
};

// Debug logging - checking which environment variables are missing
console.log("Firebase config check:");
console.log("API Key exists:", !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
console.log("Auth Domain exists:", !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN);
console.log("Project ID exists:", !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
console.log("Storage Bucket exists:", !!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
console.log("Messaging Sender ID exists:", !!process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID);
console.log("App ID exists:", !!process.env.NEXT_PUBLIC_FIREBASE_APP_ID);

// Check if Firebase app is already initialized to prevent multiple instances
let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

// Check if Firebase config is valid by ensuring required fields have values
const isConfigValid = 
  !!firebaseConfig.apiKey && 
  !!firebaseConfig.authDomain && 
  !!firebaseConfig.projectId;

if (!isConfigValid) {
  console.warn("Firebase configuration is missing. Please set environment variables.");
  if (!firebaseConfig.apiKey) console.warn("Missing: NEXT_PUBLIC_FIREBASE_API_KEY");
  if (!firebaseConfig.authDomain) console.warn("Missing: NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN");
  if (!firebaseConfig.projectId) console.warn("Missing: NEXT_PUBLIC_FIREBASE_PROJECT_ID");
  if (!firebaseConfig.storageBucket) console.warn("Missing: NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET");
  if (!firebaseConfig.messagingSenderId) console.warn("Missing: NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID");
  if (!firebaseConfig.appId) console.warn("Missing: NEXT_PUBLIC_FIREBASE_APP_ID");
} else {
  try {
    // Initialize Firebase
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    console.log("Firebase initialized successfully!");
  } catch (error) {
    console.error("Firebase initialization error:", error);
    app = null;
    db = null;
    auth = null;
  }
}

export { app, db, auth };
export default app; 