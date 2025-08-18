
// hooks/useNicheResearcher.ts - SIMPLIFIED VERSION (matching working pattern)
import { useState } from 'react';
import { message } from 'antd';
import { NicheResearchInput, GeneratedNicheReport } from '@/types/nicheResearcher';

export interface NicheReportSummary {
  id: string;
  title: string;
  topNiches: Array<{
    name: string;
    matchScore: number;
    category: string;
  }>;
  skills: string[];
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

  // ✅ Simplified API call (exactly same as cold email)
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

  const generateNicheReport = async (input: NicheResearchInput): Promise<{
    reportId: string;
    report: GeneratedNicheReport;
  }> => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Generating niche report with input:', input);
      
      const response = await handleApiCall<{
        reportId: string;
        report: GeneratedNicheReport;
      }>(
        '/api/niche-research',
        {
          method: 'POST',
          body: JSON.stringify(input)
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

  const getNicheReport = async (reportId: string) => {
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
  };

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

  const analyzeMarket = async (options: {
    niche: string;
    skills: string[];
    location: 'remote-only' | 'local-focused' | 'hybrid';
    budget: '0-1k' | '1k-5k' | '5k-10k' | '10k+';
    analysisType?: 'competitive' | 'opportunity' | 'validation';
  }) => {
    try {
      return await handleApiCall<any>(
        '/api/niche-research/market-analysis',
        {
          method: 'POST',
          body: JSON.stringify(options)
        },
        'Market analysis failed'
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Market analysis failed';
      message.error(errorMessage);
      throw err;
    }
  };

  const getSkillsSuggestions = async (category?: string) => {
    try {
      const params = new URLSearchParams();
      if (category) params.set('category', category);

      const url = `/api/niche-research/skills-suggestions${params.toString() ? `?${params.toString()}` : ''}`;
      
      return await handleApiCall<any>(
        url,
        { method: 'GET' },
        'Failed to fetch skills'
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch skills';
      message.error(errorMessage);
      throw err;
    }
  };

  return {
    generateNicheReport,
    getNicheReport,
    getUserReports,
    deleteNicheReport,
    exportNicheReport,
    analyzeMarket,
    getSkillsSuggestions,
    loading,
    error,
    setError
  };
}