// types/offerCreator.ts - FIXED VERSION

// Input types for the form sections
export interface FounderInputs {
  signatureResults: string[];
  coreStrengths: string[];
  processes: string[];
  industries: string[];
  proofAssets: string[];
}

export interface MarketInputs {
  targetMarket: string;
  buyerRole: string;
  pains: string[];
  outcomes: string[];
}

export interface BusinessInputs {
  deliveryModel: string[];
  capacity: string;
  monthlyHours: string;
  acv: string;
  fulfillmentStack: string[];
    acvPeriod?: 'monthly' | 'annual'; 

}

export interface ProgressiveValidationResult {
  isValid: boolean;
  isReadyToGenerate: boolean;
  errors: Record<string, string>;
  warnings: Record<string, string>;
  completionPercentage: number;
  completedFields: number;
  totalRequiredFields: number;
  essentialComplete?: number;
  totalEssential?: number;
}

export interface PricingInputs {
  pricePosture: 'value-priced' | 'market-priced' | 'premium';
  contractStyle: 'month-to-month' | '3-month-min' | '6-month-min' | 'project';
  guarantee: 'none' | 'conditional' | 'strong-guarantee';
}

export interface VoiceInputs {
  brandTone: 'assertive' | 'consultative' | 'friendly' | 'elite';
  positioning: 'speed' | 'certainty' | 'specialization' | 'done-for-you' | 'ROI';
  differentiators: string[];
}

// Combined input type for the offer creator
export interface OfferCreatorInput {
  founder: FounderInputs;
  market: MarketInputs;
  business: BusinessInputs;
  pricing: PricingInputs;
  voice: VoiceInputs;
  userId?: string;
}

// Type for a single signature offer (Starter, Core, Premium)
export interface SignatureOffer {
  name: string;
  for: string;
  promise: string;
  scope: string[];
  proof: string[];
  timeline: string;
  milestones: string[];
  pricing: string;
  term: string;
  guarantee: string;
  clientLift: string;
  requirements: string;
}

// Type for the comparison table features
export interface ComparisonFeature {
  name: string;
  starter: string;
  core: string;
  premium: string;
}

// Type for the generated offer output
export interface GeneratedOffer {
  signatureOffers: {
    starter: SignatureOffer;
    core: SignatureOffer;
    premium: SignatureOffer;
  };
  comparisonTable: {
    features: ComparisonFeature[];
  };
  pricing: {
    starter: string;
    core: string;
    premium: string;
  };
}

// Type for the live preview calculation
export interface LivePreview {
  offerStrength: number;
  confidenceScore: number;
  recommendations: string[];
}

// Analysis types
export interface ConversionFactor {
  factor: string;
  impact: 'High' | 'Medium' | 'Low';
  recommendation: string;
}

export interface ConversionPotential {
  score: number;
  factors: ConversionFactor[];
}

export interface OfferAnalysis {
  conversionPotential: ConversionPotential;
}

// Type for the complete generated offer package
// Type for the complete generated offer package - FIXED VERSION
export interface GeneratedOfferPackage {
  // Direct properties (not nested under primaryOffer)
  signatureOffers: {
    starter: SignatureOffer;
    core: SignatureOffer;
    premium: SignatureOffer;
  };
  comparisonTable: {
    features: ComparisonFeature[];
  };
  pricing: {
    starter: string;
    core: string;
    premium: string;
  };
  analysis: OfferAnalysis;
  tokensUsed: number;
  generationTime: number;
  originalInput?: OfferCreatorInput; // Add this for loading saved offers
}



export interface GeneratedOfferWithPrimaryOffer {
  primaryOffer: GeneratedOffer;
  analysis: OfferAnalysis;
  tokensUsed: number;
  generationTime: number;
}


