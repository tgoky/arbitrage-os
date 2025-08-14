// types/pricingCalculator.ts
export interface PricingCalculatorInput {
  // Basic Calculation Inputs
  annualSavings: number;
  hoursPerWeek: number;
  roiMultiple: number;
  
  // Enhanced Client Context
  clientName?: string;
  projectName?: string;
  industry?: string;
  serviceType?: string;
  projectDuration?: number; // in months
  
  // Advanced Pricing Factors
  experienceLevel?: 'beginner' | 'intermediate' | 'expert' | 'premium';
  competitiveAdvantage?: 'low' | 'medium' | 'high';
  clientUrgency?: 'low' | 'medium' | 'high';
  relationshipType?: 'new' | 'existing' | 'referral' | 'strategic';
  
  // Risk Factors
  deliveryRisk?: 'low' | 'medium' | 'high';
  paymentTerms?: 'upfront' | 'monthly' | 'milestone' | 'success-based';
  guaranteeOffered?: boolean;
  
  // Market Context
  marketDemand?: 'low' | 'medium' | 'high';
  seasonality?: boolean;
  competitionLevel?: 'low' | 'medium' | 'high';
  
  // System field
  userId: string;
}

export interface PricingResults {
  // Core Calculations
  monthlySavings: number;
  recommendedRetainer: number;
  netSavings: number;
  roiPercentage: number;
  
  // Advanced Metrics
  totalProjectValue: number;
  hourlyRate: number;
  effectiveHourlyRate: number;
  profitMargin: number;
  
  // Alternative Pricing Models
  pricingOptions: Array<{
    model: 'retainer' | 'project' | 'hourly' | 'success' | 'hybrid';
    price: number;
    description: string;
    pros: string[];
    cons: string[];
    recommendationScore: number;
  }>;
  
  // Risk-Adjusted Pricing
  riskAdjustment: {
    factor: number;
    adjustedPrice: number;
    reasoning: string[];
  };
  
  // Competitive Analysis
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

export interface PricingStrategy {
  recommendedApproach: string;
  pricingFramework: string;
  negotiationTactics: string[];
  valueProposition: string;
  
  // Client Communication
  presentationStructure: Array<{
    section: string;
    content: string;
    emphasis: 'low' | 'medium' | 'high';
  }>;
  
  // Implementation Roadmap
  phases: Array<{
    phase: string;
    duration: string;
    deliverables: string[];
    milestones: string[];
    payment: number;
  }>;
  
  // Success Metrics
  kpis: Array<{
    metric: string;
    target: string;
    timeline: string;
    measurement: string;
  }>;
}

export interface IndustryBenchmarks {
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
}

export interface GeneratedPricingPackage {
  calculations: PricingResults;
  strategy: PricingStrategy;
  benchmarks: IndustryBenchmarks;
  
  // Client-Ready Materials
  proposalTemplate: string;
  pricingPresentationSlides: Array<{
    title: string;
    content: string;
    visualType: 'text' | 'chart' | 'table' | 'bullet';
  }>;
  
  // Negotiation Support
  objectionHandling: Array<{
    objection: string;
    response: string;
    alternatives: string[];
  }>;
  
  // Contract Elements
  contractClauses: Array<{
    clause: string;
    purpose: string;
    template: string;
  }>;
  
  tokensUsed: number;
  generationTime: number;
}
