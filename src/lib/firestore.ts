import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  orderBy,
  serverTimestamp,
  DocumentData,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';

// Generic Types
export type FirestoreTimestamp = Timestamp;

// Collection Names
export const COLLECTIONS = {
  USERS: 'users',
  CUSTOMERS: 'customers',
  DEALS: 'deals',
  TASKS: 'tasks',
  NOTES: 'notes',
  CONTACTS: 'contacts',
};

// Create a new document
export async function createDocument<T>(collectionName: string, data: T) {
  const collectionRef = collection(db, collectionName);
  const docRef = await addDoc(collectionRef, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { id: docRef.id, ...data };
}

// Get all documents in a collection
export async function getDocuments<T>(collectionName: string): Promise<(T & { id: string })[]> {
  const collectionRef = collection(db, collectionName);
  const snapshot = await getDocs(collectionRef);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as T & { id: string }));
}

// Get a specific document by ID
export async function getDocumentById<T>(collectionName: string, documentId: string): Promise<(T & { id: string }) | null> {
  const docRef = doc(db, collectionName, documentId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as T & { id: string };
  } else {
    return null;
  }
}

// Update a document
export async function updateDocument<T>(collectionName: string, documentId: string, data: Partial<T>) {
  const docRef = doc(db, collectionName, documentId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
  return { id: documentId, ...data };
}

// Delete a document
export async function deleteDocument(collectionName: string, documentId: string) {
  const docRef = doc(db, collectionName, documentId);
  await deleteDoc(docRef);
  return { id: documentId };
}

// Query documents
export async function queryDocuments<T>(
  collectionName: string, 
  fieldPath: string, 
  operator: any, 
  value: any
): Promise<(T & { id: string })[]> {
  const collectionRef = collection(db, collectionName);
  const q = query(collectionRef, where(fieldPath, operator, value));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as T & { id: string }));
}

// Query documents with order
export async function queryDocumentsOrdered<T>(
  collectionName: string,
  orderByField: string,
  direction: 'asc' | 'desc' = 'asc'
): Promise<(T & { id: string })[]> {
  const collectionRef = collection(db, collectionName);
  const q = query(collectionRef, orderBy(orderByField, direction));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as T & { id: string }));
} 