// Type for saved offers
export interface SavedOffer {
  id: string;
  title: string;
  offer: GeneratedOfferPackage;
  metadata?: {
    targetMarket?: string;
    industries?: string[];
    conversionScore?: number;
    createdAt?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  workspace?: {
    id: string;
    name: string;
    slug: string;
  };
}

// User offer type for service layer
export interface UserOffer {
  id: string;
  title: string;
  offerData?: OfferCreatorInput;
  metadata?: {
    offerType?: string;
    targetMarket?: string;
    industries?: string[];
    conversionScore?: number;
    createdAt?: string;
    pricePosture?: string;
    brandTone?: string;
    positioning?: string;
    deliveryModels?: string[];
    tokensUsed?: number;
    generationTime?: number;
  };
  createdAt: Date;
  updatedAt: Date;
  workspace?: {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    user_id: string | null;
    color?: string | null;
    created_at: Date | null;
    updated_at: Date | null;
  } | null;
}

// Template types
export interface OfferTemplate {
  id: string;
  industry: string;
  tier: 'starter' | 'core' | 'premium';
  name: string;
  for: string;
  promise: string;
  scope: string[];
  pricing: string;
  timeline: string;
  guarantee: string;
  differentiators: string[];
  metadata?: {
    estimatedROI?: string;
    implementationComplexity?: string;
    idealClientSize?: string;
    averageTimeToResults?: string;
  };
}

// Optimization types
export type OptimizationType = 'pricing' | 'positioning' | 'messaging' | 'delivery' | 'guarantee';

export interface OptimizationVersion {
  version: string;
  rationale: string;
  expectedImpact: string;
}

export interface OptimizationResult {
  originalElement: string;
  optimizedVersions: OptimizationVersion[];
  tokensUsed: number;
}

// Analysis request types
export interface AnalysisRequest {
  offerData: OfferCreatorInput;
  analysisType: 'market-fit' | 'competitive' | 'scalability';
}

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

// Performance tracking types
export interface PerformanceMetrics {
  inquiries: number;
  proposals: number;
  conversions: number;
  avgDealSize: number;
  timeToClose: number;
  proposalRate: number;
  conversionRate: number;
  totalRevenue: number;
}

export interface PerformanceData {
  metrics: {
    inquiries: number;
    proposals: number;
    conversions: number;
    avgDealSize: number;
    timeToClose: number;
  };
  dateRange: {
    start: string;
    end: string;
  };
}

export interface PerformanceEntry {
  dateRange: {
    start: string;
    end: string;
  };
  metrics: PerformanceMetrics;
  recordedAt: string;
}

export interface PerformanceSummary {
  totalInquiries: number;
  totalProposals: number;
  totalConversions: number;
  totalRevenue: number;
  averageConversionRate: number;
  averageProposalRate: number;
  averageDealSize: number;
  trend: 'improving' | 'stable' | 'declining' | 'no-data';
  dataPoints: number;
}

export interface OfferPerformance {
  offerId: string;
  offerName: string;
  performanceHistory: PerformanceEntry[];
  latestMetrics?: PerformanceMetrics;
  insights: string[];
  summary: PerformanceSummary;
}

// Business validation types
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
  credibility: {
    score: number;
    strengths: string[];
    improvements: string[];
  };
  marketFit: {
    score: number;
    alignment: string[];
    gaps: string[];
  };
  scalability: {
    score: number;
    advantages: string[];
    challenges: string[];
  };
  recommendations: string[];
}

// Industry benchmark types
export interface IndustryBenchmark {
  industry: string;
  conversionRate: {
    min: number;
    max: number;
    average: number;
    description: string;
  };
  proposalRate: {
    min: number;
    max: number;
    average: number;
    description: string;
  };
  avgDealSize: {
    min: number;
    max: number;
    average: number;
    description: string;
  };
  timeToClose: {
    min: number;
    max: number;
    average: number;
    description: string;
  };
  characteristics: string[];
  commonPainPoints: string[];
  winningPositioning: string[];
}

// API Response type - FIXED to ensure data is never undefined
export interface ApiResponse<T> {
  success: boolean;
  data?: T; // Make it optional with ?
  error?: string;
  details?: any;
  meta?: {
    offerId?: string;
    tokensUsed?: number;
    generationTime?: number;
    remaining?: number;
    [key: string]: any;
  };
}
// Alternative response type for cases where data might be missing
export interface ApiResponseOptional<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any;
  meta?: {
    offerId?: string;
    tokensUsed?: number;
    generationTime?: number;
    remaining?: number;
    [key: string]: any;
  };
}

