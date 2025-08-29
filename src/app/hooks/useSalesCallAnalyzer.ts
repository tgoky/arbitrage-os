// hooks/useSalesCallAnalyzer.ts
import { useState, useCallback } from 'react';
import { SalesCallInput } from '@/types/salesCallAnalyzer';
import { useWorkspaceContext } from '../hooks/useWorkspaceContext';
export interface AnalysisResponse {
  analysisId: string;
  analysis: any; // GeneratedCallPackage type
}

export interface AnalyticsData {
  totalCalls: number;
  averageScore: number;
  averageDuration: number;
  callTypes: Record<string, number>;
  sentimentDistribution: Record<string, number>;
  timeframe: string;
  trend: { direction: 'up' | 'down' | 'stable', percentage: number };
  topCompanies: Array<{company: string, calls: number, avgScore: number}>;
  performanceInsights: string[];
}

export interface BusinessInsights {
  completenessScore: number;
  recommendations: string[];
  estimatedAccuracy: number;
  analysisComplexity: 'simple' | 'moderate' | 'complex';
}

export function useSalesCallAnalyzer() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
    const { currentWorkspace } = useWorkspaceContext(); 
  
// In hooks/useSalesCallAnalyzer.ts

// Update the analyzeCall function:
const analyzeCall = useCallback(async (input: Omit<SalesCallInput, 'userId'>): Promise<AnalysisResponse> => {
  setLoading(true);
  setError(null);
  
  try {

     if (!currentWorkspace) {
        throw new Error('No workspace selected. Please access the sales call analyzer from within a workspace.');
      }
      
    // Remove userId from the input since it's handled by the API
        const response = await fetch(`/api/sales-call-analyzer?workspaceId=${currentWorkspace.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...input,
          workspaceId: currentWorkspace.id
        })
      });

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Analysis failed');
    }

    return result.data;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'An error occurred';
    setError(errorMessage);
    throw err;
  } finally {
    setLoading(false);
  }
  }, [currentWorkspace]);

  const getAnalysis = useCallback(async (analysisId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/sales-call-analyzer/${analysisId}`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch analysis');
      }

      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateAnalysis = useCallback(async (analysisId: string, updates: Partial<SalesCallInput>) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/sales-call-analyzer/${analysisId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update analysis');
      }

      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteAnalysis = useCallback(async (analysisId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/sales-call-analyzer/${analysisId}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete analysis');
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getUserAnalyses = useCallback(async (workspaceId?: string) => {
     if (!currentWorkspace) {
      console.log('No current workspace, skipping analyses fetch');
      return [];
    }


    setLoading(true);
    setError(null);
    
    try {
 const url = `/api/sales-call-analyzer?workspaceId=${currentWorkspace.id}`;
      const response = await fetch(url);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch analyses');
      }

      return result.data || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      return []; // Return empty array instead of throwing
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace?.id]);

  const getAnalytics = useCallback(async (
    workspaceId?: string,
    timeframe: 'week' | 'month' | 'quarter' = 'month'
  ): Promise<AnalyticsData> => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (workspaceId) params.append('workspaceId', workspaceId);
      params.append('timeframe', timeframe);

      const response = await fetch(`/api/sales-call-analyzer/analytics?${params.toString()}`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch analytics');
      }

      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch analytics';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const exportAnalysis = useCallback(async (
    analysisId: string, 
    format: 'summary' | 'detailed' | 'presentation' | 'follow-up' = 'summary'
  ) => {
    try {
      const response = await fetch(`/api/sales-call-analyzer/export/${analysisId}?format=${format}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Export failed' }));
        throw new Error(errorData.error || 'Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `call-analysis-${format}-${analysisId}.md`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Export failed';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const bulkImport = useCallback(async (calls: SalesCallInput[]) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/sales-call-analyzer/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calls })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to import calls');
      }

      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Bulk import failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

const validateInput = useCallback((input: Partial<SalesCallInput>) => {
  const errors: string[] = [];

  if (!input.title?.trim()) {
    errors.push('Call title is required');
  }

  if (!input.callType) {
    errors.push('Call type is required');
  }

   // FIX: Remove recordingUrl check since we're text-only
  if (!input.transcript?.trim()) {
    errors.push('Transcript is required');
  }

  if (input.transcript && input.transcript.length < 50) {
    errors.push('Transcript must be at least 50 characters for meaningful analysis');
  }

  if (input.prospectEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.prospectEmail)) {
    errors.push('Invalid prospect email format');
  }

  if (input.companyWebsite && !/^https?:\/\/.+/.test(input.companyWebsite)) {
    errors.push('Company website must be a valid URL');
  }

  if (input.prospectLinkedin && !/^https?:\/\/(www\.)?linkedin\.com\//.test(input.prospectLinkedin)) {
    errors.push('Invalid LinkedIn URL format');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}, []);

  const generateBusinessInsights = useCallback((input: Partial<SalesCallInput>): BusinessInsights => {
    const insights: BusinessInsights = {
      completenessScore: 0,
      recommendations: [],
      estimatedAccuracy: 50,
      analysisComplexity: 'simple'
    };

    // Calculate completeness score
    const fields = [
      input.title,
      input.prospectName,
      input.companyName,
      input.companyIndustry,
      input.transcript,
      input.additionalContext
    ];
    
    insights.completenessScore = Math.round((fields.filter(Boolean).length / fields.length) * 100);

    // Generate recommendations
    if (!input.prospectName) {
      insights.recommendations.push('Add prospect name for personalized insights');
    }

    if (!input.companyName) {
      insights.recommendations.push('Include company name for better context analysis');
    }

    if (!input.companyIndustry) {
      insights.recommendations.push('Specify industry for relevant benchmarking');
    }

    if (!input.additionalContext) {
      insights.recommendations.push('Provide context or goals for more targeted analysis');
    }

    if (input.transcript && input.transcript.length < 500) {
      insights.recommendations.push('Longer transcripts provide more detailed insights');
    }

    if (!input.specificQuestions?.length) {
      insights.recommendations.push('Add specific questions for focused analysis');
    }

    // Estimate accuracy
    const transcriptLength = input.transcript?.length || 0;
    const hasContext = Boolean(input.additionalContext);
    const hasGoals = Boolean(input.specificQuestions?.length);
    
    insights.estimatedAccuracy = Math.min(95, Math.round(
      40 + 
      (transcriptLength > 500 ? 25 : transcriptLength > 200 ? 15 : 5) +
      (insights.completenessScore * 0.3) +
      (hasContext ? 10 : 0) +
      (hasGoals ? 10 : 0)
    ));

    // Determine complexity
    const complexityFactors = [
      input.specificQuestions?.length || 0,
      input.analysisGoals?.length || 0,
      transcriptLength > 2000 ? 1 : 0,
      hasContext ? 1 : 0
    ];
    
    const complexityScore = complexityFactors.reduce((sum, factor) => sum + factor, 0);
    
    if (complexityScore <= 2) {
      insights.analysisComplexity = 'simple';
    } else if (complexityScore <= 5) {
      insights.analysisComplexity = 'moderate';
    } else {
      insights.analysisComplexity = 'complex';
    }

    return insights;
  }, []);

  return {
    // Core operations
    analyzeCall,
    getAnalysis,
    updateAnalysis,
    deleteAnalysis,
    getUserAnalyses,
    
    // Analytics and exports
    getAnalytics,
    exportAnalysis,
    bulkImport,
    
    // Utilities
    validateInput,
    generateBusinessInsights,
    
    // State
    loading,
    error,
    
    // Clear error
    clearError: useCallback(() => setError(null), [])
  };
}