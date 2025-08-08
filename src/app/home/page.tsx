"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '../../providers/ThemeProvider';
import { PlusIcon, FolderIcon, ArrowRightIcon, Clock, HardDrive, File, Trash2, Menu, Power } from 'lucide-react';
import Image from 'next/image';

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
  const [progress, setProgress] = useState(0);
  const [showStartMenu, setShowStartMenu] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeWindow, setActiveWindow] = useState('workspaces');
  const [showShutdown, setShowShutdown] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [navigationProgress, setNavigationProgress] = useState(0);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string | null>(null);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Load workspaces with Windows 98 style loading
  useEffect(() => {
    const loadWorkspaces = async () => {
      try {
        // Simulate Windows 98 boot sequence
        const interval = setInterval(() => {
          setProgress(prev => {
            // Random progress increments with occasional pauses
            const increment = Math.random() > 0.85 ? 0 : (Math.random() > 0.7 ? 2 : 1);
            return Math.min(prev + increment, 100);
          });
        }, 200); // Slower progress

        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const savedWorkspaces = localStorage.getItem('userWorkspaces');
        if (savedWorkspaces) {
          const parsedWorkspaces = JSON.parse(savedWorkspaces);
          const workspacesWithDates = parsedWorkspaces.map((w: any) => ({
            ...w,
            createdAt: new Date(w.createdAt)
          }));
          setWorkspaces(workspacesWithDates);
        }

        clearInterval(interval);
        setProgress(100);
        await new Promise(resolve => setTimeout(resolve, 800));
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
      // Windows 98 style alert
      alert("Workspace name is required");
      return;
    }

    const slug = createWorkspaceSlug(newWorkspaceName);
    
    if (workspaces.some(w => w.slug === slug)) {
      alert("A workspace with this name already exists");
      return;
    }

    const colors = [
      "bg-blue-700",
      "bg-red-700", 
      "bg-green-700",
      "bg-yellow-600",
      "bg-purple-700",
      "bg-teal-700",
      "bg-pink-700",
      "bg-indigo-700"
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
    localStorage.setItem('userWorkspaces', JSON.stringify(updatedWorkspaces));

    setShowCreateModal(false);
    setNewWorkspaceName("");
    setNewWorkspaceDescription("");
    
    router.push(`/dashboard/${slug}`);
  };

  const handleWorkspaceClick = (workspace: Workspace) => {
    setSelectedWorkspace(workspace.name);
    setNavigating(true);
    setNavigationProgress(0);
    
    // Simulate loading progress
    const interval = setInterval(() => {
      setNavigationProgress(prev => {
        const increment = Math.random() > 0.8 ? 0 : (Math.random() > 0.6 ? 4 : 2);
        return Math.min(prev + increment, 100);
      });
    }, 100);
    
    // Complete after random delay (simulating actual navigation)
    const delay = 500 + Math.random() * 1000;
    setTimeout(() => {
      clearInterval(interval);
      setNavigationProgress(100);
      setTimeout(() => {
        router.push(`/dashboard/${workspace.slug}`);
      }, 300);
    }, delay);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (isLoading) {
    return (
      <div className={`fixed inset-0 flex flex-col items-center justify-center ${
        theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="w-full max-w-md px-8">
          <div className="flex items-center mb-2">
            <div className={`w-4 h-4 rounded-full mr-2 ${
              progress >= 100 ? 'bg-green-500' : 'bg-indigo-500'
            }`}></div>
              <h2 className={`text-xl font-mono font-medium ${
        theme === 'dark' ? 'text-white' : 'text-gray-900'
      }`}>
        {progress >= 100 ? 'Ready' : 'Booting Arbitrage-OS'}
      </h2>
          </div>
          
          <div className={`w-full h-2 rounded-full overflow-hidden ${
            theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
          }`}>
            <div 
              className={`h-full transition-all duration-300 ease-out ${
                progress >= 100 ? 'bg-green-500' : 'bg-indigo-500'
              }`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          
          <div className="mt-4 font-mono text-sm space-y-1">
            <p className={progress > 20 ? 'text-gray-400' : 'text-gray-500'}>
              {progress > 20 ? '✓' : '⌛'} Initializing system...
            </p>
            <p className={progress > 50 ? 'text-gray-400' : 'text-gray-500'}>
              {progress > 50 ? '✓' : '⌛'} Loading workspaces...
            </p>
            <p className={progress > 80 ? 'text-gray-400' : 'text-gray-500'}>
              {progress > 80 ? '✓' : '⌛'} Preparing dashboard...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-teal-700">
      {/* Navigation Loading Overlay */}
      {navigating && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
          <div className="bg-gray-300 border-2 border-gray-400 p-6 w-96">
            <div className="mb-4">
              <h3 className="font-bold text-lg mb-1">Opening {selectedWorkspace}</h3>
              <p className="text-sm">Loading workspace contents...</p>
            </div>
            
            {/* Windows 98 style progress bar */}
            <div className="w-full h-4 bg-gray-200 border border-gray-400">
              <div 
                className="h-full bg-blue-700 transition-all duration-300"
                style={{ width: `${navigationProgress}%` }}
              ></div>
            </div>
            
            <div className="mt-2 text-xs text-right">
              {navigationProgress}% complete
            </div>
          </div>
        </div>
      )}

      {/* Desktop Background */}
      <div className="flex-1 relative bg-[url('/win98-bg.jpg')] bg-cover bg-center p-4 overflow-hidden">
        {/* Desktop Icons */}
        <div className="absolute left-0 top-0 p-6 space-y-8 flex flex-col">
          {/* My Computer Icon */}
          <div 
            className="flex flex-col items-center w-20 text-center text-white cursor-pointer group"
            onDoubleClick={() => setActiveWindow('my-computer')}
          >
            <div className="w-14 h-14 mb-1 flex items-center justify-center relative">
              <svg 
                width="56" 
                height="56" 
                viewBox="0 0 56 56" 
                className="transition-transform group-hover:scale-110"
              >
                {/* Monitor Base */}
                <rect x="8" y="12" width="40" height="30" rx="2" fill="#1084D0" />
                {/* Screen */}
                <rect x="12" y="16" width="32" height="22" fill="#000" />
                {/* Screen Glare */}
                <path d="M12 16 L44 16 L36 24 Z" fill="white" fillOpacity="0.2" />
                {/* Monitor Stand */}
                <rect x="24" y="42" width="8" height="4" fill="#595959" />
                <rect x="20" y="46" width="16" height="4" fill="#808080" />
              </svg>
            </div>
            <span className="text-xs bg-blue-700 px-1 group-hover:bg-blue-800">
              My Computer
            </span>
          </div>

          {/* Documents Icon */}
          <div 
            className="flex flex-col items-center w-20 text-center text-white cursor-pointer group"
            onDoubleClick={() => setActiveWindow('documents')}
          >
            <div className="w-14 h-14 mb-1 flex items-center justify-center relative">
              <svg 
                width="56" 
                height="56" 
                viewBox="0 0 56 56" 
                className="transition-transform group-hover:scale-110"
              >
                {/* Folder Body */}
                <path 
                  d="M10 16H46V46H10V16Z" 
                  fill="#FFCC00" 
                  stroke="#000" 
                  strokeWidth="1.5"
                />
                {/* Folder Tab */}
                <path 
                  d="M10 16L20 8H36L46 16" 
                  fill="#FFCC00" 
                  stroke="#000" 
                  strokeWidth="1.5"
                />
                {/* Document Lines */}
                <rect x="16" y="24" width="24" height="2" fill="#000" />
                <rect x="16" y="28" width="20" height="2" fill="#000" />
                <rect x="16" y="32" width="24" height="2" fill="#000" />
                <rect x="16" y="36" width="18" height="2" fill="#000" />
                {/* Fold Corner */}
                <path 
                  d="M42 20L50 28V20H42Z" 
                  fill="#FFCC00" 
                  stroke="#000" 
                  strokeWidth="1.5"
                />
              </svg>
            </div>
            <span className="text-xs bg-blue-700 px-1 group-hover:bg-blue-800">
              My Documents
            </span>
          </div>

          {/* Recycle Bin Icon */}
          <div 
            className="flex flex-col items-center w-20 text-center text-white cursor-pointer group"
            onDoubleClick={() => setActiveWindow('recycle-bin')}
          >
            <div className="w-14 h-14 mb-1 flex items-center justify-center relative">
              <svg 
                width="56" 
                height="56" 
                viewBox="0 0 56 56" 
                className="transition-transform group-hover:scale-110"
              >
                {/* Bin Body */}
                <path 
                  d="M14 20H42V44H14V20Z" 
                  fill="#C0C0C0" 
                  stroke="#000" 
                  strokeWidth="1.5"
                />
                {/* Bin Top */}
                <path 
                  d="M18 16H38V20H18V16Z" 
                  fill="#808080" 
                  stroke="#000" 
                  strokeWidth="1.5"
                />
                {/* Bin Lid Handle */}
                <rect x="26" y="12" width="4" height="4" fill="#000" />
                {/* Paper */}
                <rect x="20" y="24" width="16" height="12" fill="#FFFFFF" stroke="#000" />
                <rect x="24" y="28" width="8" height="1" fill="#000" />
                <rect x="24" y="32" width="8" height="1" fill="#000" />
                {/* Recycle Arrows */}
                <path 
                  d="M28 16L32 12L36 16" 
                  stroke="#000" 
                  strokeWidth="1.5" 
                  fill="none"
                />
              </svg>
            </div>
            <span className="text-xs bg-blue-700 px-1 group-hover:bg-blue-800">
              Recycle Bin
            </span>
          </div>
        </div>

        {/* Main Workspace Window */}
        {activeWindow === 'workspaces' && (
          <div className="ml-28 h-full overflow-y-auto">
            <div className="max-w-6xl mx-auto py-8">
              <div className="border-2 border-gray-400 bg-gray-300 mb-4 shadow-lg">
                {/* Window Title Bar */}
                <div className="bg-blue-700 text-white px-2 py-1 flex justify-between items-center">
                  <div className="flex items-center">
                    <FolderIcon className="w-4 h-4 mr-2" />
                    <span className="font-bold">Your Workspaces</span>
                  </div>
                  <div className="flex space-x-1">
                    <div className="w-5 h-5 border-2 border-gray-300 bg-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-400">
                      <span className="text-xs">_</span>
                    </div>
                    <div className="w-5 h-5 border-2 border-gray-300 bg-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-400">
                      <span className="text-xs">□</span>
                    </div>
                    <div 
                      className="w-5 h-5 border-2 border-gray-300 bg-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-400"
                      onClick={() => setActiveWindow('')}
                    >
                      <span className="text-xs">×</span>
                    </div>
                  </div>
                </div>
                
                {/* Window Content */}
                <div className="p-4 bg-gray-200">
                  {/* Workspaces Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {/* Create New Workspace Card */}
                    <div
                      onClick={() => setShowCreateModal(true)}
                      className="border-2 border-gray-400 bg-gray-100 p-4 cursor-pointer hover:border-blue-500 hover:shadow-md"
                    >
                      <div className="w-16 h-16 bg-blue-700 flex items-center justify-center mx-auto mb-2 hover:bg-blue-800">
                        <PlusIcon className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="font-bold text-center mb-1">New Workspace</h3>
                      <p className="text-xs text-center text-gray-700">
                        Create a new workspace
                      </p>
                    </div>

                    {/* Existing Workspaces */}
                    {workspaces.map((workspace) => (
                      <div
                        key={workspace.id}
                        onClick={() => handleWorkspaceClick(workspace)} 
                        className="border-2 border-gray-400 bg-gray-100 p-4 cursor-pointer hover:border-blue-500 hover:shadow-md"
                      >
                        <div className="flex items-start mb-2">
                          <div className={`w-10 h-10 ${workspace.color} flex items-center justify-center mr-2`}>
                            <FolderIcon className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-bold text-sm">{workspace.name}</h3>
                            <p className="text-xs text-gray-600">
                              Created {workspace.createdAt.toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        {workspace.description && (
                          <p className="text-xs text-gray-700 mt-1">
                            {workspace.description}
                          </p>
                        )}
                        <div className="mt-2 text-xs text-blue-700 font-bold">
                          Double-click to open
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* My Computer Window */}
        {activeWindow === 'my-computer' && (
          <div className="absolute left-1/4 top-1/4 w-96 border-2 border-gray-400 bg-gray-300 shadow-lg">
            <div className="bg-blue-700 text-white px-2 py-1 flex justify-between items-center">
              <div className="flex items-center">
                <HardDrive className="w-4 h-4 mr-2" />
                <span className="font-bold">My Computer</span>
              </div>
              <div className="flex space-x-1">
                <div className="w-5 h-5 border-2 border-gray-300 bg-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-400">
                  <span className="text-xs">_</span>
                </div>
                <div className="w-5 h-5 border-2 border-gray-300 bg-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-400">
                  <span className="text-xs">□</span>
                </div>
                <div 
                  className="w-5 h-5 border-2 border-gray-300 bg-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-400"
                  onClick={() => setActiveWindow('')}
                >
                  <span className="text-xs">×</span>
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-200 grid grid-cols-3 gap-4">
              {['Local Disk (C:)', 'Local Disk (D:)', 'CD-ROM (E:)', 'Network', 'Control Panel', 'Printers'].map((item) => (
                <div key={item} className="flex flex-col items-center cursor-pointer">
                  <div className="w-12 h-12 bg-blue-700 flex items-center justify-center mb-1 hover:bg-blue-800">
                    <HardDrive className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xs text-center">{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Shutdown Dialog */}
        {showShutdown && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="border-2 border-gray-400 bg-gray-300 w-80">
              <div className="bg-blue-700 text-white px-2 py-1 flex justify-between items-center">
                <div className="flex items-center">
                  <Power className="w-4 h-4 mr-2" />
                  <span className="font-bold">Shut Down</span>
                </div>
                <div className="flex space-x-1">
                  <div 
                    className="w-5 h-5 border-2 border-gray-300 bg-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-400"
                    onClick={() => setShowShutdown(false)}
                  >
                    <span className="text-xs">×</span>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gray-200">
                <p className="mb-4">Are you sure you want to shut down your computer?</p>
                <div className="flex justify-end space-x-2">
                  <button 
                    className="px-4 py-1 bg-gray-300 border-2 border-gray-400 font-bold hover:bg-gray-400"
                    onClick={() => setShowShutdown(false)}
                  >
                    No
                  </button>
                  <button 
                    className="px-4 py-1 bg-blue-700 text-white border-2 border-gray-400 font-bold hover:bg-blue-800"
                    onClick={() => {
                      // In a real app, this would log the user out
                      alert("System shutting down...");
                      setShowShutdown(false);
                    }}
                  >
                    Yes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Taskbar */}
      <div className="h-10 bg-gray-400 border-t-2 border-gray-300 flex items-center px-2 z-40">
        <button 
          onClick={() => setShowStartMenu(!showStartMenu)}
          className="h-8 px-3 bg-gradient-to-b from-blue-700 to-blue-500 text-white font-bold flex items-center hover:from-blue-800 hover:to-blue-600"
        >
          <Menu className="w-4 h-4 mr-1" />
          Start
        </button>
        
        {/* Taskbar Programs */}
        <div className="flex-1 flex space-x-1 mx-2">
          {activeWindow === 'workspaces' && (
            <button className="h-8 px-3 bg-gradient-to-b from-gray-300 to-gray-200 border-2 border-gray-400 font-bold flex items-center">
              <FolderIcon className="w-4 h-4 mr-1" />
              Your Workspaces
            </button>
          )}
        </div>
        
        {/* System Tray */}
        <div className="flex items-center space-x-1">
          <div className="h-8 px-2 bg-gray-300 border-2 border-gray-400 flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            <span className="text-xs">
              {formatTime(currentTime)}
            </span>
          </div>
        </div>
      </div>

      {/* Start Menu */}
      {showStartMenu && (
        <div className="absolute bottom-10 left-0 w-64 bg-gray-300 border-2 border-gray-400 shadow-lg z-50">
          <div className="bg-blue-700 text-white p-2 font-bold flex items-center">
            <Menu className="w-4 h-4 mr-2" />
            <span>Arbitrage-OS</span>
          </div>
          <div className="p-1">
            <div className="hover:bg-blue-700 hover:text-white p-1 flex items-center cursor-pointer">
              <FolderIcon className="w-4 h-4 mr-2" />
              <span>Programs</span>
              <span className="ml-auto">▶</span>
            </div>
            <div 
              className="hover:bg-blue-700 hover:text-white p-1 flex items-center cursor-pointer"
              onClick={() => {
                setActiveWindow('documents');
                setShowStartMenu(false);
              }}
            >
              <File className="w-4 h-4 mr-2" />
              <span>Documents</span>
            </div>
            <div 
              className="hover:bg-blue-700 hover:text-white p-1 flex items-center cursor-pointer"
              onClick={() => {
                setActiveWindow('my-computer');
                setShowStartMenu(false);
              }}
            >
              <HardDrive className="w-4 h-4 mr-2" />
              <span>My Computer</span>
            </div>
            <div className="border-t border-gray-400 mt-1 pt-1">
              <div 
                className="hover:bg-blue-700 hover:text-white p-1 flex items-center cursor-pointer"
                onClick={() => {
                  setShowShutdown(true);
                  setShowStartMenu(false);
                }}
              >
                <Power className="w-4 h-4 mr-2" />
                <span>Shut Down...</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Workspace Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="border-2 border-gray-400 bg-gray-300 w-full max-w-md">
            <div className="bg-blue-700 text-white px-2 py-1 flex justify-between items-center">
              <div className="flex items-center">
                <FolderIcon className="w-4 h-4 mr-2" />
                <span className="font-bold">Create New Workspace</span>
              </div>
              <div className="flex space-x-1">
                <div className="w-5 h-5 border-2 border-gray-300 bg-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-400">
                  <span className="text-xs">_</span>
                </div>
                <div className="w-5 h-5 border-2 border-gray-300 bg-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-400">
                  <span className="text-xs">□</span>
                </div>
                <div 
                  className="w-5 h-5 border-2 border-gray-300 bg-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-400"
                  onClick={() => setShowCreateModal(false)}
                >
                  <span className="text-xs">×</span>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-gray-200">
              <div className="mb-4">
                <label className="block text-sm font-bold mb-1">
                  Workspace Name:
                </label>
                <input
                  type="text"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  className="w-full px-2 py-1 border-2 border-gray-400 bg-white focus:outline-none focus:border-blue-500"
                  placeholder="My Workspace"
                  autoFocus
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-bold mb-1">
                  Description (optional):
                </label>
                <textarea
                  value={newWorkspaceDescription}
                  onChange={(e) => setNewWorkspaceDescription(e.target.value)}
                  className="w-full px-2 py-1 border-2 border-gray-400 bg-white h-20 focus:outline-none focus:border-blue-500"
                  placeholder="What's this workspace for?"
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-1 bg-gray-300 border-2 border-gray-400 font-bold hover:bg-gray-400 active:border-gray-500 active:bg-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateWorkspace}
                  disabled={!newWorkspaceName.trim()}
                  className="px-4 py-1 bg-blue-700 text-white border-2 border-gray-400 font-bold hover:bg-blue-800 active:border-gray-500 active:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspaceHomePage;