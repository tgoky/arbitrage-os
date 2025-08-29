// hooks/useSavedNiche.ts
import { GeneratedNicheReport } from '@/types/nicheResearcher';
import React, {  useState, useCallback } from 'react';
import { useWorkspaceContext } from './useWorkspaceContext';


export interface SavedNiche {
  id: string;
  title: string;
  createdAt: string;
  metadata: {
    nicheName: string;
    primaryObjective: string;
    marketType: string;
    budget: string;
    marketSize: string;
    tokensUsed: number;
    totalNiches?: number;
    recommendedNicheIndex?: number;
  };
  content: {
    niches: GeneratedNicheReport[];
    recommendedNiche: number;
    recommendationReason: string;
  };
}

export function useSavedNiche() {
  const [niches, setNiches] = useState<SavedNiche[]>([]);
  const [loading, setLoading] = useState(false);
  const { currentWorkspace } = useWorkspaceContext();

  const fetchNiches = useCallback(async () => {
    if (!currentWorkspace) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/niche-research?workspaceId=${currentWorkspace.id}`);
      const data = await response.json();
      if (data.success) {
        setNiches(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch saved niches:', error);
      setNiches([]);
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace?.id]);

  return { niches, loading, fetchNiches };
}