// app/hooks/useWorkspace.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter, useParams, usePathname } from 'next/navigation';
import { workspaceService, type Workspace, type CreateWorkspaceInput } from '@/services/workspace.service';

interface WorkspaceContextType {
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  isLoading: boolean;
  validationError: string | null;
  createWorkspace: (name: string, description?: string) => Promise<Workspace>;
  updateWorkspace: (id: string, updates: Partial<CreateWorkspaceInput>) => Promise<Workspace>;
  switchWorkspace: (slug: string) => void;
  deleteWorkspace: (id: string) => Promise<void>;
  refreshWorkspaces: () => Promise<void>;
  validateWorkspaceAccess: (slug: string) => Promise<boolean>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider = ({ children }: { children: ReactNode }) => {
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();

  // Validate workspace slug format
  const isValidSlugFormat = (slug: string): boolean => {
    return /^[a-z0-9-]+$/.test(slug) && slug.length >= 2 && slug.length <= 50;
  };

  // Validate workspace access - check if workspace exists and user has access
  const validateWorkspaceAccess = async (slug: string): Promise<boolean> => {
    if (!slug || !isValidSlugFormat(slug)) {
      console.log('Invalid workspace slug format:', slug);
      return false;
    }

    try {
      const workspace = await workspaceService.getWorkspaceBySlug(slug);
      return !!workspace;
    } catch (error) {
      console.error('Workspace validation error:', error);
      return false;
    }
  };

  // Load workspaces from database
  const loadWorkspaces = async () => {
    try {
      setValidationError(null);
      const data = await workspaceService.getWorkspaces();
      console.log('Loaded workspaces:', data);
      setWorkspaces(data);
      
      // Handle workspace validation based on URL
      const workspaceSlug = params?.workspace as string;
      
      if (workspaceSlug) {
        // Validate current workspace from URL
        const isValid = await validateWorkspaceAccess(workspaceSlug);
        
        if (isValid) {
          const workspace = data.find(w => w.slug === workspaceSlug);
          if (workspace) {
            console.log('Setting valid workspace from URL:', workspace);
            setCurrentWorkspace(workspace);
          } else {
            // Workspace exists but not in user's list (shouldn't happen)
            setValidationError('Workspace access denied');
            handleInvalidWorkspace(data);
          }
        } else {
          // Invalid or inaccessible workspace
          setValidationError('Workspace not found or access denied');
          handleInvalidWorkspace(data);
        }
      } else if (data.length > 0 && !currentWorkspace) {
        // No workspace in URL, set first available
        console.log('No workspace in URL, setting first available:', data[0]);
        setCurrentWorkspace(data[0]);
        // Don't auto-redirect here - let the component handle it
      } else if (data.length === 0) {
        // No workspaces available
        setCurrentWorkspace(null);
      }
    } catch (error) {
      console.error('Error loading workspaces:', error);
      setValidationError('Failed to load workspaces');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle invalid workspace scenarios
  const handleInvalidWorkspace = (availableWorkspaces: Workspace[]) => {
    if (availableWorkspaces.length > 0) {
      // Redirect to first available workspace
      const firstWorkspace = availableWorkspaces[0];
      console.log('Redirecting to first available workspace:', firstWorkspace.slug);
      
      // Preserve the current page structure if possible
      const currentPath = pathname || '';
      if (currentPath.includes('/dashboard/')) {
        const pathParts = currentPath.split('/');
        if (pathParts.length >= 3) {
          pathParts[2] = firstWorkspace.slug;
          const newPath = pathParts.join('/');
          router.push(newPath);
        } else {
          router.push(`/dashboard/${firstWorkspace.slug}`);
        }
      } else {
        router.push(`/dashboard/${firstWorkspace.slug}`);
      }
      
      setCurrentWorkspace(firstWorkspace);
    } else {
      // No workspaces available, redirect to workspace creation
      router.push('/');
      setCurrentWorkspace(null);
    }
  };

  useEffect(() => {
    loadWorkspaces();
  }, []);

  // Update current workspace when URL params change
  useEffect(() => {
    const handleWorkspaceChange = async () => {
      const workspaceSlug = params?.workspace as string;
      
      if (workspaceSlug && workspaces.length > 0) {
        // Check if we need to validate and switch workspace
        if (!currentWorkspace || currentWorkspace.slug !== workspaceSlug) {
          setValidationError(null);
          
          // Validate workspace access
          const isValid = await validateWorkspaceAccess(workspaceSlug);
          
          if (isValid) {
            const workspace = workspaces.find(w => w.slug === workspaceSlug);
            if (workspace) {
              console.log('URL changed, updating current workspace:', workspace);
              setCurrentWorkspace(workspace);
            } else {
              // Workspace valid but not in user's list
              setValidationError('Workspace access denied');
              handleInvalidWorkspace(workspaces);
            }
          } else {
            // Invalid workspace in URL
            setValidationError('Invalid workspace');
            handleInvalidWorkspace(workspaces);
          }
        }
      }
    };

    if (workspaces.length > 0) {
      handleWorkspaceChange();
    }
  }, [params?.workspace, workspaces, currentWorkspace, pathname]);

  const createWorkspace = async (name: string, description?: string): Promise<Workspace> => {
    try {
      setValidationError(null);
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
      setValidationError('Failed to create workspace');
      throw error;
    }
  };

  const updateWorkspace = async (id: string, updates: Partial<CreateWorkspaceInput>): Promise<Workspace> => {
    try {
      setValidationError(null);
      const updatedWorkspace = await workspaceService.updateWorkspace(id, updates);
      
      // Update local state - replace the workspace in the array
      setWorkspaces(prev => 
        prev.map(workspace => 
          workspace.id === id ? updatedWorkspace : workspace
        )
      );
      
      // Update current workspace if it's the one being updated
      if (currentWorkspace?.id === id) {
        setCurrentWorkspace(updatedWorkspace);
      }
      
      return updatedWorkspace;
    } catch (error) {
      console.error('Error updating workspace:', error);
      setValidationError('Failed to update workspace');
      throw error;
    }
  };

  // In useWorkspace hook, fix the switchWorkspace function
// In useWorkspace hook, add debouncing
const switchWorkspace = useCallback(async (slug: string) => {
  if (isLoading || !workspaces.length) return;
  
  const workspace = workspaces.find(w => w.slug === slug);
  if (!workspace || workspace.id === currentWorkspace?.id) return;

  setIsLoading(true);
  
  try {
    // Clear all workspace-related data
    if (typeof window !== 'undefined') {
      // Clear localStorage
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('work-items-') || 
            key.startsWith('workspace-') ||
            key.startsWith('deliverables-')) {
          localStorage.removeItem(key);
        }
      });
      
      // Update current workspace
      localStorage.setItem('current-workspace', JSON.stringify(workspace));
    }
    
    // Update state
    setCurrentWorkspace(workspace);
    
    // Dispatch workspace change event
    window.dispatchEvent(new CustomEvent('workspaceChanged', {
      detail: { workspace }
    }));
    
    // Navigate (use replace to avoid history issues)
    router.replace(`/dashboard/${slug}`);
    
  } finally {
    // Add small delay to prevent race conditions
    setTimeout(() => setIsLoading(false), 500);
  }
}, [workspaces, currentWorkspace?.id, isLoading, router]);


  const deleteWorkspace = async (id: string) => {
    try {
      setValidationError(null);
      await workspaceService.deleteWorkspace(id);
      
      // Update local state
      const remaining = workspaces.filter(w => w.id !== id);
      setWorkspaces(remaining);
      
      // If deleted workspace was current, switch to another
      if (currentWorkspace?.id === id) {
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
      setValidationError('Failed to delete workspace');
      throw error;
    }
  };

  const refreshWorkspaces = async () => {
    setIsLoading(true);
    await loadWorkspaces();
  };

  return (
    <WorkspaceContext.Provider 
      value={{
        currentWorkspace,
        workspaces,
        isLoading,
        validationError,
        createWorkspace,
        updateWorkspace,
        switchWorkspace,
        deleteWorkspace,
        refreshWorkspaces,
        validateWorkspaceAccess
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