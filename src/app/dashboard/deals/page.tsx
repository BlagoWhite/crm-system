'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { createDocument, updateDocument, deleteDocument, getDocuments } from '@/lib/firestore';
import { COLLECTIONS } from '@/lib/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { Deal as DealType } from '@/types/firebase';
import { Timestamp } from 'firebase/firestore';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export default function DealsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [deals, setDeals] = useState<DealType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Local state for form with Date objects (easier to work with in UI)
  interface FormDeal {
    title: string;
    value: number;
    status: 'OPEN' | 'PENDING' | 'WON' | 'LOST';
    customerId: string;
    customerName?: string; // For display purposes only
    closingDate: Date | null;
    userId: string;
  }

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDeal, setNewDeal] = useState<FormDeal>({
    title: '',
    value: 0,
    status: 'OPEN',
    customerId: '',
    customerName: '',
    closingDate: null,
    userId: user?.id || '',
  });
  
  // Fetch deals from Firestore
  useEffect(() => {
    async function fetchDeals() {
      if (!user?.id) return;
      
      try {
        const fetchedDeals = await getDocuments<DealType>(COLLECTIONS.DEALS);
        // Filter to only show this user's deals
        const userDeals = fetchedDeals.filter(deal => deal.userId === user.id);
        
        // Fetch customer data for deals that need it
        const dealsWithCustomerInfo = [...userDeals];
        
        try {
          // Get all customers
          const customers = await getDocuments<{ id: string; name: string }>(COLLECTIONS.CUSTOMERS);
          
          // Add customer names to deals
          for (const deal of dealsWithCustomerInfo) {
            if (!deal.customerId) continue;
            const customer = customers.find(c => c.id === deal.customerId);
            if (customer) {
              deal.customerName = customer.name;
            }
          }
        } catch (error) {
          console.error("Error fetching customer data:", error);
        }
        
        setDeals(dealsWithCustomerInfo);
      } catch (error) {
        console.error('Error fetching deals:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDeals();
  }, [user?.id]);
  
  // Group deals by status
  const openDeals = deals.filter((deal) => deal.status === 'OPEN');
  const pendingDeals = deals.filter((deal) => deal.status === 'PENDING');
  const wonDeals = deals.filter((deal) => deal.status === 'WON');
  const lostDeals = deals.filter((deal) => deal.status === 'LOST');

  // Add new deal
  const addDeal = async () => {
    if (newDeal.title.trim() === '' || !newDeal.customerName || !user?.id) return;
    
    try {
      // Generate a temporary customer ID if none provided
      const tempCustomerId = newDeal.customerId || `temp-customer-${Date.now()}`;
      
      // Convert form data to Firestore data
      const dealData: Omit<DealType, 'id'> = {
        title: newDeal.title,
        value: newDeal.value,
        status: newDeal.status,
        customerId: tempCustomerId,
        userId: user.id,
        customerName: newDeal.customerName,
        // Convert Date to Firestore Timestamp if present
        ...(newDeal.closingDate && { closingDate: Timestamp.fromDate(newDeal.closingDate) })
      };
      
      // Save to Firestore
      const savedDeal = await createDocument<Omit<DealType, 'id'>>(COLLECTIONS.DEALS, dealData);
      
      // Create a merged object with customer name for display purposes
      const dealWithCustomerName = {
        ...savedDeal,
        customerName: newDeal.customerName
      };
      
      // Update local state
      setDeals([...deals, dealWithCustomerName as DealType]);
      
      // Reset form
      setNewDeal({
        title: '',
        value: 0,
        status: 'OPEN',
        customerId: '',
        customerName: '',
        closingDate: null,
        userId: user.id,
      });
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error adding deal:', error);
    }
  };

  // Delete deal
  const deleteDeal = async (id: string) => {
    try {
      // Delete from Firestore
      await deleteDocument(COLLECTIONS.DEALS, id);
      
      // Update local state
      setDeals(deals.filter((deal) => deal.id !== id));
    } catch (error) {
      console.error('Error deleting deal:', error);
    }
  };

  // Move deal to a different status
  const moveDeal = async (id: string, newStatus: 'OPEN' | 'PENDING' | 'WON' | 'LOST') => {
    try {
      // Update in Firestore
      await updateDocument(COLLECTIONS.DEALS, id, { status: newStatus });
      
      // Update local state
      setDeals(
        deals.map((deal) =>
          deal.id === id ? { ...deal, status: newStatus } : deal
        )
      );
    } catch (error) {
      console.error('Error updating deal status:', error);
    }
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  // Format date - converts Firestore timestamp to readable date
  const formatDate = (timestamp?: any) => {
    if (!timestamp) return 'No date set';
    
    // If it's a Firestore Timestamp, convert to JS Date
    const date = timestamp instanceof Timestamp ? 
      timestamp.toDate() : 
      (timestamp instanceof Date ? timestamp : null);
    
    if (!date) return 'Invalid date';
    return format(date, 'MMM d, yyyy');
  };

  // Get color classes based on deal status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-blue-500';
      case 'PENDING':
        return 'bg-yellow-500';
      case 'WON':
        return 'bg-green-500';
      case 'LOST':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Deals</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md"
        >
          Add New Deal
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-100 p-4 rounded-lg">
          <div className="flex items-center mb-4">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
            <h2 className="text-lg font-semibold">Open</h2>
            <span className="ml-auto bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
              {openDeals.length}
            </span>
          </div>
          
          <div className="space-y-3">
            {openDeals.length === 0 ? (
              <div className="text-center p-4 bg-white rounded-lg border border-gray-200 text-gray-500">
                No open deals
              </div>
            ) : (
              openDeals.map((deal) => (
                <DealCard
                  key={deal.id}
                  deal={deal}
                  onMove={moveDeal}
                  onDelete={deleteDeal}
                  formatCurrency={formatCurrency}
                  formatDate={formatDate}
                />
              ))
            )}
          </div>
        </div>

        <div className="bg-gray-100 p-4 rounded-lg">
          <div className="flex items-center mb-4">
            <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
            <h2 className="text-lg font-semibold">Pending</h2>
            <span className="ml-auto bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
              {pendingDeals.length}
            </span>
          </div>
          
          <div className="space-y-3">
            {pendingDeals.length === 0 ? (
              <div className="text-center p-4 bg-white rounded-lg border border-gray-200 text-gray-500">
                No pending deals
              </div>
            ) : (
              pendingDeals.map((deal) => (
                <DealCard
                  key={deal.id}
                  deal={deal}
                  onMove={moveDeal}
                  onDelete={deleteDeal}
                  formatCurrency={formatCurrency}
                  formatDate={formatDate}
                />
              ))
            )}
          </div>
        </div>

        <div className="bg-gray-100 p-4 rounded-lg">
          <div className="flex items-center mb-4">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <h2 className="text-lg font-semibold">Won</h2>
            <span className="ml-auto bg-green-500 text-white text-xs px-2 py-1 rounded-full">
              {wonDeals.length}
            </span>
          </div>
          
          <div className="space-y-3">
            {wonDeals.length === 0 ? (
              <div className="text-center p-4 bg-white rounded-lg border border-gray-200 text-gray-500">
                No won deals
              </div>
            ) : (
              wonDeals.map((deal) => (
                <DealCard
                  key={deal.id}
                  deal={deal}
                  onMove={moveDeal}
                  onDelete={deleteDeal}
                  formatCurrency={formatCurrency}
                  formatDate={formatDate}
                />
              ))
            )}
          </div>
        </div>

        <div className="bg-gray-100 p-4 rounded-lg">
          <div className="flex items-center mb-4">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
            <h2 className="text-lg font-semibold">Lost</h2>
            <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {lostDeals.length}
            </span>
          </div>
          
          <div className="space-y-3">
            {lostDeals.length === 0 ? (
              <div className="text-center p-4 bg-white rounded-lg border border-gray-200 text-gray-500">
                No lost deals
              </div>
            ) : (
              lostDeals.map((deal) => (
                <DealCard
                  key={deal.id}
                  deal={deal}
                  onMove={moveDeal}
                  onDelete={deleteDeal}
                  formatCurrency={formatCurrency}
                  formatDate={formatDate}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add Deal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add New Deal</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={newDeal.title}
                  onChange={(e) =>
                    setNewDeal({ ...newDeal, title: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Deal title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer
                </label>
                <input
                  type="text"
                  value={newDeal.customerName}
                  onChange={(e) =>
                    setNewDeal({ ...newDeal, customerName: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Customer name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Value
                </label>
                <input
                  type="number"
                  value={newDeal.value}
                  onChange={(e) =>
                    setNewDeal({ ...newDeal, value: Number(e.target.value) })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Deal value"
                  min="0"
                  step="100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expected Closing Date
                </label>
                <DatePicker
                  selected={newDeal.closingDate}
                  onChange={(date) => setNewDeal({ ...newDeal, closingDate: date })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholderText="Select closing date"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={newDeal.status}
                  onChange={(e) =>
                    setNewDeal({
                      ...newDeal,
                      status: e.target.value as 'OPEN' | 'PENDING' | 'WON' | 'LOST',
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="OPEN">Open</option>
                  <option value="PENDING">Pending</option>
                  <option value="WON">Won</option>
                  <option value="LOST">Lost</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={addDeal}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                Add Deal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DealCard({
  deal,
  onMove,
  onDelete,
  formatCurrency,
  formatDate,
}: {
  deal: DealType & { customerName?: string };
  onMove: (id: string, newStatus: 'OPEN' | 'PENDING' | 'WON' | 'LOST') => void;
  onDelete: (id: string) => void;
  formatCurrency: (value: number) => string;
  formatDate: (date: any) => string;
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Check if we have necessary properties and use defaults if not
  const id = deal.id || '';
  const customerId = deal.customerId || '';
  const customerDisplay = deal.customerName || `Customer ${customerId.substring(0, Math.min(5, customerId.length))}...`;

  return (
    <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
      <div className="flex justify-between items-start">
        <h3 className="font-medium">{deal.title}</h3>
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
              <div className="py-1">
                {deal.status !== 'OPEN' && (
                  <button
                    onClick={() => {
                      onMove(id, 'OPEN');
                      setIsDropdownOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Move to Open
                  </button>
                )}
                {deal.status !== 'PENDING' && (
                  <button
                    onClick={() => {
                      onMove(id, 'PENDING');
                      setIsDropdownOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Move to Pending
                  </button>
                )}
                {deal.status !== 'WON' && (
                  <button
                    onClick={() => {
                      onMove(id, 'WON');
                      setIsDropdownOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Move to Won
                  </button>
                )}
                {deal.status !== 'LOST' && (
                  <button
                    onClick={() => {
                      onMove(id, 'LOST');
                      setIsDropdownOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Move to Lost
                  </button>
                )}
                <button
                  onClick={() => {
                    onDelete(id);
                    setIsDropdownOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <p className="text-sm text-gray-600 mt-1">{customerDisplay}</p>
      <p className="text-lg font-semibold mt-2">{formatCurrency(deal.value)}</p>
      <div className="flex items-center mt-2 text-xs text-gray-500">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 mr-1"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        {formatDate(deal.closingDate)}
      </div>
    </div>
  );
} 