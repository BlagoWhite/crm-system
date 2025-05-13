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

// DND-kit imports (replacing react-beautiful-dnd)
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';

export default function DealsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [deals, setDeals] = useState<DealType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeDeal, setActiveDeal] = useState<DealType | null>(null);
  
  // Configure DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px movement required before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
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

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const draggedDeal = deals.find(deal => deal.id === active.id);
    
    if (draggedDeal) {
      setActiveDeal(draggedDeal);
    }
  };

  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    // Reset active deal
    setActiveDeal(null);
    
    if (!over) {
      console.log('Dropped outside droppable area');
      return;
    }
    
    const dealId = active.id as string;
    const newStatus = over.id as 'OPEN' | 'PENDING' | 'WON' | 'LOST';
    
    console.log(`Moving deal ${dealId} to ${newStatus}`);
    
    // Find the deal being dragged
    const deal = deals.find(d => d.id === dealId);
    
    if (!deal) {
      console.error(`Could not find deal with ID ${dealId}`);
      return;
    }
    
    // If the status hasn't changed, do nothing
    if (deal.status === newStatus) {
      console.log('Status unchanged');
      return;
    }
    
    try {
      // Update in Firestore
      await updateDocument(COLLECTIONS.DEALS, dealId, { status: newStatus });
      
      // Update local state
      setDeals(
        deals.map((deal) =>
          deal.id === dealId ? { ...deal, status: newStatus } : deal
        )
      );
      
      console.log(`Successfully updated deal ${dealId} to status ${newStatus}`);
    } catch (error) {
      console.error('Error updating deal status:', error);
      alert('Failed to update deal status. Please try again.');
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

  if (isLoading) {
    return <div className="text-center p-8 dark:text-white">Loading deals data...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold dark:text-white">Deals</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md"
        >
          Add New Deal
        </button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {/* Open Deals Column */}
          <DealColumn 
            title="Open"
            count={openDeals.length}
            status="OPEN"
            deals={openDeals}
            color="blue"
            onMove={moveDeal}
            onDelete={deleteDeal}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
          />

          {/* Pending Deals Column */}
          <DealColumn 
            title="Pending"
            count={pendingDeals.length}
            status="PENDING"
            deals={pendingDeals}
            color="yellow"
            onMove={moveDeal}
            onDelete={deleteDeal}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
          />

          {/* Won Deals Column */}
          <DealColumn 
            title="Won"
            count={wonDeals.length}
            status="WON"
            deals={wonDeals}
            color="green"
            onMove={moveDeal}
            onDelete={deleteDeal}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
          />

          {/* Lost Deals Column */}
          <DealColumn 
            title="Lost"
            count={lostDeals.length}
            status="LOST"
            deals={lostDeals}
            color="red"
            onMove={moveDeal}
            onDelete={deleteDeal}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
          />
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeDeal ? (
            <div className="opacity-80 w-full">
              <DealCard
                deal={activeDeal}
                onMove={moveDeal}
                onDelete={deleteDeal}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Add Deal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 dark:text-white">Add New Deal</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={newDeal.title}
                  onChange={(e) =>
                    setNewDeal({ ...newDeal, title: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                  placeholder="Deal title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Customer
                </label>
                <input
                  type="text"
                  value={newDeal.customerName}
                  onChange={(e) =>
                    setNewDeal({ ...newDeal, customerName: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                  placeholder="Customer name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Value
                </label>
                <input
                  type="number"
                  value={newDeal.value}
                  onChange={(e) =>
                    setNewDeal({ ...newDeal, value: Number(e.target.value) })
                  }
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                  placeholder="Deal value"
                  min="0"
                  step="100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Expected Closing Date
                </label>
                <DatePicker
                  selected={newDeal.closingDate}
                  onChange={(date) => setNewDeal({ ...newDeal, closingDate: date })}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                  placeholderText="Select closing date"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
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
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
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

// Deal Column Component
import { useDroppable } from '@dnd-kit/core';

function DealColumn({
  title,
  count,
  status,
  deals,
  color,
  onMove,
  onDelete,
  formatCurrency,
  formatDate,
}: {
  title: string;
  count: number;
  status: 'OPEN' | 'PENDING' | 'WON' | 'LOST';
  deals: DealType[];
  color: 'blue' | 'yellow' | 'green' | 'red';
  onMove: (id: string, newStatus: 'OPEN' | 'PENDING' | 'WON' | 'LOST') => void;
  onDelete: (id: string) => void;
  formatCurrency: (value: number) => string;
  formatDate: (date: any) => string;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });
  
  const getBackgroundColor = () => {
    if (isOver) {
      switch (color) {
        case 'blue': return 'bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-200 dark:ring-blue-800';
        case 'yellow': return 'bg-yellow-50 dark:bg-yellow-900/20 ring-2 ring-yellow-200 dark:ring-yellow-800';
        case 'green': return 'bg-green-50 dark:bg-green-900/20 ring-2 ring-green-200 dark:ring-green-800';
        case 'red': return 'bg-red-50 dark:bg-red-900/20 ring-2 ring-red-200 dark:ring-red-800';
        default: return '';
      }
    }
    return '';
  };
  
  return (
    <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
      <div className="flex items-center mb-4">
        <div className={`w-3 h-3 bg-${color}-500 rounded-full mr-2`}></div>
        <h2 className="text-lg font-semibold dark:text-white">{title}</h2>
        <span className={`ml-auto bg-${color}-500 text-white text-xs px-2 py-1 rounded-full`}>
          {count}
        </span>
      </div>
      
      <div 
        ref={setNodeRef}
        className={`space-y-3 min-h-[100px] rounded-md transition-colors duration-200 p-2 ${getBackgroundColor()}`}
      >
        {deals.length === 0 ? (
          <div className="text-center p-4 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400">
            No {title.toLowerCase()} deals
          </div>
        ) : (
          deals.map((deal) => (
            <DraggableDeal 
              key={deal.id} 
              deal={deal}
              onMove={onMove}
              onDelete={onDelete}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
            />
          ))
        )}
      </div>
    </div>
  );
}

// Draggable Deal Component
import { useDraggable } from '@dnd-kit/core';

function DraggableDeal({
  deal,
  onMove,
  onDelete,
  formatCurrency,
  formatDate,
}: {
  deal: DealType;
  onMove: (id: string, newStatus: 'OPEN' | 'PENDING' | 'WON' | 'LOST') => void;
  onDelete: (id: string) => void;
  formatCurrency: (value: number) => string;
  formatDate: (date: any) => string;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: deal.id || '',
  });
  
  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0.5 : 1,
  } : undefined;
  
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <DealCard
        deal={deal}
        onMove={onMove}
        onDelete={onDelete}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
      />
    </div>
  );
}

// Deal Card Component
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
    <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-600 relative group">
      {/* Subtle indicator that the card is draggable */}
      <div className="absolute top-2 left-2 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors duration-200">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
      </div>
      
      <div className="flex justify-between items-start ml-5">
        <h3 className="font-medium dark:text-white">{deal.title}</h3>
        <div className="relative z-10"> {/* Higher z-index to ensure dropdown works properly */}
          <button
            onClick={(e) => {
              e.stopPropagation(); // Prevent drag event when clicking dropdown
              setIsDropdownOpen(!isDropdownOpen);
            }}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
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
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-700">
              <div className="py-1">
                {deal.status !== 'OPEN' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent drag
                      onMove(id, 'OPEN');
                      setIsDropdownOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Move to Open
                  </button>
                )}
                {deal.status !== 'PENDING' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent drag
                      onMove(id, 'PENDING');
                      setIsDropdownOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Move to Pending
                  </button>
                )}
                {deal.status !== 'WON' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent drag
                      onMove(id, 'WON');
                      setIsDropdownOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Move to Won
                  </button>
                )}
                {deal.status !== 'LOST' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent drag
                      onMove(id, 'LOST');
                      setIsDropdownOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Move to Lost
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent drag
                    onDelete(id);
                    setIsDropdownOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{customerDisplay}</p>
      <p className="text-lg font-semibold mt-2 dark:text-white">{formatCurrency(deal.value)}</p>
      <div className="flex items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
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