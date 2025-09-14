// hooks/useNicheResearcher.ts - UPDATED TO MATCH NEW API STRUCTURE
import { useState, useCallback} from 'react';
import { message } from 'antd';
// import { NicheResearchInput, GeneratedNicheReport } from '@/types/nicheResearcher';
import { NicheResearchInput, GeneratedNicheReport, MultiNicheReport } from '@/types/nicheResearcher';

export interface NicheReportSummary {
  id: string;
  title: string;
  nicheName: string;
  marketSize: string;
  primaryObjective: string;
  marketType: string;
  budget: string;
  tokensUsed: number;
  generationTime: number;
  createdAt: string;
  updatedAt: string;
  workspace?: {
    id: string;
    name: string;
  };
}

export function useNicheResearcher() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ Simplified API call helper (same pattern as working implementations)
  const handleApiCall = async <T>(
    url: string, 
    options: RequestInit,
    errorMessage: string = 'Operation failed'
  ): Promise<T> => {
    try {
      console.log(`Making API call to: ${url}`);
      
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });

      console.log(`API Response status: ${response.status}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || errorMessage);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || errorMessage);
      }

      return data.data;
    } catch (err) {
      console.error(`API Error for ${url}:`, err);
      throw err;
    }
  };

  // ✅ FIXED useNicheResearcher.ts - Update generateNicheReport method:
const generateNicheReport = async (
  input: NicheResearchInput,
  workspaceId: string // Add workspace parameter
): Promise<{
  reportId: string;
  report: MultiNicheReport;
}> => {
  setLoading(true);
  setError(null);
  
  try {
    console.log('Generating niche report with input:', input);
    
    const requestData = {
      ...input,
      workspaceId // Add workspace ID to request
    };
    
    const response = await handleApiCall<{
      reportId: string;
      report: MultiNicheReport;
    }>(
      '/api/niche-research',
      {
        method: 'POST',
        body: JSON.stringify(requestData)
      },
      'Failed to generate niche report'
    );

    console.log('✅ Received response from API:', response);
    
    message.success('Niche report generated successfully!');
    return response;
  } catch (err) {
    console.error('❌ Generate niche report error:', err);
    const errorMessage = err instanceof Error ? err.message : 'Generation failed';
    setError(errorMessage);
    message.error(errorMessage);
    throw err;
  } finally {
    setLoading(false);
  }
};
 const getNicheReport = useCallback(async (reportId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      return await handleApiCall<any>(
        `/api/niche-research/${reportId}`,
        { method: 'GET' },
        'Failed to fetch report'
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch report';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
     }
  }, []);

  const getUserReports = async (workspaceId?: string): Promise<NicheReportSummary[]> => {
    try {
      const params = new URLSearchParams();
      if (workspaceId) params.set('workspaceId', workspaceId);

      const url = `/api/niche-research${params.toString() ? `?${params.toString()}` : ''}`;
      
      return await handleApiCall<NicheReportSummary[]>(
        url,
        { method: 'GET' },
        'Failed to fetch reports'
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch reports';
      message.error(errorMessage);
      throw err;
    }
  };

  const deleteNicheReport = async (reportId: string): Promise<void> => {
    try {
      await handleApiCall<void>(
        `/api/niche-research/${reportId}`,
        { method: 'DELETE' },
        'Failed to delete report'
      );

      message.success('Report deleted successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete report';
      message.error(errorMessage);
      throw err;
    }
  };

  const exportNicheReport = async (
    reportId: string, 
    format: 'html' | 'json' = 'html'
  ): Promise<void> => {
    try {
      const response = await fetch(`/api/niche-research/export/${reportId}?format=${format}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Export failed');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      
      try {
        a.href = url;
        a.download = `niche-research-report-${reportId}.${format === 'json' ? 'json' : 'html'}`;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
      } finally {
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }

      message.success('Report exported successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Export failed';
      message.error(errorMessage);
      throw err;
    }
  };

  // ✅ UPDATED MARKET ANALYSIS TO MATCH NEW STRUCTURE
  const analyzeMarket = async (options: {
    niche: string;
    skills: string[];
    analysisType?: 'competitive' | 'opportunity' | 'validation' | 'trends';
    
    // New structure fields (matching your niche research)
    primaryObjective?: 'cashflow' | 'equity-exit' | 'lifestyle' | 'audience-build' | 'saas' | 'agency' | 'ecomm';
    riskAppetite?: 'low' | 'medium' | 'high';
    marketType?: 'b2b-saas' | 'b2c-consumer' | 'professional-services' | 'local-business' | 'info-education';
    customerSize?: 'startups' | 'smb' | 'enterprise' | 'consumers' | 'government';
    budget: '<10k' | '10k-50k' | '50k-250k' | '250k+';
    geographicFocus?: 'local' | 'regional' | 'us-only' | 'global';
    timeCommitment?: '5-10' | '10-20' | '20-30' | '30+';
    teamSize?: 'solo' | 'small-team' | 'established-team';
    industries?: string[];
    excludedIndustries?: string[];
    
    // Analysis options
    includeCompetitors?: boolean;
    includeTrends?: boolean;
    includeValidation?: boolean;
  }) => {
    try {
      return await handleApiCall<any>(
        '/api/niche-research/market-analysis',
        {
          method: 'POST',
          body: JSON.stringify({
            ...options,
            analysisType: options.analysisType || 'opportunity',
            includeCompetitors: options.includeCompetitors ?? true,
            includeTrends: options.includeTrends ?? true,
            includeValidation: options.includeValidation ?? false
          })
        },
        'Market analysis failed'
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Market analysis failed';
      message.error(errorMessage);
      throw err;
    }
  };

  // ✅ UPDATED SKILLS SUGGESTIONS TO MATCH NEW API
  const getSkillsSuggestions = async (options?: {
    category?: string;
    search?: string;
  }) => {
    try {
      const params = new URLSearchParams();
      if (options?.category) params.set('category', options.category);
      if (options?.search) params.set('search', options.search);

      const url = `/api/niche-research/skills${params.toString() ? `?${params.toString()}` : ''}`;
      
      return await handleApiCall<any>(
        url,
        { method: 'GET' },
        'Failed to fetch skills suggestions'
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch skills suggestions';
      message.error(errorMessage);
      throw err;
    }
  };

  // ✅ NEW: VALIDATE SKILLS BASED ON NICHE CONTEXT
  const validateSkills = async (options: {
    currentSkills: string[];
    primaryObjective?: string;
    marketType?: string;
    customerSize?: string;
    budget?: string;
    suggestComplementary?: boolean;
  }) => {
    try {
      return await handleApiCall<any>(
        '/api/niche-research/skills',
        {
          method: 'POST',
          body: JSON.stringify({
            ...options,
            suggestComplementary: options.suggestComplementary ?? true
          })
        },
        'Skills validation failed'
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Skills validation failed';
      message.error(errorMessage);
      throw err;
    }
  };

  // ✅ NEW: UPDATE REPORT METADATA (title, tags, etc.)
  const updateNicheReport = async (
    reportId: string,
    updates: {
      title?: string;
      tags?: string[];
    }
  ) => {
    try {
      return await handleApiCall<any>(
        `/api/niche-research/${reportId}`,
        {
          method: 'PUT',
          body: JSON.stringify(updates)
        },
        'Failed to update report'
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update report';
      message.error(errorMessage);
      throw err;
    }
  };

  // ✅ NEW: QUICK COMPETITIVE ANALYSIS
  const quickCompetitiveAnalysis = async (options: {
    niche: string;
    skills: string[];
    budget: '<10k' | '10k-50k' | '50k-250k' | '250k+';
    marketType?: 'b2b-saas' | 'b2c-consumer' | 'professional-services' | 'local-business' | 'info-education';
  }) => {
    return analyzeMarket({
      ...options,
      analysisType: 'competitive',
      includeCompetitors: true,
      includeTrends: false,
      includeValidation: false
    });
  };

  // ✅ NEW: QUICK OPPORTUNITY ANALYSIS  
  const quickOpportunityAnalysis = async (options: {
    niche: string;
    skills: string[];
    budget: '<10k' | '10k-50k' | '50k-250k' | '250k+';
    primaryObjective?: 'cashflow' | 'equity-exit' | 'lifestyle' | 'audience-build' | 'saas' | 'agency' | 'ecomm';
  }) => {
    return analyzeMarket({
      ...options,
      analysisType: 'opportunity',
      includeCompetitors: false,
      includeTrends: true,
      includeValidation: false
    });
  };

  // ✅ NEW: NICHE VALIDATION ANALYSIS
  const validateNicheIdea = async (options: {
    niche: string;
    skills: string[];
    budget: '<10k' | '10k-50k' | '50k-250k' | '250k+';
    riskAppetite?: 'low' | 'medium' | 'high';
    marketType?: 'b2b-saas' | 'b2c-consumer' | 'professional-services' | 'local-business' | 'info-education';
  }) => {
    return analyzeMarket({
      ...options,
      analysisType: 'validation',
      includeCompetitors: true,
      includeTrends: true,
      includeValidation: true
    });
  };

  return {
    // Core niche research functions
    generateNicheReport,
    getNicheReport,
    getUserReports,
    deleteNicheReport,
    updateNicheReport,
    exportNicheReport,
    
    // Market analysis functions (updated structure)
    analyzeMarket,
    quickCompetitiveAnalysis,
    quickOpportunityAnalysis,
    validateNicheIdea,
    
    // Skills functions (updated endpoints)
    getSkillsSuggestions,
    validateSkills,
    
    // State
    loading,
    error,
    setError
  };
}