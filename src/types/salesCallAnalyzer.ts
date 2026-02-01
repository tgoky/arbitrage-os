// types/salesCallAnalyzer.ts - UPDATED VERSION WITH DEAL ARCHITECTURE
export interface SalesCallInput {
  // Basic Call Information
  title: string;
  callType: 'discovery' | 'interview' | 'sales' | 'podcast';
  scheduledDate?: Date;
  actualDate?: Date;

  // Transcript Input (removed audio-related fields)
  transcript: string; // Made required since we're text-only now

  // Prospect Information
  prospectName?: string;
  prospectTitle?: string;
  prospectEmail?: string;
  prospectLinkedin?: string;

  // Company Information
  companyName?: string;
  companyWebsite?: string;
  companyIndustry?: string;
  companyHeadcount?: string;
  companyRevenue?: string;
  companyLocation?: string;
  companyLinkedin?: string;

  // Additional Context
  additionalContext?: string;
  specificQuestions?: string[];
  analysisGoals?: string[];

  // System fields
  userId: string;
}

// ═══════════════════════════════════════════════════════════════════
// DEAL ARCHITECTURE TYPES - NEW COMMERCIAL FOCUS
// ═══════════════════════════════════════════════════════════════════

/**
 * Prospect Diagnosis - Understanding the "Why"
 * Identifies business profile, pain points, and qualification status
 */
export interface ProspectDiagnosis {
  // Business Profile
  businessProfile: {
    industry: string;
    businessType: 'blue_collar' | 'local_service' | 'ecommerce' | 'saas' | 'agency' | 'professional_services' | 'other';
    estimatedTeamSize: string;
    estimatedRevenue: string;
    currentTechStack: string[];
    location?: string;
  };

  // The "Bleeding Neck" Problems - Top 3 urgent pain points
  bleedingNeckProblems: Array<{
    problem: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    frequency: string; // e.g., "Daily", "Weekly", "Monthly"
    estimatedCost: string; // e.g., "$2,000/month in missed calls"
    quotedEvidence?: string; // Direct quote from transcript
  }>;

  // Financial Qualification
  financialQualification: {
    isQualified: 'yes' | 'no' | 'maybe';
    qualificationReason: string;
    estimatedBudget?: string;
    urgencyLevel: 'immediate' | 'this_quarter' | 'this_year' | 'exploring';
    decisionMakerPresent: boolean;
    buyingSignals: string[];
    redFlags: string[];
  };

  // Buying Committee
  buyingCommittee?: {
    decisionMaker?: string;
    influencers?: string[];
    endUsers?: string[];
    blockers?: string[];
  };
}

/**
 * Solution Stack - The "What" to Build
 * Three-tiered solution approach for high-ticket recurring revenue
 */
export interface SolutionStack {
  // Phase 1: Quick Win (Immediate Implementation)
  phase1QuickWin: {
    phaseName: string;
    timeline: string; // e.g., "24-48 hours"
    tools: Array<{
      toolName: string;
      toolType: 'ghl_workflow' | 'make_scenario' | 'ai_agent' | 'landing_page' | 'crm_setup' | 'automation' | 'integration' | 'other';
      description: string;
      whyItHelps: string;
      setupComplexity: 'low' | 'medium' | 'high';
      estimatedSetupHours: number;
    }>;
    expectedOutcome: string;
    proofOfConcept: string; // How to demonstrate quick value
  };

  // Phase 2: Core System (The Retainer Foundation)
  phase2CoreSystem: {
    phaseName: string;
    timeline: string; // e.g., "1-2 weeks"
    tools: Array<{
      toolName: string;
      toolType: 'ghl_workflow' | 'make_scenario' | 'ai_agent' | 'landing_page' | 'crm_setup' | 'automation' | 'integration' | 'other';
      description: string;
      whyItHelps: string;
      setupComplexity: 'low' | 'medium' | 'high';
      estimatedSetupHours: number;
      monthlyMaintenanceHours?: number;
    }>;
    expectedOutcome: string;
    retainerJustification: string; // Why they need ongoing support
  };

  // Phase 3: AI "Wow" Factor (High Ticket Upsell)
  phase3AIWowFactor: {
    phaseName: string;
    timeline: string; // e.g., "2-4 weeks"
    tools: Array<{
      toolName: string;
      toolType: 'ai_voice_agent' | 'ai_chat_agent' | 'ai_booking_agent' | 'ai_qualifier' | 'ai_support' | 'custom_ai' | 'other';
      description: string;
      whyItHelps: string;
      setupComplexity: 'low' | 'medium' | 'high';
      estimatedSetupHours: number;
      replacesRole?: string; // e.g., "Full-time receptionist ($45k/year)"
      monthlyMaintenanceHours?: number;
    }>;
    expectedOutcome: string;
    roiProjection: string; // e.g., "Saves $3,750/month in labor costs"
  };

