// hooks/useOptimizedWorkDashboard.ts - Fixed Authentication
import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export interface WorkItem {
  id: string;
  type: 'sales-call' | 'growth-plan' | 'pricing-calc' | 'niche-research' | 'cold-email' | 'offer-creator';
  title: string;
  subtitle: string;
  status: 'completed' | 'processing' | 'failed' | 'draft';
  createdAt: string;
  metadata: Record<string, any>;
  actions: string[];
  rawData: any;
}

interface DashboardResponse {
  items: WorkItem[];
  cached: boolean;
  timestamp: string;
  authMethod?: string;
}

export function useOptimizedWorkDashboard(workspaceId?: string) {
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [cacheHit, setCacheHit] = useState(false);

  // Create Supabase client with better error handling
  const supabase = createClientComponentClient();

  // Clear corrupted auth data
  const clearCorruptedAuth = useCallback(async () => {
    try {
      console.log('🧹 Clearing potentially corrupted auth data...');
      
      // Clear all Supabase-related localStorage items
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('sb-')) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => {
        console.log(`🗑️ Removing corrupted key: ${key}`);
        localStorage.removeItem(key);
      });

      // Sign out to clear any cached session
      await supabase.auth.signOut();
      
      console.log('✅ Auth data cleared');
      return true;
    } catch (error) {
      console.error('❌ Error clearing auth data:', error);
      return false;
    }
  }, [supabase]);

  // Enhanced authentication with retry logic
  const getValidSession = useCallback(async (retryCount = 0): Promise<any> => {
    const maxRetries = 2;
    
    try {
      console.log(`🔐 Getting session (attempt ${retryCount + 1}/${maxRetries + 1})...`);
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('❌ Session error:', sessionError);
        
        // If it's a parsing error and we haven't retried yet, clear corrupted data
        if (sessionError.message?.includes('JSON') && retryCount === 0) {
          console.log('🔄 Detected JSON parsing error, clearing corrupted auth data...');
          await clearCorruptedAuth();
          
          // Wait a bit for cleanup to complete
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Retry getting session
          return getValidSession(retryCount + 1);
        }
        
        throw new Error(`Authentication error: ${sessionError.message}`);
      }
      
      if (!session?.access_token) {
        console.error('❌ No valid session or access token found');
        
        // Try to refresh if we haven't retried yet
        if (retryCount === 0) {
          console.log('🔄 Attempting to refresh session...');
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError || !refreshData.session?.access_token) {
            console.error('❌ Session refresh failed:', refreshError);
            throw new Error('No active session found. Please sign in again.');
          }
          
          console.log('✅ Session refreshed successfully');
          return refreshData.session;
        }
        
        throw new Error('No authentication found. Please sign in.');
      }
      
      console.log('✅ Valid session obtained:', {
        userId: session.user?.id,
        tokenLength: session.access_token.length
      });
      
      return session;
      
    } catch (error) {
      if (retryCount < maxRetries) {
        console.log(`🔄 Retrying session fetch (${retryCount + 1}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return getValidSession(retryCount + 1);
      }
      
      throw error;
    }
  }, [supabase, clearCorruptedAuth]);

  // Fast cached fetch with robust authentication
  const fetchWorkItems = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    
    const startTime = Date.now();
    
    try {
      console.log(`🚀 ${forceRefresh ? 'Force refreshing' : 'Loading'} work items...`);
      
      // Get valid session with retry logic
      const session = await getValidSession();
      
      const params = new URLSearchParams();
      if (workspaceId) params.set('workspaceId', workspaceId);
      if (forceRefresh) params.set('refresh', 'true');
      
      // Make API request with proper auth header
      const response = await fetch(`/api/dashboard/work-items?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          // Add additional headers to help with debugging
          'X-Client-Info': 'dashboard-hook',
          'X-Request-Time': Date.now().toString()
        }
      });
      
      console.log('📡 API Response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // If response isn't JSON, use the status message
        }
        
        if (response.status === 401) {
          // Clear potentially corrupted auth data
          await clearCorruptedAuth();
          errorMessage = 'Session expired. Please refresh the page and sign in again.';
        }
        
        throw new Error(errorMessage);
      }
      
      const result: { success: boolean; data: DashboardResponse; error?: string } = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch work items');
      }
      
      const loadTime = Date.now() - startTime;
      
      console.log(`✅ Work items loaded in ${loadTime}ms`, {
        authMethod: result.data.authMethod,
        cacheStatus: result.data.cached ? 'HIT' : 'MISS',
        itemCount: result.data.items.length
      });
      
      setWorkItems(result.data.items);
      setLastUpdated(new Date(result.data.timestamp));
      setCacheHit(result.data.cached);
      
      // Performance feedback
      if (loadTime < 200) {
        console.log('⚡ Lightning fast load!');
      } else if (loadTime < 1000) {
        console.log('🚀 Fast load!');
      } else {
        console.log('🐌 Slower load - investigating...');
      }
      
      return result.data.items;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch work items';
      console.error('💥 Dashboard fetch error:', err);
      setError(errorMessage);
      
      // Show user-friendly error messages
      if (errorMessage.includes('JSON')) {
        message.error('Authentication data corrupted. Please refresh the page.');
      } else if (errorMessage.includes('401') || errorMessage.includes('authentication')) {
        message.error('Please sign in to view your work.');
      } else {
        message.error('Failed to load work items. Please try again.');
      }
      
      return [];
    } finally {
      setLoading(false);
    }
  }, [workspaceId, getValidSession, clearCorruptedAuth]);

  // Handle actions with enhanced auth
  const handleAction = useCallback(async (action: string, item: WorkItem) => {
    try {
      switch (action) {
        case 'view':
          // Navigate to the specific tool's view page
          const viewUrls = {
            'sales-call': `/sales-call-analyzer/${item.rawData.id}`,
            'growth-plan': `/growth-plans/${item.rawData.id}`,
            'pricing-calc': `/pricing-calculator/${item.rawData.id}`,
            'niche-research': `/niche-research/${item.rawData.id}`,
            'cold-email': `/cold-email/${item.rawData.id}`,
            'offer-creator': `/offer-creator/${item.rawData.id}`,
          };
          window.location.href = viewUrls[item.type] || '/';
          break;

        case 'delete':
          const deleteConfirm = window.confirm('Are you sure you want to delete this item?');
          if (deleteConfirm) {
            setLoading(true);
            
            // Get valid session for delete request
            const session = await getValidSession();
            
            // Call the appropriate delete API with auth
            const deleteResponse = await fetch(`/api/${item.type.replace('-', '-')}/${item.rawData.id}`, {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
              }
            });
            
            if (!deleteResponse.ok) {
              throw new Error('Delete failed');
            }
            
            // Refresh after successful delete
            message.success('Item deleted successfully');
            await fetchWorkItems(true);
          }
          break;

        case 'export':
          message.info('Export functionality available in individual tools');
          break;

        case 'copy':
          if (item.type === 'cold-email' && item.rawData.emails) {
            const emails = typeof item.rawData.emails === 'string' 
              ? JSON.parse(item.rawData.emails) 
              : item.rawData.emails;
              
            const emailsText = emails.map((email: any, index: number) => 
              `Email ${index + 1}:\nSubject: ${email.subject}\n\n${email.body}\n\n---\n\n`
            ).join('');
            
            await navigator.clipboard.writeText(emailsText);
            message.success('Emails copied to clipboard');
          }
          break;

        default:
          message.info(`${action} functionality coming soon`);
      }
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
      message.error(`Failed to ${action} item`);
    } finally {
      setLoading(false);
    }
  }, [fetchWorkItems, getValidSession]);

  // Auto-load on mount with error boundary
  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchWorkItems();
      } catch (error) {
        console.error('Initial data load failed:', error);
      }
    };
    
    loadData();
  }, [fetchWorkItems]);

  // Calculate summary stats
  const summaryStats = {
    total: workItems.length,
    thisMonth: workItems.filter(item => {
      const itemDate = new Date(item.createdAt);
      const thisMonth = new Date();
      thisMonth.setDate(1);
      return itemDate >= thisMonth;
    }).length,
    processing: workItems.filter(item => item.status === 'processing').length,
    completed: workItems.filter(item => item.status === 'completed').length,
    byType: workItems.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  };

  // Filter functions
  const filterByType = useCallback((type: string) => {
    if (type === 'all') return workItems;
    return workItems.filter(item => item.type === type);
  }, [workItems]);

  const filterByStatus = useCallback((status: string) => {
    if (status === 'all') return workItems;
    return workItems.filter(item => item.status === status);
  }, [workItems]);

  const searchItems = useCallback((query: string) => {
    if (!query.trim()) return workItems;
    const lowerQuery = query.toLowerCase();
    return workItems.filter(item => 
      item.title.toLowerCase().includes(lowerQuery) ||
      item.subtitle.toLowerCase().includes(lowerQuery) ||
      Object.values(item.metadata).some(value => 
        typeof value === 'string' && value.toLowerCase().includes(lowerQuery)
      )
    );
  }, [workItems]);

  // Enhanced refresh with better feedback
  const refreshWithFeedback = useCallback(async () => {
    const hide = message.loading('Refreshing your work...', 0);
    try {
      await fetchWorkItems(true);
      hide();
      message.success('Dashboard refreshed successfully!');
    } catch (error) {
      hide();
      console.error('Refresh failed:', error);
    }
  }, [fetchWorkItems]);

  // Performance metrics for debugging
  const getPerformanceMetrics = useCallback(() => {
    return {
      totalItems: workItems.length,
      cacheHit,
      lastUpdated,
      loadTime: lastUpdated ? Date.now() - lastUpdated.getTime() : null,
      breakdown: summaryStats.byType
    };
  }, [workItems, cacheHit, lastUpdated, summaryStats]);

  return {
    // Data
    workItems,
    summaryStats,
    
    // State
    loading,
    error,
    lastUpdated,
    cacheHit,
    
    // Actions
    fetchWorkItems,
    handleAction,
    refreshWithFeedback,
    clearCorruptedAuth, // Export this for manual cleanup if needed
    
    // Filters
    filterByType,
    filterByStatus,
    searchItems,
    
    // Utils
    getPerformanceMetrics,
    clearError: useCallback(() => setError(null), [])
  };
}