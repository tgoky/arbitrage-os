// types/proposalCreator.ts
export type ProposalType = 
  | 'service-agreement'
  | 'project-proposal' 
  | 'retainer-agreement'
  | 'consulting-proposal'
  | 'custom-proposal';

export type IndustryType =
  | 'technology'
  | 'healthcare'
  | 'finance'
  | 'marketing'
  | 'consulting'
  | 'ecommerce'
  | 'manufacturing'
  | 'real-estate'
  | 'education'
  | 'other';

  

export type ContractLength =
  | 'one-time'
  | 'monthly'
  | '3-months'
  | '6-months'
  | 'annual'
  | 'ongoing';

export type PricingModel =
  | 'fixed-price'
  | 'hourly-rate'
  | 'milestone-based'
  | 'value-based'
  | 'retainer'
  | 'hybrid';

export interface ClientInformation {
  legalName: string;
  stateOfIncorporation?: string;
  entityType?: 'corporation' | 'llc' | 'partnership' | 'sole-proprietorship';
  address?: string;
  signatoryName?: string;
  signatoryTitle?: string;
  industry: IndustryType;
  companySize: 'startup' | 'small' | 'medium' | 'enterprise';
  decisionMaker?: string;
  // ADD THIS
  previousEngagements?: number;
}

// Updated ServiceProvider interface to match validator
export interface ServiceProvider {
  name?: string; // Made optional - can use workspace name
  legalName?: string; // Made optional
  address?: string; // Made optional
  signatoryName?: string; // Made optional
  signatoryTitle?: string; // Made optional
  businessStructure?: string; // Made optional
  credentials: string[]; // Required array but can be empty
  specializations: string[]; // Required array but can be empty
}


export interface ProjectScope {
  description: string; // Required
  objectives: string[]; // Required array but can be empty
  deliverables: Deliverable[]; // Required array but can be empty
  timeline?: string; // Made optional with default 'TBD'
  milestones: Milestone[]; // Required array but can be empty
  exclusions: string[]; // Required array but can be empty
  assumptions: string[]; // Required array but can be empty
  dependencies: string[]; // Required array but can be empty
}


export interface Deliverable {
  name: string;
  description: string;
  format: string;
  quantity: number;
  dueDate?: string;
  acceptanceCriteria: string[];
}

export interface Milestone {
  name: string;
  description: string;
  dueDate: string;
  deliverables: string[];
  paymentPercentage?: number;
  acceptanceCriteria: string[];
}

export interface PricingStructure {
  model: PricingModel; // Required with default
  totalAmount: number; // Required
  currency: string; // Required with default
  breakdown: PricingBreakdown[]; // Required array but can be empty
  paymentSchedule: PaymentSchedule[]; // Required array but can be empty
  expensePolicy?: string; // Made optional
  lateFeePercentage: number; // Required with default
  discounts: Discount[]; // Required array but can be empty
}



export interface PricingBreakdown {
  item: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  category: 'labor' | 'materials' | 'expenses' | 'other';
}

export interface PaymentSchedule {
  description: string;
  amount: number;
  dueDate: string;
  conditions: string[];
  status: 'pending' | 'paid' | 'overdue';
}

export interface Discount {
  type: 'early-payment' | 'volume' | 'loyalty' | 'promotional';
  description: string;
  percentage?: number;
  amount?: number;
  conditions: string[];
}

export interface ProposalTerms {
  proposalValidityDays: number; // Required with default
  contractLength: ContractLength; // Required with default
  terminationNotice: number; // Required with default
  intellectualProperty: 'client-owns' | 'service-provider-owns' | 'shared' | 'work-for-hire'; // Required with default
  confidentiality: boolean; // Required with default
  liabilityLimit: number; // Required with default
  warranty?: string; // Made optional
  governingLaw?: string; // Made optional
  disputeResolution: 'arbitration' | 'mediation' | 'litigation'; // Required with default
  forceMarjeure: boolean; // Required with default
  amendments?: string; // Made optional
}


export interface RiskFactors {
  technicalRisks: Risk[];
  businessRisks: Risk[];
  timelineRisks: Risk[];
  mitigationStrategies: string[];
}

export interface Risk {
  description: string;
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  mitigation: string;
}

export interface ProposalCustomizations {
  includeExecutiveSummary: boolean;
  includeCaseStudies: boolean;
  includeTeamBios: boolean;
  includeTestimonials: boolean;
  includeRiskAssessment: boolean;
  includeTimeline: boolean;
  includeNextSteps: boolean;
  customSections: CustomSection[];
  branding: BrandingOptions;
  
}

