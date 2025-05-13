'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { createDocument, updateDocument, deleteDocument, getDocuments } from '@/lib/firestore';
import { COLLECTIONS } from '@/lib/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { Task as TaskType } from '@/types/firebase';
import { Timestamp } from 'firebase/firestore';

export default function TasksPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Local form state with Date objects (easier to work with in UI)
  interface FormTask {
    title: string;
    description: string;
    dueDate: Date | null;
    completed: boolean;
    priority?: 'high' | 'medium' | 'low'; // For UI only, not stored in Firestore
    customerId?: string;
    dealId?: string;
    userId: string;
  }

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTask, setNewTask] = useState<FormTask>({
    title: '',
    description: '',
    dueDate: null,
    completed: false,
    priority: 'medium',
    userId: user?.id || '',
  });

  // Fetch tasks from Firestore
  useEffect(() => {
    async function fetchTasks() {
      if (!user?.id) return;
      
      try {
        const fetchedTasks = await getDocuments<TaskType>(COLLECTIONS.TASKS);
        // Filter to only show this user's tasks
        const userTasks = fetchedTasks.filter(task => task.userId === user.id);
        setTasks(userTasks);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTasks();
  }, [user?.id]);

  // Toggle task completion
  const toggleTaskCompletion = async (id: string) => {
    try {
      // Get the current task
      const task = tasks.find((t) => t.id === id);
      if (!task) return;
      
      // Update in Firestore
      await updateDocument(COLLECTIONS.TASKS, id, { completed: !task.completed });
      
      // Update local state
      setTasks(
        tasks.map((task) =>
          task.id === id ? { ...task, completed: !task.completed } : task
        )
      );
    } catch (error) {
      console.error('Error updating task completion:', error);
    }
  };

  // Delete task
  const deleteTask = async (id: string) => {
    try {
      // Delete from Firestore
      await deleteDocument(COLLECTIONS.TASKS, id);
      
      // Update local state
      setTasks(tasks.filter((task) => task.id !== id));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  // Add new task
  const addTask = async () => {
    if (newTask.title.trim() === '' || !user?.id) return;
    
    try {
      // Convert form data to Firestore data
      const taskData: Omit<TaskType, 'id'> = {
        title: newTask.title,
        description: newTask.description,
        completed: false,
        userId: user.id,
        // Convert Date to Firestore Timestamp if present
        ...(newTask.dueDate && { dueDate: Timestamp.fromDate(newTask.dueDate) }),
        // Add optional fields if present
        ...(newTask.customerId && { customerId: newTask.customerId }),
        ...(newTask.dealId && { dealId: newTask.dealId }),
      };
      
      // Save to Firestore
      const savedTask = await createDocument<Omit<TaskType, 'id'>>(COLLECTIONS.TASKS, taskData);
      
      // Update local state
      setTasks([...tasks, savedTask as TaskType]);
      
      // Reset form
      setNewTask({
        title: '',
        description: '',
        dueDate: null,
        completed: false,
        priority: 'medium',
        userId: user.id,
      });
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  // Format date - converts Firestore timestamp to readable date
  const formatDate = (timestamp?: any) => {
    if (!timestamp) return 'No date';
    
    // If it's a Firestore Timestamp, convert to JS Date
    const date = timestamp instanceof Timestamp ? 
      timestamp.toDate() : 
      (timestamp instanceof Date ? timestamp : null);
    
    if (!date) return 'Invalid date';
    return format(date, 'MMM d, yyyy');
  };

  // Get priority class
  const getPriorityClass = (priority?: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Tasks</h1>
        <button
          onClick={() => setIsModalOpen(true)}
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
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add New Task</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) =>
                    setNewTask({ ...newTask, title: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Task title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newTask.description}
                  onChange={(e) =>
                    setNewTask({ ...newTask, description: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Task description"
                  rows={3}
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date
                </label>
                <DatePicker
                  selected={newTask.dueDate}
                  onChange={(date) => setNewTask({ ...newTask, dueDate: date })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholderText="Select due date"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={newTask.priority}
                  onChange={(e) =>
                    setNewTask({
                      ...newTask,
                      priority: e.target.value as 'high' | 'medium' | 'low',
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
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
                onClick={addTask}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                Add Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 