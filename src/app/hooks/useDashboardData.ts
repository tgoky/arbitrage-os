// hooks/useDashboardData.ts
import { useQuery } from '@tanstack/react-query';
import { useWorkspaceContext } from '../hooks/useWorkspaceContext';

// Types
export interface WorkItem {
  id: string;
  type: 'sales-call' | 'growth-plan' | 'pricing-calc' | 'niche-research' | 'cold-email' | 'offer-creator' | 'ad-writer' | 'n8n-workflow'  | 'proposal' | 'lead-generation';
  title: string;
  subtitle: string;
  status: 'completed' | 'processing' | 'failed' | 'draft';
  createdAt: string;
  metadata: Record<string, any>;
  actions: string[];
  rawData: any;
}

export interface Client {
  id: string;
  name: string;
  email?: string;
  company?: string;
  workspace_id: string;
  created_at: string;
  updated_at: string;
}

export interface Agent {
  id: string;
  name: string;
  description?: string;
  assignedClient?: string;
  status?: string;
  eta?: string;
  workspace_id: string;
  created_at: string;
  updated_at: string;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  assignedClient?: string;
  status?: string;
  eta?: string;
  workspace_id: string;
  created_at: string;
  updated_at: string;
}

export interface Deliverable {
  id: string;
  title: string;
  clientId: string;
  type: string;
  content: any;
  workspace_id: string;
  created_at: string;
  updated_at: string;
}

// Base fetch function with workspace context
// In hooks/useDashboardData.ts, update fetchWithWorkspace:
async function fetchWithWorkspace(endpoint: string, workspaceId?: string) {
  const url = new URL(endpoint, window.location.origin);
  if (workspaceId) {
    url.searchParams.append('workspaceId', workspaceId);
  }

  const response = await fetch(url.toString(), {
    headers: {
      'Content-Type': 'application/json',
      ...(workspaceId && { 'X-Workspace-Id': workspaceId }),
    },
    credentials: 'include',
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Authentication required');
    }
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'API request failed');
  }

  // Return the items array, not the whole data object
  return data.data.items;
}


// Work Items Hook
export const useWorkItems = (maxItems = 100) => {
  const { currentWorkspace, isWorkspaceReady } = useWorkspaceContext();

  return useQuery<WorkItem[]>(
    ['workItems', currentWorkspace?.id, maxItems],
    () => fetchWithWorkspace('/api/dashboard/work-items', currentWorkspace?.id),
    {
      enabled: isWorkspaceReady && !!currentWorkspace,
      staleTime: 2 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
     retry: (failureCount: number, error: unknown) => {
  if (error instanceof Error && error.message === 'Authentication required') return false;
  return failureCount < 3;
},
    }
  );
};

// Clients Hook
export const useClients = () => {
  const { currentWorkspace, isWorkspaceReady } = useWorkspaceContext();

  return useQuery<WorkItem[]>(
    ['clients', currentWorkspace?.id],
    () => fetchWithWorkspace('/api/clients', currentWorkspace?.id),
    {
      enabled: isWorkspaceReady && !!currentWorkspace,
      staleTime: 5 * 60 * 1000,
      cacheTime: 15 * 60 * 1000, // Changed from gcTime
      refetchOnWindowFocus: false,
      retry: (failureCount: number, error: unknown) => {
  if (error instanceof Error && error.message === 'Authentication required') return false;
  return failureCount < 2;
},
    }
  );
};

// Agents Hook
export const useAgents = () => {
  const { currentWorkspace, isWorkspaceReady } = useWorkspaceContext();

   return useQuery<WorkItem[]>(
    ['agents', currentWorkspace?.id],
    () => fetchWithWorkspace('/api/agents', currentWorkspace?.id),
    {
      enabled: isWorkspaceReady && !!currentWorkspace,
      staleTime: 3 * 60 * 1000,
      cacheTime: 10 * 60 * 1000, // Changed from gcTime
      refetchOnWindowFocus: false,
     retry: (failureCount: number, error: unknown) => {
  if (error instanceof Error && error.message === 'Authentication required') return false;
  return failureCount < 2;
},
    }
  );
};

// Workflows Hook
export const useWorkflows = () => {
  const { currentWorkspace, isWorkspaceReady } = useWorkspaceContext();

 return useQuery<WorkItem[]>(
    ['workflows', currentWorkspace?.id],
    () => fetchWithWorkspace('/api/workflows', currentWorkspace?.id),
    {
      enabled: isWorkspaceReady && !!currentWorkspace,
      staleTime: 3 * 60 * 1000,
      cacheTime: 10 * 60 * 1000, // Changed from gcTime
      refetchOnWindowFocus: false,
  retry: (failureCount: number, error: unknown) => {
  if (error instanceof Error && error.message === 'Authentication required') return false;
  return failureCount < 2;
},
    }
  );
};

// Deliverables Hook
export const useDeliverables = () => {
  const { currentWorkspace, isWorkspaceReady } = useWorkspaceContext();

  return useQuery<WorkItem[]>(
    ['deliverables', currentWorkspace?.id],
    () => fetchWithWorkspace('/api/deliverables', currentWorkspace?.id),
    {
      enabled: isWorkspaceReady && !!currentWorkspace,
      staleTime: 2 * 60 * 1000,
      cacheTime: 10 * 60 * 1000, // Changed from gcTime
      refetchOnWindowFocus: true,
      retry: (failureCount: number, error: unknown) => {
  if (error instanceof Error && error.message === 'Authentication required') return false;
  return failureCount < 2;
},
    }
  );
};

// Combined Dashboard Data Hook
export const useDashboardData = () => {
  const workItemsQuery = useWorkItems();

  const isLoading = workItemsQuery.isLoading;
  const isError = workItemsQuery.isError;
  const error = workItemsQuery.error;

  return {
    // Data
    workItems: workItemsQuery.data || [],
    clients: [],
    agents: [],
    workflows: [],
    deliverables: [],
    
    // States
    isLoading,
    isError,
    error,
    
    // Individual query states
    queries: {
      workItems: workItemsQuery,
    },
    
    // Refetch functions
    refetchAll: () => {
      workItemsQuery.refetch();
    },
  };
};