export interface CustomSection {
  title: string;
  content: string;
  position: number;
  required: boolean;
}

export interface BrandingOptions {
  useCompanyColors: boolean;
  includeLogo: boolean;
  customHeader: string;
  customFooter: string;
  fontStyle: 'professional' | 'modern' | 'classic';
}

export interface ProposalInput {
  proposalType: ProposalType;
  client: ClientInformation;
  serviceProvider: ServiceProvider;
  project: ProjectScope;
  pricing: PricingStructure;
  terms: ProposalTerms;
  risks?: RiskFactors;
  customizations: ProposalCustomizations;
  workspaceId: string;
  userId: string;
}

export interface GeneratedProposal {
  executiveSummary?: string;
  projectOverview: string;
  scopeOfWork: string;
  timeline: string;
  deliverables: string;
  pricing: string;
  terms: string;
  nextSteps: string;
  appendices?: string[];
  alternativeOptions?: AlternativeOption[]; // ADD THIS LINE
  contractTemplates: {
    serviceAgreement: string;
    statementOfWork: string;
    masterServiceAgreement?: string;
  };
  metadata?: {
    tokensUsed?: number;
    model?: string;
    generatedAt?: string;
    fallbackGeneration?: boolean;
    minimalGeneration?: boolean;
    proposalType?: ProposalType;
  };
}

export interface ProposalPackage {
  proposal: GeneratedProposal;
  analysis: ProposalAnalysis;
  recommendations: string[];
  alternativeOptions: AlternativeOption[];
  riskAssessment?: RiskAssessment;
  competitiveAnalysis?: CompetitiveAnalysis;
  tokensUsed: number;
  generationTime: number;
  originalInput: ProposalInput;
}

export interface ProposalAnalysis {
  winProbability: {
    score: number;
    factors: AnalysisFactor[];
  };
  pricingAnalysis: {
    competitiveness: 'low' | 'competitive' | 'premium';
    valueJustification: string;
    recommendations: string[];
  };
  riskLevel: 'low' | 'medium' | 'high';
  strengthsWeaknesses: {
    strengths: string[];
    weaknesses: string[];
    improvements: string[];
  };
}

export interface AnalysisFactor {
  factor: string;
  impact: 'High' | 'Medium' | 'Low';
  description: string;
  recommendation?: string;
}

export interface AlternativeOption {
  title: string;
  description: string;
  pricingAdjustment: number;
  timelineAdjustment: string;
  scopeChanges: string[];
  pros: string[];
  cons: string[];
}

export interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high';
  riskCategories: {
    technical: Risk[];
    financial: Risk[];
    timeline: Risk[];
    relationship: Risk[];
    // ADD THIS
    market?: Risk[];
  };
  mitigationPlan: string[];
}


export interface CompetitiveAnalysis {
  positioningAdvantages: string[];
  potentialChallenges: string[];
  differentiationPoints: string[];
  marketBenchmarks: {
    pricingRange: { min: number; max: number };
    typicalTimeline: string;
    standardFeatures: string[];
  };
}

export interface SavedProposal {
  id: string;
  title: string;
  proposalType: ProposalType;
  clientName: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'negotiating';
  totalValue: number;
  createdAt: Date;
  updatedAt: Date;
  proposalData: ProposalPackage;
  metadata: {
    industry: IndustryType;
    projectSize: 'small' | 'medium' | 'large';
    // FIX THIS - change to match the actual values used in service
    complexity: 'low' | 'moderate' | 'high'; // Changed from 'simple' | 'moderate' | 'complex'
    winProbability: number;
    version: string; // Changed from number to string to match "1.0"
  };
  workspace?: any;
}


export interface ProposalTemplate {
  id: string;
  name: string;
  proposalType: ProposalType;
  industry: IndustryType;
  description: string;
  template: Partial<ProposalInput>;
  isPublic: boolean;
  usage: number;
  rating: number;
  createdBy: string;
}

export interface ProposalValidationResult {
  isValid: boolean;
  isReadyToGenerate: boolean;
  errors: Record<string, string>;
  warnings: Record<string, string>;
  completionPercentage: number;
  completedFields: number;
  totalRequiredFields: number;
  missingCriticalFields: string[];
}

// API Response Types
export interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: {
    proposalId?: string;
    saved?: boolean;
    tokensUsed?: number;
    generationTime?: number;
    remaining?: number;
     error?: string; 
    version?: string;
    [key: string]: any;
  };
}

export interface ApiResponseOptional<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  details?: any[];
  meta?: {
    [key: string]: any;
  };
}

// Export utility types
export type ProposalCreatorInput = ProposalInput;
export type GeneratedProposalPackage = ProposalPackage;