// Validation result type
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: Array<{
    message: string;
    path?: string[];
    code?: string;
  }>;
}

// Export types for forms and UI
export interface FormState {
  founder: FounderInputs;
  market: MarketInputs;
  business: BusinessInputs;
  pricing: PricingInputs;
  voice: VoiceInputs;
}

export interface UIState {
  activeTab: 'inputs' | 'outputs' | 'history';
  activePanels: string[];
  isLoading: boolean;
  generatedOffer: GeneratedOfferPackage | null;
  savedOfferId: string | null;
  livePreview: LivePreview | null;
}

// Workspace integration
export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  user_id: string | null;
  color?: string | null;
  created_at: Date | null;
  updated_at: Date | null;
}

// Extended user offer type for listings
export interface UserOfferListing {
  id: string;
  title: string;
  targetMarket?: string;
  industries?: string[];
  conversionScore?: number;
  pricePosture?: string;
  createdAt: Date;
  updatedAt: Date;
  workspace?: Workspace | null;
}

// Export types for the service layer
export interface ServiceConfig {
  openRouterApiKey: string;
  redisUrl: string;
  redisToken: string;
  cacheExpirationTime?: number;
}

// Cache related types
export interface CacheStats {
  hits: number;
  misses: number;
}

export interface CacheKey {
  industries: string[];
  targetMarket: string;
  deliveryModel: string[];
  pricePosture: string;
  brandTone: string;
  positioning: string;
  differentiators: string[];
}

// Error types
export interface OfferCreatorError {
  type: 'validation' | 'generation' | 'storage' | 'network';
  message: string;
  details?: any;
  retryable: boolean;
}

// Export utility types
export type DeliveryModel = 'productized-service' | 'monthly-retainer' | 'one-time-project' | 'training' | 'advisory' | 'licensing';
export type PricePosture = 'value-priced' | 'market-priced' | 'premium';
export type ContractStyle = 'month-to-month' | '3-month-min' | '6-month-min' | 'project';
export type GuaranteeType = 'none' | 'conditional' | 'strong-guarantee';
export type BrandTone = 'assertive' | 'consultative' | 'friendly' | 'elite';
export type PositioningAngle = 'speed' | 'certainty' | 'specialization' | 'done-for-you' | 'ROI';



export interface ProgressiveValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  warnings: Record<string, string>;
  completionPercentage: number;
  completedFields: number;
  totalRequiredFields: number;
  isReadyToGenerate: boolean;
}


// Form validation schemas (for frontend use)
export interface FormValidationRules {
  founder: {
    signatureResults: { required: true; minItems: 1; maxItems: 5 };
    coreStrengths: { required: true; minItems: 1; maxItems: 10 };
    processes: { required: true; minItems: 1; maxItems: 8 };
    industries: { required: true; minItems: 1; maxItems: 3 };
    proofAssets: { required: false; maxItems: 10 };
  };
  market: {
    targetMarket: { required: true; minLength: 3; maxLength: 100 };
    buyerRole: { required: true; minLength: 3; maxLength: 100 };
    pains: { required: true; minItems: 1; maxItems: 5 };
    outcomes: { required: true; minItems: 1; maxItems: 8 };
  };
  business: {
    deliveryModel: { required: true; minItems: 1; maxItems: 3 };
    capacity: { required: true; pattern: RegExp };
    monthlyHours: { required: true; pattern: RegExp };
    acv: { required: true; pattern: RegExp };
    fulfillmentStack: { required: false; maxItems: 10 };
  };
  pricing: {
    pricePosture: { required: true };
    contractStyle: { required: true };
    guarantee: { required: true };
  };
  voice: {
    brandTone: { required: true };
    positioning: { required: true };
    differentiators: { required: true; minItems: 1; maxItems: 5 };
  };
}

