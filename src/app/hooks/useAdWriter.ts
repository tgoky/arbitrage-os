// hooks/useAdWriter.ts
import { useState, useEffect } from 'react';
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
  hooks?: string[];
  visualSuggestions?: string[];
}

export function useAdWriter() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  // Cleanup function for aborting requests
  const cleanup = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, []);

  const generateAds = async (input: AdWriterInput): Promise<GeneratedAd[]> => {
    cleanup(); // Cancel any existing request
    
    const controller = new AbortController();
    setAbortController(controller);
    setLoading(true);
    setError(null);
    
    try {
      // Validate input before sending
      if (!input.businessName || !input.valueProposition) {
        throw new Error('Missing required business information');
      }
      
      if (!input.activePlatforms || input.activePlatforms.length === 0) {
        throw new Error('At least one platform must be selected');
      }

      if (!input.cta || !input.url) {
        throw new Error('Call-to-action and URL are required');
      }

      const response = await fetch('/api/ad-writer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
        signal: controller.signal // Add abort signal
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || `Server error: ${response.status}`);
      }

      if (result.success && Array.isArray(result.data)) {
        // Validate response structure
        const validAds = result.data.filter((ad: any) => 
          ad.platform && 
          Array.isArray(ad.headlines) && 
          ad.headlines.length > 0 &&
          Array.isArray(ad.descriptions) && 
          ad.descriptions.length > 0 &&
          Array.isArray(ad.ctas) &&
          ad.ctas.length > 0
        );
        
        if (validAds.length === 0) {
          throw new Error('No valid ads received from server');
        }
        
        return validAds;
      } else {
        throw new Error(result.error || 'Invalid response format');
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was cancelled, don't show error
        console.log('Request was cancelled');
        return [];
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Generation failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
      setAbortController(null);
    }
  };

  const optimizeAd = async (adCopy: string, optimizationType: string): Promise<string> => {
    try {
      if (!adCopy || !adCopy.trim()) {
        throw new Error('Ad copy cannot be empty');
      }

      const response = await fetch('/api/ad-writer/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adCopy, optimizationType })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Optimization failed');
      }

      if (!result.data || typeof result.data !== 'string') {
        throw new Error('Invalid optimization result');
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
    setError(null);
    
    try {
      if (!originalInput) {
        throw new Error('Original input data is required');
      }

      if (!platform) {
        throw new Error('Platform is required');
      }

      // Validate that the platform is in the original platforms list
      const validPlatforms = ['facebook', 'google', 'linkedin', 'tiktok'];
      if (!validPlatforms.includes(platform)) {
        throw new Error(`Invalid platform: ${platform}`);
      }

      const response = await fetch('/api/ad-writer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...originalInput,
          activePlatforms: [platform] // Only regenerate for this platform
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Regeneration failed');
      }

      if (result.success && Array.isArray(result.data) && result.data.length > 0) {
        const newAd = result.data[0];
        
        // Validate the new ad structure
        if (!newAd.headlines || !newAd.descriptions || !newAd.ctas) {
          throw new Error('Invalid ad structure returned');
        }

        if (!Array.isArray(newAd.headlines) || newAd.headlines.length === 0) {
          throw new Error('No headlines generated');
        }

        if (!Array.isArray(newAd.descriptions) || newAd.descriptions.length === 0) {
          throw new Error('No descriptions generated');
        }

        if (!Array.isArray(newAd.ctas) || newAd.ctas.length === 0) {
          throw new Error('No CTAs generated');
        }

        return newAd;
      } else {
        throw new Error('No ads generated for platform');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Regeneration failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const validateInput = (input: Partial<AdWriterInput>): string[] => {
    const errors: string[] = [];

    if (!input.businessName?.trim()) {
      errors.push('Business name is required');
    }

    if (!input.valueProposition?.trim()) {
      errors.push('Value proposition is required');
    }

    if (!input.offerName?.trim()) {
      errors.push('Offer name is required');
    }

    if (!input.offerDescription?.trim()) {
      errors.push('Offer description is required');
    }

    if (!input.pricing?.trim()) {
      errors.push('Pricing is required');
    }

    if (!input.uniqueMechanism?.trim()) {
      errors.push('Unique mechanism is required');
    }

    if (!input.idealCustomer?.trim()) {
      errors.push('Ideal customer is required');
    }

    if (!input.primaryPainPoint?.trim()) {
      errors.push('Primary pain point is required');
    }

    if (!input.coreResult?.trim()) {
      errors.push('Core result is required');
    }

    if (!input.cta?.trim()) {
      errors.push('Call-to-action is required');
    }

    if (!input.url?.trim()) {
      errors.push('URL is required');
    } else {
      // Basic URL validation
      try {
        new URL(input.url);
      } catch {
        errors.push('Please enter a valid URL');
      }
    }

    if (!input.activePlatforms || input.activePlatforms.length === 0) {
      errors.push('At least one platform must be selected');
    }

    if (!input.adType) {
      errors.push('Ad type is required');
    }

    if (!input.tone) {
      errors.push('Tone is required');
    }

    return errors;
  };

  const clearError = () => {
    setError(null);
  };

  return {
    generateAds,
    optimizeAd,
    regeneratePlatformAds,
    validateInput,
    loading,
    error,
    setError,
    clearError,
    cleanup // Expose cleanup for manual cancellation
  };
}