  // Integration Requirements
  integrationMap: {
    requiredIntegrations: string[];
    niceToHaveIntegrations: string[];
    potentialBlockers: string[];
  };
}

/**
 * Pricing Strategy - The "How Much"
 * Maximizes agency profit while fitting prospect's budget
 */
export interface PricingStrategy {
  // Setup Fees
  setupFee: {
    minimum: number;
    maximum: number;
    recommended: number;
    breakdown: Array<{
      item: string;
      cost: number;
      justification: string;
    }>;
  };

  // Monthly Retainer
  monthlyRetainer: {
    minimum: number;
    maximum: number;
    recommended: number;
    breakdown: Array<{
      item: string;
      monthlyCost: number;
      justification: string;
    }>;
    includedHours?: number;
    overhourlyRate?: number;
  };

  // The Pitch Angle - How to frame the price
  pitchAngle: {
    headline: string; // e.g., "Replace a $50k admin for the price of coffee a day"
    valueFraming: string;
    comparisonPoint: string; // What they're currently spending/losing
    urgencyHook: string;
  };

  // Contract Terms
  contractTerms: {
    recommendedTerm: '3_months' | '6_months' | '12_months';
    discountForLongerTerm?: string;
    paymentStructure: string;
    guaranteeOffered?: string;
  };

  // Upsell Path
  upsellOpportunities: Array<{
    service: string;
    timing: string; // When to pitch it
    additionalRevenue: number;
  }>;

  // Total Deal Value
  totalDealValue: {
    firstYearValue: number;
    lifetimeValueEstimate: number;
    profitMarginEstimate: string;
  };
}

/**
 * Sales Performance Analysis - The Coaching (maintained from original)
 * Critiques the agency owner's performance on the call
 */
export interface SalesPerformanceAnalysis {
  // Green Flags - What went well
  greenFlags: Array<{
    observation: string;
    example?: string; // Quote or specific moment
    impact: string;
  }>;

  // Red Flags - Areas to improve
  redFlags: Array<{
    observation: string;
    example?: string;
    howToFix: string;
    priority: 'high' | 'medium' | 'low';
  }>;

  // Missed Opportunities - Questions they should have asked
  missedOpportunities: Array<{
    topic: string;
    questionToAsk: string;
    whyItMatters: string;
  }>;

  // Call Score Card
  callScoreCard: {
    rapportBuilding: number; // 0-10
    discoveryDepth: number; // 0-10
    painIdentification: number; // 0-10
    valuePresentation: number; // 0-10
    objectionHandling: number; // 0-10
    closingStrength: number; // 0-10
    overallScore: number; // 0-100
  };

  // Next Call Preparation
  nextCallPreparation: string[];
}

/**
 * Deal Grade - Overall deal quality assessment
 */
export interface DealGrade {
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  gradeReason: string;
  winProbability: number; // 0-100
  recommendedNextStep: string;
  dealRisks: string[];
  dealStrengths: string[];
}

/**
 * Complete Deal Architecture Package
 * The main output combining all deal-focused analysis
 */
export interface DealArchitecturePackage {
  // Core Deal Analysis
  prospectDiagnosis: ProspectDiagnosis;
  solutionStack: SolutionStack;
  pricingStrategy: PricingStrategy;

  // Sales Coaching (maintained)
  salesPerformance: SalesPerformanceAnalysis;

  // Deal Assessment
  dealGrade: DealGrade;

  // Quick Reference
  executiveBrief: {
    oneLineSummary: string;
    topPriority: string;
    immediateAction: string;
    dealValue: string;
  };
}

export interface CallStructureAnalysis {
  callStructure: {
    opening: {
      assessment: 'Strong' | 'Good' | 'Needs Improvement';
      strengths: string[];
      weaknesses: string[];
      recommendations: string[];
    };
    middle: {
      assessment: 'Strong' | 'Good' | 'Needs Improvement';
      discoveryQuality: 'Excellent' | 'Good' | 'Poor';
      questionCount: number;
      topicsCovered: string[];
      recommendations: string[];
    };
    closing: {
      assessment: 'Strong' | 'Good' | 'Needs Improvement';
      nextStepsDefined: boolean;
      commitmentLevel: 'High' | 'Medium' | 'Low';
      recommendations: string[];
    };
  };
  metrics: {
    clarity: number;
    energy: number;
    professionalism: number;
    rapport: number;
    transitionSmoothness: number;
    pacingOptimal: boolean;
  };
  keyMoments: Array<{
    timestamp: string;
    type: 'positive' | 'negative' | 'neutral' | 'critical';
    description: string;
    impact: string;
  }>;
  missedOpportunities: Array<{
    area: string;
    description: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    howToFix: string;
  }>;
}



