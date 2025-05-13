'use client';

import { useState } from 'react';

interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: Date | null;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Follow up with Acme Inc.',
      description: 'Call regarding the new proposal',
      dueDate: new Date(),
      completed: false,
      priority: 'high',
    },
    {
      id: '2',
      title: 'Prepare quarterly report',
      description: 'Gather sales data and prepare presentation',
      dueDate: new Date(Date.now() + 86400000 * 2), // 2 days from now
      completed: false,
      priority: 'medium',
    },
    {
      id: '3',
      title: 'Schedule team meeting',
      description: 'Discuss Q3 goals with the sales team',
      dueDate: new Date(Date.now() + 86400000 * 5), // 5 days from now
      completed: false,
      priority: 'low',
    },
  ]);

  // Toggle task completion
  const toggleTaskCompletion = (id: string) => {
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  // Get priority class for styling
  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Format date for display
  const formatDate = (date: Date | null) => {
    if (!date) return 'No due date';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Tasks</h1>
        <button
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md"
        >
          Add New Task
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="divide-y divide-gray-200">
          {tasks.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No tasks available. Create your first task!
            </div>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className={`p-4 ${
                  task.completed ? 'bg-gray-50' : 'bg-white'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTaskCompletion(task.id)}
                      className="mt-1 h-4 w-4 text-primary-600 rounded"
                    />
                    <div>
                      <h3
                        className={`font-medium ${
                          task.completed ? 'line-through text-gray-500' : ''
                        }`}
                      >
                        {task.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {task.description}
                      </p>
                      <div className="flex space-x-2 mt-2">
                        <span className="text-xs text-gray-500">
                          {formatDate(task.dueDate)}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${getPriorityClass(
                            task.priority
                          )}`}
                        >
                          {task.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
} 