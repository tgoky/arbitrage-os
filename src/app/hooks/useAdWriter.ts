// hooks/useAdWriter.ts
import { useState } from 'react';
import { message } from 'antd';

export interface AdWriterInput {
  businessName: string;
  personalTitle?: string;
  valueProposition: string;
  offerName: string;
  offerDescription: string;
  features?: string[];
  pricing: string;
  uniqueMechanism: string;
  idealCustomer: string;
  primaryPainPoint: string;
  failedSolutions?: string;
  coreResult: string;
  secondaryBenefits?: string[];
  timeline?: string;
  activePlatforms: string[];
  adType: 'awareness' | 'conversion' | 'lead' | 'traffic';
  tone: 'professional' | 'friendly' | 'urgent' | 'humorous' | 'inspirational';
  caseStudy1?: string;
  credentials?: string;
  cta: string;
  url: string;
  urgency?: string;
  leadMagnet?: string;
}

export interface GeneratedAd {
  platform: string;
  headlines: string[];
  descriptions: string[];
  ctas: string[];
  hooks: string[];
  visualSuggestions: string[];
}

export function useAdWriter() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateAds = async (input: AdWriterInput): Promise<GeneratedAd[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/ad-writer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate ads');
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

  const optimizeAd = async (adCopy: string, optimizationType: string): Promise<string> => {
    try {
      const response = await fetch('/api/ad-writer/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adCopy, optimizationType })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Optimization failed');
      }

      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Optimization failed';
      message.error(errorMessage);
      throw err;
    }
  };

  const regeneratePlatformAds = async (
    originalInput: AdWriterInput, 
    platform: string
  ): Promise<GeneratedAd> => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/ad-writer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...originalInput,
          activePlatforms: [platform]
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Regeneration failed');
      }

      if (result.success && result.data.length > 0) {
        return result.data[0];
      } else {
        throw new Error('No ads generated');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Regeneration failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    generateAds,
    optimizeAd,
    regeneratePlatformAds,
    loading,
    error,
    setError
  };
}