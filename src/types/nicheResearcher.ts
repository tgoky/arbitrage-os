// types/nicheResearcher.ts - UPDATED TO MATCH FRONTEND
export interface NicheResearchInput {
  // Business & Strategic Goals
  primaryObjective: 'cashflow' | 'equity-exit' | 'lifestyle' | 'audience-build' | 'saas' | 'agency' | 'ecomm';
  riskAppetite: 'low' | 'medium' | 'high';
  
  // Target Customer Preferences
  marketType: 'b2b-saas' | 'b2c-consumer' | 'professional-services' | 'local-business' | 'info-education';
  customerSize: 'startups' | 'smb' | 'enterprise' | 'consumers' | 'government';
  industries?: string[];
  geographicFocus?: 'local' | 'regional' | 'us-only' | 'global';
  
  // Constraints & Resources
  budget: '<10k' | '10k-50k' | '50k-250k' | '250k+';
  teamSize?: 'solo' | 'small-team' | 'established-team';
  skills?: string[];
  timeCommitment?: '5-10' | '10-20' | '20-30' | '30+';
  
  // Market Directional Inputs
  problems?: string;
  excludedIndustries?: string[];
  monetizationPreference?: 'high-ticket' | 'subscription' | 'low-ticket' | 'ad-supported';
  acquisitionChannels?: string[];
  
  // Validation & Scalability Factors
  validationData?: string[];
  competitionPreference?: 'low-competition' | 'high-potential';
  scalabilityPreference?: 'stay-small' | 'grow-fast' | 'build-exit';
  
  // System field
  userId?: string;
}

export interface NicheOverview {
  name: string;
  summary: string;
  whyItFits: string;
}

export interface MarketDemand {
  marketSize: string;
  trend: 'growing' | 'plateauing' | 'declining';
  willingnessToPay: string;
}

export interface PainPoint {
  problem: string;
  intensity: 'High' | 'Medium' | 'Low';
}

export interface Competitor {
  name: string;
  description: string;
  strength?: 'Strong' | 'Medium' | 'Weak'; // Added optional strength property
}

export interface CompetitiveLandscape {
  competitors: Competitor[];
  gapAnalysis: string;
  barrierToEntry: 'Low' | 'Medium' | 'High';
}

export interface ArbitrageOpportunity {
  explanation: string;
  concreteAngle: string;
}

export interface EntryOffer {
  positioning: string;
  businessModel: string;
  pricePoint: string;
}

export interface GtmStrategy {
  primaryChannel: string;
  justification: string;
}

export interface ScalabilityExit {
  scalabilityScore: 'High' | 'Medium' | 'Low';
  exitPotential: string;
}

export interface RiskFactor {
  risk: string;
  impact: 'High' | 'Medium' | 'Low';
}

export interface Scorecard {
  marketDemand: 'High' | 'Medium' | 'Low';
  competition: 'High' | 'Medium' | 'Low';
  easeOfEntry: 'High' | 'Medium' | 'Low';
  profitability: 'High' | 'Medium' | 'Low';
}

// types/nicheResearcher.ts - Add these interfaces
export interface MultiNicheReport {
  niches: GeneratedNicheReport[];
  recommendedNiche: number; // Index of recommended niche (0, 1, or 2)
  recommendationReason: string;
  comparisonMatrix: NicheComparisonMatrix;
  generationTime: number;
  tokensUsed: number;
}

export interface NicheComparisonMatrix {
  criteria: string[];
  scores: NicheScore[];
}

export interface NicheScore {
  nicheIndex: number;
  scores: Record<string, number>; // e.g., { marketSize: 85, competition: 60, fit: 90 }
  totalScore: number;
}

export interface GeneratedNicheReport {
  nicheOverview: NicheOverview;
  marketDemand: MarketDemand;
  painPoints: PainPoint[];
  competitiveLandscape: CompetitiveLandscape;
  arbitrageOpportunity: ArbitrageOpportunity;
  entryOffers: EntryOffer[];
  gtmStrategy: GtmStrategy;
  scalabilityExit: ScalabilityExit;
  riskFactors: RiskFactor[];
  scorecard: Scorecard;
  tokensUsed: number;
  generationTime: number;
}

export interface NicheReportMetadata {
  primaryObjective: string;
  marketType: string;
  customerSize: string;
  budget: string;
  generatedAt: string;
  tokensUsed: number;
  generationTime: number;
  topNiches: Array<{
    name: string;
    matchScore: number;
    category: string;
    isRecommended?: boolean;
  }>;
  // Multi-niche specific fields
  recommendedNicheIndex?: number;
  recommendationReason?: string;
  totalNiches?: number;
  // Additional optional fields
  riskAppetite?: string;
  geographicFocus?: string;
  teamSize?: string;
  timeCommitment?: string;
  skills?: string[];
  industries?: string[];
  originalInput?: any;
  [key: string]: any;
}