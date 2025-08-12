// app/hooks/useWorkspace.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { workspaceService, type Workspace } from '@/services/workspace.service';

interface WorkspaceContextType {
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  isLoading: boolean;
  createWorkspace: (name: string, description?: string) => Promise<Workspace>;
  switchWorkspace: (slug: string) => void;
  deleteWorkspace: (id: string) => Promise<void>;
  refreshWorkspaces: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider = ({ children }: { children: ReactNode }) => {
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const params = useParams();

  // Load workspaces from database
  const loadWorkspaces = async () => {
    try {
      const data = await workspaceService.getWorkspaces();
      setWorkspaces(data);
      
      // Set current workspace based on URL or first available
      if (params?.workspace) {
        const workspace = data.find(w => w.slug === params.workspace);
        if (workspace) {
          setCurrentWorkspace(workspace);
        }
      } else if (data.length > 0 && !currentWorkspace) {
        setCurrentWorkspace(data[0]);
      }
    } catch (error) {
      console.error('Error loading workspaces:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspaces();
  }, [params?.workspace]);

  const createWorkspace = async (name: string, description?: string): Promise<Workspace> => {
    try {
      const newWorkspace = await workspaceService.createWorkspace({
        name,
        description
      });
      
      // Update local state
      setWorkspaces(prev => [newWorkspace, ...prev]);
      setCurrentWorkspace(newWorkspace);
      
      return newWorkspace;
    } catch (error) {
      console.error('Error creating workspace:', error);
      throw error;
    }
  };

  const switchWorkspace = (slug: string) => {
    const workspace = workspaces.find(w => w.slug === slug);
    if (workspace) {
      setCurrentWorkspace(workspace);
      router.push(`/dashboard/${slug}`);
    }
  };

  const deleteWorkspace = async (id: string) => {
    try {
      await workspaceService.deleteWorkspace(id);
      
      // Update local state
      setWorkspaces(prev => prev.filter(w => w.id !== id));
      
      // If deleted workspace was current, switch to another
      if (currentWorkspace?.id === id) {
        const remaining = workspaces.filter(w => w.id !== id);
        if (remaining.length > 0) {
          setCurrentWorkspace(remaining[0]);
          router.push(`/dashboard/${remaining[0].slug}`);
        } else {
          setCurrentWorkspace(null);
          router.push('/');
        }
      }
    } catch (error) {
      console.error('Error deleting workspace:', error);
      throw error;
    }
  };

  const refreshWorkspaces = async () => {
    await loadWorkspaces();
  };

  return (
    <WorkspaceContext.Provider 
      value={{
        currentWorkspace,
        workspaces,
        isLoading,
        createWorkspace,
        switchWorkspace,
        deleteWorkspace,
        refreshWorkspaces
      }}
    >
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