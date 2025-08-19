// hooks/useOfferCreator.ts - FIXED VERSION

import { useState, useCallback } from 'react';
import { message } from 'antd';

// Import from your existing types file
import type {
  OfferCreatorInput,
  GeneratedOfferPackage,
  SavedOffer,
  OfferTemplate,
  OptimizationType,
  OptimizationResult,
  AnalysisRequest,
  ConversionAnalysis,
  PsychologyAnalysis,
  CompetitiveAnalysis,
  PerformanceData,
  IndustryBenchmark
} from '@/types/offerCreator';

export type {
  OfferCreatorInput,
  GeneratedOfferPackage,
  SavedOffer,
  OfferTemplate,
  OptimizationType,
  OptimizationResult,
  AnalysisRequest,
  ConversionAnalysis,
  PsychologyAnalysis,
  CompetitiveAnalysis,
  PerformanceData,
  IndustryBenchmark
};

// Main offer creator hook
export const useOfferCreator = () => {
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // In useOfferCreator.ts
const generateOffer = useCallback(async (input: OfferCreatorInput): Promise<{
  offerId: string;
  offer: GeneratedOfferPackage;
} | null> => {
  setGenerating(true);
  setError(null);

  try {
    console.log('🚀 Sending offer generation request...', input);

    // Validate required fields before constructing request
    if (!input.offerType) {
      throw new Error('Offer type is required');
    }
    if (!['discount', 'bonus', 'trial', 'guarantee'].includes(input.offerType)) {
      throw new Error('Invalid offer type');
    }

    // Construct request data
    const requestData = {
      // Basic required fields
      offerName: input.offerName,
      offerValue: input.offerValue,
      regularPrice: input.regularPrice,
      offerPrice: input.offerPrice,
      expiryDate: input.expiryDate,
      targetIndustry: input.targetIndustry,
      offerType: input.offerType, // No default to force validation

      // Offer type-specific fields
      ...(input.offerType === 'discount' && {
        discountValue: input.discountValue,
        discountAmount: input.discountAmount,
      }),
      ...(input.offerType === 'bonus' && {
        bonusItem: input.bonusItem,
        bonusValue: input.bonusValue,
        totalValue: input.totalValue,
      }),
      ...(input.offerType === 'trial' && {
        trialPeriod: input.trialPeriod,
      }),
      ...(input.offerType === 'guarantee' && {
        guaranteePeriod: input.guaranteePeriod,
      }),

      // Optional enhancement fields
      cta: input.cta,
      redemptionInstructions: input.redemptionInstructions,
      scarcity: input.scarcity || false,
      scarcityReason: input.scarcity ? input.scarcityReason : undefined,
      socialProof: input.socialProof || false,
      testimonialQuote: input.socialProof ? input.testimonialQuote : undefined,
      testimonialAuthor: input.socialProof ? input.testimonialAuthor : undefined,

      // Advanced fields
      businessGoal: input.businessGoal,
      customerSegment: input.customerSegment,
      seasonality: input.seasonality,
      competitorAnalysis: input.competitorAnalysis,
    };

    console.log('📤 Final request data:', requestData);

    const response = await fetch('/api/offer-creator', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    console.log('📨 Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ API Error:', errorData);

      if (errorData.details && Array.isArray(errorData.details)) {
        const errorMessages = errorData.details.map((detail: any) => detail.message || detail).join(', ');
        throw new Error(`Validation Error: ${errorMessages}`);
      }

      throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ API Response:', data);

    if (!data.success) {
      throw new Error(data.error || 'Generation failed');
    }

    message.success('Offer generated successfully!');
    return data.data;

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

    // Basic required field validation
    if (!input.offerName || input.offerName.length < 3) {
      errors.offerName = 'Offer name must be at least 3 characters';
    }

    if (!input.offerValue || input.offerValue.length < 10) {
      errors.offerValue = 'Please provide a more detailed value proposition (at least 10 characters)';
    }

    if (!input.regularPrice) {
      errors.regularPrice = 'Regular price is required';
    }

    if (!input.offerPrice) {
      errors.offerPrice = 'Offer price is required';
    }

    if (input.regularPrice && input.offerPrice) {
      const regular = parseFloat(input.regularPrice.replace(/[$,]/g, ''));
      const offer = parseFloat(input.offerPrice.replace(/[$,]/g, ''));
      
      if (!isNaN(regular) && !isNaN(offer) && offer >= regular) {
        errors.offerPrice = 'Offer price must be lower than regular price';
      }
    }

    if (!input.expiryDate) {
      errors.expiryDate = 'Expiry date is required';
    } else {
      const expiry = new Date(input.expiryDate);
      const today = new Date();
      if (expiry <= today) {
        errors.expiryDate = 'Expiry date must be in the future';
      }
    }

    if (!input.targetIndustry) {
      errors.targetIndustry = 'Target industry is required';
    }

    // Offer type specific validation
    if (input.offerType === 'discount') {
  if (!input.discountValue) {
    errors.discountValue = 'Discount percentage is required for discount offers';
  }
  if (!input.discountAmount) {
    errors.discountAmount = 'Discount amount is required for discount offers';
  }
}

    if (input.offerType === 'bonus') {
      if (!input.bonusItem) {
        errors.bonusItem = 'Bonus item is required for bonus offers';
      }
      if (!input.bonusValue) {
        errors.bonusValue = 'Bonus value is required for bonus offers';
      }
    }

    if (input.offerType === 'trial' && !input.trialPeriod) {
      errors.trialPeriod = 'Trial period is required for trial offers';
    }

    if (input.offerType === 'guarantee' && !input.guaranteePeriod) {
      errors.guaranteePeriod = 'Guarantee period is required for guarantee offers';
    }

    // Conditional validation for scarcity
    if (input.scarcity && !input.scarcityReason) {
      errors.scarcityReason = 'Scarcity reason is required when scarcity is enabled';
    }

    // Conditional validation for social proof
    if (input.socialProof) {
      if (!input.testimonialQuote) {
        errors.testimonialQuote = 'Testimonial quote is required when social proof is enabled';
      }
      if (!input.testimonialAuthor) {
        errors.testimonialAuthor = 'Testimonial author is required when social proof is enabled';
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }, []);

  const calculateSavings = useCallback((regularPrice: string, offerPrice: string) => {
    if (!regularPrice || !offerPrice) return null;
    
    const regular = parseFloat(regularPrice.replace(/[$,]/g, ''));
    const offer = parseFloat(offerPrice.replace(/[$,]/g, ''));
    
    if (isNaN(regular) || isNaN(offer)) return null;
    
    const savings = regular - offer;
    const percentage = (savings / regular) * 100;
    
    return {
      dollarAmount: savings,
      percentage: Math.round(percentage),
      formattedSavings: `$${savings.toLocaleString()}`
    };
  }, []);

  return {
    loading,
    generating,
    error,
    generateOffer,
    quickValidate,
    calculateSavings,
    setError
  };
};

// Hook for managing saved offers - FIXED
export const useSavedOffers = () => {
  const [offers, setOffers] = useState<SavedOffer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOffers = useCallback(async (workspaceId?: string, offerType?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('📋 Fetching offers...');
      
      const params = new URLSearchParams();
      if (workspaceId) params.append('workspaceId', workspaceId);
      if (offerType) params.append('offerType', offerType);
      
      const url = `/api/offer-creator${params.toString() ? `?${params.toString()}` : ''}`;
      console.log('🔗 Fetch URL:', url);
      
      const response = await fetch(url);
      console.log('📨 Offers response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Offers fetch error:', errorData);
        throw new Error(errorData.error || `Failed to fetch offers: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Offers data:', data);
      
      if (data.success) {
        setOffers(data.data || []);
      } else {
        throw new Error(data.error || 'Failed to fetch offers');
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('💥 Fetch offers error:', err);
      setError(errorMessage);
      // Don't show message.error in hook, let component handle it
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

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch offer');
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

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to delete offer');
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

// Rest of the hooks remain the same...
export const useOfferBenchmarks = () => {
  const [benchmarks, setBenchmarks] = useState<any>(null);
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBenchmarks = useCallback(async (industry?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('📊 Fetching benchmarks...');
      
      const url = industry 
        ? `/api/offer-creator/benchmarks?industry=${industry}`
        : '/api/offer-creator/benchmarks';
      
      console.log('🔗 Benchmarks URL:', url);
      
      const response = await fetch(url);
      console.log('📨 Benchmarks response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Benchmarks fetch error:', errorText);
        throw new Error(`Failed to fetch benchmarks: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Benchmarks data:', data);
      
      if (data.success) {
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
        throw new Error('Failed to fetch insights');
      }

      const data = await response.json();
      
      if (data.success) {
        setInsights(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch insights');
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    benchmarks,
    insights,
    loading,
    error,
    fetchBenchmarks,
    fetchInsights,
    setError
  };
};

export const useOfferTemplates = () => {
  const [templates, setTemplates] = useState<OfferTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = useCallback(async (
    industry?: string,
    offerType?: string
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('📋 Fetching templates...');
      
      const params = new URLSearchParams();
      if (industry) params.append('industry', industry);
      if (offerType) params.append('offerType', offerType);
      
      const url = `/api/offer-creator/templates${params.toString() ? `?${params.toString()}` : ''}`;
      console.log('🔗 Templates URL:', url);
      
      const response = await fetch(url);
      console.log('📨 Templates response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Templates fetch error:', errorText);
        throw new Error(`Failed to fetch templates: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Templates data:', data);
      
      if (data.success) {
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

  const applyTemplate = useCallback((template: OfferTemplate): Partial<OfferCreatorInput> => {
    return {
      offerType: template.offerType,
      targetIndustry: template.industry,
      offerName: template.name,
      offerValue: template.description,
      cta: template.example?.headline || 'Get Started Now',
      discountValue: template.example?.discount,
      bonusValue: template.example?.bonusValue,
      trialPeriod: template.example?.trialPeriod,
      guaranteePeriod: template.example?.guarantee ? 30 : undefined,
      scarcity: !!template.example?.urgency,
      scarcityReason: template.example?.urgency,
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

// Other hooks remain the same...
export const useOfferOptimization = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const optimizeOffer = useCallback(async (
    offerId: string, 
    type: OptimizationType
  ): Promise<OptimizationResult | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/offer-creator/${offerId}/optimize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to optimize offer');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Optimization failed');
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
    optimizeOffer,
    setError
  };
};

export const useOfferAnalysis = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeOffer = useCallback(async (
    offerText: string,
    analysisType: 'conversion' | 'psychology' | 'competition' = 'conversion',
    industry?: string
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
          offerText,
          analysisType,
          industry
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze offer');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Analysis failed');
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

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Performance update failed');
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

  const getPerformance = useCallback(async (offerId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/offer-creator/${offerId}/performance`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch performance data');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch performance data');
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
    updatePerformance,
    getPerformance,
    setError
  };
};

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
        throw new Error('Failed to export offer');
      }

      if (format === 'html') {
        const contentDisposition = response.headers.get('content-disposition');
        const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
        const filename = filenameMatch?.[1] || `offer-export-${offerId}.html`;

        const blob = await response.blob();
        downloadFile(blob, filename);
        message.success('Offer exported successfully');
      } else {
        const data = await response.json();
        if (data.success) {
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

export const useOfferValidation = () => {
  const validateInput = useCallback((input: Partial<OfferCreatorInput>) => {
    const errors: Record<string, string> = {};

    // Required fields validation
    if (!input.offerName || input.offerName.length < 3) {
      errors.offerName = 'Offer name must be at least 3 characters';
    } else if (input.offerName.length > 100) {
      errors.offerName = 'Offer name must be less than 100 characters';
    }

    if (!input.offerValue || input.offerValue.length < 10) {
      errors.offerValue = 'Please provide a more detailed value proposition';
    } else if (input.offerValue.length > 200) {
      errors.offerValue = 'Value proposition is too long';
    }

    if (!input.regularPrice) {
      errors.regularPrice = 'Regular price is required';
    } else if (!/^\$?[\d,]+(\.\d{2})?$/.test(input.regularPrice)) {
      errors.regularPrice = 'Please enter a valid price format';
    }

    if (!input.offerPrice) {
      errors.offerPrice = 'Offer price is required';
    } else if (!/^\$?[\d,]+(\.\d{2})?$/.test(input.offerPrice)) {
      errors.offerPrice = 'Please enter a valid price format';
    }

    // Price comparison
    if (input.regularPrice && input.offerPrice) {
      const regular = parseFloat(input.regularPrice.replace(/[$,]/g, ''));
      const offer = parseFloat(input.offerPrice.replace(/[$,]/g, ''));
      
      if (offer >= regular) {
        errors.offerPrice = 'Offer price must be lower than regular price';
      }
    }

    if (!input.expiryDate) {
      errors.expiryDate = 'Expiry date is required';
    } else {
      const expiry = new Date(input.expiryDate);
      const today = new Date();
      if (expiry <= today) {
        errors.expiryDate = 'Expiry date must be in the future';
      }
    }

    if (!input.targetIndustry) {
      errors.targetIndustry = 'Please select a target industry';
    }

    // Conditional validations based on offer type
    if (input.offerType === 'discount') {
      if (!input.discountValue) {
        errors.discountValue = 'Discount percentage is required for discount offers';
      }
      if (!input.discountAmount) {
        errors.discountAmount = 'Discount amount is required for discount offers';
      }
    }

    if (input.offerType === 'bonus') {
      if (!input.bonusItem) {
        errors.bonusItem = 'Bonus item is required for bonus offers';
      }
      if (!input.bonusValue) {
        errors.bonusValue = 'Bonus value is required for bonus offers';
      }
    }

    if (input.offerType === 'trial' && !input.trialPeriod) {
      errors.trialPeriod = 'Trial period is required for trial offers';
    }

    if (input.offerType === 'guarantee' && !input.guaranteePeriod) {
      errors.guaranteePeriod = 'Guarantee period is required for guarantee offers';
    }

    // Scarcity validation
    if (input.scarcity && !input.scarcityReason) {
      errors.scarcityReason = 'Scarcity reason is required when scarcity is enabled';
    }

    // Social proof validation
    if (input.socialProof) {
      if (!input.testimonialQuote) {
        errors.testimonialQuote = 'Testimonial quote is required when social proof is enabled';
      }
      if (!input.testimonialAuthor) {
        errors.testimonialAuthor = 'Testimonial author is required when social proof is enabled';
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }, []);

  const getOfferInsights = useCallback((input: OfferCreatorInput) => {
    // Safely handle potentially undefined price values
    const regularPriceStr = input.regularPrice || '0';
    const offerPriceStr = input.offerPrice || '0';
    
    const regularPrice = parseFloat(regularPriceStr.replace(/[$,]/g, ''));
    const offerPrice = parseFloat(offerPriceStr.replace(/[$,]/g, ''));
    
    // Handle NaN values
    const validRegularPrice = isNaN(regularPrice) ? 0 : regularPrice;
    const validOfferPrice = isNaN(offerPrice) ? 0 : offerPrice;
    
    const savings = validRegularPrice - validOfferPrice;
    const discountPercentage = validRegularPrice > 0 ? (savings / validRegularPrice) * 100 : 0;

    const insights = {
      pricing: {
        regularPrice: validRegularPrice,
        offerPrice: validOfferPrice,
        savings,
        discountPercentage: Math.round(discountPercentage),
        pricePoint: validRegularPrice > 1000 ? 'high-ticket' as const : validRegularPrice > 100 ? 'mid-ticket' as const : 'low-ticket' as const
      },
      urgency: {
        hasScarcity: input.scarcity || false,
        hasDeadline: !!input.expiryDate,
        expiryDate: input.expiryDate,
        daysUntilExpiry: input.expiryDate ? Math.ceil((new Date(input.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0
      },
      trust: {
        hasSocialProof: input.socialProof || false,
        hasGuarantee: input.offerType === 'guarantee',
        hasTestimonial: !!(input.testimonialQuote && input.testimonialAuthor)
      },
      recommendations: [] as string[]
    };

    // Generate recommendations only if we have valid pricing data
    if (validRegularPrice > 0 && validOfferPrice > 0) {
      if (discountPercentage > 50) {
        insights.recommendations.push('Very high discount may hurt perceived value');
      } else if (discountPercentage < 10) {
        insights.recommendations.push('Consider increasing discount for stronger motivation');
      }
    }

    if (!input.scarcity) {
      insights.recommendations.push('Adding scarcity could increase urgency and conversions');
    }

    if (!input.socialProof) {
      insights.recommendations.push('Adding testimonials or social proof could build trust');
    }

    if (input.expiryDate) {
      const daysUntilExpiry = Math.ceil((new Date(input.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntilExpiry > 30) {
        insights.recommendations.push('Long expiry period may reduce urgency');
      }
    }

    return insights;
  }, []);

  return {
    validateInput,
    getOfferInsights,
    
    
  };
};