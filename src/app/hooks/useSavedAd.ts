import { useState, useCallback } from 'react';
import { useWorkspaceContext } from './useWorkspaceContext';
import { GeneratedAd } from '@/types/adWriter';

export interface SavedAd {
  id: string;
  title: string;
  createdAt: string;
  metadata: {
    businessName: string;
    offerName: string;
    platforms: string[];
    adCount: number;
  };
  content: {
    ads: GeneratedAd[];
  };
}

export function useSavedAds() {
  const [ads, setAds] = useState<SavedAd[]>([]);
  const [loading, setLoading] = useState(false);
  const { currentWorkspace } = useWorkspaceContext();

  const fetchAds = useCallback(async () => {
    if (!currentWorkspace) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/ad-writer/saved?workspaceId=${currentWorkspace.id}`);
      const data = await response.json();
      if (data.success) {
        setAds(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch saved ads:', error);
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace?.id]);

  return { ads, loading, fetchAds };
}