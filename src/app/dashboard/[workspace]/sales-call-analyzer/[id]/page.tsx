"use client";

import React, { useState, useEffect } from 'react';
import {
  ArrowLeftOutlined,
  DownloadOutlined,
  ShareAltOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import {
  Button,
  Typography,
  Progress,
  Alert,
  Divider,
  Tabs,
  message,
  Skeleton
} from 'antd';
import { useGo } from "@refinedev/core";
import { useParams } from 'next/navigation';
import { useSalesCallAnalyzer } from '../../../../hooks/useSalesCallAnalyzer';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

// Minimal pill component - replaces Tag everywhere
const Pill = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <span className={`inline-block px-2.5 py-0.5 text-sm rounded-full border border-white/10 text-gray-400 font-manrope ${className}`}>
    {children}
  </span>
);

// Section label
const Label = ({ children }: { children: React.ReactNode }) => (
  <p className="text-xs uppercase tracking-widest text-gray-500 font-manrope mb-3 mt-0">{children}</p>
);

// Thin horizontal rule
const Rule = () => <div className="border-t border-white/5 my-10" />;


interface CallStructureAnalysis {
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

interface AnalysisData {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  analysis: {
    callResults: {
      callId: string;
      status: string;
      duration: number;
      detailedReport?: string;
      followUpEmail?: string;
      proposalTemplate?: string;
      callStructureAnalysis?: CallStructureAnalysis;
      participants: Array<{
        name: string;
        role: string;
        speakingTime: number;
        speakingPercentage: number;
      }>;
      transcript: string;
      analysis: {
        overallScore: number;
        sentiment: string;
        keyInsights: string[];
        actionItems: string[];
        speakerBreakdown: Array<{
          speaker: string;
          speakingTime: number;
          percentage: number;
          keyPoints: string[];
          toneAnalysis?: string;
          engagement?: number;
        }>;
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
        salesMetrics?: {
          painPointsIdentified?: string[];
          budgetDiscussed?: boolean;
          timelineEstablished?: boolean;
          decisionMakerIdentified?: boolean;
          nextStepsDefined?: boolean;
          objectionsRaised?: string[];
          buyingSignals?: string[];
          competitorsMentioned?: string[];
        };
      };
      executiveSummary: string;
      coachingFeedback: {
        strengths: string[];
        improvements: string[];
        specificSuggestions: string[];
      };
      benchmarks?: {
        industryAverages: Record<string, number>;
        yourPerformance: Record<string, number>;
        improvementAreas: string[];
      };
    };
    summaryPresentation?: Array<{
      title: string;
      content: string;
      visualType: string;
    }>;
    nextStepsStrategy?: {
      immediateActions: string[];
      shortTermGoals: string[];
      longTermStrategy?: string[];
      riskMitigation?: string[];
    };
    performanceMetrics: {
      talkTimePercentage?: number;
      talkTime?: number;
      questionToStatementRatio: number;
      averageResponseTime?: number;
      responseTime?: number;
      engagementScore: number;
      clarityScore: number;
      enthusiasmLevel: number;
      professionalismScore: number;
    };
    tokensUsed: number;
    processingTime: number;
    dealArchitecture?: {
      prospectDiagnosis: {
        businessProfile: {
          industry: string;
          businessType: string;
          estimatedTeamSize: string;
          estimatedRevenue: string;
          currentTechStack: string[];
          location?: string;
        };
        bleedingNeckProblems: Array<{
          problem: string;
          severity: 'critical' | 'high' | 'medium' | 'low';
          frequency: string;
          estimatedCost: string;
          quotedEvidence?: string;
        }>;
        financialQualification: {
          isQualified: 'yes' | 'no' | 'maybe';
          qualificationReason: string;
          estimatedBudget?: string;
          urgencyLevel: 'immediate' | 'this_quarter' | 'this_year' | 'exploring';
          decisionMakerPresent: boolean;
          buyingSignals: string[];
          redFlags: string[];
        };
        buyingCommittee?: {
          decisionMaker?: string;
          influencers?: string[];
          endUsers?: string[];
          blockers?: string[];
        };
      };
      solutionStack: {
        phase1QuickWin: {
          phaseName: string;
          timeline: string;
          tools: Array<{
            toolName: string;
            toolType: string;
            description: string;
            whyItHelps: string;
            setupComplexity: 'low' | 'medium' | 'high';
            estimatedSetupHours: number;
          }>;
          expectedOutcome: string;
          proofOfConcept: string;
        };
        phase2CoreSystem: {
          phaseName: string;
          timeline: string;
          tools: Array<{
            toolName: string;
            toolType: string;
            description: string;
            whyItHelps: string;
            setupComplexity: 'low' | 'medium' | 'high';
            estimatedSetupHours: number;
            monthlyMaintenanceHours?: number;
          }>;
          expectedOutcome: string;
          retainerJustification: string;
        };
        phase3AIWowFactor: {
          phaseName: string;
          timeline: string;
          tools: Array<{
            toolName: string;
            toolType: string;
            description: string;
            whyItHelps: string;
            setupComplexity: 'low' | 'medium' | 'high';
            estimatedSetupHours: number;
            replacesRole?: string;
            monthlyMaintenanceHours?: number;
          }>;
          expectedOutcome: string;
          roiProjection: string;
        };
        integrationMap: {
          requiredIntegrations: string[];
          niceToHaveIntegrations: string[];
          potentialBlockers: string[];
        };
      };
      pricingStrategy: {
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
        pitchAngle: {
          headline: string;
          valueFraming: string;
          comparisonPoint: string;
          urgencyHook: string;
        };
        contractTerms: {
          recommendedTerm: '3_months' | '6_months' | '12_months';
          discountForLongerTerm?: string;
          paymentStructure: string;
          guaranteeOffered?: string;
        };
        upsellOpportunities: Array<{
          service: string;
          timing: string;
          additionalRevenue: number;
        }>;
        totalDealValue: {
          firstYearValue: number;
          lifetimeValueEstimate: number;
          profitMarginEstimate: string;
        };
      };
      salesPerformance: {
        greenFlags: Array<{
          observation: string;
          example?: string;
          impact: string;
        }>;
        redFlags: Array<{
          observation: string;
          example?: string;
          howToFix: string;
          priority: 'high' | 'medium' | 'low';
        }>;
        missedOpportunities: Array<{
          topic: string;
          questionToAsk: string;
          whyItMatters: string;
        }>;
        callScoreCard: {
          rapportBuilding: number;
          discoveryDepth: number;
          painIdentification: number;
          valuePresentation: number;
          objectionHandling: number;
          closingStrength: number;
          overallScore: number;
        };
        nextCallPreparation: string[];
      };
      dealGrade: {
        grade: 'A' | 'B' | 'C' | 'D' | 'F';
        gradeReason: string;
        winProbability: number;
        recommendedNextStep: string;
        dealRisks: string[];
        dealStrengths: string[];
      };
      executiveBrief: {
        oneLineSummary: string;
        topPriority: string;
        immediateAction: string;
        dealValue: string;
      };
    };
  };
  metadata: {
    callType: string;
    duration: number;
    sentiment: string;
    actualDate: string;
    tokensUsed: number;
    companyName?: string;
    generatedAt: string;
    overallScore: number;
    prospectName?: string;
    prospectTitle?: string;
    prospectEmail?: string;
    questionCount: number;
    analysisStatus: string;
    processingTime: number;
    companyIndustry?: string;
    companyLocation?: string;
    engagementScore: number;
    participantCount: number;
    transcriptLength: number;
  };
  workspace?: {
    id: string;
    user_id: string;
    name: string;
    slug: string;
    description?: string;
    color: string;
    created_at: string;
    updated_at: string;
  };
}


export default function AnalysisDetailPage() {
  const { id } = useParams();
  const go = useGo();
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('deal-architecture');
  const [shareModalVisible, setShareModalVisible] = useState(false);
const [shareUrl, setShareUrl] = useState('');
const [sharing, setSharing] = useState(false);
const [copySuccess, setCopySuccess] = useState(false);
const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);

