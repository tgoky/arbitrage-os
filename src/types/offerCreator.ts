// types/offerCreator.ts

export interface OfferCreatorInput {
  // Offer Basics
  offerName: string;
  offerValue: string;
  regularPrice: string;
  offerPrice: string;
  expiryDate: string;
  targetIndustry: string;

  // Offer Strategy
  offerType: 'discount' | 'bonus' | 'trial' | 'guarantee';

  // Type-specific fields
  discountValue?: number;
  discountAmount?: string;
  bonusItem?: string;
  bonusValue?: string;
  totalValue?: string;
  trialPeriod?: number;
  guaranteePeriod?: number;

  // Conversion Boosters
  cta?: string;
  redemptionInstructions?: string;
  scarcity?: boolean;
  scarcityReason?: string;
  socialProof?: boolean;
  testimonialQuote?: string;
  testimonialAuthor?: string;

  // Additional Context
  businessGoal?: 'lead-generation' | 'sales' | 'retention' | 'upsell' | 'brand-awareness';
  customerSegment?: 'new' | 'existing' | 'churned' | 'high-value';
  seasonality?: string;
  competitorAnalysis?: string;

  // System field
  userId: string;
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

export interface ConversionFactor {
  factor: string;
  impact: 'High' | 'Medium' | 'Low';
  recommendation: string;
}

export interface OfferAnalysis {
  conversionPotential: {
    score: number;
    factors: ConversionFactor[];
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

export interface OfferAlternative {
  type: string;
  headline: string;
  description: string;
  expectedPerformance: string;
  useCases: string[];
}

export interface UpsellOpportunity {
  name: string;
  description: string;
  pricePoint: string;
  timing: string;
}

export interface CrossSellIdea {
  product: string;
  rationale: string;
  bundleOpportunity: boolean;
}

export interface OfferVariations {
  alternatives: OfferAlternative[];
  upsellOpportunities: UpsellOpportunity[];
  crossSellIdeas: CrossSellIdea[];
}

export interface EmailSequenceItem {
  day: number;
  subject: string;
  content: string;
  purpose: string;
}

export interface SocialMediaKitItem {
  platform: string;
  content: string;
  hashtags: string[];
}

export interface AdCreative {
  platform: string;
  format: string;
  headline: string;
  description: string;
  cta: string;
}

export interface MarketingAssets {
  landingPageCopy: string;
  emailSequence: EmailSequenceItem[];
  socialMediaKit: SocialMediaKitItem[];
  adCreatives: AdCreative[];
}

export interface PerformanceMetrics {
  expectedConversionRate: string;
  estimatedROI: string;
  benchmarkComparison: string;
  keyMetricsToTrack: string[];
}

export interface GeneratedOfferPackage {
  primaryOffer: GeneratedOffer;
  analysis: OfferAnalysis;
  variations: OfferVariations;
  marketingAssets: MarketingAssets;
  performanceMetrics: PerformanceMetrics;
  tokensUsed: number;
  generationTime: number;
}

// Performance tracking types
export interface PerformanceData {
  views: number;
  clicks: number;
  conversions: number;
  revenue: number;
  dateRange: {
    start: string;
    end: string;
  };
}

export interface PerformanceMetricsCalculated {
  views: number;
  clicks: number;
  conversions: number;
  revenue: number;
  clickThroughRate: number;
  conversionRate: number;
  averageOrderValue: number;
}

export interface PerformanceEntry {
  dateRange: {
    start: string;
    end: string;
  };
  metrics: PerformanceMetricsCalculated;
  recordedAt: string;
}

export interface PerformanceInsight {
  type: 'positive' | 'warning' | 'info' | 'suggestion';
  message: string;
  suggestion: string;
}

export interface PerformanceSummary {
  totalViews: number;
  totalClicks: number;
  totalConversions: number;
  totalRevenue: number;
  averageConversionRate: number;
  averageClickThroughRate: number;
  trend: 'improving' | 'declining' | 'stable' | 'no-data';
  dataPoints: number;
}

export interface IndustryBenchmark {
  clickThroughRate: {
    min: number;
    avg: number;
    max: number;
  };
  conversionRate: {
    min: number;
    avg: number;
    max: number;
  };
  description: string;
}

// Optimization types
export interface OptimizationResult {
  originalElement: string;
  optimizedVersions: Array<{
    version: string;
    rationale: string;
    expectedImpact: string;
  }>;
  tokensUsed: number;
}

export type OptimizationType = 'headline' | 'cta' | 'urgency' | 'social-proof' | 'pricing';

// Analysis types
export interface ConversionAnalysis {
  conversionScore: number;
  strengths: string[];
  weaknesses: string[];
  improvements: Array<{
    element: string;
    suggestion: string;
    expectedImpact: string;
  }>;
  missingElements: string[];
  headline: string;
  cta: string;
}

export interface PsychologyAnalysis {
  psychologyScore: number;
  triggersUsed: string[];
  triggersMissing: string[];
  emotionalAppeal: string;
  persuasionTechniques: string[];
  cognitiveShortcuts: string[];
  recommendations: string[];
}

export interface CompetitiveAnalysis {
  competitiveScore: number;
  differentiators: string[];
  commodityRisk: string;
  marketPosition: string;
  competitiveAdvantages: string[];
  vulnerabilities: string[];
  recommendations: string[];
}

export type AnalysisType = 'conversion' | 'psychology' | 'competition';

export interface AnalysisRequest {
  offerText: string;
  industry?: string;
  analysisType: AnalysisType;
}

export interface AnalysisResponse {
  originalOffer: string;
  analysisType: AnalysisType;
  analysis: ConversionAnalysis | PsychologyAnalysis | CompetitiveAnalysis;
  tokensUsed: number;
}

// Template types
export interface OfferTemplate {
  id: string;
  name: string;
  offerType: 'discount' | 'bonus' | 'trial' | 'guarantee';
  industry: string;
  headline: string;
  description: string;
  conversionRate: string;
  bestFor: string;
  example: {
    headline: string;
    subheadline: string;
    discount?: number;
    bonusValue?: string;
    trialPeriod?: number;
    guarantee?: string;
    urgency: string;
  };
}

export interface TemplatesResponse {
  templates: OfferTemplate[];
  industries: string[];
  offerTypes: string[];
  total: number;
}

// Database types
export interface SavedOffer {
  id: string;
  title: string;
  offerName?: string;
  offerType?: string;
  targetIndustry?: string;
  conversionScore?: number;
  expiryDate?: string;
  createdAt: Date;
  updatedAt: Date;
  workspace?: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface DetailedSavedOffer {
  id: string;
  title: string;
  offer: GeneratedOfferPackage;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  workspace?: {
    id: string;
    name: string;
    slug: string;
  };
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any;
  meta?: {
    tokensUsed?: number;
    generationTime?: number;
    remaining?: number;
  };
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  count: number;
  reset: number;
}

// Cache types
export interface CacheKey {
  input: OfferCreatorInput;
}

// Validation types
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: Array<{
    message: string;
    path?: string[];
    code?: string;
  }>;
}

export interface BusinessRulesValidation {
  isValid: boolean;
  warnings: string[];
  suggestions: string[];
  conversionPrediction: {
    score: number;
    factors: Array<{
      factor: string;
      impact: 'positive' | 'negative' | 'neutral';
      weight: number;
    }>;
  };
}

export interface OfferInsights {
  pricing: {
    regularPrice: number;
    offerPrice: number;
    savings: number;
    discountPercentage: number;
    pricePoint: 'high-ticket' | 'mid-ticket' | 'low-ticket';
  };
  urgency: {
    hasScarcity: boolean;
    hasDeadline: boolean;
    expiryDate: string;
    daysUntilExpiry: number;
  };
  trust: {
    hasSocialProof: boolean;
    hasGuarantee: boolean;
    hasTestimonial: boolean;
  };
  offerStrength: {
    type: string;
    valueProposition: string;
    targetMarket: string;
    hasBonus: boolean;
    hasTrial: boolean;
  };
  recommendations: string[];
}