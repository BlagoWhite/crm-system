import { Timestamp } from 'firebase/firestore';
import { createDocument, updateDocument, deleteDocument, getDocuments } from './firestore';
import { BaseModel } from '@/types/firebase';

/**
 * Converts JS Dates to Firestore Timestamps for any properties that need it
 * @param data Object with potential Date fields
 * @returns Same object with Dates converted to Timestamps
 */
export function convertDatesToTimestamps<T>(data: any): T {
  const result = { ...data };
  
  // Look for Date objects in the data and convert them to Firestore Timestamps
  Object.keys(result).forEach(key => {
    if (result[key] instanceof Date) {
      result[key] = Timestamp.fromDate(result[key]);
    }
  });
  
  return result as T;
}

/**
 * Converts Firestore Timestamps to JS Dates for easier UI handling
 * @param data Object with potential Timestamp fields
 * @returns Same object with Timestamps converted to Dates
 */
export function convertTimestampsToDates<T>(data: any): T {
  const result = { ...data };
  
  // Look for Firestore Timestamps in the data and convert them to JS Dates
  Object.keys(result).forEach(key => {
    if (result[key] instanceof Timestamp) {
      result[key] = result[key].toDate();
    }
  });
  
  return result as T;
}

/**
 * Creates a document with dates properly converted to timestamps
 * @param collectionName Collection to add to
 * @param data Data to save
 * @returns Created document with ID
 */
export async function createDocumentWithDateConversion<T extends object>(
  collectionName: string,
  data: Omit<T, 'id'>
): Promise<T & { id: string }> {
  // Convert any dates to timestamps
  const convertedData = convertDatesToTimestamps<Omit<T, 'id'>>(data);
  
  // Create document in Firestore
  const result = await createDocument<Omit<T, 'id'>>(collectionName, convertedData);
  
  // Return as the expected type
  return result as unknown as T & { id: string };
}

/**
 * Updates a document with dates properly converted to timestamps
 * @param collectionName Collection name
 * @param documentId Document ID
 * @param data Data to update
 * @returns Updated document data
 */
export async function updateDocumentWithDateConversion<T>(
  collectionName: string,
  documentId: string,
  data: Partial<T>
): Promise<Partial<T> & { id: string }> {
  // Convert any dates to timestamps
  const convertedData = convertDatesToTimestamps<Partial<T>>(data);
  
  // Update document in Firestore
  return await updateDocument<Partial<T>>(collectionName, documentId, convertedData);
}

/**
 * Gets documents from a collection and converts timestamps to dates
 * @param collectionName Collection to fetch from
 * @returns Array of documents with timestamps converted to dates
 */
export async function getDocumentsWithDateConversion<T>(
  collectionName: string
): Promise<(T & { id: string })[]> {
  // Get documents from Firestore
  const documents = await getDocuments<T>(collectionName);
  
  // Convert timestamps to dates in each document
  return documents.map(doc => convertTimestampsToDates<T & { id: string }>(doc));
}

/**
 * Gets user-specific documents
 * @param collectionName Collection to query
 * @param userId User ID to filter by
 * @returns User's documents with timestamps converted to dates
 */
export async function getUserDocuments<T extends BaseModel & { userId: string }>(
  collectionName: string,
  userId: string
): Promise<(T & { id: string })[]> {
  if (!userId) {
    return [];
  }
  
  // Get all documents
  const allDocs = await getDocumentsWithDateConversion<T>(collectionName);
  
  // Filter to user's documents
  return allDocs.filter(doc => doc.userId === userId);
} 