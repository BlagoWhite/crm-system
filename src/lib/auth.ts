import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { COLLECTIONS } from './firestore';
import { User, UserRole } from '@/types/firebase';

// Create a new user with email and password
export async function registerUser(
  email: string, 
  password: string, 
  name: string, 
  role: UserRole = 'USER'
): Promise<User> {
  if (!auth || !db) {
    throw new Error('Firebase is not initialized');
  }

  // Create the user in Firebase Auth
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const firebaseUser = userCredential.user;
  
  // Create user document in Firestore
  const user: User = {
    name,
    email,
    role,
  };
  
  await setDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid), user);
  
  return {
    ...user,
    id: firebaseUser.uid,
  };
}

// Sign in with email and password
export async function signIn(email: string, password: string) {
  if (!auth) {
    throw new Error('Firebase is not initialized');
  }
  return signInWithEmailAndPassword(auth, email, password);
}

// Sign out
export async function signOut() {
  if (!auth) {
    throw new Error('Firebase is not initialized');
  }
  return firebaseSignOut(auth);
}

// Get current user with Firestore data
export async function getCurrentUser(): Promise<User | null> {
  if (!auth || !db) {
    throw new Error('Firebase is not initialized');
  }
  
  const firebaseUser = auth.currentUser;
  
  if (!firebaseUser) {
    return null;
  }
  
  const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid));
  
  if (!userDoc.exists()) {
    return null;
  }
  
  return {
    id: firebaseUser.uid,
    ...userDoc.data() as User
  };
}

// Listen to auth state changes
export function onAuthStateChange(callback: (user: FirebaseUser | null) => void) {
  if (!auth) {
    throw new Error('Firebase is not initialized');
  }
  return onAuthStateChanged(auth, callback);
} 