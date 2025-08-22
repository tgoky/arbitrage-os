// types/offerCreator.ts

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
  userId: string;
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

// Type for the complete generated offer package
export interface GeneratedOfferPackage {
  primaryOffer: GeneratedOffer;
  analysis: {
    conversionPotential: {
      score: number;
      factors: Array<{
        factor: string;
        impact: 'High' | 'Medium' | 'Low';
        recommendation: string;
      }>;
    };
  };
  tokensUsed: number;
  generationTime: number;
}

// Type for saved offers
export interface SavedOffer {
  id: string;
  title: string;
  offer: GeneratedOfferPackage;
  createdAt: Date;
  updatedAt: Date;
  workspace?: {
    id: string;
    name: string;
    slug: string;
  };
}

// API Response type
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