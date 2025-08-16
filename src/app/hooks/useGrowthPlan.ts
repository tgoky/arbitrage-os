// hooks/useGrowthPlan.ts
import { useState, useEffect, useCallback } from 'react';
import { message, notification } from 'antd';
import {
  GrowthPlanInput,
  GeneratedGrowthPlan,
  SavedGrowthPlan,
  GrowthPlanSummary,
  GrowthPlanAnalytics,
  CreateGrowthPlanRequest,
  CreateGrowthPlanResponse,
  UpdateGrowthPlanRequest,
  UpdateGrowthPlanResponse,
  GetGrowthPlanResponse,
  ListGrowthPlansResponse,
  ExportGrowthPlanResponse,
  GrowthPlanServiceResponse
} from '@/types/growthPlan';

interface UseGrowthPlanOptions {
  workspaceId?: string;
  autoFetch?: boolean;
}

export function useGrowthPlan(options: UseGrowthPlanOptions = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  // State for different operations
  const [generationLoading, setGenerationLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<{ [key: string]: boolean }>({});
  const [exportLoading, setExportLoading] = useState<{ [key: string]: boolean }>({});

  // Data state
  const [plans, setPlans] = useState<GrowthPlanSummary[]>([]);
  const [currentPlan, setCurrentPlan] = useState<SavedGrowthPlan | null>(null);
  const [analytics, setAnalytics] = useState<GrowthPlanAnalytics | null>(null);

  // Cleanup function for aborting requests
  const cleanup = useCallback(() => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
  }, [abortController]);

  // Cleanup on unmount

  useEffect(() => {
  return () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
  };
}, []);

  // Generate a new growth plan
  const generateGrowthPlan = useCallback(async (input: Omit<GrowthPlanInput, 'userId'>): Promise<GeneratedGrowthPlan | null> => {
    cleanup(); // Cancel any existing request
    
    const controller = new AbortController();
    setAbortController(controller);
    setGenerationLoading(true);
    setError(null);
    
    try {
      // Validate required fields before sending
      if (!input.name || !input.clientCompany || !input.industry) {
        throw new Error('Name, client company, and industry are required');
      }

      if (!input.expertise || input.expertise.length === 0) {
        throw new Error('At least one expertise area is required');
      }

      const requestData: CreateGrowthPlanRequest = {
        input,
        workspaceId: options.workspaceId
      };

      const response = await fetch('/api/growth-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
        signal: controller.signal
      });

      const result: GrowthPlanServiceResponse<CreateGrowthPlanResponse> = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || `Server error: ${response.status}`);
      }

      if (result.success && result.data) {
        notification.success({
          message: 'Growth Plan Generated!',
          description: 'Your customized growth plan has been created successfully.',
          placement: 'topRight',
        });

        // Refresh plans list
        await fetchPlans();
        
        return result.data.plan;
      } else {
        throw new Error(result.error || 'Invalid response format');
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('Request was cancelled');
        return null;
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Generation failed';
      setError(errorMessage);
      
      notification.error({
        message: 'Generation Failed',
        description: errorMessage,
        placement: 'topRight',
      });
      
      throw err;
    } finally {
      setGenerationLoading(false);
      setAbortController(null);
    }
  }, [options.workspaceId, cleanup]);

  // Fetch growth plans list
  const fetchPlans = useCallback(async (filters?: {
    industry?: string;
    timeframe?: string;
    limit?: number;
    offset?: number;
  }): Promise<GrowthPlanSummary[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (options.workspaceId) params.set('workspaceId', options.workspaceId);
      if (filters?.industry) params.set('industry', filters.industry);
      if (filters?.timeframe) params.set('timeframe', filters.timeframe);
      if (filters?.limit) params.set('limit', filters.limit.toString());
      if (filters?.offset) params.set('offset', filters.offset.toString());

      const response = await fetch(`/api/growth-plans?${params.toString()}`);
      const result: GrowthPlanServiceResponse<ListGrowthPlansResponse> = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch growth plans');
      }

      if (result.success && result.data) {
        setPlans(result.data.plans);
        return result.data.plans;
      } else {
        throw new Error(result.error || 'Invalid response format');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch plans';
      setError(errorMessage);
      message.error(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, [options.workspaceId]);

  // Fetch a specific growth plan
  const fetchPlan = useCallback(async (planId: string): Promise<SavedGrowthPlan | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/growth-plans/${planId}`);
      const result: GrowthPlanServiceResponse<GetGrowthPlanResponse> = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch growth plan');
      }

      if (result.success && result.data) {
        setCurrentPlan(result.data.plan);
        return result.data.plan;
      } else {
        throw new Error(result.error || 'Invalid response format');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch plan';
      setError(errorMessage);
      message.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update a growth plan
  const updatePlan = useCallback(async (
    planId: string, 
    updates: Partial<Omit<GrowthPlanInput, 'userId'>>
  ): Promise<SavedGrowthPlan | null> => {
    setUpdateLoading(true);
    setError(null);
    
    try {
      const requestData: UpdateGrowthPlanRequest = {
        planId,
        updates
      };

      const response = await fetch(`/api/growth-plans/${planId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      const result: GrowthPlanServiceResponse<UpdateGrowthPlanResponse> = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update growth plan');
      }

      if (result.success && result.data) {
        notification.success({
          message: 'Plan Updated!',
          description: 'Your growth plan has been updated successfully.',
          placement: 'topRight',
        });

        // Refresh current plan if it's the one being updated
        if (currentPlan?.id === planId) {
          await fetchPlan(planId);
        }
        
        // Refresh plans list
        await fetchPlans();
        
        return currentPlan;
      } else {
        throw new Error(result.error || 'Invalid response format');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update plan';
      setError(errorMessage);
      
      notification.error({
        message: 'Update Failed',
        description: errorMessage,
        placement: 'topRight',
      });
      
      return null;
    } finally {
      setUpdateLoading(false);
    }
  }, [currentPlan, fetchPlan, fetchPlans]);

  // Delete a growth plan
  const deletePlan = useCallback(async (planId: string): Promise<boolean> => {
    setDeleteLoading(prev => ({ ...prev, [planId]: true }));
    setError(null);
    
    try {
      const response = await fetch(`/api/growth-plans/${planId}`, {
        method: 'DELETE'
      });

      const result: GrowthPlanServiceResponse = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete growth plan');
      }

      if (result.success) {
        message.success('Growth plan deleted successfully');
        
        // Remove from local state
        setPlans(prev => prev.filter(plan => plan.id !== planId));
        
        // Clear current plan if it's the one being deleted
        if (currentPlan?.id === planId) {
          setCurrentPlan(null);
        }
        
        return true;
      } else {
        throw new Error(result.error || 'Delete operation failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete plan';
      setError(errorMessage);
      message.error(errorMessage);
      return false;
    } finally {
      setDeleteLoading(prev => ({ ...prev, [planId]: false }));
    }
  }, [currentPlan]);

  // Export a growth plan
  const exportPlan = useCallback(async (
    planId: string, 
    format: 'pdf' | 'word' | 'markdown' = 'markdown'
  ): Promise<string | null> => {
    setExportLoading(prev => ({ ...prev, [planId]: true }));
    setError(null);
    
    try {
      const response = await fetch(`/api/growth-plans/${planId}/export?format=${format}`);
      const result: GrowthPlanServiceResponse<ExportGrowthPlanResponse> = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to export growth plan');
      }

      if (result.success && result.data) {
        // Create download
        const blob = new Blob([result.data.content], { type: result.data.mimeType });
        const url = URL.createObjectURL(blob);
        
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = result.data.filename;
        anchor.style.display = 'none';
        
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        
        URL.revokeObjectURL(url);
        
        message.success('Growth plan exported successfully');
        return result.data.content;
      } else {
        throw new Error(result.error || 'Export failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export plan';
      setError(errorMessage);
      message.error(errorMessage);
      return null;
    } finally {
      setExportLoading(prev => ({ ...prev, [planId]: false }));
    }
  }, []);

  // Search growth plans
  const searchPlans = useCallback(async (
    query: string,
    filters?: {
      industry?: string;
      timeframe?: string;
      workspaceId?: string;
    }
  ): Promise<GrowthPlanSummary[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      params.set('q', query);
      if (filters?.industry) params.set('industry', filters.industry);
      if (filters?.timeframe) params.set('timeframe', filters.timeframe);
      if (filters?.workspaceId || options.workspaceId) {
        params.set('workspaceId', filters?.workspaceId || options.workspaceId!);
      }

      const response = await fetch(`/api/growth-plans/search?${params.toString()}`);
      const result: GrowthPlanServiceResponse<ListGrowthPlansResponse> = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Search failed');
      }

      if (result.success && result.data) {
        return result.data.plans;
      } else {
        throw new Error(result.error || 'Invalid response format');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      setError(errorMessage);
      message.error(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, [options.workspaceId]);

  // Fetch analytics
  const fetchAnalytics = useCallback(async (
    timeframe: 'week' | 'month' | 'quarter' = 'month'
  ): Promise<GrowthPlanAnalytics | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      params.set('timeframe', timeframe);
      if (options.workspaceId) params.set('workspaceId', options.workspaceId);

      const response = await fetch(`/api/growth-plans/analytics?${params.toString()}`);
      const result: GrowthPlanServiceResponse<GrowthPlanAnalytics> = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch analytics');
      }

      if (result.success && result.data) {
        setAnalytics(result.data);
        return result.data;
      } else {
        throw new Error(result.error || 'Invalid response format');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch analytics';
      setError(errorMessage);
      message.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [options.workspaceId]);

  // Bulk delete plans
  const bulkDeletePlans = useCallback(async (planIds: string[]): Promise<number> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/growth-plans/bulk', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planIds })
      });

      const result: GrowthPlanServiceResponse<{ deletedCount: number }> = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Bulk delete failed');
      }

      if (result.success && result.data) {
        message.success(`Successfully deleted ${result.data.deletedCount} plans`);
        
        // Remove from local state
        setPlans(prev => prev.filter(plan => !planIds.includes(plan.id)));
        
        // Clear current plan if it was deleted
        if (currentPlan && planIds.includes(currentPlan.id)) {
          setCurrentPlan(null);
        }
        
        return result.data.deletedCount;
      } else {
        throw new Error(result.error || 'Bulk delete failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Bulk delete failed';
      setError(errorMessage);
      message.error(errorMessage);
      return 0;
    } finally {
      setLoading(false);
    }
  }, [currentPlan]);

  // Template management
  const createTemplate = useCallback(async (
    name: string,
    description: string,
    template: Partial<GrowthPlanInput>
  ): Promise<string | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/growth-plans/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, template })
      });

      const result: GrowthPlanServiceResponse<{ templateId: string }> = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create template');
      }

      if (result.success && result.data) {
        message.success('Template created successfully');
        return result.data.templateId;
      } else {
        throw new Error(result.error || 'Template creation failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create template';
      setError(errorMessage);
      message.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTemplates = useCallback(async (): Promise<Array<{
    id: string;
    name: string;
    description: string;
    template: Partial<GrowthPlanInput>;
    createdAt: Date;
  }>> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/growth-plans/templates');
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch templates');
      }

      if (result.success && result.data) {
        return result.data.templates;
      } else {
        throw new Error(result.error || 'Failed to fetch templates');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch templates';
      setError(errorMessage);
      message.error(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Clear error state
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (options.autoFetch) {
      fetchPlans();
    }
  }, [options.autoFetch, fetchPlans]);

  return {
    // State
    loading,
    generationLoading,
    updateLoading,
    deleteLoading,
    exportLoading,
    error,
    plans,
    currentPlan,
    analytics,

    // Actions
    generateGrowthPlan,
    fetchPlans,
    fetchPlan,
    updatePlan,
    deletePlan,
    exportPlan,
    searchPlans,
    fetchAnalytics,
    bulkDeletePlans,
    createTemplate,
    fetchTemplates,
    clearError,
    cleanup,

    // Utilities
    setCurrentPlan,
    setPlans
  };
}