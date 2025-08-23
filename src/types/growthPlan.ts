// types/growthPlan.ts - COMPLETE TYPE DEFINITIONS (FIXED)

// Base interfaces for growth plan components
export interface CaseStudy {
  client: string;
  result: string;
}

export interface GrowthPlanInput {
  // User Information
  email: string;
  name: string;
  company: string;
  
  // Client Information
  clientCompany: string;
  industry: string;
  contactName: string;
  contactRole: string;
  
  // Discovery & Expertise
  transcript?: string;
  expertise: string[];
  experience: string;
  
  // Case Studies
  caseStudies?: CaseStudy[];
  
  // Plan Configuration
  timeframe: '3m' | '6m' | '12m';
  focusAreas?: string[];
  budget?: number;
  currentRevenue?: number;
  targetRevenue?: number;
  
  // Optional business context
  businessModel?: 'B2B' | 'B2C' | 'B2B2C' | 'Marketplace' | 'SaaS' | 'E-commerce' | 'Service';
  teamSize?: number;
  currentChannels?: string[];
  painPoints?: string[];
  objectives?: string[];
  
  // System field
  userId: string;
}

export interface GrowthStage {
  title: string;
  duration: string;
  tasks: string[];
  kpis: string[];
  budget: number;
}

export interface GrowthPriority {
  area: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
  timeline: string;
}

export interface GrowthRisk {
  risk: string;
  mitigation: string;
  probability: 'high' | 'medium' | 'low';
}

export interface GrowthStrategy {
  stages: GrowthStage[];
  priorities: GrowthPriority[];
  recommendations: string[];
  risks: GrowthRisk[];
}

export interface GrowthTimelineEntry {
  month: string;
  leads: number;
  revenue: number;
  customers: number;
  cac: number;
  ltv: number;
}

export interface GrowthKPI {
  name: string;
  current: number;
  target: number;
  improvement: number;
}

export interface GrowthChannel {
  name: string;
  allocation: number;
  expectedROI: number;
  status: 'active' | 'planned' | 'testing';
}

export interface GrowthMetrics {
  timeline: GrowthTimelineEntry[];
  kpis: GrowthKPI[];
  channels: GrowthChannel[];
}

export interface GrowthPhase {
  name: string;
  duration: string;
  objectives: string[];
  deliverables: string[];
  resources: string[];
}

export interface GrowthBudgetBreakdown {
  category: string;
  amount: number;
  percentage: number;
}

export interface GrowthBudget {
  total: number;
  breakdown: GrowthBudgetBreakdown[];
}

export interface GrowthImplementation {
  phases: GrowthPhase[];
  timeline: string;
  budget: GrowthBudget;
}

export interface GeneratedGrowthPlan {
  executiveSummary: string;
  strategy: GrowthStrategy;
  metrics: GrowthMetrics;
  implementation: GrowthImplementation;
  nextSteps: string[];
  tokensUsed: number;
  generationTime: number;
}

// Database/API related types
export interface SavedGrowthPlan {
  id: string;
  title: string;
  plan: GeneratedGrowthPlan;
  metadata: GrowthPlanMetadata;
  createdAt: Date;
  updatedAt: Date;
  workspace?: {
    id: string;
    name: string;
  };
}

export interface GrowthPlanMetadata {
  clientCompany: string;
  industry: string;
  timeframe: string;
  contactName: string;
  contactRole: string;
  generatedAt: string;
  tokensUsed: number;
  generationTime: number;
  consultant: {
    name: string;
    company: string;
    expertise: string[];
  };
  [key: string]: any; // For additional metadata fields
}

export interface GrowthPlanSummary {
  id: string;
  title: string;
  clientCompany: string;
  industry: string;
  timeframe: string;
  createdAt: Date;
  updatedAt: Date;
  workspace?: {
    id: string;
    name: string;
  };
}

// Validation types
export interface GrowthPlanValidationResult {
  success: boolean;
  data?: GrowthPlanInput;
  errors?: Array<{
    code: string;
    message: string;
    path: string[];
  }>;
}

