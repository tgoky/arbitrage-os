// hooks/useOfferCreator.ts
import { useState, useCallback } from 'react';
import { message } from 'antd';

// Types matching the backend
export interface OfferCreatorInput {
  offerName: string;
  offerValue: string;
  regularPrice: string;
  offerPrice: string;
  expiryDate: string;
  targetIndustry: string;
  offerType: 'discount' | 'bonus' | 'trial' | 'guarantee';
  discountValue?: number;
  discountAmount?: string;
  bonusItem?: string;
  bonusValue?: string;
  totalValue?: string;
  trialPeriod?: number;
  guaranteePeriod?: number;
  cta?: string;
  redemptionInstructions?: string;
  scarcity?: boolean;
  scarcityReason?: string;
  socialProof?: boolean;
  testimonialQuote?: string;
  testimonialAuthor?: string;
  businessGoal?: 'lead-generation' | 'sales' | 'retention' | 'upsell' | 'brand-awareness';
  customerSegment?: 'new' | 'existing' | 'churned' | 'high-value';
  seasonality?: string;
  competitorAnalysis?: string;
}

export interface GeneratedOffer {
  headline: string;
  subheadline: string;
  mainCopy: string;
  bulletPoints: string[];
  cta: string;
  urgency: string;
  socialProof: string;
  riskReversal: string;
  offerSummary: string;
  emailSubjectLines: string[];
  socialMediaCaptions: string[];
  adCopy: string;
}

export interface OfferAnalysis {
  conversionPotential: {
    score: number;
    factors: Array<{
      factor: string;
      impact: 'High' | 'Medium' | 'Low';
      recommendation: string;
    }>;
  };
  marketFit: {
    industryRelevance: number;
    competitiveAdvantage: string[];
    marketTiming: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  };
  psychologyFactors: {
    persuasionTechniques: string[];
    cognitiveTriggersUsed: string[];
    emotionalAppeal: number;
  };
  optimizationSuggestions: Array<{
    area: string;
    suggestion: string;
    expectedImpact: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
  }>;
}

export interface GeneratedOfferPackage {
  primaryOffer: GeneratedOffer;
  analysis: OfferAnalysis;
  variations: {
    alternatives: Array<{
      type: string;
      headline: string;
      description: string;
      expectedPerformance: string;
      useCases: string[];
    }>;
    upsellOpportunities: Array<{
      name: string;
      description: string;
      pricePoint: string;
      timing: string;
    }>;
    crossSellIdeas: Array<{
      product: string;
      rationale: string;
      bundleOpportunity: boolean;
    }>;
  };
  marketingAssets: {
    landingPageCopy: string;
    emailSequence: Array<{
      day: number;
      subject: string;
      content: string;
      purpose: string;
    }>;
    socialMediaKit: Array<{
      platform: string;
      content: string;
      hashtags: string[];
    }>;
    adCreatives: Array<{
      platform: string;
      format: string;
      headline: string;
      description: string;
      cta: string;
    }>;
  };
  performanceMetrics: {
    expectedConversionRate: string;
    estimatedROI: string;
    benchmarkComparison: string;
    keyMetricsToTrack: string[];
  };
  tokensUsed: number;
  generationTime: number;
}

export interface SavedOffer {
  id: string;
  title: string;
  offerName?: string;
  offerType?: string;
  targetIndustry?: string;
  conversionScore?: number;
  expiryDate?: string;
  createdAt: string;
  updatedAt: string;
  expired?: boolean;
  workspace?: {
    id: string;
    name: string;
  };
}

