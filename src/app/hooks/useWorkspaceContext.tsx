"use client";

import { useWorkspace } from './useWorkspace';

export const useWorkspaceContext = () => {
  const { currentWorkspace, workspaces, isLoading, switchWorkspace } = useWorkspace();
  
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
    switchWorkspace,
    isWorkspaceReady: !isLoading && !!currentWorkspace,
    getWorkspaceScopedEndpoint,
  };
};