  const { getAnalysis, exportAnalysis, shareAnalysis } = useSalesCallAnalyzer();

  useEffect(() => {
    loadAnalysis();
  }, [id]);

  const loadAnalysis = async () => {
    try {
      setLoading(true);
      const data = await getAnalysis(id as string);
      setAnalysis(data);
    } catch (error) {
      console.error('Failed to load analysis:', error);
      message.error('Failed to load analysis details');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'summary' | 'detailed' | 'presentation' | 'follow-up' = 'summary') => {
    try {
      await exportAnalysis(id as string, format);
      message.success('Analysis exported successfully');
    } catch (error) {
      message.error('Failed to export analysis');
    }
  };

  const getDuration = (): number => analysis?.analysis?.callResults?.duration || analysis?.metadata?.duration || 0;
  const getOverallScore = (): number => analysis?.analysis?.callResults?.analysis?.overallScore || analysis?.metadata?.overallScore || 0;
  const getSentiment = (): string => analysis?.analysis?.callResults?.analysis?.sentiment || analysis?.metadata?.sentiment || 'neutral';

  const getTalkRatio = () => {
    const participants = analysis?.analysis?.callResults?.participants || [];
    if (participants.length > 0) {
      // Find agent/host by role — no hardcoded names
      const agent = participants.find((p: any) =>
        p.role?.toLowerCase().includes('agent') || p.role?.toLowerCase().includes('host')
      ) || participants[0]; // First speaker is typically the host
      const prospect = participants.find((p: any) =>
        p.role?.toLowerCase().includes('customer') || p.role?.toLowerCase().includes('prospect')
      ) || participants[1]; // Second speaker is typically the prospect
      if (agent && prospect) {
        return { agent: agent.speakingPercentage || 0, prospect: prospect.speakingPercentage || 0, silence: Math.max(0, 100 - (agent.speakingPercentage || 0) - (prospect.speakingPercentage || 0)) };
      }
    }
    // Fallback to speaker breakdown — match by role/position, not hardcoded names
    const breakdown = analysis?.analysis?.callResults?.analysis?.speakerBreakdown || [];
    const a = breakdown[0]; // First speaker
    const p = breakdown[1]; // Second speaker
    return { agent: a?.percentage || 0, prospect: p?.percentage || 0, silence: Math.max(0, 100 - (a?.percentage || 0) - (p?.percentage || 0)) };
  };

  const getBuyingSignals = (): string[] => {
    return analysis?.analysis?.callResults?.analysis?.salesMetrics?.buyingSignals ||
           analysis?.analysis?.callResults?.analysis?.discoveryMetrics?.evaluationCriteria || [];
  };

  const getNextSteps = (): string[] => {
    const items = analysis?.analysis?.callResults?.analysis?.actionItems || [];
    const immediate = analysis?.analysis?.nextStepsStrategy?.immediateActions || [];
    return items.length > 0 ? items : immediate.length > 0 ? immediate : ['Review call recording', 'Follow up with prospect', 'Prepare next meeting agenda'];
  };

  const getExecutiveSummary = (): string => analysis?.analysis?.callResults?.executiveSummary || 'No summary available.';
  const getStrengths = (): string[] => analysis?.analysis?.callResults?.coachingFeedback?.strengths || [];
  const getImprovements = (): string[] => [
    ...(analysis?.analysis?.callResults?.coachingFeedback?.improvements || []),
    ...(analysis?.analysis?.callResults?.coachingFeedback?.specificSuggestions || [])
  ];

  const getPerformanceMetrics = () => {
    const m = analysis?.analysis?.performanceMetrics;
    return { talkTime: m?.talkTimePercentage || m?.talkTime || 0, engagement: m?.engagementScore || 0, clarity: m?.clarityScore || 0, professionalism: m?.professionalismScore || 0 };
  };

  if (loading) {
    return <div className="max-w-4xl mx-auto px-8 py-14 font-manrope"><Skeleton active paragraph={{ rows: 10 }} /></div>;
  }

  if (!analysis) {
    return (
      <div className="max-w-4xl mx-auto px-8 py-14 text-center font-manrope">
        <p className="text-xl text-gray-300 mb-2">Analysis not found</p>
        <p className="text-base text-gray-500 mb-6">The requested analysis could not be loaded.</p>
        <button onClick={() => go({ to: "/sales-call-analyzer" })} className="text-base text-gray-400 hover:text-white transition-colors">
          <ArrowLeftOutlined className="mr-1" /> Back
        </button>
      </div>
    );
  }

  const duration = getDuration();
  const overallScore = getOverallScore();
  const sentiment = getSentiment();
  const talkRatio = getTalkRatio();
  const buyingSignals = getBuyingSignals();
  const nextSteps = getNextSteps();
  const executiveSummary = getExecutiveSummary();
  const strengths = getStrengths();
  const improvements = getImprovements();
  const perfMetrics = getPerformanceMetrics();
  const deal = analysis?.analysis?.dealArchitecture;
  const callStructure = analysis?.analysis?.callResults?.callStructureAnalysis;


const handleShare = async () => {
  try {
    setSharing(true);
  
    
    const result = await shareAnalysis(id as string);
    
    if (!result || !result.shareUrl) {
      throw new Error('Invalid response from server');
    }
    
    setShareUrl(result.shareUrl);
    setShareModalVisible(true);
    
  } catch (error: any) {
    console.error('Share failed:', error);
    message.error(error?.message || 'Failed to create share link');
  } finally {
    setSharing(false);
  }
};

const copyToClipboard = async () => {
  await navigator.clipboard.writeText(shareUrl);
  setCopySuccess(true);
  setTimeout(() => setCopySuccess(false), 2000);
};

const shareToPlatform = (platform: string) => {
  setSelectedPlatform(platform);
  
  const text = encodeURIComponent(`Check out this sales call analysis: ${analysis?.title}`);
  const url = encodeURIComponent(shareUrl);
  
  let shareLink = '';
  
  switch(platform) {
    case 'linkedin':
      shareLink = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
      break;
    case 'twitter':
      shareLink = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
      break;
    case 'facebook':
      shareLink = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
      break;
    case 'email':
      shareLink = `mailto:?subject=${encodeURIComponent('Sales Call Analysis')}&body=${text}%0A${url}`;
      break;
    case 'medium':
      shareLink = `https://medium.com/new-story?source=${url}`;
      break;
    case 'reddit':
      shareLink = `https://www.reddit.com/submit?url=${url}&title=${text}`;
      break;
    case 'whatsapp':
      shareLink = `https://wa.me/?text=${text}%20${url}`;
      break;
    case 'telegram':
      shareLink = `https://t.me/share/url?url=${url}&text=${text}`;
      break;
    case 'slack':
      // This would need Slack app integration, but we can copy to clipboard
      copyToClipboard();
      message.info('Link copied! Paste in Slack');
      setTimeout(() => setSelectedPlatform(null), 500);
      return;
    default:
      return;
  }
  
  // Open share window
  window.open(shareLink, '_blank', 'width=600,height=400');
  
  // Reset selected platform after a moment
  setTimeout(() => setSelectedPlatform(null), 500);
};

  return (
    <div className="max-w-4xl mx-auto px-8 py-14" style={{ fontFamily: "'Manrope', sans-serif" }}>

      {/* Back */}
      <button onClick={() => go({ to: "/sales-call-analyzer" })}     className={`
              group flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300
              bg-white/5 border border-white/10 hover:border-white/20 text-gray-400 hover:text-white
            `}
          >
        <ArrowLeftOutlined className="text-xs" /> Back
      </button>

      {/* Title */}
      <h1 className="text-3xl font-semibold text-gray-100 mb-2 leading-tight">{analysis.title}</h1>
      <p className="text-base text-gray-500 mb-8">
        {sentiment} &middot; {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')} &middot; {new Date(analysis.createdAt).toLocaleDateString()}
      </p>

      {/* Score strip */}
      <div className="flex items-center gap-8 mb-4">
        <div>
          <p className="text-5xl font-light text-gray-100">{overallScore}</p>
          <p className="text-xs uppercase tracking-widest text-gray-500 mt-1">Score</p>
        </div>
        <div className="flex-1 grid grid-cols-4 gap-4 text-center">
          <div><p className="text-xl font-light text-gray-200">{Math.round(talkRatio.agent)}%</p><p className="text-xs text-gray-500">You</p></div>
          <div><p className="text-xl font-light text-gray-200">{Math.round(talkRatio.prospect)}%</p><p className="text-xs text-gray-500">Prospect</p></div>
          {/* <div><p className="text-xl font-light text-gray-200">{Math.round(talkRatio.silence)}%</p><p className="text-xs text-gray-500">Silence</p></div> */}
          <div><p className="text-xl font-light text-gray-200">{buyingSignals.length}</p><p className="text-xs text-gray-500">Signals</p></div>
        </div>
      </div>

      {strengths.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {strengths.slice(0, 3).map((s, i) => <Pill key={i}>{s}</Pill>)}
        </div>
      )}

      <div className="flex gap-2 mb-10">
        <button onClick={() => handleExport()} className="text-sm text-gray-500 border border-white/10 rounded px-3 py-1.5 hover:text-gray-300 hover:border-white/20 transition-colors">Export</button>
    <button 
  onClick={handleShare}
  disabled={sharing}
  className={`
    text-sm border rounded px-3 py-1.5 transition-all duration-200
    flex items-center gap-2
    ${sharing 
      ? 'bg-white/5 border-white/10 text-gray-400 cursor-not-allowed opacity-50' 
      : 'text-gray-500 border-white/10 hover:text-gray-300 hover:border-white/20'
    }
  `}
>
  {sharing ? (
    <>
      <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
      <span>getting it ready...</span>
    </>
  ) : (
    <>
      <ShareAltOutlined className="text-sm" />
      <span>Share</span>
    </>
  )}
</button>
      </div>

      <Rule />

      {/* Tabs */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        className="minimal-tabs mb-6"
        tabBarStyle={{ borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: 32 }}
      >

        {/* ─── DEAL ARCHITECTURE ─── */}
        <TabPane tab={<span className="font-manrope text-sm tracking-wide">Deal Architecture</span>} key="deal-architecture">
          {deal ? (
            <div className="space-y-12">
              {/* Grade + Brief */}
              <div className="text-center">
                <p className="text-7xl font-extralight text-gray-100">{deal.dealGrade.grade}</p>
                <p className="text-xs uppercase tracking-widest text-gray-500 mt-1 mb-4">Deal Grade &middot; {deal.dealGrade.winProbability}% win probability</p>
                <p className="text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">{deal.executiveBrief.oneLineSummary}</p>
              </div>

              <div className="space-y-4">
                <div className="border-b border-white/5 pb-3"><Label>Deal Value</Label><p className="text-xl text-gray-200">{deal.executiveBrief.dealValue}</p></div>
                <div className="border-b border-white/5 pb-3"><Label>Top Priority</Label><p className="text-base text-gray-300 leading-relaxed">{deal.executiveBrief.topPriority}</p></div>
                <div className="border-b border-white/5 pb-3"><Label>Immediate Action</Label><p className="text-base text-gray-300 leading-relaxed">{deal.executiveBrief.immediateAction}</p></div>
              </div>

              <Rule />

              {/* Prospect */}
              {deal.prospectDiagnosis && (
                <div>
                  <h3 className="text-base font-medium text-gray-200 mb-6">Prospect Diagnosis</h3>

                  <Label>Business Profile</Label>
                  <div className="space-y-1.5 text-base text-gray-400 mb-8 leading-relaxed">
                    <p><span className="text-gray-500">Industry:</span> {deal.prospectDiagnosis.businessProfile?.industry || 'N/A'}</p>
                    <p><span className="text-gray-500">Type:</span> {(deal.prospectDiagnosis.businessProfile?.businessType || '').replace(/_/g, ' ') || 'N/A'}</p>
                    <p><span className="text-gray-500">Team Size:</span> {deal.prospectDiagnosis.businessProfile?.estimatedTeamSize || 'N/A'}</p>
                    <p><span className="text-gray-500">Revenue:</span> {deal.prospectDiagnosis.businessProfile?.estimatedRevenue || 'N/A'}</p>
                    {deal.prospectDiagnosis.businessProfile?.location && <p><span className="text-gray-500">Location:</span> {deal.prospectDiagnosis.businessProfile.location}</p>}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {(deal.prospectDiagnosis.businessProfile?.currentTechStack || []).map((t, i) => <Pill key={i}>{t}</Pill>)}
                    </div>
                  </div>

                  {deal.prospectDiagnosis.financialQualification && (
                    <>
                      <Label>Financial Qualification</Label>
                      <p className="text-base mb-2">
                        <Pill>{deal.prospectDiagnosis.financialQualification.isQualified === 'yes' ? 'Qualified' : deal.prospectDiagnosis.financialQualification.isQualified === 'maybe' ? 'Needs Validation' : 'Not Qualified'}</Pill>
                      </p>
                      <div className="space-y-1.5 text-base text-gray-400 mb-8 leading-relaxed">
                        <p>{deal.prospectDiagnosis.financialQualification.qualificationReason || 'N/A'}</p>
                        {deal.prospectDiagnosis.financialQualification.estimatedBudget && <p><span className="text-gray-500">Budget:</span> {deal.prospectDiagnosis.financialQualification.estimatedBudget}</p>}
                        <p><span className="text-gray-500">Urgency:</span> {(deal.prospectDiagnosis.financialQualification.urgencyLevel || '').replace(/_/g, ' ')}</p>
                        <p><span className="text-gray-500">Decision Maker Present:</span> {deal.prospectDiagnosis.financialQualification.decisionMakerPresent ? 'Yes' : 'No'}</p>
                      </div>
                    </>
                  )}

                  <Label>Pain Points</Label>
                  <div className="space-y-5 mb-8">
                    {(deal.prospectDiagnosis.bleedingNeckProblems || []).map((prob, i) => (
                      <div key={i}>
                        <p className="text-base text-gray-200 mb-1">{i + 1}. {prob.problem} <span className="text-gray-500 text-sm ml-1">{(prob.severity || '').toLowerCase()}</span></p>
                        <p className="text-sm text-gray-500">{prob.frequency || ''} {prob.estimatedCost ? `/ ${prob.estimatedCost}` : ''}</p>
                        {prob.quotedEvidence && <p className="text-sm text-gray-500 italic mt-1 pl-3 border-l border-white/10">{prob.quotedEvidence}</p>}
                      </div>
                    ))}
                  </div>

                  {(deal.prospectDiagnosis.financialQualification?.buyingSignals || []).length > 0 && (
                    <>
                      <Label>Buying Signals</Label>
                      <ul className="text-base text-gray-400 space-y-1.5 mb-6 leading-relaxed">
                        {deal.prospectDiagnosis.financialQualification.buyingSignals.map((s, i) => <li key={i}>- {s}</li>)}
                      </ul>
                    </>
                  )}

                  {(deal.prospectDiagnosis.financialQualification?.redFlags || []).length > 0 && (
                    <>
                      <Label>Red Flags</Label>
                      <ul className="text-base text-gray-400 space-y-1.5 mb-6 leading-relaxed">
                        {deal.prospectDiagnosis.financialQualification.redFlags.map((f, i) => <li key={i}>- {f}</li>)}
                      </ul>
                    </>
                  )}
                </div>
              )}

              <Rule />

              {/* Solution Stack */}
              {deal.solutionStack && (
                <div>
                  <h3 className="text-base font-medium text-gray-200 mb-8">Solution Stack</h3>

                  {[
                    { phase: deal.solutionStack.phase1QuickWin, label: 'Phase 1 - Quick Win', extra: (p: any) => p.proofOfConcept ? <p className="text-sm text-gray-500 mt-1">Proof of concept: {p.proofOfConcept}</p> : null },
                    { phase: deal.solutionStack.phase2CoreSystem, label: 'Phase 2 - Core System', extra: (p: any) => p.retainerJustification ? <p className="text-sm text-gray-500 mt-1">Retainer justification: {p.retainerJustification}</p> : null },
                    { phase: deal.solutionStack.phase3AIWowFactor, label: 'Phase 3 - AI Wow Factor', extra: (p: any) => p.roiProjection ? <p className="text-sm text-gray-500 mt-1">ROI projection: {p.roiProjection}</p> : null },
                  ].map(({ phase, label, extra }) => phase && (
                    <div key={label} className="mb-10">
                      <div className="flex items-baseline gap-2 mb-3">
                        <p className="text-sm font-medium text-gray-300">{label}</p>
                        <span className="text-xs text-gray-500">{phase.timeline || ''}</span>
                      </div>
                      <p className="text-base text-gray-400 mb-3">{phase.phaseName}</p>
                      {(phase.tools || []).map((tool: any, j: number) => (
                        <div key={j} className="mb-3 pl-4 border-l border-white/5">
                          <p className="text-base text-gray-300">{tool.toolName} <span className="text-gray-500 text-sm">{(tool.toolType || '').replace(/_/g, ' ')}</span></p>
                          <p className="text-sm text-gray-500 leading-relaxed">{tool.description}</p>
                          <p className="text-xs text-gray-600">{tool.estimatedSetupHours || 0}h setup, {tool.setupComplexity || 'n/a'} complexity{tool.monthlyMaintenanceHours ? `, ${tool.monthlyMaintenanceHours}h/mo` : ''}{tool.replacesRole ? ` — replaces ${tool.replacesRole}` : ''}</p>
                        </div>
                      ))}
                      <p className="text-base text-gray-400 leading-relaxed">Expected outcome: {phase.expectedOutcome || 'N/A'}</p>
                      {extra(phase)}
                    </div>
                  ))}

                  {deal.solutionStack.integrationMap && (
                    <div className="mt-6">
                      <Label>Integrations</Label>
                      <div className="space-y-2 text-base text-gray-400">
                        {(deal.solutionStack.integrationMap.requiredIntegrations || []).length > 0 && <p>Required: {deal.solutionStack.integrationMap.requiredIntegrations.join(', ')}</p>}
                        {(deal.solutionStack.integrationMap.niceToHaveIntegrations || []).length > 0 && <p>Nice to have: {deal.solutionStack.integrationMap.niceToHaveIntegrations.join(', ')}</p>}
                        {(deal.solutionStack.integrationMap.potentialBlockers || []).length > 0 && <p>Potential blockers: {deal.solutionStack.integrationMap.potentialBlockers.join(', ')}</p>}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <Rule />

              {/* Pricing */}
              {deal.pricingStrategy && (
                <div>
                  <h3 className="text-base font-medium text-gray-200 mb-8">Pricing Strategy</h3>

                  <div className="space-y-6 mb-8">
                    <div className="border-b border-white/5 pb-4">
                      <Label>Setup Fee</Label>
                      <p className="text-3xl font-light text-gray-200">${(deal.pricingStrategy.setupFee?.recommended || 0).toLocaleString()}</p>
                      <p className="text-sm text-gray-500">Range: ${(deal.pricingStrategy.setupFee?.minimum || 0).toLocaleString()} - ${(deal.pricingStrategy.setupFee?.maximum || 0).toLocaleString()}</p>
                      {(deal.pricingStrategy.setupFee?.breakdown || []).map((b, i) => <p key={i} className="text-sm text-gray-500 mt-0.5">{b.item}: ${(b.cost || 0).toLocaleString()}</p>)}
                    </div>
                    <div className="border-b border-white/5 pb-4">
                      <Label>Monthly Retainer</Label>
                      <p className="text-3xl font-light text-gray-200">${(deal.pricingStrategy.monthlyRetainer?.recommended || 0).toLocaleString()}<span className="text-base text-gray-500">/mo</span></p>
                      <p className="text-sm text-gray-500">Range: ${(deal.pricingStrategy.monthlyRetainer?.minimum || 0).toLocaleString()} - ${(deal.pricingStrategy.monthlyRetainer?.maximum || 0).toLocaleString()}</p>
                      {deal.pricingStrategy.monthlyRetainer?.includedHours && <p className="text-sm text-gray-500">{deal.pricingStrategy.monthlyRetainer.includedHours} hrs included{deal.pricingStrategy.monthlyRetainer.overhourlyRate ? ` / $${deal.pricingStrategy.monthlyRetainer.overhourlyRate}/hr overage` : ''}</p>}
                      {(deal.pricingStrategy.monthlyRetainer?.breakdown || []).map((b, i) => <p key={i} className="text-sm text-gray-500 mt-0.5">{b.item}: ${(b.monthlyCost || 0).toLocaleString()}/mo</p>)}
                    </div>
                    <div>
                      <Label>Total Deal Value (Year 1)</Label>
                      <p className="text-3xl font-light text-gray-200">${(deal.pricingStrategy.totalDealValue?.firstYearValue || 0).toLocaleString()}</p>
                      <p className="text-sm text-gray-500">Lifetime: ${(deal.pricingStrategy.totalDealValue?.lifetimeValueEstimate || 0).toLocaleString()} &middot; Margin: {deal.pricingStrategy.totalDealValue?.profitMarginEstimate || 'N/A'}</p>
                    </div>
                  </div>

                  {deal.pricingStrategy.pitchAngle && (
                    <div className="mb-8">
                      <Label>Pitch Angle</Label>
                      <p className="text-base text-gray-200 mb-1">{deal.pricingStrategy.pitchAngle.headline}</p>
                      <p className="text-base text-gray-400 leading-relaxed mb-1">{deal.pricingStrategy.pitchAngle.valueFraming}</p>
                      <p className="text-sm text-gray-500">Comparison: {deal.pricingStrategy.pitchAngle.comparisonPoint}</p>
                      <p className="text-sm text-gray-500">Urgency: {deal.pricingStrategy.pitchAngle.urgencyHook}</p>
                    </div>
                  )}

                  {deal.pricingStrategy.contractTerms && (
                    <div className="mb-8">
                      <Label>Contract Terms</Label>
                      <div className="text-base text-gray-400 space-y-1 leading-relaxed">
                        <p>Recommended term: {(deal.pricingStrategy.contractTerms.recommendedTerm || '').replace(/_/g, ' ')}</p>
                        {deal.pricingStrategy.contractTerms.discountForLongerTerm && <p>Discount: {deal.pricingStrategy.contractTerms.discountForLongerTerm}</p>}
                        <p>Payment: {deal.pricingStrategy.contractTerms.paymentStructure || 'N/A'}</p>
                        {deal.pricingStrategy.contractTerms.guaranteeOffered && <p>Guarantee: {deal.pricingStrategy.contractTerms.guaranteeOffered}</p>}
                      </div>
                    </div>
                  )}

                  {(deal.pricingStrategy.upsellOpportunities || []).length > 0 && (
                    <div>
                      <Label>Upsell Opportunities</Label>
                      {deal.pricingStrategy.upsellOpportunities.map((u, i) => (
                        <p key={i} className="text-base text-gray-400 mb-1">{u.service} <span className="text-gray-500 text-sm">{u.timing} / +${(u.additionalRevenue || 0).toLocaleString()}</span></p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <Rule />

              {/* Sales Performance */}
              {deal.salesPerformance && (
                <div>
                  <h3 className="text-base font-medium text-gray-200 mb-8">Sales Performance</h3>

                  <div className="text-center mb-8">
                    <p className="text-5xl font-extralight text-gray-100">{deal.salesPerformance.callScoreCard?.overallScore || 0}</p>
                    <p className="text-xs uppercase tracking-widest text-gray-500 mt-1">Overall Score</p>
                  </div>

                  <div className="space-y-2 mb-8">
                    {[
                      { key: 'rapportBuilding', label: 'Rapport Building' },
                      { key: 'discoveryDepth', label: 'Discovery Depth' },
                      { key: 'painIdentification', label: 'Pain Identification' },
                      { key: 'valuePresentation', label: 'Value Presentation' },
                      { key: 'objectionHandling', label: 'Objection Handling' },
                      { key: 'closingStrength', label: 'Closing Strength' },
                    ].map(({ key, label }) => {
                      const val = (deal.salesPerformance?.callScoreCard as any)?.[key] || 0;
                      return (
                        <div key={key} className="flex justify-between items-center">
                          <span className="text-sm text-gray-400">{label}</span>
                          <span className="text-sm text-gray-300 w-8 text-right">{val}/10</span>
                        </div>
                      );
                    })}
                  </div>

                  {(deal.salesPerformance.greenFlags || []).length > 0 && (
                    <div className="mb-8">
                      <Label>Strengths Observed</Label>
                      {deal.salesPerformance.greenFlags.map((f, i) => (
                        <div key={i} className="mb-3">
                          <p className="text-base text-gray-300">{f.observation}</p>
                          {f.example && <p className="text-sm text-gray-500 italic">{f.example}</p>}
                          <p className="text-sm text-gray-500">{f.impact}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {(deal.salesPerformance.redFlags || []).length > 0 && (
                    <div className="mb-8">
                      <Label>Areas to Improve</Label>
                      {deal.salesPerformance.redFlags.map((f, i) => (
                        <div key={i} className="mb-3">
                          <p className="text-base text-gray-300">{f.observation} <span className="text-sm text-gray-500">{f.priority}</span></p>
                          {f.example && <p className="text-sm text-gray-500 italic">{f.example}</p>}
                          <p className="text-sm text-gray-500">Fix: {f.howToFix}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {(deal.salesPerformance.missedOpportunities || []).length > 0 && (
                    <div className="mb-8">
                      <Label>Missed Opportunities</Label>
                      {deal.salesPerformance.missedOpportunities.map((o, i) => (
                        <div key={i} className="mb-3">
                          <p className="text-base text-gray-300">{o.topic}</p>
                          <p className="text-sm text-gray-500 italic pl-3 border-l border-white/10">{o.questionToAsk}</p>
                          <p className="text-sm text-gray-500">{o.whyItMatters}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {(deal.salesPerformance.nextCallPreparation || []).length > 0 && (
                    <div>
                      <Label>Next Call Preparation</Label>
                      <ol className="text-base text-gray-400 space-y-1.5 leading-relaxed list-decimal list-inside">
                        {deal.salesPerformance.nextCallPreparation.map((item, i) => <li key={i}>{item}</li>)}
                      </ol>
                    </div>
                  )}
                </div>
              )}

              <Rule />

              {/* Deal Summary */}
              {deal.dealGrade && (
                <div>
                  {(deal.dealGrade.dealStrengths || []).length > 0 && (
                    <div className="mb-6">
                      <Label>Deal Strengths</Label>
                      <ul className="text-base text-gray-400 space-y-1.5 leading-relaxed">
                        {deal.dealGrade.dealStrengths.map((s, i) => <li key={i}>- {s}</li>)}
                      </ul>
                    </div>
                  )}
                  {(deal.dealGrade.dealRisks || []).length > 0 && (
                    <div className="mb-6">
                      <Label>Deal Risks</Label>
                      <ul className="text-base text-gray-400 space-y-1.5 leading-relaxed">
                        {deal.dealGrade.dealRisks.map((r, i) => <li key={i}>- {r}</li>)}
                      </ul>
                    </div>
                  )}
                  <div className="border border-white/5 rounded p-4">
                    <Label>Recommended Next Step</Label>
                    <p className="text-base text-gray-300 leading-relaxed">{deal.dealGrade.recommendedNextStep || 'N/A'}</p>
                    <p className="text-sm text-gray-500 mt-1">{deal.dealGrade.gradeReason || ''}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-base text-gray-500 py-8">Deal architecture analysis is not available for this call.</p>
          )}
        </TabPane>

        {/* ─── OVERVIEW ─── */}
        <TabPane tab={<span className="font-manrope text-sm tracking-wide">Overview</span>} key="overview">
          <div className="space-y-12">
            <div>
              <Label>Call Summary</Label>
              <p className="text-base text-gray-400 leading-relaxed">{executiveSummary}</p>
            </div>

            <div>
              <Label>Next Steps</Label>
              <ol className="text-base text-gray-400 space-y-2 leading-relaxed list-decimal list-inside">
                {nextSteps.map((step, i) => <li key={i}>{step}</li>)}
              </ol>
            </div>

            <div>
              <Label>Participants</Label>
              <div className="text-base text-gray-400 space-y-1 leading-relaxed">
                <p>{analysis?.metadata?.prospectName || 'Not specified'}{analysis?.metadata?.prospectTitle ? `, ${analysis.metadata.prospectTitle}` : ''}{analysis?.metadata?.prospectEmail ? ` — ${analysis.metadata.prospectEmail}` : ''}</p>
                <p>{analysis?.metadata?.companyName || 'Not specified'}{analysis?.metadata?.companyIndustry ? `, ${analysis.metadata.companyIndustry}` : ''}{analysis?.metadata?.companyLocation ? ` — ${analysis.metadata.companyLocation}` : ''}</p>
              </div>
            </div>

            <div>
              <Label>Key Moments</Label>
              <div className="space-y-4">
                {(() => {
                  const moments = analysis?.analysis?.callResults?.callStructureAnalysis?.keyMoments;
                  if (moments && moments.length > 0) {
                    return moments.map((m: any, i: number) => (
                      <div key={i} className="pl-3 border-l border-white/10">
                        <p className="text-sm text-gray-500 mb-0.5">{m.timestamp} &middot; {m.type}{m.emotionalTag ? ` &middot; ${m.emotionalTag}` : ''}</p>
                        <p className="text-base text-gray-400 leading-relaxed">{m.description}</p>
                        <p className="text-sm text-gray-500">{m.impact}</p>
                      </div>
                    ));
                  }
                  const insights = analysis?.analysis?.callResults?.analysis?.keyInsights || [];
                  return insights.map((insight: string, i: number) => (
                    <div key={i} className="pl-3 border-l border-white/10">
                      <p className="text-base text-gray-400 leading-relaxed">{insight}</p>
                    </div>
                  ));
                })()}
              </div>
            </div>

            {improvements.length > 0 && (
              <div>
                <Label>Improvement Suggestions</Label>
                <ol className="text-base text-gray-400 space-y-2 leading-relaxed list-decimal list-inside">
                  {improvements.map((s, i) => <li key={i}>{s}</li>)}
                </ol>
              </div>
            )}
          </div>
        </TabPane>

        {/* ─── TRANSCRIPT ─── */}
        <TabPane tab={<span className="font-manrope text-sm tracking-wide">Transcript</span>} key="transcript">
          <div className="whitespace-pre-wrap text-base text-gray-400 leading-relaxed">
            {analysis?.analysis?.callResults?.transcript || 'No transcript available.'}
          </div>
        </TabPane>

        {/* ─── CALL STRUCTURE ─── */}
        <TabPane tab={<span className="font-manrope text-sm tracking-wide">Call Structure</span>} key="call-structure">
          {callStructure ? (
            <div className="space-y-12">
              {/* Opening */}
              <div>
                <div className="flex justify-between items-baseline mb-4">
                  <h3 className="text-base font-medium text-gray-200">Opening (First 20%)</h3>
                  <Pill>{callStructure.callStructure.opening.assessment}</Pill>
                </div>
                <Label>Strengths</Label>
                <ul className="text-base text-gray-400 space-y-1.5 leading-relaxed mb-4">{(callStructure.callStructure.opening.strengths || []).map((s, i) => <li key={i}>- {s}</li>)}</ul>
                <Label>Areas to Improve</Label>
                <ul className="text-base text-gray-400 space-y-1.5 leading-relaxed mb-4">{(callStructure.callStructure.opening.weaknesses || []).map((s, i) => <li key={i}>- {s}</li>)}</ul>
                <Label>Recommendations</Label>
                <ul className="text-base text-gray-400 space-y-1.5 leading-relaxed">{(callStructure.callStructure.opening.recommendations || []).map((s, i) => <li key={i}>- {s}</li>)}</ul>
              </div>

              <Rule />

              {/* Middle */}
              <div>
                <div className="flex justify-between items-baseline mb-4">
                  <h3 className="text-base font-medium text-gray-200">Discovery / Middle (20-70%)</h3>
                  <Pill>{callStructure.callStructure.middle.assessment}</Pill>
                </div>
                <p className="text-base text-gray-400 mb-4">Discovery quality: {callStructure.callStructure.middle.discoveryQuality} &middot; {callStructure.callStructure.middle.questionCount || 0} questions asked</p>
                <div className="flex flex-wrap gap-1.5 mb-4">{(callStructure.callStructure.middle.topicsCovered || []).map((t, i) => <Pill key={i}>{t}</Pill>)}</div>
                <Label>Recommendations</Label>
                <ul className="text-base text-gray-400 space-y-1.5 leading-relaxed">{(callStructure.callStructure.middle.recommendations || []).map((s, i) => <li key={i}>- {s}</li>)}</ul>
              </div>

              <Rule />

              {/* Closing */}
              <div>
                <div className="flex justify-between items-baseline mb-4">
                  <h3 className="text-base font-medium text-gray-200">Closing (Last 30%)</h3>
                  <Pill>{callStructure.callStructure.closing.assessment}</Pill>
                </div>
                <p className="text-base text-gray-400 mb-4">
                  Next steps defined: {callStructure.callStructure.closing.nextStepsDefined ? 'Yes' : 'No'} &middot; Commitment: {callStructure.callStructure.closing.commitmentLevel || 'Unknown'}
                </p>
                <Label>Recommendations</Label>
                <ul className="text-base text-gray-400 space-y-1.5 leading-relaxed">{(callStructure.callStructure.closing.recommendations || []).map((s, i) => <li key={i}>- {s}</li>)}</ul>
              </div>

              <Rule />

              {/* Metrics */}
              <div>
                <Label>Call Quality Metrics</Label>
                <div className="space-y-1.5">
                  {Object.entries(callStructure.metrics || {}).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-base">
                      <span className="text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <span className="text-gray-300">{typeof value === 'boolean' ? (value ? 'Yes' : 'No') : `${value}/10`}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Key Moments */}
              {(callStructure.keyMoments || []).length > 0 && (
                <div>
                  <Label>Key Moments</Label>
                  <div className="space-y-4">
                    {callStructure.keyMoments.map((m: any, i: number) => (
                      <div key={i} className="pl-3 border-l border-white/10">
                        <p className="text-sm text-gray-500">{m.timestamp} &middot; {m.type}{m.emotionalTag ? ` &middot; ${m.emotionalTag}` : ''}</p>
                        <p className="text-base text-gray-400 leading-relaxed">{m.description}</p>
                        <p className="text-sm text-gray-500">Impact: {m.impact}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Missed Opportunities */}
              {(callStructure.missedOpportunities || []).length > 0 && (
                <div>
                  <Label>Missed Opportunities</Label>
                  {callStructure.missedOpportunities.map((o: any, i: number) => (
                    <div key={i} className="mb-4">
                      <p className="text-base text-gray-300">{o.area} <span className="text-sm text-gray-500">{o.priority}</span></p>
                      <p className="text-sm text-gray-400 leading-relaxed">{o.description}</p>
                      <p className="text-sm text-gray-500">How to fix: {o.howToFix}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Competitive Intel */}
              {(() => {
                const competitors = analysis?.analysis?.callResults?.analysis?.salesMetrics?.competitorsMentioned ||
                                    analysis?.analysis?.callResults?.analysis?.discoveryMetrics?.currentVendors || [];
                const objections = analysis?.analysis?.callResults?.analysis?.salesMetrics?.objectionsRaised || [];
                if (competitors.length === 0 && objections.length === 0) return null;
                return (
                  <>
                    <Rule />
                    <div>
                      <h3 className="text-base font-medium text-gray-200 mb-6">Competitive Intel</h3>
                      {competitors.length > 0 && (
                        <div className="mb-8">
                          <Label>Competitors / Current Vendors</Label>
                          <ul className="text-base text-gray-400 space-y-2 leading-relaxed">
                            {competitors.map((c: string, i: number) => <li key={i}>- {c}</li>)}
                          </ul>
                        </div>
                      )}
                      {objections.length > 0 && (
                        <div>
                          <Label>Objections Raised</Label>
                          <ul className="text-base text-gray-400 space-y-2 leading-relaxed">
                            {objections.map((o: string, i: number) => <li key={i}>- {o}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}

              {/* Buying Signals */}
              {(() => {
                const signals = analysis?.analysis?.callResults?.analysis?.salesMetrics?.buyingSignals ||
                                analysis?.analysis?.dealArchitecture?.prospectDiagnosis?.financialQualification?.buyingSignals || [];
                if (signals.length === 0) return null;
                return (
                  <>
                    <Rule />
                    <div>
                      <h3 className="text-base font-medium text-gray-200 mb-6">Buying Signals</h3>
                      <ul className="text-base text-gray-400 space-y-2 leading-relaxed">
                        {signals.map((s: string, i: number) => <li key={i}>- {s}</li>)}
                      </ul>
                    </div>
                  </>
                );
              })()}
            </div>
          ) : (
            <p className="text-base text-gray-500 py-8">Call structure analysis is not available for this call.</p>
          )}
        </TabPane>

        {/* ─── FOLLOW-UP EMAIL ─── */}
        <TabPane tab={<span className="font-manrope text-sm tracking-wide">Follow-up</span>} key="follow-up">
          {analysis?.analysis?.callResults?.followUpEmail ? (
            <div className="whitespace-pre-wrap text-base text-gray-400 leading-relaxed font-mono">
              {analysis.analysis.callResults.followUpEmail}
            </div>
          ) : (
            <p className="text-base text-gray-500 py-8">No follow-up email template available.</p>
          )}
        </TabPane>

        {/* ─── ANALYSIS ─── */}
        <TabPane tab={<span className="font-manrope text-sm tracking-wide">Analysis</span>} key="analysis">
          <div className="space-y-12">
            <div>
              <Label>Key Insights</Label>
              <ol className="text-base text-gray-400 space-y-2 leading-relaxed list-decimal list-inside">
                {(analysis?.analysis?.callResults?.analysis?.keyInsights || []).map((insight, i) => <li key={i}>{insight}</li>)}
              </ol>
              {(!analysis?.analysis?.callResults?.analysis?.keyInsights || analysis.analysis.callResults.analysis.keyInsights.length === 0) && <p className="text-base text-gray-500">No key insights available.</p>}
            </div>

            <div>
              <Label>Performance Metrics</Label>
              <div className="space-y-1.5">
                <div className="flex justify-between text-base"><span className="text-gray-400">Talk Time</span><span className="text-gray-300">{perfMetrics.talkTime}%</span></div>
                <div className="flex justify-between text-base"><span className="text-gray-400">Engagement</span><span className="text-gray-300">{perfMetrics.engagement}/10</span></div>
                <div className="flex justify-between text-base"><span className="text-gray-400">Clarity</span><span className="text-gray-300">{perfMetrics.clarity}/10</span></div>
                <div className="flex justify-between text-base"><span className="text-gray-400">Professionalism</span><span className="text-gray-300">{perfMetrics.professionalism}/10</span></div>
              </div>
            </div>

            <div>
              <Label>Discovery Metrics</Label>
              <div className="space-y-3 text-base text-gray-400">
                {analysis?.analysis?.callResults?.analysis?.discoveryMetrics?.challengesUncovered && (
                  <div><p className="text-sm text-gray-500 mb-1">Challenges Uncovered</p><div className="flex flex-wrap gap-1.5">{analysis.analysis.callResults.analysis.discoveryMetrics.challengesUncovered.map((c, i) => <Pill key={i}>{c}</Pill>)}</div></div>
                )}
                {analysis?.analysis?.callResults?.analysis?.discoveryMetrics?.technicalRequirements && (
                  <div><p className="text-sm text-gray-500 mb-1">Technical Requirements</p><div className="flex flex-wrap gap-1.5">{analysis.analysis.callResults.analysis.discoveryMetrics.technicalRequirements.map((r, i) => <Pill key={i}>{r}</Pill>)}</div></div>
                )}
                {analysis?.analysis?.callResults?.analysis?.discoveryMetrics?.stakeholdersIdentified && (
                  <div><p className="text-sm text-gray-500 mb-1">Stakeholders</p><div className="flex flex-wrap gap-1.5">{analysis.analysis.callResults.analysis.discoveryMetrics.stakeholdersIdentified.map((s, i) => <Pill key={i}>{s}</Pill>)}</div></div>
                )}
              </div>
            </div>

            {buyingSignals.length > 0 && (
              <div>
                <Label>Buying Signals</Label>
                <ul className="text-base text-gray-400 space-y-1.5 leading-relaxed">
                  {buyingSignals.map((s, i) => <li key={i}>- {s}</li>)}
                </ul>
              </div>
            )}

            {analysis?.analysis?.callResults?.analysis?.discoveryMetrics?.currentVendors?.length ? (
              <div>
                <Label>Current Vendors</Label>
                <ul className="text-base text-gray-400 space-y-1.5">
                  {analysis.analysis.callResults.analysis.discoveryMetrics.currentVendors.map((v, i) => <li key={i}>- {v}</li>)}
                </ul>
              </div>
            ) : null}
          </div>
        </TabPane>

      </Tabs>

      {/* Footer */}
      <Rule />
      <div className="flex justify-center gap-3 pb-12">
        <button onClick={() => go({ to: "/sales-call-analyzer" })} className="text-sm text-gray-500 border border-white/10 rounded px-4 py-2 hover:text-gray-300 hover:border-white/20 transition-colors">Back</button>
        <button onClick={() => handleExport('detailed')} className="text-sm text-gray-500 border border-white/10 rounded px-4 py-2 hover:text-gray-300 hover:border-white/20 transition-colors">Download Report</button>
      </div>
      {/* Professional Share Modal */}
{shareModalVisible && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    {/* Backdrop with blur */}
    <div 
      className="absolute inset-0 bg-black/80 backdrop-blur-md"
      onClick={() => setShareModalVisible(false)}
    />
    
    {/* Modal */}
    <div className="relative bg-[#0A0A0A] border border-white/5 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
      
      {/* Header with gradient */}
      <div className="relative px-6 py-5 border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-purple-500/5" />
        <div className="relative flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-100">Share Analysis</h3>
            <p className="text-sm text-gray-500 mt-0.5">Share this sales call analysis with your team or network</p>
          </div>
          <button
            onClick={() => setShareModalVisible(false)}
            className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-gray-200 hover:border-white/20 transition-all"
          >
            ✕
          </button>
        </div>
      </div>
      
      {/* Body */}
      <div className="p-6">
        
        {/* Preview Card */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
              <span className="text-lg">📊</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-200 mb-1 truncate">{analysis?.title}</p>
              <p className="text-xs text-gray-500">
                {analysis?.metadata?.companyName || 'Sales Call'} · Score: {overallScore} · {Math.floor(duration / 60)} min
              </p>
            </div>
          </div>
        </div>
        
        {/* Share Link Section */}
        <div className="mb-8">
          <p className="text-xs uppercase tracking-wider text-gray-500 mb-3 font-medium">Share Link</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="w-full bg-black/30 border border-white/10 rounded-lg pl-4 pr-24 py-3 text-sm text-gray-300 font-mono focus:outline-none focus:border-white/20 transition-colors"
              />
              <div className="absolute right-1 top-1 bottom-1 flex items-center">
                <button
                  onClick={copyToClipboard}
                  className={`
                    px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200
                    ${copySuccess 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                      : 'bg-white/10 text-gray-300 hover:bg-white/15 border border-white/10'
                    }
                  `}
                >
                  {copySuccess ? '✓ Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Social Platforms Grid */}
        <div>
          <p className="text-xs uppercase tracking-wider text-gray-500 mb-4 font-medium">Share on Social</p>
          <div className="grid grid-cols-4 gap-3">
            
            {/* LinkedIn */}
            <button
              onClick={() => shareToPlatform('linkedin')}
              disabled={!!selectedPlatform}
              className={`
                relative group flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200
                ${selectedPlatform === 'linkedin' 
                  ? 'bg-[#0077B5]/20 border-[#0077B5]/40' 
                  : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                }
              `}
            >
              {selectedPlatform === 'linkedin' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl">
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                </div>
              )}
              <svg className="w-6 h-6 text-[#0077B5]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              <span className="text-xs text-gray-400 group-hover:text-gray-300">LinkedIn</span>
            </button>
            
            {/* Twitter/X */}
            <button
              onClick={() => shareToPlatform('twitter')}
              disabled={!!selectedPlatform}
              className={`
                relative group flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200
                ${selectedPlatform === 'twitter' 
                  ? 'bg-black/30 border-white/30' 
                  : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                }
              `}
            >
              {selectedPlatform === 'twitter' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl">
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                </div>
              )}
              <svg className="w-6 h-6 text-gray-300" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              <span className="text-xs text-gray-400 group-hover:text-gray-300">X</span>
            </button>
            
            {/* Facebook */}
            <button
              onClick={() => shareToPlatform('facebook')}
              disabled={!!selectedPlatform}
              className={`
                relative group flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200
                ${selectedPlatform === 'facebook' 
                  ? 'bg-[#1877F2]/20 border-[#1877F2]/40' 
                  : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                }
              `}
            >
              {selectedPlatform === 'facebook' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl">
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                </div>
              )}
              <svg className="w-6 h-6 text-[#1877F2]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span className="text-xs text-gray-400 group-hover:text-gray-300">Facebook</span>
            </button>
            
            {/* Email */}
            <button
              onClick={() => shareToPlatform('email')}
              disabled={!!selectedPlatform}
              className={`
                relative group flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200
                ${selectedPlatform === 'email' 
                  ? 'bg-white/10 border-white/30' 
                  : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                }
              `}
            >
              {selectedPlatform === 'email' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl">
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                </div>
              )}
              <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
              </svg>
              <span className="text-xs text-gray-400 group-hover:text-gray-300">Email</span>
            </button>
            
            {/* Medium */}
            <button
              onClick={() => shareToPlatform('medium')}
              disabled={!!selectedPlatform}
              className={`
                relative group flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200
                ${selectedPlatform === 'medium' 
                  ? 'bg-black/30 border-white/30' 
                  : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                }
              `}
            >
              {selectedPlatform === 'medium' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl">
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                </div>
              )}
              <svg className="w-6 h-6 text-gray-300" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13.54 12a6.8 6.8 0 01-6.77 6.82A6.8 6.8 0 010 12a6.8 6.8 0 016.77-6.82A6.8 6.8 0 0113.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z"/>
              </svg>
              <span className="text-xs text-gray-400 group-hover:text-gray-300">Medium</span>
            </button>
            
            {/* Reddit */}
            <button
              onClick={() => shareToPlatform('reddit')}
              disabled={!!selectedPlatform}
              className={`
                relative group flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200
                ${selectedPlatform === 'reddit' 
                  ? 'bg-[#FF4500]/20 border-[#FF4500]/40' 
                  : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                }
              `}
            >
              {selectedPlatform === 'reddit' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl">
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                </div>
              )}
              <svg className="w-6 h-6 text-[#FF4500]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.24c.69 0 1.25.56 1.25 1.25a1.25 1.25 0 0 1-2.5 0c0-.69.56-1.25 1.25-1.25zM12 2.74c2.37 0 4.51 1.04 5.99 2.69-.53-.27-1.12-.41-1.73-.41-.27 0-.54.04-.8.1-1.13-.7-2.42-1.11-3.78-1.11-2.28 0-4.33 1.06-5.7 2.71-.25-.05-.51-.08-.77-.08-.63 0-1.23.15-1.77.44C3.3 6.03 2 8.13 2 10.51c0 4.11 3.97 7.45 8.86 7.45 4.9 0 8.86-3.34 8.86-7.45 0-1.49-.43-2.88-1.17-4.05.41-.5.65-1.13.65-1.82 0-1.56-1.27-2.82-2.83-2.82-.36 0-.7.07-1.01.19-.95-1.07-2.44-1.77-4.1-1.77zm-6.5 7.79c0-.81.66-1.47 1.47-1.47s1.47.66 1.47 1.47-.66 1.47-1.47 1.47-1.47-.66-1.47-1.47zm9.48 3.29c-.97 1.22-2.55 1.87-4.19 1.87-1.64 0-3.22-.65-4.19-1.87a.55.55 0 0 1 .1-.77.55.55 0 0 1 .77.1c.74.93 1.94 1.43 3.32 1.43 1.38 0 2.58-.5 3.32-1.43a.55.55 0 0 1 .77-.1.55.55 0 0 1 .1.77zm-.19-3.29c0-.81.66-1.47 1.47-1.47s1.47.66 1.47 1.47-.66 1.47-1.47 1.47-1.47-.66-1.47-1.47z"/>
              </svg>
              <span className="text-xs text-gray-400 group-hover:text-gray-300">Reddit</span>
            </button>
            
            {/* WhatsApp */}
            <button
              onClick={() => shareToPlatform('whatsapp')}
              disabled={!!selectedPlatform}
              className={`
                relative group flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200
                ${selectedPlatform === 'whatsapp' 
                  ? 'bg-[#25D366]/20 border-[#25D366]/40' 
                  : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                }
              `}
            >
              {selectedPlatform === 'whatsapp' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl">
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                </div>
              )}
              <svg className="w-6 h-6 text-[#25D366]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.064 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.125.555 4.12 1.52 5.85L.053 24l6.294-1.463C8.215 23.392 10.06 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.848 0-3.632-.496-5.177-1.426l-.37-.22-3.734.87.995-3.618-.24-.385A9.93 9.93 0 0 1 2 12c0-5.514 4.486-10 10-10s10 4.486 10 10-4.486 10-10 10z"/>
              </svg>
              <span className="text-xs text-gray-400 group-hover:text-gray-300">WhatsApp</span>
            </button>
            
            {/* Telegram */}
            <button
              onClick={() => shareToPlatform('telegram')}
              disabled={!!selectedPlatform}
              className={`
                relative group flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200
                ${selectedPlatform === 'telegram' 
                  ? 'bg-[#0088cc]/20 border-[#0088cc]/40' 
                  : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                }
              `}
            >
              {selectedPlatform === 'telegram' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl">
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                </div>
              )}
              <svg className="w-6 h-6 text-[#0088cc]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.244-1.349-.374-1.297-.79.028-.216.324-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
              <span className="text-xs text-gray-400 group-hover:text-gray-300">Telegram</span>
            </button>
            
            {/* Slack */}
            <button
              onClick={() => shareToPlatform('slack')}
              disabled={!!selectedPlatform}
              className={`
                relative group flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200
                ${selectedPlatform === 'slack' 
                  ? 'bg-[#4A154B]/20 border-[#4A154B]/40' 
                  : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                }
              `}
            >
              {selectedPlatform === 'slack' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl">
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                </div>
              )}
              <svg className="w-6 h-6 text-[#4A154B]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5.058 14.12c0 1.44-1.16 2.6-2.6 2.6-1.44 0-2.6-1.16-2.6-2.6 0-1.44 1.16-2.6 2.6-2.6h2.6v2.6zm1.3 0c0-1.44 1.16-2.6 2.6-2.6 1.44 0 2.6 1.16 2.6 2.6v6.5c0 1.44-1.16 2.6-2.6 2.6-1.44 0-2.6-1.16-2.6-2.6v-6.5zM8.958 5.058c-1.44 0-2.6-1.16-2.6-2.6 0-1.44 1.16-2.6 2.6-2.6 1.44 0 2.6 1.16 2.6 2.6v2.6h-2.6zm0 1.3c1.44 0 2.6 1.16 2.6 2.6 0 1.44-1.16 2.6-2.6 2.6h-6.5c-1.44 0-2.6-1.16-2.6-2.6 0-1.44 1.16-2.6 2.6-2.6h6.5zm9.484 2.6c0-1.44 1.16-2.6 2.6-2.6 1.44 0 2.6 1.16 2.6 2.6 0 1.44-1.16 2.6-2.6 2.6h-2.6v-2.6zm-1.3 0c0 1.44-1.16 2.6-2.6 2.6-1.44 0-2.6-1.16-2.6-2.6v-6.5c0-1.44 1.16-2.6 2.6-2.6 1.44 0 2.6 1.16 2.6 2.6v6.5zM15.042 18.942c1.44 0 2.6 1.16 2.6 2.6 0 1.44-1.16 2.6-2.6 2.6-1.44 0-2.6-1.16-2.6-2.6v-2.6h2.6zm0-1.3c-1.44 0-2.6-1.16-2.6-2.6 0-1.44 1.16-2.6 2.6-2.6h6.5c1.44 0 2.6 1.16 2.6 2.6 0 1.44-1.16 2.6-2.6 2.6h-6.5z"/>
              </svg>
              <span className="text-xs text-gray-400 group-hover:text-gray-300">Slack</span>
            </button>
          </div>
        </div>
        
        {/* Additional Options */}
        <div className="mt-6 pt-6 border-t border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* <button className="text-sm text-gray-500 hover:text-gray-400 transition-colors flex items-center gap-1">
                <span>🔗</span> Embed
              </button> */}
              {/* <button className="text-sm text-gray-500 hover:text-gray-400 transition-colors flex items-center gap-1">
                <span>📋</span> Export as PDF
              </button> */}
            </div>
            <div className="text-xs text-gray-600">
              Link expires in 30 days
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
)}
    </div>
  );
}