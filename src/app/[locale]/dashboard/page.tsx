export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard 
          title="Total Customers" 
          value="1,254" 
          change="+12%" 
          trend="up" 
        />
        <StatCard 
          title="Active Deals" 
          value="45" 
          change="+3%" 
          trend="up" 
        />
        <StatCard 
          title="Closed Deals (Month)" 
          value="24" 
          change="+8%" 
          trend="up" 
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-4">
            <ActivityItem 
              title="New Customer Added" 
              description="Acme Inc. was added as a new customer" 
              time="2 hours ago" 
            />
            <ActivityItem 
              title="Deal Closed" 
              description="$15,000 deal with XYZ Corp was marked as won" 
              time="5 hours ago" 
            />
            <ActivityItem 
              title="Task Completed" 
              description="Follow-up call with potential client completed" 
              time="Yesterday" 
            />
            <ActivityItem 
              title="New Note Added" 
              description="Sales meeting notes updated for ABC Ltd." 
              time="Yesterday" 
            />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Upcoming Tasks</h2>
          <div className="space-y-3">
            <TaskItem 
              title="Follow up with client" 
              dueDate="Today" 
              priority="high" 
            />
            <TaskItem 
              title="Prepare proposal" 
              dueDate="Tomorrow" 
              priority="medium" 
            />
            <TaskItem 
              title="Send invoice to ABC Ltd." 
              dueDate="May 15" 
              priority="medium" 
            />
            <TaskItem 
              title="Schedule meeting with team" 
              dueDate="May 17" 
              priority="low" 
            />
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