export interface GrowthPlanBusinessRules {
  isValid: boolean;
  warnings: string[];
  errors: string[];
  insights: GrowthPlanInsights;
}

export interface GrowthPlanInsights {
  complexity: 'simple' | 'moderate' | 'complex';
  feasibility: 'high' | 'medium' | 'low';
  credibility: 'strong' | 'moderate' | 'weak';
  expectedSuccess: number; // 0-100
}

export interface GrowthPlanContext {
  hasTranscript: boolean;
  hasRevenueData: boolean;
  hasBudget: boolean;
  hasCaseStudies: boolean;
  industrySpecific: boolean;
}

export interface GrowthPlanScope {
  expertiseAreas: number;
  focusAreas: number;
  timeframe: string;
  businessModel: string;
  teamSize: string | number;
}

export interface GrowthPlanGrowthData {
  hasGrowthTarget: boolean;
  growthMultiple: number | null;
  monthlyGrowthRequired: number;
  budgetToRevenueRatio: number | null;
}

export interface GrowthPlanRecommendations {
  shouldAddCaseStudies: boolean;
  shouldExpandExperience: boolean;
  shouldNarrowFocus: boolean;
  shouldAdjustTimeline: boolean;
  shouldIncreaseBudget: boolean;
}

export interface GrowthPlanExtractedInsights {
  context: GrowthPlanContext;
  scope: GrowthPlanScope;
  growth: GrowthPlanGrowthData;
  recommendations: GrowthPlanRecommendations;
}

export interface GrowthPlanSuggestions {
  improvements: string[];
  optimizations: string[];
  alternatives: string[];
}

// Analytics types
export interface GrowthPlanAnalytics {
  totalPlans: number;
  plansThisMonth?: number;  // ✅ ADD: Plans in current timeframe
  industryDistribution: Record<string, number>;
  timeframeDistribution: Record<string, number>;
  timeframe: 'week' | 'month' | 'quarter';
  topIndustries: Array<{
    industry: string;
    count: number;          // ✅ CHANGE: from 'plans' to 'count' to match service
    percentage: number;     // ✅ ADD: Percentage of total
  }>;
  averageMetrics?: {        // ✅ ADD: Average performance metrics
    tokensPerPlan: number;
    generationTime: number;
  };
  plansByDate?: Array<{     // ✅ ADD: Data for charts
    date: string;
    count: number;
    cumulative: number;
  }>;
  insights: string[];
}


// Service response types
// ✅ Update service response to be more flexible
export interface GrowthPlanServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    saved?: boolean;        // Indicates if plan was saved to DB
    temporary?: boolean;    // Indicates if this is a temporary generation
    workspace?: string;     // ✅ ADD: Workspace name or ID
    planId?: string;        // ✅ ADD: Plan ID for reference
    tokensUsed?: number;    // ✅ ADD: Token usage info
    generationTime?: number; // ✅ ADD: Generation time info
    [key: string]: any;     // ✅ ADD: Allow additional meta fields
  };
}

// API endpoint types
export interface CreateGrowthPlanRequest {
  input: Omit<GrowthPlanInput, 'userId'>; // Remove userId - server will add it
  workspaceId?: string;
}


export interface CreateGrowthPlanResponse {
  planId?: string;
  plan: GeneratedGrowthPlan;
}

export interface UpdateGrowthPlanRequest {
  planId: string;
  updates: Partial<GrowthPlanInput>;
}

export interface UpdateGrowthPlanResponse {
  planId: string;
  plan: GeneratedGrowthPlan;
  updatedAt: string;
}

export interface GetGrowthPlanResponse {
  plan: SavedGrowthPlan;
}

export interface ListGrowthPlansRequest {
  workspaceId?: string;
  limit?: number;
  offset?: number;
  industry?: string;
  timeframe?: string;
}

export interface ListGrowthPlansResponse {
  plans: GrowthPlanSummary[];
  total: number;
  hasMore: boolean;
}

export interface ExportGrowthPlanRequest {
  planId: string;
  format: 'pdf' | 'word' | 'markdown';
}

