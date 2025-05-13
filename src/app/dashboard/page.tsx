'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getDocuments } from '@/lib/firestore';
import { COLLECTIONS } from '@/lib/firestore';
import { Customer, Deal, Task } from '@/types/firebase';
import { Timestamp } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';

export default function DashboardPage() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch data from Firebase
  useEffect(() => {
    async function fetchData() {
      if (!user?.id) return;

      try {
        // Fetch customers
        const fetchedCustomers = await getDocuments<Customer>(COLLECTIONS.CUSTOMERS);
        const userCustomers = fetchedCustomers.filter(customer => customer.userId === user.id);
        setCustomers(userCustomers);

        // Fetch deals
        const fetchedDeals = await getDocuments<Deal>(COLLECTIONS.DEALS);
        const userDeals = fetchedDeals.filter(deal => deal.userId === user.id);
        setDeals(userDeals);

        // Fetch tasks
        const fetchedTasks = await getDocuments<Task>(COLLECTIONS.TASKS);
        const userTasks = fetchedTasks.filter(task => task.userId === user.id);
        setTasks(userTasks);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [user?.id]);

  // Calculate statistics
  const totalCustomers = customers.length;
  const activeDeals = deals.filter(deal => deal.status === 'OPEN' || deal.status === 'PENDING').length;
  const closedDealsThisMonth = deals.filter(deal => {
    // Check if deal was closed (WON or LOST) this month
    if (deal.status !== 'WON' && deal.status !== 'LOST') return false;
    
    // Check if the deal was updated this month
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    
    if (!deal.updatedAt) return false;
    
    const updatedDate = deal.updatedAt instanceof Timestamp 
      ? deal.updatedAt.toDate() 
      : new Date(deal.updatedAt);
    
    return updatedDate.getMonth() === thisMonth && 
           updatedDate.getFullYear() === thisYear;
  }).length;

  // Get upcoming tasks (not completed, sorted by due date)
  const upcomingTasks = [...tasks]
    .filter(task => !task.completed)
    .sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      
      const dateA = a.dueDate instanceof Timestamp ? a.dueDate.toDate() : new Date(a.dueDate);
      const dateB = b.dueDate instanceof Timestamp ? b.dueDate.toDate() : new Date(b.dueDate);
      
      return dateA.getTime() - dateB.getTime();
    })
    .slice(0, 4); // Get only the first 4

  // Format relative time (e.g., "2 hours ago")
  const getRelativeTime = (timestamp?: Timestamp | Date) => {
    if (!timestamp) return 'N/A';
    
    const date = timestamp instanceof Timestamp 
      ? timestamp.toDate() 
      : (timestamp instanceof Date ? timestamp : new Date(timestamp));
    
    return formatDistanceToNow(date, { addSuffix: true });
  };

  // Create "recent activity" items
  const getRecentActivity = () => {
    const activities = [];
    
    // Add recently created customers
    for (const customer of [...customers].sort((a, b) => {
      const timeA = a.createdAt instanceof Timestamp ? a.createdAt.toDate().getTime() : 0;
      const timeB = b.createdAt instanceof Timestamp ? b.createdAt.toDate().getTime() : 0;
      return timeB - timeA;
    }).slice(0, 2)) {
      activities.push({
        title: 'New Customer Added',
        description: `${customer.name} was added as a new customer`,
        time: getRelativeTime(customer.createdAt),
        timestamp: customer.createdAt instanceof Timestamp ? customer.createdAt.toDate().getTime() : 0
      });
    }
    
    // Add recently closed deals
    for (const deal of [...deals].filter(d => d.status === 'WON' || d.status === 'LOST').sort((a, b) => {
      const timeA = a.updatedAt instanceof Timestamp ? a.updatedAt.toDate().getTime() : 0;
      const timeB = b.updatedAt instanceof Timestamp ? b.updatedAt.toDate().getTime() : 0;
      return timeB - timeA;
    }).slice(0, 2)) {
      activities.push({
        title: `Deal ${deal.status === 'WON' ? 'Won' : 'Lost'}`,
        description: `${deal.title} (${deal.customerName || 'Unknown customer'}) was marked as ${deal.status.toLowerCase()}`,
        time: getRelativeTime(deal.updatedAt),
        timestamp: deal.updatedAt instanceof Timestamp ? deal.updatedAt.toDate().getTime() : 0
      });
    }
    
    // Add recently completed tasks
    for (const task of [...tasks].filter(t => t.completed).sort((a, b) => {
      const timeA = a.updatedAt instanceof Timestamp ? a.updatedAt.toDate().getTime() : 0;
      const timeB = b.updatedAt instanceof Timestamp ? b.updatedAt.toDate().getTime() : 0;
      return timeB - timeA;
    }).slice(0, 2)) {
      activities.push({
        title: 'Task Completed',
        description: task.title,
        time: getRelativeTime(task.updatedAt),
        timestamp: task.updatedAt instanceof Timestamp ? task.updatedAt.toDate().getTime() : 0
      });
    }
    
    // Sort all activities by timestamp
    return activities.sort((a, b) => b.timestamp - a.timestamp).slice(0, 4);
  };
  
  const recentActivities = getRecentActivity();

  // Format due date for tasks
  const formatDueDate = (dueDate?: Timestamp) => {
    if (!dueDate) return 'No due date';
    
    const date = dueDate instanceof Timestamp ? dueDate.toDate() : new Date(dueDate);
    const now = new Date();
    
    // Check if the due date is today
    if (date.getDate() === now.getDate() && 
        date.getMonth() === now.getMonth() && 
        date.getFullYear() === now.getFullYear()) {
      return 'Today';
    }
    
    // Check if the due date is tomorrow
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (date.getDate() === tomorrow.getDate() && 
        date.getMonth() === tomorrow.getMonth() && 
        date.getFullYear() === tomorrow.getFullYear()) {
      return 'Tomorrow';
    }
    
    // Format date as "MMM D"
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return <div className="text-center p-8">Loading dashboard data...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard 
          title="Total Customers" 
          value={totalCustomers.toString()} 
          change={customers.length > 0 ? "+1" : "0"} 
          trend="up" 
        />
        <StatCard 
          title="Active Deals" 
          value={activeDeals.toString()} 
          change={activeDeals > 0 ? "+1" : "0"} 
          trend="up" 
        />
        <StatCard 
          title="Closed Deals (Month)" 
          value={closedDealsThisMonth.toString()} 
          change={closedDealsThisMonth > 0 ? "+1" : "0"} 
          trend="up" 
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {recentActivities.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No recent activity found</p>
            ) : (
              recentActivities.map((activity, index) => (
                <ActivityItem 
                  key={index}
                  title={activity.title} 
                  description={activity.description} 
                  time={activity.time} 
                />
              ))
            )}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Upcoming Tasks</h2>
          <div className="space-y-3">
            {upcomingTasks.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No upcoming tasks found</p>
            ) : (
              upcomingTasks.map((task) => (
                <TaskItem 
                  key={task.id}
                  title={task.title} 
                  dueDate={formatDueDate(task.dueDate)} 
                  priority="medium" 
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  change, 
  trend 
}: { 
  title: string; 
  value: string; 
  change: string; 
  trend: 'up' | 'down'; 
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
      <div className="flex items-center mt-2">
        <span className={`text-sm ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
          {change}
          {trend === 'up' ? (
            <svg className="w-3 h-3 ml-1 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          ) : (
            <svg className="w-3 h-3 ml-1 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          )}
        </span>
      </div>
    </div>
  );
}

function ActivityItem({ 
  title, 
  description, 
  time 
}: { 
  title: string; 
  description: string; 
  time: string; 
}) {
  return (
    <div className="border-l-4 border-primary-500 pl-4 py-1">
      <p className="font-medium">{title}</p>
      <p className="text-sm text-gray-600">{description}</p>
      <p className="text-xs text-gray-400 mt-1">{time}</p>
    </div>
  );
}

function TaskItem({ 
  title, 
  dueDate, 
  priority 
}: { 
  title: string; 
  dueDate: string; 
  priority: 'high' | 'medium' | 'low'; 
}) {
  const getPriorityColor = () => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
      <div className="flex items-center">
        <input type="checkbox" className="mr-3 h-4 w-4 text-primary-600 rounded" />
        <span>{title}</span>
      </div>
      <div className="flex items-center">
        <span className="text-sm text-gray-500 mr-2">{dueDate}</span>
        <span className={`text-xs px-2 py-1 rounded ${getPriorityColor()}`}>
          {priority}
        </span>
      </div>
    </div>
  );
} 