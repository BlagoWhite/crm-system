import { FirestoreTimestamp } from "@/lib/firestore";

// Base model with common fields
export interface BaseModel {
  id?: string;
  createdAt?: FirestoreTimestamp;
  updatedAt?: FirestoreTimestamp;
}

// User model
export type UserRole = 'USER' | 'ADMIN';

export interface User extends BaseModel {
  name: string;
  email: string;
  password?: string; // Only stored when using email/password auth
  role: UserRole;
}

// Customer model
export type CustomerStatus = 'LEAD' | 'PROSPECT' | 'ACTIVE' | 'INACTIVE';

export interface Customer extends BaseModel {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  status: CustomerStatus;
  userId: string; // Reference to User who owns this customer
}

// Deal model
export type DealStatus = 'OPEN' | 'WON' | 'LOST' | 'PENDING';

export interface Deal extends BaseModel {
  title: string;
  value: number;
  status: DealStatus;
  closingDate?: FirestoreTimestamp;
  customerId: string; // Reference to Customer
  customerName?: string; // For display purposes
  userId: string; // Reference to User who owns this deal
}

// Task model
export interface Task extends BaseModel {
  title: string;
  description?: string;
  dueDate?: FirestoreTimestamp;
  completed: boolean;
  customerId?: string; // Optional reference to Customer
  dealId?: string; // Optional reference to Deal
  userId: string; // Reference to User who owns this task
}

// Note model
export interface Note extends BaseModel {
  content: string;
  customerId?: string; // Optional reference to Customer
  dealId?: string; // Optional reference to Deal
  userId: string; // Reference to User who created this note
}

// Contact model
export interface Contact extends BaseModel {
  name: string;
  email?: string;
  phone?: string;
  jobTitle?: string;
  customerId: string; // Reference to Customer
} 