// Main offer creator hook
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
      const response = await fetch('/api/offer-creator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate offer');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Generation failed');
      }

      message.success('Offer generated successfully!');
      return data.data;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      message.error(errorMessage);
      return null;
    } finally {
      setGenerating(false);
    }
  }, []);

  const quickValidate = useCallback((input: Partial<OfferCreatorInput>) => {
    const errors: Record<string, string> = {};

    if (!input.offerName || input.offerName.length < 3) {
      errors.offerName = 'Offer name must be at least 3 characters';
    }

    if (!input.offerValue || input.offerValue.length < 10) {
      errors.offerValue = 'Please provide a more detailed value proposition';
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

// Hook for managing saved offers
export const useSavedOffers = () => {
  const [offers, setOffers] = useState<SavedOffer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOffers = useCallback(async (workspaceId?: string, offerType?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (workspaceId) params.append('workspaceId', workspaceId);
      if (offerType) params.append('offerType', offerType);
      
      const url = `/api/offer-creator${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch offers');
      }

      const data = await response.json();
      
      if (data.success) {
        setOffers(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch offers');
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setOffers]);

  const getOffer = useCallback(async (offerId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/offer-creator/${offerId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch offer');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch offer');
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
        throw new Error('Failed to delete offer');
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

// Hook for offer optimization
export const useOfferOptimization = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const optimizeOffer = useCallback(async (
    offerId: string, 
    type: 'headline' | 'cta' | 'urgency' | 'social-proof' | 'pricing'
  ) => {
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

// Hook for offer analysis
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

// Hook for performance tracking
export const useOfferPerformance = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updatePerformance = useCallback(async (
    offerId: string,
    performanceData: {
      views: number;
      clicks: number;
      conversions: number;
      revenue: number;
      dateRange: { start: string; end: string };
    }
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

// Hook for exporting offers
// Hook for exporting offers
export const useOfferExport = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper function for safe file downloads
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
      // Cleanup always happens, even if an error occurs
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
        // Handle HTML file download
        const contentDisposition = response.headers.get('content-disposition');
        const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
        const filename = filenameMatch?.[1] || `offer-export-${offerId}.html`;

        const blob = await response.blob();
        
        // Use the safe download helper
        downloadFile(blob, filename);
        
        message.success('Offer exported successfully');
      } else {
        // Handle JSON export
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

// Hook for benchmarks and insights
export const useOfferBenchmarks = () => {
  const [benchmarks, setBenchmarks] = useState<any>(null);
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBenchmarks = useCallback(async (industry?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const url = industry 
        ? `/api/offer-creator/benchmarks?industry=${industry}`
        : '/api/offer-creator/benchmarks';
        
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch benchmarks');
      }

      const data = await response.json();
      
      if (data.success) {
        setBenchmarks(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch benchmarks');
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      message.error(errorMessage);
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
      message.error(errorMessage);
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

// Hook for offer templates
export const useOfferTemplates = () => {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = useCallback(async (
    industry?: string,
    offerType?: string
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (industry) params.append('industry', industry);
      if (offerType) params.append('offerType', offerType);
      
      const url = `/api/offer-creator/templates${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }

      const data = await response.json();
      
      if (data.success) {
        setTemplates(data.data.templates);
      } else {
        throw new Error(data.error || 'Failed to fetch templates');
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const applyTemplate = useCallback((template: any): Partial<OfferCreatorInput> => {
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

// Validation hook for form inputs
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
    const regularPrice = parseFloat(input.regularPrice.replace(/[$,]/g, ''));
    const offerPrice = parseFloat(input.offerPrice.replace(/[$,]/g, ''));
    const savings = regularPrice - offerPrice;
    const discountPercentage = (savings / regularPrice) * 100;

    const insights = {
      pricing: {
        regularPrice,
        offerPrice,
        savings,
        discountPercentage: Math.round(discountPercentage),
        pricePoint: regularPrice > 1000 ? 'high-ticket' : regularPrice > 100 ? 'mid-ticket' : 'low-ticket'
      },
      urgency: {
        hasScarcity: input.scarcity || false,
        hasDeadline: true,
        expiryDate: input.expiryDate,
        daysUntilExpiry: Math.ceil((new Date(input.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      },
      trust: {
        hasSocialProof: input.socialProof || false,
        hasGuarantee: input.offerType === 'guarantee',
        hasTestimonial: !!(input.testimonialQuote && input.testimonialAuthor)
      },
      recommendations: [] as string[]
    };

    // Generate recommendations
    if (discountPercentage > 50) {
      insights.recommendations.push('Very high discount may hurt perceived value');
    } else if (discountPercentage < 10) {
      insights.recommendations.push('Consider increasing discount for stronger motivation');
    }

    if (!input.scarcity) {
      insights.recommendations.push('Adding scarcity could increase urgency and conversions');
    }

    if (!input.socialProof) {
      insights.recommendations.push('Adding testimonials or social proof could build trust');
    }

    if (insights.urgency.daysUntilExpiry > 30) {
      insights.recommendations.push('Long expiry period may reduce urgency');
    }

    return insights;
  }, []);

  return {
    validateInput,
    getOfferInsights
  };
};