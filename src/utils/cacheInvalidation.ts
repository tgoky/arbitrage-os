// utils/cacheInvalidation.ts
import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

export const useCacheInvalidation = () => {
  const queryClient = useQueryClient();

  // Invalidate all workspace-related data
  const invalidateWorkspaceData = useCallback((workspaceId?: string) => {
    if (workspaceId) {
      // Invalidate specific workspace data
      queryClient.invalidateQueries({
        predicate: (query) => {
          const queryKey = query.queryKey;
          return queryKey.some(key => 
            typeof key === 'string' && 
            (key.includes('workItems') || key.includes('clients') || 
             key.includes('agents') || key.includes('workflows') || 
             key.includes('deliverables'))
          ) && queryKey.includes(workspaceId);
        }
      });
    } else {
      // Invalidate all workspace data
      queryClient.invalidateQueries({
        predicate: (query) => {
          const queryKey = query.queryKey;
          return queryKey.some(key => 
            typeof key === 'string' && 
            (key.includes('workItems') || key.includes('clients') || 
             key.includes('agents') || key.includes('workflows') || 
             key.includes('deliverables'))
          );
        }
      });
    }
  }, [queryClient]);

  // Invalidate work items specifically
  const invalidateWorkItems = useCallback((workspaceId?: string) => {
    queryClient.invalidateQueries({
      queryKey: ['workItems', workspaceId]
    });
  }, [queryClient]);

  // Invalidate user profile data
  const invalidateUserProfile = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ['userProfile']
    });
  }, [queryClient]);

  // Optimistic update for work items
  const optimisticUpdateWorkItem = useCallback((workspaceId: string, updatedItem: any) => {
    queryClient.setQueryData(['workItems', workspaceId], (oldData: any[] = []) => {
      return oldData.map(item => 
        item.id === updatedItem.id ? { ...item, ...updatedItem } : item
      );
    });
  }, [queryClient]);

  // Remove work item optimistically
  const optimisticRemoveWorkItem = useCallback((workspaceId: string, itemId: string) => {
    queryClient.setQueryData(['workItems', workspaceId], (oldData: any[] = []) => {
      return oldData.filter(item => item.id !== itemId);
    });
  }, [queryClient]);

  // Add work item optimistically
  const optimisticAddWorkItem = useCallback((workspaceId: string, newItem: any) => {
    queryClient.setQueryData(['workItems', workspaceId], (oldData: any[] = []) => {
      return [newItem, ...oldData];
    });
  }, [queryClient]);

  // Prefetch data for better UX
  const prefetchWorkspaceData = useCallback(async (workspaceId: string) => {
    const promises = [
      queryClient.prefetchQuery({
        queryKey: ['workItems', workspaceId],
        staleTime: 1 * 60 * 1000, // 1 minute
      }),
      queryClient.prefetchQuery({
        queryKey: ['clients', workspaceId],
        staleTime: 5 * 60 * 1000, // 5 minutes
      }),
      queryClient.prefetchQuery({
        queryKey: ['agents', workspaceId],
        staleTime: 3 * 60 * 1000, // 3 minutes
      }),
    ];

    await Promise.allSettled(promises);
  }, [queryClient]);

  return {
    invalidateWorkspaceData,
    invalidateWorkItems,
    invalidateUserProfile,
    optimisticUpdateWorkItem,
    optimisticRemoveWorkItem,
    optimisticAddWorkItem,
    prefetchWorkspaceData,
  };
};

// Hook for handling workspace switches with proper cache management
export const useWorkspaceSwitch = () => {
  const { invalidateWorkspaceData, prefetchWorkspaceData } = useCacheInvalidation();

  const switchWorkspace = useCallback(async (newWorkspaceId: string, oldWorkspaceId?: string) => {
    // Clear old workspace data
    if (oldWorkspaceId) {
      invalidateWorkspaceData(oldWorkspaceId);
    }

    // Prefetch new workspace data
    await prefetchWorkspaceData(newWorkspaceId);

    // Emit workspace change event for other components
    window.dispatchEvent(new CustomEvent('workspaceChanged', {
      detail: { newWorkspaceId, oldWorkspaceId }
    }));
  }, [invalidateWorkspaceData, prefetchWorkspaceData]);

  return { switchWorkspace };
};