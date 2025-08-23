// hooks/usePricingCalculator.ts
import { useState, useCallback } from 'react';
import { message } from 'antd';

// Types matching the backend
export interface PricingCalculatorInput {
  annualSavings: number;
  hoursPerWeek: number;
  roiMultiple: number;
  clientName?: string;
  projectName?: string;
  industry?: string;
  serviceType?: string;
  projectDuration?: number;
  experienceLevel?: 'beginner' | 'intermediate' | 'expert' | 'premium';
  competitiveAdvantage?: 'low' | 'medium' | 'high';
  clientUrgency?: 'low' | 'medium' | 'high';
  relationshipType?: 'new' | 'existing' | 'referral' | 'strategic';
  deliveryRisk?: 'low' | 'medium' | 'high';
  paymentTerms?: 'upfront' | 'monthly' | 'milestone' | 'success-based';
  guaranteeOffered?: boolean;
  marketDemand?: 'low' | 'medium' | 'high';
  seasonality?: boolean;
  competitionLevel?: 'low' | 'medium' | 'high';
}

export interface PricingResults {
  monthlySavings: number;
  recommendedRetainer: number;
  netSavings: number;
  roiPercentage: number;
  totalProjectValue: number;
  hourlyRate: number;
  effectiveHourlyRate: number;
  profitMargin: number;
  pricingOptions: Array<{
    model: 'retainer' | 'project' | 'hourly' | 'success' | 'hybrid';
    price: number;
    description: string;
    pros: string[];
    cons: string[];
    recommendationScore: number;
  }>;
  riskAdjustment: {
    factor: number;
    adjustedPrice: number;
    reasoning: string[];
  };
  marketPosition: {
    percentile: number;
    competitorRange: {
      low: number;
      average: number;
      high: number;
    };
    positioning: 'budget' | 'standard' | 'premium' | 'luxury';
  };
}

export interface GeneratedPricingPackage {
  calculations: PricingResults;
  strategy: {
    recommendedApproach: string;
    pricingFramework: string;
    negotiationTactics: string[];
    valueProposition: string;
    presentationStructure: Array<{
      section: string;
      content: string;
      emphasis: 'low' | 'medium' | 'high';
    }>;
    phases: Array<{
      phase: string;
      duration: string;
      deliverables: string[];
      milestones: string[];
      payment: number;
    }>;
    kpis: Array<{
      metric: string;
      target: string;
      timeline: string;
      measurement: string;
    }>;
  };
  benchmarks: {
    industry: string;
    averageRoiMultiple: number;
    typicalHourlyRates: {
      junior: number;
      mid: number;
      senior: number;
      expert: number;
    };
    commonPricingModels: string[];
    seasonalityFactors: string[];
    paymentTermPreferences: string[];
  };
  proposalTemplate: string;
  pricingPresentationSlides: Array<{
    title: string;
    content: string;
    visualType: 'text' | 'chart' | 'table' | 'bullet';
  }>;
  objectionHandling: Array<{
    objection: string;
    response: string;
    alternatives: string[];
  }>;
  contractClauses: Array<{
    clause: string;
    purpose: string;
    template: string;
  }>;
  tokensUsed: number;
  generationTime: number;
}

export interface SavedCalculation {
  id: string;
  title: string;
  clientName?: string;
  projectName?: string;
  industry?: string;
  annualSavings: number;
  recommendedRetainer: number;
  roiPercentage: number;
  hourlyRate: number;
  createdAt: string;
  updatedAt: string;
  workspace?: {
    id: string;
    name: string;
  };
}

export interface ComparisonScenario {
  annualSavings: number;
  hoursPerWeek: number;
  roiMultiple: number;
  experienceLevel?: 'beginner' | 'intermediate' | 'expert' | 'premium';
  deliveryRisk?: 'low' | 'medium' | 'high';
  scenarioName?: string;
}

