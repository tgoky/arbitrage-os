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

import { useWorkspaceContext } from '../hooks/useWorkspaceContext';

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
   const { currentWorkspace } = useWorkspaceContext(); // ADD THIS

  const generateOffer = useCallback(async (input: OfferCreatorInput): Promise<{
    offerId: string;
    offer: GeneratedOfferPackage;
  } | null> => {


     // ADD WORKSPACE VALIDATION
    if (!currentWorkspace) {
      throw new Error('No workspace selected. Please access the offer creator from within a workspace.');
    }

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


      // MODIFY REQUEST TO INCLUDE WORKSPACE ID
      const requestBody = {
        ...input,
        workspaceId: currentWorkspace.id // Add workspace ID
      };

 



      const response = await fetch('/api/offer-creator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
         body: JSON.stringify(requestBody),
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
  }, [currentWorkspace]); 

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

    if (input.business?.acv) {
  const value = parseInt(input.business.acv.replace(/[^0-9]/g, '') || '0');
  const period = input.business.acvPeriod || 'annual';
  
  // Warn if numbers seem backwards
  if (period === 'monthly' && value > 50000) {
    warnings['business.acv'] = 'Monthly deal size over $50k is unusual for most service businesses - did you mean annual?';
  }
  if (period === 'annual' && value < 5000) {
    warnings['business.acv'] = 'Annual deal size under $5k is very low - did you mean monthly?';
  }
}


if (input.business?.acv && input.business?.capacity) {
  const acvNum = parseInt(input.business.acv.replace(/[^0-9]/g, ''));
  const capacityNum = parseInt(input.business.capacity);
  const period = input.business.acvPeriod || 'annual';
  
  const perClientMonthly = period === 'monthly' 
    ? Math.round(acvNum / capacityNum)
    : Math.round(acvNum / 12 / capacityNum);
  
  if (perClientMonthly < 500) {
    warnings['business.acv'] = `Your per-client monthly rate would be only $${perClientMonthly}/month. Did you mean to select "${period === 'monthly' ? 'annual' : 'monthly'}"?`;
  }
}

    // HARD ERRORS - Only truly essential fields prevent generation
    // Founder validation - Only check if showAllErrors OR if we have some founder data
    if (showAllErrors || (input.founder?.signatureResults?.length || input.founder?.coreStrengths?.length)) {
      if (!(input.founder?.signatureResults?.length || 0)) {
        errors['founder.signatureResults'] = 'At least one signature result is required';
      }
      if (!(input.founder?.coreStrengths?.length || 0)) {
        errors['founder.coreStrengths'] = 'At least one core strength is required';
      }
      // MOVED TO WARNING - processes not absolutely essential
      if (!(input.founder?.processes?.length || 0)) {
        warnings['founder.processes'] = 'Adding proven processes strengthens your offers';
      }
      if (!(input.founder?.industries?.length || 0)) {
        errors['founder.industries'] = 'At least one industry is required';
      }
      
      // MOVED TO WARNING - Don't block generation for too many industries
      if ((input.founder?.industries?.length || 0) > 3) {
        warnings['founder.industries'] = 'Consider focusing on 1-2 industries for stronger positioning';
      }
    }

    // Market validation - Only check if showAllErrors OR if we have some market data
    if (showAllErrors || input.market?.targetMarket || input.market?.buyerRole) {
      if (!input.market?.targetMarket || input.market.targetMarket.length < 3) {
        errors['market.targetMarket'] = 'Target market must be at least 3 characters';
      }
      if (!input.market?.buyerRole || input.market.buyerRole.length < 3) {
        errors['market.buyerRole'] = 'Buyer role required';
      }
      // MADE LESS STRICT - only require if trying to validate
      if (showAllErrors && !(input.market?.pains?.length || 0)) {
        warnings['market.pains'] = 'Adding pain points will improve your offers';
      }
      if (showAllErrors && !(input.market?.outcomes?.length || 0)) {
        warnings['market.outcomes'] = 'Adding desired outcomes will improve your offers';
      }
    }

    if (input.business?.acv) {
  const value = parseInt(input.business.acv.replace(/[^0-9]/g, '') || '0');
  const period = input.business.acvPeriod || 'monthly';
  
  // Warn if numbers seem unusual
  if (period === 'monthly' && value > 100000) {
    warnings['business.acv'] = 'Monthly deal size over $100k is unusual - did you mean annual?';
  }
  if (period === 'annual' && value < 1000) {
    warnings['business.acv'] = 'Annual deal size under $1k is unusual - did you mean monthly?';
  }
}


    // Business validation - Only check if showAllErrors OR if we have some business data
    if (showAllErrors || input.business?.deliveryModel?.length || input.business?.capacity) {
      if (!(input.business?.deliveryModel?.length || 0)) {
        errors['business.deliveryModel'] = 'At least one delivery model is required';
      }
      // MADE LESS STRICT - capacity and hours become warnings unless fully validating
      if (!input.business?.capacity) {
        if (showAllErrors) {
          errors['business.capacity'] = 'Capacity is required';
        } else {
          warnings['business.capacity'] = 'Adding capacity helps generate better pricing';
        }
      }
      if (!input.business?.monthlyHours) {
        if (showAllErrors) {
          errors['business.monthlyHours'] = 'Monthly hours is required';
        } else {
          warnings['business.monthlyHours'] = 'Adding monthly hours helps with capacity planning';
        }
      }
      if (!input.business?.acv) {
        if (showAllErrors) {
          errors['business.acv'] = 'Annual Contract Value is required';
        } else {
          warnings['business.acv'] = 'Adding ACV helps with pricing strategy';
        }
      }

      // MOVED TO WARNINGS - Capacity vs hours guidance (don't block generation)
      if (input.business?.capacity && input.business?.monthlyHours) {
        const capacity = parseInt(input.business.capacity);
        const monthlyHours = parseInt(input.business.monthlyHours);
        
        if (!isNaN(capacity) && !isNaN(monthlyHours) && capacity > 0) {
          const hoursPerClient = monthlyHours / capacity;
          if (hoursPerClient < 5) {
            warnings['business.capacity'] = 'Consider increasing hours per client (currently less than 5 hours per client)';
          } else if (hoursPerClient > 80) {
            warnings['business.monthlyHours'] = 'Consider adjusting capacity or hours (currently over 80 hours per client)';
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

    // Voice validation - Only require differentiators for generation
    if (!input.voice?.brandTone) {
      // These have defaults, so just warn
      warnings['voice.brandTone'] = 'Brand tone helps tailor your messaging';
    }
    if (!input.voice?.positioning) {
      warnings['voice.positioning'] = 'Positioning angle helps focus your value proposition';
    }
    
    // Differentiators are essential for good offers
    if (!(input.voice?.differentiators?.length || 0)) {
      if (showAllErrors || input.voice?.differentiators !== undefined) {
        errors['voice.differentiators'] = 'At least one differentiator is required';
      }
    }

    // ALL BUSINESS LOGIC MOVED TO WARNINGS - Don't block generation
    
    // ACV validation based on price posture - NOW WARNINGS ONLY
    if (input.business?.acv && input.pricing?.pricePosture) {
      const acvMatch = input.business.acv.match(/[\d,]+/);
      if (acvMatch) {
        const acvValue = parseInt(acvMatch[0].replace(/,/g, ''));
        
        if (input.pricing.pricePosture === 'premium' && acvValue < 25000) {
          warnings['business.acv'] = 'Premium pricing typically works better with higher ACV (>$25K), but you can still proceed';
        }
        
        if (input.pricing.pricePosture === 'value-priced' && acvValue > 100000) {
          warnings['pricing.pricePosture'] = 'Value pricing at this ACV level may not be optimal, but can work with strong ROI positioning';
        }
      }
    }

    // Delivery model and contract alignment - NOW WARNING ONLY
    if (input.business?.deliveryModel?.includes('one-time-project') && 
        input.pricing?.contractStyle !== 'project') {
      warnings['pricing.contractStyle'] = 'Consider project-based contract style for one-time project delivery';
    }

    // Industry and tone alignment - NOW WARNING ONLY
    const techIndustries = ['saas', 'software', 'tech', 'technology'];
    const hasTechIndustry = input.founder?.industries?.some(industry => 
      techIndustries.some(tech => industry.toLowerCase().includes(tech))
    );
    
    if (hasTechIndustry && input.voice?.brandTone === 'friendly') {
      warnings['voice.brandTone'] = 'Consider "consultative" or "assertive" tone for tech industries, though friendly can work too';
    }

    // Premium pricing without guarantee - NOW WARNING ONLY
    if (input.pricing?.pricePosture === 'premium' && input.pricing?.guarantee === 'none') {
      warnings['pricing.guarantee'] = 'Consider adding a guarantee for premium pricing to reduce buyer risk';
    }

    // Calculate completion percentage based on ESSENTIAL fields only
    const essentialFields = [
      (input.founder?.signatureResults?.length || 0) > 0,
      (input.founder?.coreStrengths?.length || 0) > 0,
      (input.founder?.industries?.length || 0) > 0,
      (input.market?.targetMarket?.length || 0) > 2,
      (input.market?.buyerRole?.length || 0) > 2,
      (input.business?.deliveryModel?.length || 0) > 0,
      (input.voice?.differentiators?.length || 0) > 0,
    ];
    
    const optionalFields = [
      (input.founder?.processes?.length || 0) > 0,
      (input.market?.pains?.length || 0) > 0,
      (input.market?.outcomes?.length || 0) > 0,
      !!input.business?.capacity,
      !!input.business?.monthlyHours,
      !!input.business?.acv,
      !!input.pricing?.pricePosture,
    ];

    const completedEssential = essentialFields.filter(Boolean).length;
    const completedOptional = optionalFields.filter(Boolean).length;
    const totalEssential = essentialFields.length;
    const totalOptional = optionalFields.length;
    
    const completionPercentage = Math.round(
      ((completedEssential * 2) + completedOptional) / ((totalEssential * 2) + totalOptional) * 100
    );

    // FIXED: Only check ERRORS for isValid, not warnings
    const hasBlockingErrors = Object.keys(errors).length > 0;
    const hasMinimumRequired = completedEssential >= 5; // Need at least 5 of 7 essential fields

    return {
      isValid: !hasBlockingErrors && completedEssential === totalEssential && completedOptional === totalOptional,
      isReadyToGenerate: !hasBlockingErrors && hasMinimumRequired, // Can generate with minimal required fields
      errors,
      warnings,
      completionPercentage,
      completedFields: completedEssential + completedOptional,
      totalRequiredFields: totalEssential + totalOptional,
      essentialComplete: completedEssential,
      totalEssential: totalEssential
    };
  }, []);


  // Simple validation for backward compatibility
 const validateInput = useCallback((input: Partial<OfferCreatorInput>) => {
    const result = validateInputProgressive(input, true);
    return {
      isValid: result.isValid,
      errors: result.errors,
      warnings: result.warnings // Include warnings in simple validation too
    };
  }, [validateInputProgressive]);


  
  const getOfferInsights = useCallback((input: OfferCreatorInput) => {
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
  const period = input.business.acvPeriod || 'annual';

  if (isNaN(capacity) || isNaN(monthlyHours) || acvValue === 0) {
    return null;
  }

  // OPTION A: acvValue is TOTAL revenue, not per-client
  const annualTotal = period === 'monthly' ? acvValue * 12 : acvValue;
  const monthlyTotal = period === 'monthly' ? acvValue : Math.round(acvValue / 12);
  
  const monthlyPerClient = Math.round(monthlyTotal / capacity);
  const hoursPerClient = monthlyHours / capacity;
  const hourlyRate = monthlyPerClient / hoursPerClient;
  
  // Potential revenue is the TOTAL, not multiplied by capacity
  const potentialRevenue = annualTotal;

  return {
    hoursPerClient: Math.round(hoursPerClient * 10) / 10,
    monthlyRate: Math.round(hourlyRate * 100) / 100,
    potentialRevenue,
    utilizationRate: Math.round((monthlyHours / (capacity * 40)) * 100),
    recommendations: {
      hoursPerClient: hoursPerClient < 10 ? 'Consider increasing hours per client' :
                     hoursPerClient > 50 ? 'Consider reducing hours per client or increasing capacity' :
                     'Good balance',
      monthlyRate: hourlyRate < 50 ? 'Consider increasing total revenue target' :
                  hourlyRate > 200 ? 'Premium rate - ensure value delivery matches' :
                  'Competitive rate',
      potentialRevenue: potentialRevenue < 50000 ? 'Consider increasing revenue target' :
                       potentialRevenue > 500000 ? 'Excellent target - focus on delivery scalability' :
                       'Good revenue target'
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
   const { currentWorkspace } = useWorkspaceContext(); // ADD THIS

  const fetchOffers = useCallback(async (workspaceId?: string, targetMarket?: string, pricePosture?: string) => {
     if (!currentWorkspace) {
      console.log('No current workspace, skipping offers fetch');
      return;
    }
   
   
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
       params.append('workspaceId', currentWorkspace.id); 
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
 }, [currentWorkspace?.id]);

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