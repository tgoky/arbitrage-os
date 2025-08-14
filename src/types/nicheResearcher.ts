// types/nicheResearcher.ts
export interface NicheResearchInput {
  // Professional Background
  roles: string;
  skills: string[];
  competencies: string;
  
  // Personal Interests & Network
  interests: string;
  connections: string;
  audienceAccess?: string;
  
  // Market Insights & Constraints
  problems: string;
  trends: string;
  time: '5-10' | '10-20' | '20-30' | '30+';
  budget: '0-1k' | '1k-5k' | '5k-10k' | '10k+';
  location: 'remote-only' | 'local-focused' | 'hybrid';
  otherConstraints?: string;
  
  // System field
  userId: string;
}

export interface NicheOpportunity {
  name: string;
  matchScore: number;
  category: string;
  reasons: string[];
  marketSize: string;
  growthRate: string;
  competition: {
    level: 'Low' | 'Moderate' | 'High';
    score: number;
    description: string;
  };
  resourcesNeeded: string[];
  startupCosts: {
    min: number;
    max: number;
    breakdown: Array<{
      category: string;
      amount: number;
      description: string;
    }>;
  };
  timeToMarket: string;
  skillsRequired: string[];
  networkLeverage: string[];
  riskFactors: string[];
  monetizationModels: string[];
  targetCustomers: string[];
  keyMetrics: string[];
  nextSteps: string[];
}

export interface MarketAnalysis {
  trends: Array<{
    trend: string;
    relevance: 'High' | 'Medium' | 'Low';
    impact: string;
    timeline: string;
  }>;
  gaps: Array<{
    gap: string;
    severity: 'High' | 'Medium' | 'Low';
    opportunity: string;
  }>;
  competitorLandscape: {
    overview: string;
    keyPlayers: string[];
    barriers: string[];
    advantages: string[];
  };
}

export interface PersonalFitAnalysis {
  strengths: string[];
  skillGaps: string[];
  networkAdvantages: string[];
  constraintImpacts: Array<{
    constraint: string;
    impact: string;
    mitigation: string;
  }>;
  confidenceScore: number;
  developmentAreas: string[];
}

export interface NicheReportMetadata {
  skills: string[];
  interests: string;
  timeCommitment: string;
  budget: string;
  location: string;
  generatedAt: string;
  tokensUsed: number;
  generationTime: number;
  topNiches: Array<{
    name: string;
    matchScore: number;
    category: string;
  }>;
  [key: string]: any; // For additional metadata fields
}

export interface GeneratedNicheReport {
  executiveSummary: string;
  recommendedNiches: NicheOpportunity[];
  marketAnalysis: MarketAnalysis;
  personalFit: PersonalFitAnalysis;
  actionPlan: {
    immediateSteps: string[];
    shortTerm: Array<{
      action: string;
      timeline: string;
      resources: string[];
    }>;
    longTerm: Array<{
      goal: string;
      timeline: string;
      milestones: string[];
    }>;
  };
  riskAssessment: Array<{
    risk: string;
    probability: 'High' | 'Medium' | 'Low';
    impact: 'High' | 'Medium' | 'Low';
    mitigation: string;
  }>;
  financialProjections: Array<{
    niche: string;
    timeline: string;
    revenue: {
      conservative: number;
      optimistic: number;
      realistic: number;
    };
    costs: number;
    profitability: number;
  }>;
  tokensUsed: number;
  generationTime: number;
}
