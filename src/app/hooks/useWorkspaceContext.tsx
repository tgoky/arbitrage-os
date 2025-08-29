"use client";

import { useWorkspace } from './useWorkspace';

export const useWorkspaceContext = () => {
  const { currentWorkspace, workspaces, isLoading, switchWorkspace } = useWorkspace();
  
  // Get workspace-scoped API endpoint
const getWorkspaceScopedEndpoint = (baseEndpoint: string) => {
  if (!currentWorkspace?.id) { // Check for ID specifically
    console.warn('No workspace ID available for endpoint:', baseEndpoint);
    return baseEndpoint;
  }
  
  try {
    const url = new URL(baseEndpoint, window.location.origin);
    url.searchParams.set('workspaceId', currentWorkspace.id);
    console.log('Built workspace endpoint:', url.toString());
    return url.toString();
  } catch (error) {
    console.error('Failed to build workspace endpoint:', error);
    return baseEndpoint;
  }
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