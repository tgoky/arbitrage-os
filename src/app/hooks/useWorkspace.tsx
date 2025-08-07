// hooks/useWorkspace.ts
"use client";

import React, { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface Workspace {
  id: string;
  name: string;
  color: string;
  slug: string;
  createdAt: Date;
  description?: string;
}

interface WorkspaceContextType {
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  isLoading: boolean;
  createWorkspace: (name: string, description?: string) => Promise<Workspace>;
  switchWorkspace: (workspaceSlug: string) => void;
  deleteWorkspace: (workspaceId: string) => Promise<void>;
  updateWorkspace: (workspaceId: string, updates: Partial<Workspace>) => Promise<void>;
  refreshWorkspaces: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider = ({ children }: { children: ReactNode }) => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const params = useParams();

  const createWorkspaceSlug = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };

  const loadWorkspaces = async () => {
    try {
      setIsLoading(true);
      // In a real app, this would be an API call
      const savedWorkspaces = localStorage.getItem('userWorkspaces');
      const parsedWorkspaces: Workspace[] = savedWorkspaces ? JSON.parse(savedWorkspaces) : [];
      
      // Convert date strings back to Date objects
      const workspacesWithDates = parsedWorkspaces.map(ws => ({
        ...ws,
        createdAt: new Date(ws.createdAt)
      }));
      
      setWorkspaces(workspacesWithDates);
      
      // Set current workspace based on route
      if (params?.workspace) {
        const current = workspacesWithDates.find(ws => ws.slug === params.workspace);
        setCurrentWorkspace(current || null);
      }
    } catch (error) {
      console.error('Error loading workspaces:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveWorkspaces = async (workspacesToSave: Workspace[]) => {
    try {
      // In a real app, this would be an API call
      localStorage.setItem('userWorkspaces', JSON.stringify(workspacesToSave));
      setWorkspaces(workspacesToSave);
    } catch (error) {
      console.error('Error saving workspaces:', error);
      throw error;
    }
  };

  const createWorkspace = async (name: string, description?: string): Promise<Workspace> => {
    const slug = createWorkspaceSlug(name);
    
    // Check if slug already exists
    if (workspaces.some(w => w.slug === slug)) {
      throw new Error('A workspace with this name already exists');
    }

    const colors = [
      "bg-blue-500", "bg-indigo-500", "bg-purple-500", "bg-pink-500",
      "bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-500",
      "bg-teal-500", "bg-cyan-500"
    ];

    const newWorkspace: Workspace = {
      id: Date.now().toString(),
      name: name.trim(),
      slug,
      color: colors[Math.floor(Math.random() * colors.length)],
      description: description?.trim() || undefined,
      createdAt: new Date()
    };

    const updatedWorkspaces = [...workspaces, newWorkspace];
    await saveWorkspaces(updatedWorkspaces);
    
    return newWorkspace;
  };

  const switchWorkspace = (workspaceSlug: string) => {
    router.push(`/dashboard/${workspaceSlug}`);
  };

  const deleteWorkspace = async (workspaceId: string) => {
    const updatedWorkspaces = workspaces.filter(ws => ws.id !== workspaceId);
    await saveWorkspaces(updatedWorkspaces);
    
    // If we deleted the current workspace, redirect to home
    if (currentWorkspace?.id === workspaceId) {
      router.push('/');
    }
  };

  const updateWorkspace = async (workspaceId: string, updates: Partial<Workspace>) => {
    const updatedWorkspaces = workspaces.map(ws => 
      ws.id === workspaceId 
        ? { ...ws, ...updates, slug: updates.name ? createWorkspaceSlug(updates.name) : ws.slug }
        : ws
    );
    await saveWorkspaces(updatedWorkspaces);
    
    // Update current workspace if it was modified
    if (currentWorkspace?.id === workspaceId) {
      const updatedCurrent = updatedWorkspaces.find(ws => ws.id === workspaceId);
      setCurrentWorkspace(updatedCurrent || null);
    }
  };

  const refreshWorkspaces = async () => {
    await loadWorkspaces();
  };

  useEffect(() => {
    loadWorkspaces();
  }, [params?.workspace]);

  const value: WorkspaceContextType = {
    currentWorkspace,
    workspaces,
    isLoading,
    createWorkspace,
    switchWorkspace,
    deleteWorkspace,
    updateWorkspace,
    refreshWorkspaces,
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};