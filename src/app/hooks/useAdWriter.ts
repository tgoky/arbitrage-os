// hooks/useAdWriter.ts - FIXED VERSION
import { useState, useEffect } from 'react';
import { message } from 'antd';
import { type Platform, isValidPlatform, convertToPlatforms } from '@/types/adWriter';
import { useWorkspaceContext } from './useWorkspaceContext';

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
  activePlatforms: string[]; // ✅ Keep as string[] for form compatibility
  adType: 'awareness' | 'conversion' | 'lead' | 'traffic';
  tone: 'professional' | 'friendly' | 'urgent' | 'humorous' | 'inspirational';
  caseStudy1?: string;
  credentials?: string;
  cta: string;
  adLength: 'short' | 'medium' | 'long'; 
  url: string;
  urgency?: string;
  leadMagnet?: string;
}

export interface FullScript {
  framework: string;
  script: string;
}

export interface GeneratedAd {
  platform: string; // Keep as string for frontend compatibility
  headlines: string[];
  descriptions: string[];
  ctas: string[];
  hooks?: string[];
  visualSuggestions?: string[];
  // ✅ NEW: Add the script section properties
  fixes?: string[];
  results?: string[];
  proofs?: string[];
  // ✅ ADD this line
  fullScripts?: FullScript[];
}


export function useAdWriter() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
   const { currentWorkspace } = useWorkspaceContext();
   
     const getCurrentWorkspaceId = () => {
    if (!currentWorkspace) {
      throw new Error('No workspace selected');
    }
    return currentWorkspace.id;
  };

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
      // CLIENT-SIDE VALIDATION
      const validationErrors = validateInput(input);
      if (validationErrors.length > 0) {
        throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
      }

      // ✅ FIXED: Convert platforms to the correct format before sending
  const requestData = {
  ...input,
  workspaceId: getCurrentWorkspaceId(), // Add this line
  activePlatforms: input.activePlatforms || []
};


      // LOG THE EXACT DATA BEING SENT
      console.log('Sending data to API:', JSON.stringify(requestData, null, 2));

      const response = await fetch('/api/ad-writer', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestData),
        signal: controller.signal // Add abort signal
      });

      // LOG THE RESPONSE
      console.log('API Response status:', response.status);
      console.log('API Response headers:', Object.fromEntries(response.headers.entries()));

      const result = await response.json();
      console.log('API Response body:', result);
      
      // ✅ ADD DETAILED LOGGING to understand the response structure
      if (result.success) {
        console.log('✅ API Success - result.data:', result.data);
        console.log('✅ result.data.ads exists?', !!result.data?.ads);
        console.log('✅ result.data.ads is array?', Array.isArray(result.data?.ads));
        if (result.data?.ads) {
          console.log('✅ Number of ads returned:', result.data.ads.length);
          console.log('✅ All ads structure:', result.data.ads);
          result.data.ads.forEach((ad: any, index: number) => {
            console.log(`✅ Ad ${index + 1} (${ad.platform}):`, {
              headlines: ad.headlines?.length || 0,
              descriptions: ad.descriptions?.length || 0,
              ctas: ad.ctas?.length || 0,
              hooks: ad.hooks?.length || 0,
              visualSuggestions: ad.visualSuggestions?.length || 0,
              fixes: ad.fixes?.length || 0,
              results: ad.results?.length || 0,
              proofs: ad.proofs?.length || 0
            });
          });
        }
      }
      
      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 400) {
          const errorDetails = result.details || [];
          const errorMessages = errorDetails.map((err: any) => 
            `${err.path}: ${err.message}`
          ).join(', ');
          throw new Error(`Validation error: ${errorMessages || result.error}`);
        } else if (response.status === 429) {
          throw new Error(`Rate limit exceeded: ${result.error}`);
        } else if (response.status === 401) {
          throw new Error('Authentication required. Please log in.');
        } else {
          throw new Error(result.error || `Server error: ${response.status}`);
        }
      }

      if (result.success && result.data && result.data.ads && Array.isArray(result.data.ads)) {
        // ✅ IMPROVED: Validate response structure with better error handling
        const validAds = result.data.ads.filter((ad: any) => {
          const hasRequiredFields = (
            ad.platform && 
            Array.isArray(ad.headlines) && ad.headlines.length > 0 &&
            Array.isArray(ad.descriptions) && ad.descriptions.length > 0 &&
            Array.isArray(ad.ctas) && ad.ctas.length > 0
          );
          
          if (!hasRequiredFields) {
            console.warn('Ad missing required fields:', ad);
          }
          
          return hasRequiredFields;
        });
        
        if (validAds.length === 0) {
          throw new Error('No valid ads received from server');
        }
        
        // ✅ Ensure the response matches our GeneratedAd interface
       const typedAds: GeneratedAd[] = validAds.map((ad: any) => ({
  platform: ad.platform,
  headlines: ad.headlines || [],
  descriptions: ad.descriptions || [],
  ctas: ad.ctas || [],
  hooks: ad.hooks || [],
  visualSuggestions: ad.visualSuggestions || [],
  fixes: ad.fixes || [],
  results: ad.results || [],
  proofs: ad.proofs || [],
  // ✅ ADD this line
  fullScripts: ad.fullScripts || []
}));
        
        return typedAds;
      } else {
        throw new Error(result.error || 'Invalid response format from server');
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was cancelled, don't show error
        console.log('Request was cancelled');
        return [];
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Generation failed';
      console.error('Generation error:', err);
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

      // ✅ FIXED: Validate that the platform is valid
      const validPlatforms = ['facebook', 'google', 'linkedin', 'tiktok', 'generic'];
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

      if (result.success && result.data && result.data.ads && Array.isArray(result.data.ads) && result.data.ads.length > 0) {
        const newAd = result.data.ads[0];
        
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

        // ✅ Return properly typed GeneratedAd
      const typedAd: GeneratedAd = {
  platform: newAd.platform,
  headlines: newAd.headlines || [],
  descriptions: newAd.descriptions || [],
  ctas: newAd.ctas || [],
  hooks: newAd.hooks || [],
  visualSuggestions: newAd.visualSuggestions || [],
  fixes: newAd.fixes || [],
  results: newAd.results || [],
  proofs: newAd.proofs || [],
  // ✅ ADD this line
  fullScripts: newAd.fullScripts || []
};

        return typedAd;
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


       if (!input.adLength) {
  errors.push('Ad length is required');
}

    // Required fields validation
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

    // ✅ NO PLATFORM REQUIREMENT - platforms are optional

    if (!input.adType) {
      errors.push('Ad type is required');
    }

    if (!input.tone) {
      errors.push('Tone is required');
    }

    // Length validations
    if (input.valueProposition && input.valueProposition.length < 10) {
      errors.push('Value proposition must be at least 10 characters');
    }

    if (input.offerDescription && input.offerDescription.length < 10) {
      errors.push('Offer description must be at least 10 characters');
    }

    if (input.uniqueMechanism && input.uniqueMechanism.length < 5) {
      errors.push('Unique mechanism must be at least 5 characters');
    }

    if (input.idealCustomer && input.idealCustomer.length < 10) {
      errors.push('Ideal customer description must be at least 10 characters');
    }

    if (input.primaryPainPoint && input.primaryPainPoint.length < 5) {
      errors.push('Primary pain point must be at least 5 characters');
    }

    if (input.coreResult && input.coreResult.length < 5) {
      errors.push('Core result must be at least 5 characters');
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