// hooks/useOfferCreator.ts - COMPLETELY FIXED VERSION

import { useState, useCallback } from 'react';
import { message } from 'antd';

// Import from your existing types file
import type {
  OfferCreatorInput,
  GeneratedOfferPackage,
  UserOffer,
  OfferTemplate,
  OptimizationType,
  OptimizationResult,
  PerformanceMetrics,
  OfferPerformance,
  IndustryBenchmark,
  BusinessRulesValidation,
  ApiResponse,
  ApiResponseOptional,
  PerformanceData,
} from '@/types/offerCreator';

export type {
  OfferCreatorInput,
  GeneratedOfferPackage,
  UserOffer,
  OfferTemplate,
  OptimizationType,
  OptimizationResult,
  PerformanceMetrics,
  OfferPerformance,
  IndustryBenchmark,
  BusinessRulesValidation
};

// ============================================================================
// MAIN SIGNATURE OFFER CREATOR HOOK
// ============================================================================
export const useOfferCreator = () => {
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateOffer = useCallback(async (input: OfferCreatorInput): Promise<{
    offerId: string;
    offer: GeneratedOfferPackage;
  } | null> => {
    setGenerating(true);
    setError(null);

    try {
      console.log('🚀 Sending signature offer generation request...', input);

      // Validate required sections
      if (!input.founder || !input.market || !input.business || !input.pricing || !input.voice) {
        throw new Error('All sections (founder, market, business, pricing, voice) are required');
      }

      // Validate founder section
      if (!input.founder.signatureResults?.length) {
        throw new Error('At least one signature result is required');
      }
      if (!input.founder.coreStrengths?.length) {
        throw new Error('At least one core strength is required');
      }
      if (!input.founder.industries?.length) {
        throw new Error('At least one industry is required');
      }

      // Validate market section
      if (!input.market.targetMarket) {
        throw new Error('Target market is required');
      }
      if (!input.market.buyerRole) {
        throw new Error('Buyer role is required');
      }

      // Validate business section
      if (!input.business.deliveryModel?.length) {
        throw new Error('At least one delivery model is required');
      }
      if (!input.business.capacity) {
        throw new Error('Capacity is required');
      }

      console.log('📤 Final request data:', input);

      const response = await fetch('/api/offer-creator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });

      console.log('📨 Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ API Error:', errorData);

        if (errorData.details && Array.isArray(errorData.details)) {
          const errorMessages = errorData.details.map((detail: any) => 
            detail.message || detail.path?.join('.') + ': ' + detail.message || detail
          ).join(', ');
          throw new Error(`Validation Error: ${errorMessages}`);
        }

        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }

      const data = await response.json() as ApiResponse<GeneratedOfferPackage>;
      console.log('✅ API Response:', data);

      if (!data.success) {
        throw new Error(data.error || 'Generation failed');
      }

      // Type guard to ensure data exists
      if (!data.data) {
        throw new Error('No offer data received from server');
      }

      message.success('Signature offers generated successfully!');
      return {
        offerId: data.meta?.offerId || 'temp-id',
        offer: data.data
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('💥 Generation error:', err);
      setError(errorMessage);
      message.error(errorMessage);
      return null;
    } finally {
      setGenerating(false);
    }
  }, []);

  const quickValidate = useCallback((input: Partial<OfferCreatorInput>) => {
    const errors: Record<string, string> = {};

    // Founder validation
    if (!input.founder?.signatureResults?.length) {
      errors['founder.signatureResults'] = 'At least one signature result is required';
    }

    if (!input.founder?.coreStrengths?.length) {
      errors['founder.coreStrengths'] = 'At least one core strength is required';
    }

    if (!input.founder?.processes?.length) {
      errors['founder.processes'] = 'At least one process is required';
    }

    if (!input.founder?.industries?.length) {
      errors['founder.industries'] = 'At least one industry is required';
    }

    // Market validation
    if (!input.market?.targetMarket || input.market.targetMarket.length < 3) {
      errors['market.targetMarket'] = 'Target market must be at least 3 characters';
    }

    if (!input.market?.buyerRole || input.market.buyerRole.length < 3) {
      errors['market.buyerRole'] = 'Buyer role must be at least 3 characters';
    }

    if (!input.market?.pains?.length) {
      errors['market.pains'] = 'At least one pain point is required';
    }

    if (!input.market?.outcomes?.length) {
      errors['market.outcomes'] = 'At least one outcome is required';
    }

    // Business validation
    if (!input.business?.deliveryModel?.length) {
      errors['business.deliveryModel'] = 'At least one delivery model is required';
    }

    if (!input.business?.capacity) {
      errors['business.capacity'] = 'Capacity is required';
    }

    if (!input.business?.monthlyHours) {
      errors['business.monthlyHours'] = 'Monthly hours is required';
    }

    if (!input.business?.acv) {
      errors['business.acv'] = 'Annual Contract Value is required';
    }

    // Pricing validation
    if (!input.pricing?.pricePosture) {
      errors['pricing.pricePosture'] = 'Price posture is required';
    }

    if (!input.pricing?.contractStyle) {
      errors['pricing.contractStyle'] = 'Contract style is required';
    }

    if (!input.pricing?.guarantee) {
      errors['pricing.guarantee'] = 'Guarantee option is required';
    }

    // Voice validation
    if (!input.voice?.brandTone) {
      errors['voice.brandTone'] = 'Brand tone is required';
    }

    if (!input.voice?.positioning) {
      errors['voice.positioning'] = 'Positioning angle is required';
    }

    if (!input.voice?.differentiators?.length) {
      errors['voice.differentiators'] = 'At least one differentiator is required';
    }

    // Business logic validation
    if (input.business?.capacity && input.business?.monthlyHours) {
      const capacity = parseInt(input.business.capacity);
      const monthlyHours = parseInt(input.business.monthlyHours);
      
      if (!isNaN(capacity) && !isNaN(monthlyHours)) {
        const hoursPerClient = monthlyHours / capacity;
        if (hoursPerClient < 5) {
          errors['business.capacity'] = 'Hours per client seems too low (less than 5 hours)';
        } else if (hoursPerClient > 80) {
          errors['business.monthlyHours'] = 'Hours per client seems too high (more than 80 hours)';
        }
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }, []);

  const getBusinessInsights = useCallback((input: OfferCreatorInput) => {
    const insights = {
      strengths: [] as string[],
      weaknesses: [] as string[],
      opportunities: [] as string[],
      recommendations: [] as string[]
    };

    // Analyze founder credibility
    if (input.founder.signatureResults.length >= 3) {
      insights.strengths.push('Strong track record with multiple signature results');
    } else if (input.founder.signatureResults.length < 2) {
      insights.weaknesses.push('Limited signature results may impact credibility');
      insights.recommendations.push('Document more specific client outcomes');
    }

    // Analyze market focus
    if (input.founder.industries.length <= 2) {
      insights.strengths.push('Focused industry targeting for clear positioning');
    } else {
      insights.opportunities.push('Consider narrowing industry focus for stronger positioning');
    }

    // Analyze delivery model
    const scalableModels = ['productized-service', 'training', 'licensing'];
    const hasScalableModel = input.business.deliveryModel.some(model => 
      scalableModels.includes(model)
    );
    
    if (hasScalableModel) {
      insights.strengths.push('Scalable delivery model selected');
    } else {
      insights.opportunities.push('Consider adding more scalable delivery models');
    }

    // Analyze pricing strategy
    if (input.pricing.pricePosture === 'premium' && input.pricing.guarantee === 'strong-guarantee') {
      insights.strengths.push('Premium positioning with strong guarantee reduces risk');
    } else if (input.pricing.pricePosture === 'premium' && input.pricing.guarantee === 'none') {
      insights.recommendations.push('Consider adding guarantee for premium pricing');
    }

    // Capacity analysis
    const capacity = parseInt(input.business.capacity);
    const monthlyHours = parseInt(input.business.monthlyHours);
    if (!isNaN(capacity) && !isNaN(monthlyHours)) {
      const hoursPerClient = monthlyHours / capacity;
      if (hoursPerClient >= 20 && hoursPerClient <= 40) {
        insights.strengths.push('Well-balanced time allocation per client');
      }
    }

    return insights;
  }, []);

  return {
    loading,
    generating,
    error,
    generateOffer,
    quickValidate,
    getBusinessInsights,
    setError
  };
};

// ============================================================================
// SAVED SIGNATURE OFFERS HOOK
// ============================================================================
export const useSavedOffers = () => {
  const [offers, setOffers] = useState<UserOffer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOffers = useCallback(async (workspaceId?: string, targetMarket?: string, pricePosture?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('📋 Fetching signature offers...');
      
      const params = new URLSearchParams();
      if (workspaceId) params.append('workspaceId', workspaceId);
      if (targetMarket) params.append('targetMarket', targetMarket);
      if (pricePosture) params.append('pricePosture', pricePosture);
      
      const url = `/api/offer-creator${params.toString() ? `?${params.toString()}` : ''}`;
      console.log('🔗 Fetch URL:', url);
      
      const response = await fetch(url);
      console.log('📨 Offers response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Offers fetch error:', errorData);
        throw new Error(errorData.error || `Failed to fetch offers: ${response.status}`);
      }

      const data = await response.json() as ApiResponseOptional<UserOffer[]>;
      console.log('✅ Offers data:', data);
      
      if (data.success && data.data) {
        setOffers(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch offers');
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('💥 Fetch offers error:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const getOffer = useCallback(async (offerId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Fetching offer:', offerId);
      
      const response = await fetch(`/api/offer-creator/${offerId}`);
      console.log('📨 Get offer response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch offer: ${response.status}`);
      }

      const data = await response.json() as ApiResponseOptional<any>;
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch offer');
      }

      // Type guard to ensure data exists
      if (!data.data) {
        throw new Error('Offer not found');
      }

      return data.data;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('💥 Get offer error:', err);
      setError(errorMessage);
      message.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteOffer = useCallback(async (offerId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/offer-creator/${offerId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete offer');
      }

      const data = await response.json() as ApiResponse<{ deleted: boolean }>;
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to delete offer');
      }

      // Type guard to ensure data exists
      if (!data.data) {
        throw new Error('Delete operation failed');
      }

      // Remove from local state
      setOffers(prev => prev.filter(offer => offer.id !== offerId));
      message.success('Offer deleted successfully');
      return true;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      message.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    offers,
    loading,
    error,
    fetchOffers,
    getOffer,
    deleteOffer,
    setError
  };
};

// ============================================================================
// SIGNATURE OFFER BENCHMARKS HOOK
// ============================================================================
export const useOfferBenchmarks = () => {
  const [benchmarks, setBenchmarks] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBenchmarks = useCallback(async (industry?: string, includeInsights = true) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('📊 Fetching signature offer benchmarks...');
      
      const params = new URLSearchParams();
      if (industry) params.append('industry', industry);
      if (!includeInsights) params.append('insights', 'false');
      
      const url = `/api/offer-creator/benchmarks${params.toString() ? `?${params.toString()}` : ''}`;
      console.log('🔗 Benchmarks URL:', url);
      
      const response = await fetch(url);
      console.log('📨 Benchmarks response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Benchmarks fetch error:', errorData);
        throw new Error(errorData.error || `Failed to fetch benchmarks: ${response.status}`);
      }

      const data = await response.json() as ApiResponseOptional<any>;
      console.log('✅ Benchmarks data:', data);
      
      if (data.success && data.data) {
        setBenchmarks(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch benchmarks');
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('💥 Fetch benchmarks error:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    benchmarks,
    loading,
    error,
    fetchBenchmarks,
    setError
  };
};

// ============================================================================
// SIGNATURE OFFER TEMPLATES HOOK
// ============================================================================
export const useOfferTemplates = () => {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = useCallback(async (
    industry?: string,
    tier?: 'starter' | 'core' | 'premium',
    includeMetadata = true
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('📋 Fetching signature offer templates...');
      
      const params = new URLSearchParams();
      if (industry) params.append('industry', industry);
      if (tier) params.append('tier', tier);
      if (!includeMetadata) params.append('metadata', 'false');
      
      const url = `/api/offer-creator/templates${params.toString() ? `?${params.toString()}` : ''}`;
      console.log('🔗 Templates URL:', url);
      
      const response = await fetch(url);
      console.log('📨 Templates response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Templates fetch error:', errorData);
        throw new Error(errorData.error || `Failed to fetch templates: ${response.status}`);
      }

      const data = await response.json() as ApiResponseOptional<any>;
      console.log('✅ Templates data:', data);
      
      if (data.success && data.data) {
        setTemplates(data.data.templates || []);
      } else {
        throw new Error(data.error || 'Failed to fetch templates');
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('💥 Fetch templates error:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const applyTemplate = useCallback((template: any): Partial<OfferCreatorInput> => {
    // Convert template data to OfferCreatorInput structure
    return {
      founder: {
        signatureResults: [template.promise || 'Signature result from template'],
        coreStrengths: template.differentiators || ['Core strength'],
        processes: ['Process from template'],
        industries: [template.industry || 'General'],
        proofAssets: []
      },
      market: {
        targetMarket: template.for || 'Target market',
        buyerRole: 'Decision maker',
        pains: ['Pain point from template'],
        outcomes: ['Outcome from template']
      },
      business: {
        deliveryModel: ['productized-service'],
        capacity: '10',
        monthlyHours: '200',
        acv: template.pricing || '$50,000',
        fulfillmentStack: []
      },
      pricing: {
        pricePosture: 'value-priced' as const,
        contractStyle: 'month-to-month' as const,
        guarantee: 'conditional' as const
      },
      voice: {
        brandTone: 'consultative' as const,
        positioning: 'specialization' as const,
        differentiators: template.differentiators || ['Template differentiator']
      }
    };
  }, []);

  return {
    templates,
    loading,
    error,
    fetchTemplates,
    applyTemplate,
    setError
  };
};

// ============================================================================
// SIGNATURE OFFER OPTIMIZATION HOOK
// ============================================================================
export const useOfferOptimization = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const optimizeOffer = useCallback(async (
    offerId: string, 
    type: OptimizationType,
    focus?: 'conversion' | 'differentiation' | 'scalability'
  ): Promise<OptimizationResult | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/offer-creator/${offerId}/optimize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type, focus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to optimize offer');
      }

      const data = await response.json() as ApiResponseOptional<OptimizationResult>;
      
      if (!data.success) {
        throw new Error(data.error || 'Optimization failed');
      }

      // Type guard to ensure data exists
      if (!data.data) {
        throw new Error('No optimization results received');
      }

      message.success('Offer optimization completed successfully');
      return data.data;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      message.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getOptimizationHistory = useCallback(async (offerId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/offer-creator/${offerId}/optimize`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch optimization history');
      }

      const data = await response.json() as ApiResponseOptional<any>;
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch optimization history');
      }

      // Type guard to ensure data exists
      if (!data.data) {
        throw new Error('No optimization history found');
      }

      return data.data;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    optimizeOffer,
    getOptimizationHistory,
    setError
  };
};

// ============================================================================
// SIGNATURE OFFER ANALYSIS HOOK
// ============================================================================
export const useOfferAnalysis = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeOffer = useCallback(async (
    input: OfferCreatorInput,
    analysisType: 'market-fit' | 'competitive' | 'scalability' = 'market-fit'
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/offer-creator/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...input,
          analysisType
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze offer');
      }

      const data = await response.json() as ApiResponseOptional<any>;
      
      if (!data.success) {
        throw new Error(data.error || 'Analysis failed');
      }

      // Type guard to ensure data exists
      if (!data.data) {
        throw new Error('No analysis results received');
      }

      return data.data;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      message.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    analyzeOffer,
    setError
  };
};

// ============================================================================
// SIGNATURE OFFER PERFORMANCE HOOK
// ============================================================================
export const useOfferPerformance = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updatePerformance = useCallback(async (
    offerId: string,
    performanceData: PerformanceData
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/offer-creator/${offerId}/performance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(performanceData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update performance');
      }

      const data = await response.json() as ApiResponseOptional<OfferPerformance>;
      
      if (!data.success) {
        throw new Error(data.error || 'Performance update failed');
      }

      // Type guard to ensure data exists
      if (!data.data) {
        throw new Error('No performance data received');
      }

      message.success('Performance data updated successfully');
      return data.data;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      message.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getPerformance = useCallback(async (
    offerId: string, 
    period: 'all' | '30d' | '90d' | '1y' = 'all',
    includeInsights = true
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (period !== 'all') params.append('period', period);
      if (!includeInsights) params.append('insights', 'false');
      
      const url = `/api/offer-creator/${offerId}/performance${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch performance data');
      }

      const data = await response.json() as ApiResponseOptional<OfferPerformance>;
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch performance data');
      }

      // Type guard to ensure data exists
      if (!data.data) {
        throw new Error('No performance data found');
      }

      return data.data;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    updatePerformance,
    getPerformance,
    setError
  };
};

// ============================================================================
// SIGNATURE OFFER EXPORT HOOK
// ============================================================================
export const useOfferExport = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const downloadFile = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    try {
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
    } finally {
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }
  };

  const exportOffer = useCallback(async (
    offerId: string, 
    format: 'json' | 'html' = 'html'
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/offer-creator/${offerId}/export?format=${format}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to export offer');
      }

      if (format === 'html') {
        const contentDisposition = response.headers.get('content-disposition');
        const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
        const filename = filenameMatch?.[1] || `signature-offers-${offerId}.html`;

        const blob = await response.blob();
        downloadFile(blob, filename);
        message.success('Signature offers exported successfully');
        return true; // Return success indicator for HTML exports
      } else {
        const data = await response.json() as ApiResponseOptional<any>;
        if (data.success && data.data) {
          return data.data;
        } else {
          throw new Error(data.error || 'Export failed');
        }
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      message.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    exportOffer,
    setError
  };
};

// ============================================================================
// SIGNATURE OFFER VALIDATION HOOK
// ============================================================================
export const useOfferValidation = () => {
  const validateInput = useCallback((input: Partial<OfferCreatorInput>) => {
    const errors: Record<string, string> = {};

    // Founder section validation
    if (!input.founder?.signatureResults?.length) {
      errors['founder.signatureResults'] = 'At least one signature result is required';
    }

    if (!input.founder?.coreStrengths?.length) {
      errors['founder.coreStrengths'] = 'At least one core strength is required';
    }

    if (!input.founder?.processes?.length) {
      errors['founder.processes'] = 'At least one process is required';
    }

    if (!input.founder?.industries?.length) {
      errors['founder.industries'] = 'At least one industry is required';
    } else if (input.founder.industries.length > 3) {
      errors['founder.industries'] = 'Maximum 3 industries allowed for focused positioning';
    }

    // Market section validation
    if (!input.market?.targetMarket || input.market.targetMarket.length < 3) {
      errors['market.targetMarket'] = 'Target market must be at least 3 characters';
    }

    if (!input.market?.buyerRole || input.market.buyerRole.length < 3) {
      errors['market.buyerRole'] = 'Buyer role must be at least 3 characters';
    }

    if (!input.market?.pains?.length) {
      errors['market.pains'] = 'At least one pain point is required';
    }

    if (!input.market?.outcomes?.length) {
      errors['market.outcomes'] = 'At least one outcome is required';
    }

    // Business section validation
    if (!input.business?.deliveryModel?.length) {
      errors['business.deliveryModel'] = 'At least one delivery model is required';
    }

    if (!input.business?.capacity) {
      errors['business.capacity'] = 'Capacity is required';
    }

    if (!input.business?.monthlyHours) {
      errors['business.monthlyHours'] = 'Monthly hours is required';
    }

    if (!input.business?.acv) {
      errors['business.acv'] = 'Annual Contract Value is required';
    }

    // Pricing section validation
    if (!input.pricing?.pricePosture) {
      errors['pricing.pricePosture'] = 'Price posture is required';
    }

    if (!input.pricing?.contractStyle) {
      errors['pricing.contractStyle'] = 'Contract style is required';
    }

    if (!input.pricing?.guarantee) {
      errors['pricing.guarantee'] = 'Guarantee option is required';
    }

    // Voice section validation
    if (!input.voice?.brandTone) {
      errors['voice.brandTone'] = 'Brand tone is required';
    }

    if (!input.voice?.positioning) {
      errors['voice.positioning'] = 'Positioning angle is required';
    }

    if (!input.voice?.differentiators?.length) {
      errors['voice.differentiators'] = 'At least one differentiator is required';
    }

    // Cross-section business logic validation
    if (input.business?.capacity && input.business?.monthlyHours) {
      const capacity = parseInt(input.business.capacity);
      const monthlyHours = parseInt(input.business.monthlyHours);
      
      if (!isNaN(capacity) && !isNaN(monthlyHours)) {
        const hoursPerClient = monthlyHours / capacity;
        if (hoursPerClient < 5) {
          errors['business.capacity'] = 'Hours per client seems too low (less than 5 hours)';
        } else if (hoursPerClient > 80) {
          errors['business.monthlyHours'] = 'Hours per client seems too high (more than 80 hours)';
        }
      }
    }

    // ACV validation based on price posture
    if (input.business?.acv && input.pricing?.pricePosture) {
      const acvMatch = input.business.acv.match(/[\d,]+/);
      if (acvMatch) {
        const acvValue = parseInt(acvMatch[0].replace(/,/g, ''));
        
        if (input.pricing.pricePosture === 'premium' && acvValue < 25000) {
          errors['business.acv'] = 'Premium pricing typically requires higher ACV (>$25K)';
        }
        
        if (input.pricing.pricePosture === 'value-priced' && acvValue > 100000) {
          errors['pricing.pricePosture'] = 'Value pricing at this ACV level may not be optimal';
        }
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }, []);

  const getOfferInsights = useCallback((input: OfferCreatorInput) => {
    const insights = {
      credibility: {
        score: 0,
        factors: [] as string[]
      },
      marketFit: {
        score: 0,
        factors: [] as string[]
      },
      scalability: {
        score: 0,
        factors: [] as string[]
      },
      pricing: {
        score: 0,
        factors: [] as string[]
      },
      recommendations: [] as string[]
    };

    // Calculate credibility score
    let credibilityScore = 0;
    
    // Signature results (30%)
    credibilityScore += Math.min(30, input.founder.signatureResults.length * 10);
    if (input.founder.signatureResults.length >= 3) {
      insights.credibility.factors.push('Strong track record with multiple results');
    }
    
    // Core strengths (25%)
    credibilityScore += Math.min(25, input.founder.coreStrengths.length * 5);
    if (input.founder.coreStrengths.length >= 4) {
      insights.credibility.factors.push('Diverse skill set');
    }
    
    // Processes (25%)
    credibilityScore += Math.min(25, input.founder.processes.length * 6);
    if (input.founder.processes.length >= 3) {
      insights.credibility.factors.push('Proven methodologies');
    }
    
    // Proof assets (20%)
    credibilityScore += Math.min(20, input.founder.proofAssets.length * 4);
    
    insights.credibility.score = Math.min(100, credibilityScore);

    // Calculate market fit score
    let marketFitScore = 0;
    
    // Pain point clarity (30%)
    marketFitScore += Math.min(30, input.market.pains.length * 10);
    if (input.market.pains.length >= 3) {
      insights.marketFit.factors.push('Clear pain point identification');
    }
    
    // Outcome specificity (25%)
    marketFitScore += Math.min(25, input.market.outcomes.length * 6);
    
    // Target market specificity (25%)
    marketFitScore += input.market.targetMarket.length > 15 ? 25 : 15;
    
    // Industry alignment (20%)
    const hasAlignment = input.founder.industries.some(industry => 
      input.market.targetMarket.toLowerCase().includes(industry.toLowerCase())
    );
    marketFitScore += hasAlignment ? 20 : 10;
    if (hasAlignment) {
      insights.marketFit.factors.push('Strong industry-market alignment');
    }
    
    insights.marketFit.score = Math.min(100, marketFitScore);

    // Calculate scalability score
    let scalabilityScore = 0;
    
    // Delivery model scalability (30%)
    const scalableModels = ['productized-service', 'training', 'licensing'];
    const hasScalableModel = input.business.deliveryModel.some(model => 
      scalableModels.includes(model)
    );
    scalabilityScore += hasScalableModel ? 30 : 15;
    if (hasScalableModel) {
      insights.scalability.factors.push('Scalable delivery model');
    }
    
    // Capacity planning (25%)
    const capacity = parseInt(input.business.capacity);
    const monthlyHours = parseInt(input.business.monthlyHours);
    if (!isNaN(capacity) && !isNaN(monthlyHours)) {
      const hoursPerClient = monthlyHours / capacity;
      if (hoursPerClient >= 10 && hoursPerClient <= 50) {
        scalabilityScore += 25;
        insights.scalability.factors.push('Well-balanced capacity planning');
      } else {
        scalabilityScore += 15;
      }
    }
    
    // Contract structure (25%)
    scalabilityScore += input.pricing.contractStyle !== 'month-to-month' ? 25 : 15;
    if (input.pricing.contractStyle !== 'month-to-month') {
      insights.scalability.factors.push('Committed contract structure');
    }
    
    // Fulfillment automation (20%)
    scalabilityScore += input.business.fulfillmentStack.length > 2 ? 20 : 10;
    
    insights.scalability.score = Math.min(100, scalabilityScore);

    // Calculate pricing score
    let pricingScore = 0;
    
    // Price posture alignment (40%)
    if (input.pricing.pricePosture === 'premium') {
      pricingScore += input.pricing.guarantee === 'strong-guarantee' ? 40 : 25;
      if (input.pricing.guarantee === 'strong-guarantee') {
        insights.pricing.factors.push('Premium pricing with strong guarantee');
      }
    } else if (input.pricing.pricePosture === 'value-priced') {
      pricingScore += 35;
      insights.pricing.factors.push('Value-based pricing strategy');
    } else {
      pricingScore += 30;
    }
    
    // Guarantee strategy (35%)
    if (input.pricing.guarantee === 'strong-guarantee') {
      pricingScore += 35;
      insights.pricing.factors.push('Strong risk-reversal strategy');
    } else if (input.pricing.guarantee === 'conditional') {
      pricingScore += 25;
    } else {
      pricingScore += 15;
    }
    
    // Contract alignment (25%)
    if (input.pricing.contractStyle === 'project' && 
        input.business.deliveryModel.includes('one-time-project')) {
      pricingScore += 25;
      insights.pricing.factors.push('Aligned contract and delivery model');
    } else if (input.pricing.contractStyle !== 'month-to-month') {
      pricingScore += 20;
    } else {
      pricingScore += 15;
    }
    
    insights.pricing.score = Math.min(100, pricingScore);

    // Generate recommendations
    if (insights.credibility.score < 60) {
      insights.recommendations.push('Strengthen proof assets and case studies');
    }
    
    if (insights.marketFit.score < 60) {
      insights.recommendations.push('Refine target market and pain point focus');
    }
    
    if (insights.scalability.score < 60) {
      insights.recommendations.push('Optimize delivery model for better scalability');
    }
    
    if (insights.pricing.score < 60) {
      insights.recommendations.push('Review pricing strategy and guarantee structure');
    }
    
    if (input.founder.industries.length > 2) {
      insights.recommendations.push('Consider focusing on fewer industries for stronger positioning');
    }
    
    if (input.voice.differentiators.length < 3) {
      insights.recommendations.push('Develop more unique differentiators');
    }

    return insights;
  }, []);

  const calculateCapacityMetrics = useCallback((input: OfferCreatorInput) => {
    const capacity = parseInt(input.business.capacity);
    const monthlyHours = parseInt(input.business.monthlyHours);
    const acvMatch = input.business.acv.match(/[\d,]+/);
    const acvValue = acvMatch ? parseInt(acvMatch[0].replace(/,/g, '')) : 0;

    if (isNaN(capacity) || isNaN(monthlyHours) || acvValue === 0) {
      return null;
    }

    const hoursPerClient = monthlyHours / capacity;
    const monthlyRate = (acvValue / 12) / monthlyHours;
    const potentialRevenue = acvValue * capacity;

    return {
      hoursPerClient: Math.round(hoursPerClient * 10) / 10,
      monthlyRate: Math.round(monthlyRate * 100) / 100,
      potentialRevenue,
      utilizationRate: Math.round((monthlyHours / (capacity * 40)) * 100), // Assuming 40 hours per client is optimal
      recommendations: {
        hoursPerClient: hoursPerClient < 10 ? 'Consider increasing hours per client' :
                       hoursPerClient > 50 ? 'Consider reducing hours per client or increasing capacity' :
                       'Good balance',
        monthlyRate: monthlyRate < 100 ? 'Consider increasing pricing' :
                    monthlyRate > 500 ? 'Premium rate - ensure value delivery matches' :
                    'Competitive rate',
        potentialRevenue: potentialRevenue < 500000 ? 'Consider increasing ACV or capacity' :
                         potentialRevenue > 2000000 ? 'Excellent potential - focus on delivery scalability' :
                         'Good revenue potential'
      }
    };
  }, []);

  return {
    validateInput,
    getOfferInsights,
    calculateCapacityMetrics
  };
};

export const useOfferInsights = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = useCallback(async (
    industry?: string,
    text?: string,
    type?: 'headline' | 'cta' | 'urgency'
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (industry) params.append('industry', industry);
      if (text) params.append('text', text);
      if (type) params.append('type', type);
      
      const url = `/api/offer-creator/insights${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch insights');
      }

      const data = await response.json() as ApiResponseOptional<any>;
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch insights');
      }

      // Type guard to ensure data exists
      if (!data.data) {
        throw new Error('No insights data received');
      }

      return data.data;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getIndustryTips = useCallback((industry: string) => {
    const tips: Record<string, string[]> = {
      'B2B SaaS': [
        'Focus on ROI metrics and integration capabilities',
        'Emphasize scalability and user adoption',
        'Highlight data security and compliance features',
        'Use technical language that resonates with IT decision makers'
      ],
      'E-commerce': [
        'Emphasize conversion rate improvements',
        'Focus on mobile commerce optimization',
        'Highlight customer lifetime value increases',
        'Show clear revenue impact metrics'
      ],
      'Healthcare': [
        'Emphasize compliance and safety outcomes',
        'Focus on patient outcome improvements',
        'Highlight workflow integration benefits',
        'Use clinical language and evidence-based results'
      ],
      'Finance': [
        'Emphasize security and regulatory compliance',
        'Focus on risk reduction and mitigation',
        'Highlight operational efficiency gains',
        'Use conservative, trust-building language'
      ],
      'Marketing Agencies': [
        'Focus on campaign performance metrics',
        'Emphasize client retention and growth',
        'Highlight creative and strategic expertise',
        'Show clear ROI and attribution data'
      ],
      'Real Estate': [
        'Focus on transaction volume and speed',
        'Emphasize market expertise and local knowledge',
        'Highlight technology and process advantages',
        'Use relationship-focused messaging'
      ]
    };

    return tips[industry] || [
      'Focus on measurable outcomes specific to your industry',
      'Emphasize your unique methodology and approach',
      'Highlight relevant case studies and success stories',
      'Use industry-specific language and terminology'
    ];
  }, []);

  return {
    loading,
    error,
    fetchInsights,
    getIndustryTips,
    setError
  };
};
    