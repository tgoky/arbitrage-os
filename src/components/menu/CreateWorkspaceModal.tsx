// components/menu/CreateWorkspaceModal.tsx
"use client";

import React from 'react';
import { useTheme } from '../../providers/ThemeProvider';

interface CreateWorkspaceModalProps {
  createWorkspaceModalOpen: boolean;
  setCreateWorkspaceModalOpen: (open: boolean) => void;
  newWorkspaceName: string;
  setNewWorkspaceName: (name: string) => void;
  newWorkspaceDescription: string;
  setNewWorkspaceDescription: (description: string) => void;
  handleCreateWorkspace: () => void;
}

export const CreateWorkspaceModal: React.FC<CreateWorkspaceModalProps> = ({
  createWorkspaceModalOpen,
  setCreateWorkspaceModalOpen,
  newWorkspaceName,
  setNewWorkspaceName,
  newWorkspaceDescription,
  setNewWorkspaceDescription,
  handleCreateWorkspace,
}) => {
  const { theme } = useTheme();

  if (!createWorkspaceModalOpen) return null;

  const handleClose = () => {
    setCreateWorkspaceModalOpen(false);
    setNewWorkspaceName("");
    setNewWorkspaceDescription("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleCreateWorkspace();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`
        ${theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}
        border rounded-lg max-w-md w-full p-6
      `}>
        <form onSubmit={handleSubmit}>
       <h2
  className={`text-xl font-bold mb-4 ${
    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
  }`}
>
  Create New Workspace
</h2>
          
          <div className="mb-4">
            <label className={`block text-sm font-medium mb-2 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Workspace Name *
            </label>
            <input
              type="text"
              value={newWorkspaceName}
              onChange={(e) => setNewWorkspaceName(e.target.value)}
              className={`
                w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500
                ${theme === 'dark' 
                  ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }
              `}
              placeholder="Enter workspace name"
              autoFocus
              required
            />
          </div>

          <div className="mb-6">
            <label className={`block text-sm font-medium mb-2 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Description (optional)
            </label>
            <textarea
              value={newWorkspaceDescription}
              onChange={(e) => setNewWorkspaceDescription(e.target.value)}
              className={`
                w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none
                ${theme === 'dark' 
                  ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }
              `}
              rows={3}
              placeholder="Describe what this workspace is for"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className={`
                flex-1 px-4 py-2 border rounded-md font-medium transition-colors
                ${theme === 'dark' 
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-800' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }
              `}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!newWorkspaceName.trim()}
              className="flex-1 px-4 py-2 bg-indigo-500 text-white rounded-md font-medium hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Create Workspace
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};