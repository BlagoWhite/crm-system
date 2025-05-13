'use client';

import { useAuth } from '@/contexts/AuthContext';

export default function ConfigError() {
  const { error } = useAuth();

  if (!error) return null;

  return (
    <div className="fixed top-0 inset-x-0 p-4 bg-red-500 text-white z-50">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-6 w-6" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor" 
            strokeWidth={2}
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
            />
          </svg>
          <span className="font-medium">Configuration Error:</span>
          <span>{error}</span>
        </div>
        {error && error.includes("Firebase") && (
          <div className="text-sm">
            Please set up your Firebase configuration in .env.local
          </div>
        )}
      </div>
    </div>
  );
} 