// types/salesCallAnalyzer.ts
export interface SalesCallInput {
  // Basic Call Information
  title: string;
  callType: 'discovery' | 'interview' | 'sales' | 'podcast';
  scheduledDate?: Date;
  actualDate?: Date;
  
  // Recording/Transcript Input
  recordingFile?: File;
  recordingUrl?: string;
  transcript?: string;
  
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

export interface CallParticipant {
  name: string;
  email?: string;
  title?: string;
  role: 'host' | 'participant' | 'prospect' | 'interviewer';
  speakingTimeSeconds?: number;
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
  }>;
  
  // Sales-Specific Analysis
  salesMetrics?: {
    pain_points_identified: string[];
    budget_discussed: boolean;
    timeline_established: boolean;
    decision_maker_identified: boolean;
    next_steps_defined: boolean;
    objections_raised: string[];
    value_proposition_clarity: number; // 0-10
    rapport_level: number; // 0-10
  };
  
  // Interview-Specific Analysis
  interviewMetrics?: {
    questions_asked: number;
    follow_up_questions: number;
    customer_satisfaction_indicators: string[];
    feature_requests: string[];
    usability_feedback: string[];
    pain_points: string[];
  };
  
  // Discovery Call Analysis
  discoveryMetrics?: {
    current_solution_identified: boolean;
    challenges_uncovered: string[];
    success_criteria_defined: boolean;
    stakeholders_identified: string[];
    technical_requirements: string[];
    implementation_timeline: string;
  };
  
  // Podcast Analysis
  podcastMetrics?: {
    content_quality: number; // 0-10
    engagement_level: number; // 0-10
    key_topics: string[];
    memorable_quotes: string[];
    audience_insights: string[];
    content_suggestions: string[];
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
  
  // Performance Analytics
  performanceMetrics: {
    talkTime: number;
    questionToStatementRatio: number;
    interruptionCount: number;
    responseTime: number;
    engagementScore: number;
  };
  
  tokensUsed: number;
  processingTime: number;
}