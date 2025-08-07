// app/page.tsx (or app/home/page.tsx)
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '../../providers/ThemeProvider';
import { PlusIcon, FolderIcon, ArrowRightIcon } from 'lucide-react';

interface Workspace {
  id: string;
  name: string;
  color: string;
  slug: string;
  createdAt: Date;
  description?: string;
}

const WorkspaceHomePage = () => {
  const router = useRouter();
  const { theme } = useTheme();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [newWorkspaceDescription, setNewWorkspaceDescription] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Simulate loading existing workspaces (replace with actual API call)
 useEffect(() => {
  const loadWorkspaces = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const savedWorkspaces = localStorage.getItem('userWorkspaces');
      if (savedWorkspaces) {
        const parsedWorkspaces = JSON.parse(savedWorkspaces);
        // Convert string dates back to Date objects
        const workspacesWithDates = parsedWorkspaces.map((w: any) => ({
          ...w,
          createdAt: new Date(w.createdAt)
        }));
        setWorkspaces(workspacesWithDates);
      }
    } catch (error) {
      console.error('Error loading workspaces:', error);
    } finally {
      setIsLoading(false);
    }
  };

  loadWorkspaces();
}, []);

  const createWorkspaceSlug = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) {
      alert("Workspace name is required");
      return;
    }

    const slug = createWorkspaceSlug(newWorkspaceName);
    
    // Check if slug already exists
    if (workspaces.some(w => w.slug === slug)) {
      alert("A workspace with this name already exists");
      return;
    }

    const colors = [
      "bg-blue-500",
      "bg-indigo-500", 
      "bg-purple-500",
      "bg-pink-500",
      "bg-red-500",
      "bg-orange-500",
      "bg-yellow-500",
      "bg-green-500",
      "bg-teal-500",
      "bg-cyan-500"
    ];

    const newWorkspace: Workspace = {
      id: Date.now().toString(),
      name: newWorkspaceName.trim(),
      slug,
      color: colors[Math.floor(Math.random() * colors.length)],
      description: newWorkspaceDescription.trim() || undefined,
      createdAt: new Date()
    };

    const updatedWorkspaces = [...workspaces, newWorkspace];
    setWorkspaces(updatedWorkspaces);
    
    // Save to localStorage (replace with actual API call)
    localStorage.setItem('userWorkspaces', JSON.stringify(updatedWorkspaces));

    // Navigate to the new workspace dashboard
    router.push(`/dashboard/${slug}`);
  };

  const handleWorkspaceClick = (workspace: Workspace) => {
    router.push(`/dashboard/${workspace.slug}`);
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        theme === 'dark' ? 'bg-black' : 'bg-gray-50'
      }`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${
      theme === 'dark' ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            Welcome to <span className="text-indigo-500">Arbitrage-OS</span>
          </h1>
          <p className={`text-xl ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
            {workspaces.length === 0 
              ? "Create your first workspace to get started"
              : "Choose a workspace or create a new one"
            }
          </p>
        </div>

        {/* Workspaces Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Create New Workspace Card */}
          <div
            onClick={() => setShowCreateModal(true)}
            className={`
              ${theme === 'dark' 
                ? 'bg-gray-900 border-gray-700 hover:bg-gray-800' 
                : 'bg-white border-gray-200 hover:bg-gray-50'
              }
              border-2 border-dashed rounded-lg p-8 cursor-pointer
              transition-all duration-200 hover:border-indigo-500
              flex flex-col items-center justify-center min-h-[200px]
              group
            `}
          >
            <PlusIcon className="w-12 h-12 text-indigo-500 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-lg font-semibold mb-2">Create Workspace</h3>
            <p className={`text-sm text-center ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Start a new workspace for your projects
            </p>
          </div>

          {/* Existing Workspaces */}
          {workspaces.map((workspace) => (
            <div
              key={workspace.id}
              onClick={() => handleWorkspaceClick(workspace)}
              className={`
                ${theme === 'dark' 
                  ? 'bg-gray-900 border-gray-700 hover:bg-gray-800' 
                  : 'bg-white border-gray-200 hover:bg-gray-50'
                }
                border rounded-lg p-6 cursor-pointer
                transition-all duration-200 hover:shadow-lg hover:scale-105
                flex flex-col min-h-[200px] group
              `}
            >
              <div className="flex items-center mb-4">
                <div className={`w-12 h-12 ${workspace.color} rounded-lg flex items-center justify-center mr-3`}>
                  <FolderIcon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{workspace.name}</h3>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    Created {workspace.createdAt.toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              {workspace.description && (
                <p className={`text-sm mb-4 flex-1 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {workspace.description}
                </p>
              )}
              
              <div className="flex items-center text-indigo-500 text-sm font-medium group-hover:text-indigo-600">
                Open workspace
                <ArrowRightIcon className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Workspace Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`
            ${theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}
            border rounded-lg max-w-md w-full p-6
          `}>
            <h2 className="text-xl font-bold mb-4">Create New Workspace</h2>
            
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
                    ? 'bg-gray-800 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                  }
                `}
                placeholder="Enter workspace name"
                autoFocus
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
                    ? 'bg-gray-800 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                  }
                `}
                rows={3}
                placeholder="Describe what this workspace is for"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewWorkspaceName("");
                  setNewWorkspaceDescription("");
                }}
                className={`
                  flex-1 px-4 py-2 border rounded-md font-medium
                  ${theme === 'dark' 
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-800' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }
                  transition-colors
                `}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateWorkspace}
                disabled={!newWorkspaceName.trim()}
                className="flex-1 px-4 py-2 bg-indigo-500 text-white rounded-md font-medium hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Create Workspace
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspaceHomePage;