// hooks/useGrowthPlan.ts - ALL ISSUES FIXED
import { useState, useEffect, useCallback, useRef } from 'react';
import { message, notification } from 'antd';
import { useWorkspaceContext } from '../hooks/useWorkspaceContext';
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
  // ✅ FIXED: Mounted state tracking
    const { currentWorkspace } = useWorkspaceContext();
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const isMounted = () => isMountedRef.current;

  // Loading states
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

  // ✅ FIXED: fetchPlan DECLARED BEFORE generateGrowthPlan
  const fetchPlan = useCallback(async (planId: string): Promise<SavedGrowthPlan | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/growth-plans/${planId}`);
      const result: GrowthPlanServiceResponse<GetGrowthPlanResponse> = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch growth plan');
      }

      if (result.success && result.data && isMounted()) {
        setCurrentPlan(result.data.plan);
        return result.data.plan;
      } else {
        throw new Error(result.error || 'Invalid response format');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch plan';
      if (isMounted()) {
        setError(errorMessage);
        message.error(errorMessage);
      }
      return null;
    } finally {
      if (isMounted()) {
        setLoading(false);
      }
    }
  }, []);

  // ✅ FIXED: fetchPlans with isMounted checks
  const fetchPlans = useCallback(async (filters?: {
    industry?: string;
    timeframe?: string;
    limit?: number;
    offset?: number;
 }): Promise<GrowthPlanSummary[]> => {
    if (!currentWorkspace) {
      console.log('No current workspace, skipping growth plans fetch');
      return [];
    }
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
         params.set('workspaceId', currentWorkspace.id);
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

      if (result.success && result.data && isMounted()) {
        setPlans(result.data.plans);
        return result.data.plans;
      } else {
        throw new Error(result.error || 'Invalid response format');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch plans';
      if (isMounted()) {
        setError(errorMessage);
        message.error(errorMessage);
      }
      return [];
    } finally {
      if (isMounted()) {
        setLoading(false);
      }
    }
  }, [currentWorkspace?.id]); 

  // ✅ FIXED: generateGrowthPlan with proper isMounted calls
  const generateGrowthPlan = useCallback(async (input: Omit<GrowthPlanInput, 'userId'>): Promise<GeneratedGrowthPlan | null> => {
        if (!currentWorkspace) {
      throw new Error('No workspace selected. Please access the growth plan creator from within a workspace.');
    }
    cleanup();
    
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
      workspaceId: currentWorkspace.id // Use current workspace instead of options
    };


      console.log('🚀 Generating growth plan with data:', {
        clientCompany: input.clientCompany,
        industry: input.industry,
        timeframe: input.timeframe
      });

      const response = await fetch('/api/growth-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
        signal: controller.signal
      });

      const result: GrowthPlanServiceResponse<CreateGrowthPlanResponse> = await response.json();
      
      console.log('📊 Generation response:', {
        ok: response.ok,
        status: response.status,
        success: result.success,
        hasPlanId: !!result.data?.planId,
        hasPlan: !!result.data?.plan
      });
      
      if (!response.ok) {
        throw new Error(result.error || `Server error: ${response.status}`);
      }

      if (result.success && result.data && isMounted()) {
        const { planId, plan } = result.data;
        
        // ✅ SUCCESS: Plan was generated and saved to database
        notification.success({
          message: 'Growth Plan Created!',
          description: `Your growth plan for ${input.clientCompany} has been saved successfully.`,
          placement: 'topRight',
        });
        
        console.log('✅ Plan created successfully:', {
          planId,
          saved: !!planId,
          tokensUsed: plan.tokensUsed
        });

        // ✅ FIXED: Call isMounted as function
        if (planId && isMounted()) {
          console.log('🔄 Fetching full saved plan...');
          try {
            const savedPlan = await fetchPlan(planId);
            if (savedPlan && isMounted()) {
              console.log('✅ Full plan loaded, setting as current');
              setCurrentPlan(savedPlan);
            }
          } catch (fetchError) {
            console.warn('⚠️ Could not fetch saved plan, creating temporary:', fetchError);
            
            if (isMounted()) {
              // ✅ Fallback: Create temporary plan object for viewing
              const tempPlan: SavedGrowthPlan = {
                id: planId,
                title: `Growth Plan - ${input.clientCompany}`,
                plan,
                metadata: {
                  clientCompany: input.clientCompany,
                  industry: input.industry,
                  timeframe: input.timeframe,
                  contactName: input.contactName || '',
                  contactRole: input.contactRole || '',
                  generatedAt: new Date().toISOString(),
                  tokensUsed: plan.tokensUsed,
                  generationTime: plan.generationTime,
                  consultant: {
                    name: input.name,
                    company: input.company,
                    expertise: input.expertise
                  }
                },
                createdAt: new Date(),
                updatedAt: new Date()
              };
              
              setCurrentPlan(tempPlan);
            }
          }
        } else {
          console.warn('⚠️ No planId returned, plan may not have been saved');
        }
        
        // ✅ Refresh the plans list
        await fetchPlans();
        
        return plan;
      } else {
        throw new Error(result.error || 'Invalid response format');
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('Request was cancelled');
        return null;
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Generation failed';
      
      if (isMounted()) {
        setError(errorMessage);
        notification.error({
          message: 'Generation Failed',
          description: errorMessage,
          placement: 'topRight',
        });
      }
      
      throw err;
    } finally {
      if (isMounted()) {
        setGenerationLoading(false);
        setAbortController(null);
      }
    }
  }, [currentWorkspace, cleanup, fetchPlans, fetchPlan]); 

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

      if (result.success && result.data && isMounted()) {
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
      
      if (isMounted()) {
        setError(errorMessage);
        notification.error({
          message: 'Update Failed',
          description: errorMessage,
          placement: 'topRight',
        });
      }
      
      return null;
    } finally {
      if (isMounted()) {
        setUpdateLoading(false);
      }
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

      if (result.success && isMounted()) {
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
      if (isMounted()) {
        setError(errorMessage);
        message.error(errorMessage);
      }
      return false;
    } finally {
      if (isMounted()) {
        setDeleteLoading(prev => ({ ...prev, [planId]: false }));
      }
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

      if (result.success && result.data && isMounted()) {
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
      if (isMounted()) {
        setError(errorMessage);
        message.error(errorMessage);
      }
      return null;
    } finally {
      if (isMounted()) {
        setExportLoading(prev => ({ ...prev, [planId]: false }));
      }
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
      console.log("Growth Plan API Response Status:", response.status);
console.log("Growth Plan API Response Body:", result); // <-- Add this
      
      if (!response.ok) {
          console.error("Growth Plan API Error Response:", result);
        throw new Error(result.error || 'Search failed');
      }

      if (result.success && result.data) {
         console.log("Growth Plan Data to Return/Store:", result.data.plans);
        return result.data.plans;
      } else {
          console.error("Growth Plan API Success=false or Missing Data:", result);
        throw new Error(result.error || 'Invalid response format');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      if (isMounted()) {
        setError(errorMessage);
        message.error(errorMessage);
      }
      return [];
    } finally {
      if (isMounted()) {
        setLoading(false);
      }
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

      console.log('📊 Fetching real analytics from:', `/api/growth-plans/analytics?${params.toString()}`);
      
      const response = await fetch(`/api/growth-plans/analytics?${params.toString()}`);
      const result: GrowthPlanServiceResponse<GrowthPlanAnalytics> = await response.json();
      
      console.log('📊 Analytics response:', { 
        ok: response.ok, 
        status: response.status, 
        success: result.success,
        hasData: !!result.data,
        totalPlans: result.data?.totalPlans
      });
      
      if (!response.ok) {
        console.warn('⚠️ Analytics API returned non-200 status:', response.status, result.error);
        return null;
      }

      if (result.success && result.data && isMounted()) {
        console.log('✅ Real analytics loaded successfully:');
        console.log('- Total plans:', result.data.totalPlans);
        console.log('- Recent plans:', result.data.plansThisMonth);
        console.log('- Top industries:', result.data.topIndustries?.length);
        
        setAnalytics(result.data);
        return result.data;
      } else {
        console.warn('⚠️ Analytics response format issue:', result);
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch analytics';
      console.warn('⚠️ Analytics fetch error (non-critical):', errorMessage);
      return null;
    } finally {
      if (isMounted()) {
        setLoading(false);
      }
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

      if (result.success && result.data && isMounted()) {
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
      if (isMounted()) {
        setError(errorMessage);
        message.error(errorMessage);
      }
      return 0;
    } finally {
      if (isMounted()) {
        setLoading(false);
      }
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

      if (result.success && result.data && isMounted()) {
        message.success('Template created successfully');
        return result.data.templateId;
      } else {
        throw new Error(result.error || 'Template creation failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create template';
      if (isMounted()) {
        setError(errorMessage);
        message.error(errorMessage);
      }
      return null;
    } finally {
      if (isMounted()) {
        setLoading(false);
      }
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
      if (isMounted()) {
        setError(errorMessage);
        message.error(errorMessage);
      }
      return [];
    } finally {
      if (isMounted()) {
        setLoading(false);
      }
    }
  }, []);

  // Clear error state
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortController) {
        abortController.abort();
        setAbortController(null);
      }
    };
  }, [abortController]);

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (options.autoFetch) {
      fetchPlans();
    }
  }, [options.autoFetch, fetchPlans]);

  // ✅ FIXED: Analytics loading without dependencies issues
  useEffect(() => {
    if (options.autoFetch) {
      fetchAnalytics('month').catch(error => {
        console.warn('Background analytics load failed:', error);
      });
    }
  }, [fetchAnalytics, options.autoFetch]);

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