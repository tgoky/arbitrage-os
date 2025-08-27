// hooks/useOfferCreator.ts - CLEAN VERSION

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
  ProgressiveValidationResult
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

      const response = await fetch('/api/offer-creator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });

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

      if (!data.success) {
        throw new Error(data.error || 'Generation failed');
      }

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
    getBusinessInsights,
    setError
  };
};

// ============================================================================
// SIGNATURE OFFER VALIDATION HOOK - ONE CLEAN VERSION
// ============================================================================
export const useOfferValidation = () => {
  // Progressive validation function
  const validateInputProgressive = useCallback((
    input: Partial<OfferCreatorInput>, 
    showAllErrors = false
  ): ProgressiveValidationResult => {
    const errors: Record<string, string> = {};
    const warnings: Record<string, string> = {};

    // Only validate filled sections, unless showAllErrors is true
    const shouldValidateSection = (section: any, sectionName: string) => {
      if (showAllErrors) return true;
      
      // Check if section has any meaningful data
      if (!section) return false;
      
      switch (sectionName) {
        case 'founder':
          return (section.signatureResults?.length || 0) > 0 || (section.coreStrengths?.length || 0) > 0;
        case 'market':
          return (section.targetMarket?.length || 0) > 0 || (section.buyerRole?.length || 0) > 0;
        case 'business':
          return (section.deliveryModel?.length || 0) > 0 || (section.capacity?.length || 0) > 0;
        case 'pricing':
          return true; // These have defaults
        case 'voice':
          return (section.differentiators?.length || 0) > 0;
        default:
          return false;
      }
    };

    // Founder validation
    if (shouldValidateSection(input.founder, 'founder')) {
      if (!(input.founder?.signatureResults?.length || 0)) {
        errors['founder.signatureResults'] = 'At least one signature result is required';
      }
      if (!(input.founder?.coreStrengths?.length || 0)) {
        errors['founder.coreStrengths'] = 'At least one core strength is required';
      }
      if (!(input.founder?.processes?.length || 0)) {
        errors['founder.processes'] = 'At least one process is required';
      }
      if (!(input.founder?.industries?.length || 0)) {
        errors['founder.industries'] = 'At least one industry is required';
      } else if ((input.founder?.industries?.length || 0) > 3) {
        errors['founder.industries'] = 'Maximum 3 industries allowed for focused positioning';
      }
    }

    // Market validation
    if (shouldValidateSection(input.market, 'market')) {
      if (!input.market?.targetMarket || input.market.targetMarket.length < 3) {
        errors['market.targetMarket'] = 'Target market must be at least 3 characters';
      }
      if (!input.market?.buyerRole || input.market.buyerRole.length < 3) {
        errors['market.buyerRole'] = 'Buyer role must be at least 3 characters';
      }
      if (!(input.market?.pains?.length || 0)) {
        errors['market.pains'] = 'At least one pain point is required';
      }
      if (!(input.market?.outcomes?.length || 0)) {
        errors['market.outcomes'] = 'At least one outcome is required';
      }
    }

    // Business validation
    if (shouldValidateSection(input.business, 'business')) {
      if (!(input.business?.deliveryModel?.length || 0)) {
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

      // Business logic validation for capacity vs hours
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
    }

    // Pricing validation (always validate since it has defaults)
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
    if (shouldValidateSection(input.voice, 'voice')) {
      if (!(input.voice?.differentiators?.length || 0)) {
        errors['voice.differentiators'] = 'At least one differentiator is required';
      }
    }

    // ACV validation based on price posture
    if (input.business?.acv && input.pricing?.pricePosture) {
      const acvMatch = input.business.acv.match(/[\d,]+/);
      if (acvMatch) {
        const acvValue = parseInt(acvMatch[0].replace(/,/g, ''));
        
        if (input.pricing.pricePosture === 'premium' && acvValue < 25000) {
          warnings['business.acv'] = 'Premium pricing typically requires higher ACV (>$25K)';
        }
        
        if (input.pricing.pricePosture === 'value-priced' && acvValue > 100000) {
          warnings['pricing.pricePosture'] = 'Value pricing at this ACV level may not be optimal';
        }
      }
    }

    // Calculate completion percentage
    const totalRequiredFields = 14;
    const completedFields = [
      (input.founder?.signatureResults?.length || 0) > 0,
      (input.founder?.coreStrengths?.length || 0) > 0,
      (input.founder?.processes?.length || 0) > 0,
      (input.founder?.industries?.length || 0) > 0,
      (input.market?.targetMarket?.length || 0) > 2,
      (input.market?.buyerRole?.length || 0) > 2,
      (input.market?.pains?.length || 0) > 0,
      (input.market?.outcomes?.length || 0) > 0,
      (input.business?.deliveryModel?.length || 0) > 0,
      (input.business?.capacity?.length || 0) > 0,
      (input.business?.monthlyHours?.length || 0) > 0,
      (input.business?.acv?.length || 0) > 0,
      !!input.pricing?.pricePosture,
      (input.voice?.differentiators?.length || 0) > 0,
    ].filter(Boolean).length;

    const completionPercentage = Math.round((completedFields / totalRequiredFields) * 100);

    return {
      isValid: Object.keys(errors).length === 0 && completedFields === totalRequiredFields,
      errors,
      warnings,
      completionPercentage,
      completedFields,
      totalRequiredFields,
      isReadyToGenerate: completedFields >= 10 // Allow generation with most fields complete
    };
  }, []);

  // Simple validation for backward compatibility
  const validateInput = useCallback((input: Partial<OfferCreatorInput>) => {
    const result = validateInputProgressive(input, true);
    return {
      isValid: result.isValid,
      errors: result.errors
    };
  }, [validateInputProgressive]);

  const getOfferInsights = useCallback((input: OfferCreatorInput) => {
    // Your existing insights logic here...
    return {
      credibility: { score: 75, factors: ['Strong results'] },
      marketFit: { score: 80, factors: ['Good alignment'] },
      scalability: { score: 70, factors: ['Scalable model'] },
      pricing: { score: 85, factors: ['Good pricing'] },
      recommendations: ['Keep improving']
    };
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
      utilizationRate: Math.round((monthlyHours / (capacity * 40)) * 100),
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
    validateInputProgressive,
    getOfferInsights,
    calculateCapacityMetrics
  };
};

// ============================================================================
// OTHER HOOKS (SAVED OFFERS, EXPORT, ETC.)
// ============================================================================
export const useSavedOffers = () => {
  const [offers, setOffers] = useState<UserOffer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOffers = useCallback(async (workspaceId?: string, targetMarket?: string, pricePosture?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (workspaceId) params.append('workspaceId', workspaceId);
      if (targetMarket) params.append('targetMarket', targetMarket);
      if (pricePosture) params.append('pricePosture', pricePosture);
      
      const url = `/api/offer-creator${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch offers: ${response.status}`);
      }

      const data = await response.json() as ApiResponseOptional<UserOffer[]>;
      
      if (data.success && data.data) {
        setOffers(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch offers');
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const getOffer = useCallback(async (offerId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/offer-creator/${offerId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch offer: ${response.status}`);
      }

      const data = await response.json() as ApiResponseOptional<any>;
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch offer');
      }

      if (!data.data) {
        throw new Error('Offer not found');
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

      if (!data.data) {
        throw new Error('Delete operation failed');
      }

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
        return true;
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