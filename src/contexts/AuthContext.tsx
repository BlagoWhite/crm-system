'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChange, getCurrentUser } from '@/lib/auth';
import { User } from '@/types/firebase';
import { app } from '@/lib/firebase';

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  user: User | null;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType>({
  firebaseUser: null,
  user: null,
  loading: true,
  error: null,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Skip Firebase authentication if app is not properly initialized
    if (!app) {
      setLoading(false);
      setError("Firebase is not properly configured. Please check your environment variables.");
      return () => {};
    }

    try {
      const unsubscribe = onAuthStateChange(async (firebaseUser) => {
        setFirebaseUser(firebaseUser);
        
        if (firebaseUser) {
          try {
            // Get the user data from Firestore
            const userData = await getCurrentUser();
            setUser(userData);
          } catch (err) {
            console.error("Error getting user data:", err);
            setError("Error loading user data");
          }
        } else {
          setUser(null);
        }
        
        setLoading(false);
      });

      // Cleanup subscription on unmount
      return () => unsubscribe();
    } catch (err) {
      console.error("Error setting up auth listener:", err);
      setLoading(false);
      setError("Error initializing authentication");
      return () => {};
    }
  }, []);

  return (
    <AuthContext.Provider value={{ firebaseUser, user, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
} 