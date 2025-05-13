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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newTask, setNewTask] = useState<FormTask>({
    title: '',
    description: '',
    dueDate: null,
    completed: false,
    priority: 'medium',
    userId: user?.id || '',
  });
  const [editingTask, setEditingTask] = useState<FormTask & { id?: string }>({
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
        // Filter to only show this user's tasks and add UI properties
        const userTasks = fetchedTasks
          .filter(task => task.userId === user.id)
          .map(task => ({ 
            ...task, 
            priority: task.priority || 'medium' as 'high' | 'medium' | 'low' 
          })); // Use stored priority or default to medium
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
        priority: newTask.priority, // Store priority in Firestore
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

  // Edit task function
  const editTask = async () => {
    if (editingTask.title.trim() === '' || !user?.id || !editingTask.id) return;
    
    try {
      // Convert form data to Firestore data
      const taskData: Partial<TaskType> = {
        title: editingTask.title,
        description: editingTask.description,
        completed: editingTask.completed,
        priority: editingTask.priority, // Store priority in Firestore
        // Convert Date to Firestore Timestamp if present
        ...(editingTask.dueDate && { dueDate: Timestamp.fromDate(editingTask.dueDate) }),
        // Add optional fields if present
        ...(editingTask.customerId && { customerId: editingTask.customerId }),
        ...(editingTask.dealId && { dealId: editingTask.dealId }),
      };
      
      // Update in Firestore
      await updateDocument(COLLECTIONS.TASKS, editingTask.id, taskData);
      
      // Update local state
      setTasks(
        tasks.map((task) =>
          task.id === editingTask.id 
            ? { ...task, ...taskData } 
            : task
        )
      );
      
      // Close modal
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  // Open edit modal with task data
  const openEditModal = (task: TaskType) => {
    setEditingTask({
      id: task.id,
      title: task.title,
      description: task.description || '',
      dueDate: task.dueDate ? (task.dueDate instanceof Timestamp ? task.dueDate.toDate() : task.dueDate) : null,
      completed: task.completed,
      priority: task.priority || 'medium',
      userId: task.userId,
      customerId: task.customerId,
      dealId: task.dealId,
    });
    setIsEditModalOpen(true);
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
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  if (isLoading) {
    return <div className="text-center p-8 dark:text-white">Загрузка задач...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold dark:text-white">Задачи</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md"
        >
          Добавить задачу
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden p-2">
        <div className="divide-y divide-gray-200 dark:divide-gray-700 space-y-2">
          {tasks.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-md">
              Задач нет. Создайте свою первую задачу!
            </div>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className={`p-4 rounded-md shadow-sm border border-gray-200 dark:border-gray-600 ${
                  task.completed ? 'bg-gray-100 dark:bg-gray-700' : 'bg-gray-50 dark:bg-gray-800'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTaskCompletion(task.id!)}
                      className="mt-1 h-4 w-4 text-primary-600 rounded"
                    />
                    <div>
                      <h3
                        className={`font-medium ${
                          task.completed ? 'line-through text-gray-500 dark:text-gray-400' : 'dark:text-white'
                        }`}
                      >
                        {task.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {task.description}
                      </p>
                      <div className="flex space-x-2 mt-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(task.dueDate)}
                        </span>
                        {task.priority && (
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${getPriorityClass(
                              task.priority
                            )}`}
                          >
                            {task.priority}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex">
                    <button
                      onClick={() => openEditModal(task)}
                      className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mr-2"
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
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => deleteTask(task.id!)}
                      className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
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
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 dark:text-white">Добавить задачу</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Название
                </label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) =>
                    setNewTask({ ...newTask, title: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                  placeholder="Название задачи"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Описание
                </label>
                <textarea
                  value={newTask.description}
                  onChange={(e) =>
                    setNewTask({ ...newTask, description: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                  placeholder="Описание задачи"
                  rows={3}
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Дата завершения
                </label>
                <DatePicker
                  selected={newTask.dueDate}
                  onChange={(date) => setNewTask({ ...newTask, dueDate: date })}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                  placeholderText="Выберите дату завершения"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Приоритет
                </label>
                <select
                  value={newTask.priority}
                  onChange={(e) =>
                    setNewTask({
                      ...newTask,
                      priority: e.target.value as 'high' | 'medium' | 'low',
                    })
                  }
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                >
                  <option value="high">Высокий</option>
                  <option value="medium">Средний</option>
                  <option value="low">Низкий</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Отменить
              </button>
              <button
                onClick={addTask}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                Добавить задачу
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 dark:text-white">Редактировать задачу</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Название
                </label>
                <input
                  type="text"
                  value={editingTask.title}
                  onChange={(e) =>
                    setEditingTask({ ...editingTask, title: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                  placeholder="Название задачи"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Описание
                </label>
                <textarea
                  value={editingTask.description}
                  onChange={(e) =>
                    setEditingTask({ ...editingTask, description: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                  placeholder="Описание задачи"
                  rows={3}
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Дата завершения
                </label>
                <DatePicker
                  selected={editingTask.dueDate}
                  onChange={(date) => setEditingTask({ ...editingTask, dueDate: date })}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                  placeholderText="Выберите дату завершения"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Приоритет
                </label>
                <select
                  value={editingTask.priority}
                  onChange={(e) =>
                    setEditingTask({
                      ...editingTask,
                      priority: e.target.value as 'high' | 'medium' | 'low',
                    })
                  }
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                >
                  <option value="high">Высокий</option>
                  <option value="medium">Средний</option>
                  <option value="low">Низкий</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Статус
                </label>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editingTask.completed}
                    onChange={(e) =>
                      setEditingTask({ ...editingTask, completed: e.target.checked })
                    }
                    className="h-4 w-4 text-primary-600 rounded"
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-300">
                    Выполнено
                  </span>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Отменить
              </button>
              <button
                onClick={editTask}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 