// Default values for forms
export const DEFAULT_FORM_VALUES: FormState = {
  founder: {
    signatureResults: [],
    coreStrengths: [],
    processes: [],
    industries: [],
    proofAssets: [],
  },
  market: {
    targetMarket: '',
    buyerRole: '',
    pains: [],
    outcomes: [],
  },
  business: {
    deliveryModel: [],
    capacity: '',
    monthlyHours: '',
    acv: '',
    fulfillmentStack: [],
  },
  pricing: {
    pricePosture: 'value-priced',
    contractStyle: 'month-to-month',
    guarantee: 'none',
  },
  voice: {
    brandTone: 'consultative',
    positioning: 'ROI',
    differentiators: [],
  },
};

// Additional utility functions for form validation
export function validateFormSection(
  section: keyof FormValidationRules,
  data: any
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const rules = FORM_VALIDATION_RULES[section];

  // This is a simplified client-side validation
  // The real validation happens in the Zod schema
  if (section === 'founder') {
    if (!data.signatureResults?.length) errors.push('Signature results are required');
    if (!data.coreStrengths?.length) errors.push('Core strengths are required');
    if (!data.processes?.length) errors.push('Processes are required');
    if (!data.industries?.length) errors.push('Industries are required');
  }

  if (section === 'market') {
    if (!data.targetMarket?.trim()) errors.push('Target market is required');
    if (!data.buyerRole?.trim()) errors.push('Buyer role is required');
    if (!data.pains?.length) errors.push('Pain points are required');
    if (!data.outcomes?.length) errors.push('Outcomes are required');
  }

  if (section === 'business') {
    if (!data.deliveryModel?.length) errors.push('Delivery model is required');
    if (!data.capacity?.trim()) errors.push('Capacity is required');
    if (!data.monthlyHours?.trim()) errors.push('Monthly hours are required');
    if (!data.acv?.trim()) errors.push('ACV is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Form validation rules constant
export const FORM_VALIDATION_RULES: FormValidationRules = {
  founder: {
    signatureResults: { required: true, minItems: 1, maxItems: 5 },
    coreStrengths: { required: true, minItems: 1, maxItems: 10 },
    processes: { required: true, minItems: 1, maxItems: 8 },
    industries: { required: true, minItems: 1, maxItems: 3 },
    proofAssets: { required: false, maxItems: 10 },
  },
  market: {
    targetMarket: { required: true, minLength: 3, maxLength: 100 },
    buyerRole: { required: true, minLength: 3, maxLength: 100 },
    pains: { required: true, minItems: 1, maxItems: 5 },
    outcomes: { required: true, minItems: 1, maxItems: 8 },
  },
  business: {
    deliveryModel: { required: true, minItems: 1, maxItems: 3 },
    capacity: { required: true, pattern: /^\d+$/ },
    monthlyHours: { required: true, pattern: /^\d+$/ },
    acv: { required: true, pattern: /^\$?[\d,]+(\.\d{2})?$/ },
    fulfillmentStack: { required: false, maxItems: 10 },
  },
  pricing: {
    pricePosture: { required: true },
    contractStyle: { required: true },
    guarantee: { required: true },
  },
  voice: {
    brandTone: { required: true },
    positioning: { required: true },
    differentiators: { required: true, minItems: 1, maxItems: 5 },
  },
};

// Helper function to calculate live preview
export function calculateLivePreview(formState: FormState): LivePreview | null {
  const { founder, market, business, pricing, voice } = formState;
  
  // Check if minimum required fields are filled
  if (
    !founder.signatureResults.length ||
    !founder.coreStrengths.length ||
    !founder.processes.length ||
    !founder.industries.length ||
    !market.targetMarket ||
    !market.buyerRole ||
    !market.pains.length ||
    !market.outcomes.length ||
    !business.deliveryModel.length
  ) {
    return null;
  }

  // Calculate offer strength (0-100)
  let offerStrength = 0;
  
  // Founder credibility (25%)
  offerStrength += Math.min(25, founder.signatureResults.length * 6);
  offerStrength += Math.min(15, founder.coreStrengths.length * 3);
  offerStrength += Math.min(10, founder.processes.length * 2);
  
  // Market clarity (25%)
  offerStrength += market.targetMarket.length > 10 ? 10 : 5;
  offerStrength += market.buyerRole.length > 5 ? 5 : 2;
  offerStrength += Math.min(10, market.pains.length * 3);
  
  // Business model (25%)
  offerStrength += Math.min(15, business.deliveryModel.length * 5);
  offerStrength += business.capacity && business.monthlyHours ? 10 : 0;
  
  // Positioning (25%)
  offerStrength += pricing.pricePosture === 'premium' ? 15 : 10;
  offerStrength += Math.min(10, voice.differentiators.length * 3);

  // Calculate confidence score
  const confidenceScore = Math.min(100, offerStrength + 10);

  // Generate recommendations
  const recommendations: string[] = [];
  
  if (founder.signatureResults.length < 3) {
    recommendations.push('Add more signature results to build credibility');
  }
  
  if (market.pains.length < 3) {
    recommendations.push('Identify more specific customer pain points');
  }
  
  if (business.deliveryModel.length === 1) {
    recommendations.push('Consider multiple delivery models for flexibility');
  }
  
  if (voice.differentiators.length < 3) {
    recommendations.push('Develop more unique differentiators');
  }
  
  if (pricing.pricePosture === 'value-priced' && pricing.guarantee === 'none') {
    recommendations.push('Consider adding a guarantee for value-priced offers');
  }

  return {
    offerStrength: Math.round(offerStrength),
    confidenceScore: Math.round(confidenceScore),
    recommendations: recommendations.slice(0, 5)
  };
}

// Helper function to format ACV
export function formatACV(acv: string): string {
  const match = acv.match(/[\d,]+/);
  if (match) {
    const number = parseInt(match[0].replace(/,/g, ''));
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(number);
  }
  return acv;
}

// Helper function to validate pricing alignment
export function validatePricingAlignment(pricing: PricingInputs, acv: string): {
  isValid: boolean;
  warnings: string[];
  suggestions: string[];
} {
  const warnings: string[] = [];
  const suggestions: string[] = [];
  
  const acvMatch = acv.match(/[\d,]+/);
  const acvValue = acvMatch ? parseInt(acvMatch[0].replace(/,/g, '')) : 0;
  
  if (pricing.pricePosture === 'premium' && acvValue < 25000) {
    warnings.push('Premium pricing typically requires higher ACV (>$25K)');
    suggestions.push('Consider increasing ACV or adjusting price posture');
  }
  
  if (pricing.pricePosture === 'value-priced' && acvValue > 100000) {
    warnings.push('Value pricing at this ACV level may not be optimal');
    suggestions.push('Consider premium positioning for higher ACV');
  }
  
  if (pricing.guarantee === 'none' && pricing.pricePosture === 'premium') {
    suggestions.push('Premium pricing works better with strong guarantees');
  }
  
  return {
    isValid: warnings.length === 0,
    warnings,
    suggestions
  };
}

// Type guards to help with TypeScript checking
export function isApiResponse<T>(response: any): response is ApiResponse<T> {
  return typeof response === 'object' && response !== null && 'success' in response && 'data' in response;
}

export function isValidOfferCreatorInput(data: any): data is OfferCreatorInput {
  return (
    data &&
    typeof data === 'object' &&
    data.founder &&
    data.market &&
    data.business &&
    data.pricing &&
    data.voice &&
    typeof data.userId === 'string'
  );
}

export function isGeneratedOfferPackage(data: any): data is GeneratedOfferPackage {
  return (
    data &&
    typeof data === 'object' &&
    data.signatureOffers &&
    data.signatureOffers.starter &&
    data.signatureOffers.core &&
    data.signatureOffers.premium &&
    data.pricing &&
    data.analysis &&
    typeof data.tokensUsed === 'number' &&
    typeof data.generationTime === 'number'
  );
}