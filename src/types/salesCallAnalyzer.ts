// types/salesCallAnalyzer.ts - UPDATED VERSION
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