export interface CallParticipant {
  name: string;
  email?: string;
  title?: string;
  role: 'host' | 'participant' | 'prospect' | 'interviewer';
  speakingTime?: number; // Changed from speakingTimeSeconds
  speakingPercentage?: number; // Added this field
  linkedin?: string;
}

export interface SalesCallAnalysis {
  // Core Analysis
  overallScore: number; // 0-100
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
  keyInsights: string[];
  actionItems: string[];
  
  // Conversation Analysis
  speakerBreakdown: Array<{
    speaker: string;
    speakingTime: number;
    percentage: number;
    keyPoints: string[];
    toneAnalysis?: string;
    engagement?: number;
  }>;
  
  // Sales-Specific Analysis - UPDATED field names to match service
  salesMetrics?: {
    painPointsIdentified: string[];
    budgetDiscussed: boolean;
    timelineEstablished: boolean;
    decisionMakerIdentified: boolean;
    nextStepsDefined: boolean;
    objectionsRaised: string[];
    valuePropositionClarity: number; // 0-10
    rapportLevel: number; // 0-10
    urgencyCreated?: number;
    competitorsMentioned?: string[];
    buyingSignals?: string[];
    riskFactors?: string[];
  };
  
  // Interview-Specific Analysis - UPDATED field names
  interviewMetrics?: {
    questionsAsked: number;
    followUpQuestions: number;
    customerSatisfactionIndicators: string[];
    featureRequests: string[];
    usabilityFeedback: string[];
    painPointsUncovered: string[];
    improvementSuggestions?: string[];
    competitorInsights?: string[];
    userJourneyInsights?: string[];
  };
  
  // Discovery Call Analysis - UPDATED field names
  discoveryMetrics?: {
    currentSolutionIdentified: boolean;
    challengesUncovered: string[];
    successCriteriaDefined: boolean;
    stakeholdersIdentified: string[];
    technicalRequirements: string[];
    implementationTimeline: string;
    budgetRangeDiscussed?: boolean;
    procurementProcess?: string;
    currentVendors?: string[];
    evaluationCriteria?: string[];
  };
  
  // Podcast Analysis - UPDATED field names
  podcastMetrics?: {
    contentQuality: number; // 0-10
    engagementLevel: number; // 0-10
    keyTopics: string[];
    memorableQuotes: string[];
    audienceInsights: string[];
    contentSuggestions: string[];
    storytellingEffectiveness?: number;
    educationalValue?: number;
    entertainmentValue?: number;
    shareableContent?: string[];
  };

  // General metrics for other call types
  generalMetrics?: {
    conversationFlow: number;
    informationGathered: number;
    relationshipBuilding: number;
    objectivesAchieved: number;
  };
}

export interface SalesCallResults {
  callId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  duration: number; // seconds
  participants: CallParticipant[];
  transcript: string;
  analysis: SalesCallAnalysis;
  
  // AI-Generated Deliverables
  executiveSummary: string;
  detailedReport: string;
  followUpEmail?: string;
  proposalTemplate?: string;
  contractClauses?: string[];
   callStructureAnalysis?: CallStructureAnalysis;
  
  // Coaching & Improvement
  coachingFeedback: {
    strengths: string[];
    improvements: string[];
    specificSuggestions: string[];
    communicationTips: string[];
    nextCallPreparation: string[];
  };
  
  // Performance Benchmarks
  benchmarks: {
    industryAverages: Record<string, number>;
    yourPerformance: Record<string, number>;
    improvementAreas: string[];
  };
}

export interface GeneratedCallPackage {
  callResults: SalesCallResults;

  // ═══════════════════════════════════════════════════════════════════
  // NEW: Deal Architecture (Commercial Focus)
  // ═══════════════════════════════════════════════════════════════════
  dealArchitecture?: DealArchitecturePackage;

  // Client-Ready Materials
  summaryPresentation: Array<{
    title: string;
    content: string;
    visualType: 'text' | 'chart' | 'bullet' | 'quote';
  }>;

  // Strategic Recommendations
  nextStepsStrategy: {
    immediateActions: string[];
    shortTermGoals: string[];
    longTermStrategy: string[];
    riskMitigation: string[];
  };

  // Performance Analytics - UPDATED to match service output
  performanceMetrics: {
    talkTime: number; // Changed from talkTimePercentage
    questionToStatementRatio: number;
    interruptionCount: number;
    responseTime: number; // Changed from averageResponseTime
    engagementScore: number;
    clarityScore?: number;
    enthusiasmLevel?: number;
    professionalismScore?: number;
  };

  tokensUsed: number;
  processingTime: number;
}