export interface ExportGrowthPlanResponse {
  content: string;
  filename: string;
  mimeType: string;
}

// Form/UI types
export interface GrowthPlanFormData extends Omit<GrowthPlanInput, 'userId'> {
  // Form-specific fields can be added here
}

export interface GrowthPlanFormStep {
  id: string;
  title: string;
  description: string;
  fields: string[];
  isComplete: boolean;
  isValid: boolean;
}

export interface GrowthPlanFormState {
  currentStep: number;
  steps: GrowthPlanFormStep[];
  data: Partial<GrowthPlanFormData>;
  validation: {
    isValid: boolean;
    errors: Record<string, string>;
    warnings: Record<string, string>;
  };
  isSubmitting: boolean;
  isDirty: boolean;
}

//  Add a new response type for unsaved plans
export interface GeneratedGrowthPlanResponse {
  plan: GeneratedGrowthPlan;
  // No planId since it's not saved
}

// Constants and enums
export const GROWTH_PLAN_TIMEFRAMES = ['3m', '6m', '12m'] as const;
export const BUSINESS_MODELS = [
  'B2B', 
  'B2C', 
  'B2B2C', 
  'Marketplace', 
  'SaaS', 
  'E-commerce', 
  'Service'
] as const;

export const IMPACT_LEVELS = ['high', 'medium', 'low'] as const;
export const EFFORT_LEVELS = ['high', 'medium', 'low'] as const;
export const PROBABILITY_LEVELS = ['high', 'medium', 'low'] as const;
export const CHANNEL_STATUSES = ['active', 'planned', 'testing'] as const;

export const COMPLEXITY_LEVELS = ['simple', 'moderate', 'complex'] as const;
export const FEASIBILITY_LEVELS = ['high', 'medium', 'low'] as const;
export const CREDIBILITY_LEVELS = ['strong', 'moderate', 'weak'] as const;

// Type guards
export function isValidTimeframe(timeframe: string): timeframe is '3m' | '6m' | '12m' {
  return GROWTH_PLAN_TIMEFRAMES.includes(timeframe as any);
}

export function isValidBusinessModel(model: string): model is typeof BUSINESS_MODELS[number] {
  return BUSINESS_MODELS.includes(model as any);
}

export function isValidImpactLevel(level: string): level is 'high' | 'medium' | 'low' {
  return IMPACT_LEVELS.includes(level as any);
}

// Utility types
export type GrowthPlanUpdateFields = Partial<Omit<GrowthPlanInput, 'userId'>>;
export type GrowthPlanRequiredFields = Pick<GrowthPlanInput, 
  'email' | 'name' | 'company' | 'clientCompany' | 'industry' | 
  'contactName' | 'contactRole' | 'expertise' | 'experience' | 'timeframe'
>;

// Error types
export interface GrowthPlanError {
  code: string;
  message: string;
  field?: string;
  details?: any;
}

export class GrowthPlanValidationError extends Error {
  constructor(
    public errors: GrowthPlanError[],
    message = 'Growth plan validation failed'
  ) {
    super(message);
    this.name = 'GrowthPlanValidationError';
  }
}

export class GrowthPlanServiceError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'GrowthPlanServiceError';
  }
}

// Default values and configurations
export const DEFAULT_GROWTH_PLAN_INPUT: Partial<GrowthPlanInput> = {
  timeframe: '6m',
  expertise: [],
  caseStudies: [],
  focusAreas: [],
  currentChannels: [],
  painPoints: [],
  objectives: []
};

export const GROWTH_PLAN_LIMITS = {
  MAX_EXPERTISE_AREAS: 10,
  MAX_CASE_STUDIES: 5,
  MAX_FOCUS_AREAS: 5,
  MAX_EXPERIENCE_LENGTH: 2000,
  MAX_TRANSCRIPT_LENGTH: 10000,
  MIN_EXPERIENCE_LENGTH: 10,
  MAX_CURRENT_CHANNELS: 10,
  MAX_PAIN_POINTS: 10,
  MAX_OBJECTIVES: 10
} as const;