// hooks/useNicheResearcher.ts
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

  const generateNicheReport = async (input: NicheResearchInput): Promise<{
    reportId: string;
    report: GeneratedNicheReport;
  }> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/niche-research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate niche report');
      }

      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || 'Generation failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Generation failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getNicheReport = async (reportId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/niche-research/${reportId}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch report');
      }

      return result.data;
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

      const response = await fetch(`/api/niche-research?${params.toString()}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch reports');
      }

      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch reports';
      message.error(errorMessage);
      throw err;
    }
  };

  const deleteNicheReport = async (reportId: string): Promise<void> => {
    try {
      const response = await fetch(`/api/niche-research/${reportId}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete report');
      }

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
    const response = await fetch(`/api/niche-research/export/${reportId}?format=${format}`);
    
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
      // Cleanup always happens
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
      const response = await fetch('/api/niche-research/market-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options)
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Market analysis failed');
      }

      return result.data;
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

      const response = await fetch(`/api/niche-research/skills-suggestions?${params.toString()}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch skills');
      }

      return result.data;
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