// app/hooks/useWorkspaceContext.tsx
"use client";

import { useEffect } from 'react';
import { useWorkspace } from './useWorkspace';
import { useRouter } from 'next/navigation';

/**
 * Hook to manage workspace context and ensure data isolation
 * This hook should be used in components that need workspace-scoped data
 */
export const useWorkspaceContext = () => {
  const { currentWorkspace, workspaces, isLoading, switchWorkspace } = useWorkspace();
  const router = useRouter();

  // Ensure workspace context is properly maintained
  useEffect(() => {
    if (typeof window !== 'undefined' && currentWorkspace) {
      // Store current workspace in localStorage for data provider
      localStorage.setItem('current-workspace', JSON.stringify(currentWorkspace));
      
      // Dispatch custom event for other components to listen to workspace changes
      window.dispatchEvent(new CustomEvent('workspaceChanged', {
        detail: { workspace: currentWorkspace }
      }));
    }
  }, [currentWorkspace]);

  // Clear workspace data when switching workspaces
  const switchWorkspaceWithCleanup = (slug: string) => {
    if (typeof window !== 'undefined') {
      // Clear any cached workspace-specific data
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.startsWith('deliverables-') ||
          key.startsWith('clients-') ||
          key.startsWith('agents-') ||
          key.startsWith('workflows-')
        )) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    }
    
    switchWorkspace(slug);
  };

  // Get workspace-scoped filter for API calls
  const getWorkspaceFilter = () => {
    if (!currentWorkspace) return [];
    
    return [{
      field: 'workspace_id',
      operator: 'eq',
      value: currentWorkspace.id
    }];
  };

  // Verify current workspace access
  const verifyWorkspaceAccess = async (resourceWorkspaceId?: string) => {
    if (!currentWorkspace) return false;
    if (!resourceWorkspaceId) return true;
    
    return resourceWorkspaceId === currentWorkspace.id;
  };

  // Get workspace-scoped API endpoint
  const getWorkspaceScopedEndpoint = (baseEndpoint: string) => {
    if (!currentWorkspace) return baseEndpoint;
    
    const url = new URL(baseEndpoint, window.location.origin);
    url.searchParams.set('workspaceId', currentWorkspace.id);
    return url.toString();
  };

  return {
    currentWorkspace,
    workspaces,
    isLoading,
    switchWorkspace: switchWorkspaceWithCleanup,
    getWorkspaceFilter,
    verifyWorkspaceAccess,
    getWorkspaceScopedEndpoint,
    isWorkspaceReady: !isLoading && !!currentWorkspace
  };
};