export interface ScenarioComparison {
  scenarios: Array<{
    input: ComparisonScenario;
    results: {
      monthlySavings: number;
      recommendedRetainer: number;
      netSavings: number;
      roiPercentage: number;
      baseHourlyRate: number;
      monthlyHours: number;
      riskFactor: number;
    };
  }>;
  comparison: {
    summary: string;
    recommendations: string[];
    bestScenario: number;
    reasoning?: string;
  };
  tokensUsed: number;
}

// Main pricing calculator hook
export const usePricingCalculator = () => {
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generatePricing = useCallback(async (input: PricingCalculatorInput): Promise<{
    calculationId: string;
    package: GeneratedPricingPackage;
  } | null> => {
    setGenerating(true);
    setError(null);
    
    try {
      const response = await fetch('/api/pricing-calculator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate pricing');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Generation failed');
      }

      message.success('Pricing package generated successfully!');
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

  const quickCalculate = useCallback((input: Pick<PricingCalculatorInput, 'annualSavings' | 'hoursPerWeek' | 'roiMultiple'>) => {
    const monthlySavings = input.annualSavings / 12;
    const monthlyHours = input.hoursPerWeek * 4.33;
    const recommendedRetainer = (monthlySavings * input.roiMultiple) / 100;
    const netSavings = monthlySavings - recommendedRetainer;
    const roiPercentage = recommendedRetainer > 0 ? (netSavings / recommendedRetainer) * 100 : 0;
    const hourlyRate = recommendedRetainer / monthlyHours;

    return {
      monthlySavings: Math.round(monthlySavings),
      recommendedRetainer: Math.round(recommendedRetainer),
      netSavings: Math.round(netSavings),
      roiPercentage: Math.round(roiPercentage),
      hourlyRate: Math.round(hourlyRate),
      monthlyHours: Math.round(monthlyHours)
    };
  }, []);

  return {
    loading,
    generating,
    error,
    generatePricing,
    quickCalculate,
    setError
  };
};

// Hook for managing saved calculations
export const useSavedCalculations = () => {
  const [calculations, setCalculations] = useState<SavedCalculation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCalculations = useCallback(async (workspaceId?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const url = workspaceId 
        ? `/api/pricing-calculator?workspaceId=${workspaceId}`
        : '/api/pricing-calculator';
        
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch calculations');
      }

      const data = await response.json();
      
      if (data.success) {
        setCalculations(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch calculations');
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const getCalculation = useCallback(async (calculationId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/pricing-calculator/${calculationId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch calculation');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch calculation');
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

  const updateCalculation = useCallback(async (calculationId: string, updates: Partial<PricingCalculatorInput>) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/pricing-calculator/${calculationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update calculation');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to update calculation');
      }

      message.success('Calculation updated successfully');
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

  const deleteCalculation = useCallback(async (calculationId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/pricing-calculator/${calculationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete calculation');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to delete calculation');
      }

      // Remove from local state
      setCalculations(prev => prev.filter(calc => calc.id !== calculationId));
      message.success('Calculation deleted successfully');
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
    calculations,
    loading,
    error,
    fetchCalculations,
    getCalculation,
    updateCalculation,
    deleteCalculation,
    setError
  };
};

// Hook for scenario comparison
export const useScenarioComparison = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const compareScenarios = useCallback(async (scenarios: ComparisonScenario[]): Promise<ScenarioComparison | null> => {
    if (scenarios.length < 2 || scenarios.length > 5) {
      message.error('Please provide 2-5 scenarios for comparison');
      return null;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/pricing-calculator/compare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ scenarios }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to compare scenarios');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Comparison failed');
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
    compareScenarios,
    setError
  };
};

// Hook for industry benchmarks
export const usePricingBenchmarks = () => {
  const [benchmarks, setBenchmarks] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBenchmarks = useCallback(async (industry?: string, serviceType?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (industry) params.append('industry', industry);
      if (serviceType) params.append('serviceType', serviceType);
      
      const url = `/api/pricing-calculator/benchmarks${params.toString() ? `?${params.toString()}` : ''}`;
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
      // Remove the automatic error message - let the component handle it
      console.warn('Benchmarks fetch failed:', errorMessage);
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

// Hook for exporting calculations
export const useCalculationExport = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportCalculation = useCallback(async (
  calculationId: string, 
  format: 'proposal' | 'presentation' | 'contract' | 'complete' = 'complete'
) => {
  setLoading(true);
  setError(null);
  
  try {
    const response = await fetch(`/api/pricing-calculator/export/${calculationId}?format=${format}`);
    
    if (!response.ok) {
      throw new Error('Failed to export calculation');
    }

    // Get filename from response headers
    const contentDisposition = response.headers.get('content-disposition');
    const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
    const filename = filenameMatch?.[1] || `pricing-${format}-${calculationId}.html`;

    const blob = await response.blob();
    
    // ✅ Create download link with proper error handling
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    try {
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
    } finally {
      // ✅ Cleanup always happens, even if an error occurs
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }
    
    message.success(`${format.charAt(0).toUpperCase() + format.slice(1)} exported successfully`);
    
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    setError(errorMessage);
    message.error(errorMessage);
  } finally {
    setLoading(false);
  }
  }, []);

  return {
    loading,
    error,
    exportCalculation,
    setError
  };
};

// Validation hook for input data
export const usePricingValidation = () => {
  const validateInput = useCallback((input: Partial<PricingCalculatorInput>) => {
    const errors: Record<string, string> = {};

    // Required fields validation
    if (!input.annualSavings || input.annualSavings < 100) {
      errors.annualSavings = 'Annual savings must be at least $1,000';
    } else if (input.annualSavings > 50000000) {
      errors.annualSavings = 'Annual savings seems unrealistically high';
    }

    if (!input.hoursPerWeek || input.hoursPerWeek < 1) {
      errors.hoursPerWeek = 'Hours per week must be at least 1';
    } else if (input.hoursPerWeek > 80) {
      errors.hoursPerWeek = 'Hours per week cannot exceed 80';
    }

    if (!input.roiMultiple || input.roiMultiple < 1) {
      errors.roiMultiple = 'ROI multiple must be at least 1';
    } else if (input.roiMultiple > 20) {
      errors.roiMultiple = 'ROI multiple cannot exceed 20';
    }

    // Optional field validation
    if (input.clientName && input.clientName.length > 100) {
      errors.clientName = 'Client name is too long';
    }

    if (input.projectName && input.projectName.length > 100) {
      errors.projectName = 'Project name is too long';
    }

    if (input.projectDuration && (input.projectDuration < 1 || input.projectDuration > 60)) {
      errors.projectDuration = 'Project duration must be between 1 and 60 months';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }, []);

  const getBusinessInsights = useCallback((input: PricingCalculatorInput) => {
    const monthlyHours = input.hoursPerWeek * 4.33;
    const monthlySavings = input.annualSavings / 12;
    const impliedRetainer = (monthlySavings * input.roiMultiple) / 100;
    const hourlyRate = impliedRetainer / monthlyHours;
    const clientROI = ((monthlySavings - impliedRetainer) / impliedRetainer) * 100;

    const insights = {
      hourlyRateCategory: hourlyRate < 100 ? 'budget' : hourlyRate < 200 ? 'standard' : hourlyRate < 400 ? 'premium' : 'luxury',
      clientROICategory: clientROI < 100 ? 'poor' : clientROI < 200 ? 'good' : clientROI < 500 ? 'excellent' : 'exceptional',
      recommendations: [] as string[]
    };

    if (hourlyRate < 50) {
      insights.recommendations.push('Consider increasing your ROI multiple - current rate may not be sustainable');
    }

    if (clientROI < 100) {
      insights.recommendations.push('Client ROI is below 100% - may be difficult to justify pricing');
    }

    if (clientROI > 500) {
      insights.recommendations.push('Excellent client ROI - you may be underpricing your services');
    }

    if (input.experienceLevel === 'expert' && hourlyRate < 200) {
      insights.recommendations.push('Your experience level suggests you could charge higher rates');
    }

    return insights;
  }, []);

  return {
    validateInput,
    getBusinessInsights
  };
};