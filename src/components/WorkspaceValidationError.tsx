// components/WorkspaceValidationError.tsx
"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '../providers/ThemeProvider';
import { useWorkspace } from '../app/hooks/useWorkspace';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

export const WorkspaceValidationError: React.FC = () => {
  const { theme } = useTheme();
  const router = useRouter();
  const { validationError, workspaces, refreshWorkspaces, isLoading } = useWorkspace();

  if (!validationError) return null;

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${
      theme === 'dark' ? 'bg-black' : 'bg-gray-50'
    }`}>
      <div className={`max-w-md w-full rounded-lg shadow-lg p-6 text-center ${
        theme === 'dark' ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200'
      }`}>
        <div className="mb-4">
          <AlertTriangle className={`w-16 h-16 mx-auto ${
            theme === 'dark' ? 'text-yellow-400' : 'text-yellow-500'
          }`} />
        </div>
        
        <h2 className={`text-xl font-bold mb-2 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          Workspace Access Error
        </h2>
        
        <p className={`mb-6 ${
          theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
        }`}>
          {validationError}
        </p>
        
        <div className="space-y-3">
          {workspaces.length > 0 && (
            <button
              onClick={() => {
                const firstWorkspace = workspaces[0];
                router.push(`/dashboard/${firstWorkspace.slug}`);
              }}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                theme === 'dark'
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              <Home className="w-4 h-4" />
              Go to Available Workspace
            </button>
          )}
          
          <button
            onClick={() => refreshWorkspaces()}
            disabled={isLoading}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              theme === 'dark'
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300 disabled:opacity-50'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-50'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Refreshing...' : 'Refresh Workspaces'}
          </button>
          
          <button
            onClick={() => router.push('/')}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              theme === 'dark'
                ? 'bg-transparent hover:bg-gray-800 text-gray-400 border border-gray-700'
                : 'bg-transparent hover:bg-gray-50 text-gray-600 border border-gray-300'
            }`}
          >
            Create New Workspace
          </button>
        </div>
        
        {workspaces.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className={`text-sm mb-2 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Available Workspaces:
            </p>
            <div className="space-y-1">
              {workspaces.slice(0, 3).map((workspace) => (
                <button
                  key={workspace.id}
                  onClick={() => router.push(`/dashboard/${workspace.slug}`)}
                  className={`w-full text-left px-2 py-1 rounded text-sm transition-colors ${
                    theme === 'dark'
                      ? 'hover:bg-gray-800 text-gray-300'
                      : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  {workspace.name}
                </button>
              ))}
              {workspaces.length > 3 && (
                <p className={`text-xs ${
                  theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                }`}>
                  +{workspaces.length - 3} more workspaces
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};