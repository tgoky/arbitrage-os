"use client";

import React, { useState, useEffect } from 'react';
import {
  ArrowLeftOutlined,
  DownloadOutlined,
  ShareAltOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ThunderboltOutlined,
  FileTextOutlined,
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
import { useSalesCallAnalyzer } from '../../../hooks/useSalesCallAnalyzer';

import { downloadAnalysisPDF } from '@/utils/downloadAnalysisPDF';

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

  const { getAnalysis,  shareAnalysis } = useSalesCallAnalyzer();
  const [shareLoading, setShareLoading] = useState(false);

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

  // const handleExport = async (format: 'summary' | 'detailed' | 'presentation' | 'follow-up' = 'summary') => {
  //   try {
  //     await exportAnalysis(id as string, format);
  //     message.success('Analysis exported successfully');
  //   } catch (error) {
  //     message.error('Failed to export analysis');
  //   }
  // };


  const handleDownloadView = async () => {
  if (!analysis) return;
  try {
    await downloadAnalysisPDF(analysis);
    message.success('PDF downloaded successfully');
  } catch (error) {
    message.error('Failed to generate PDF');
    console.error(error);
  }
};


  const handleShare = async () => {
    setShareLoading(true);
    try {
      const result = await shareAnalysis(id as string);
      // Try clipboard API first, fall back to legacy approach
      try {
        await navigator.clipboard.writeText(result.shareUrl);
        message.success('Share link copied to clipboard');
      } catch {
        // Clipboard API failed (non-HTTPS or denied) — show the link directly
        message.success({
          content: `Share link: ${result.shareUrl}`,
          duration: 8,
        });
      }
    } catch (error) {
      message.error('Failed to generate share link');
    } finally {
      setShareLoading(false);
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

  // ─── Proposal Generator helpers ───
  const buildProposalPrefill = () => {
    const deal = analysis?.analysis?.dealArchitecture;
    const meta = analysis?.metadata;
    const painPoints = deal?.prospectDiagnosis?.bleedingNeckProblems || [];
    const phases = deal?.solutionStack
      ? [deal.solutionStack.phase1QuickWin, deal.solutionStack.phase2CoreSystem, deal.solutionStack.phase3AIWowFactor]
      : [];

    return {
      clientDetails: {
        clientName: meta?.prospectName || '',
        clientTitle: meta?.prospectTitle || '',
        companyName: meta?.companyName || '',
        corePitchGoal: deal?.pricingStrategy?.pitchAngle?.headline || 'Custom AI Automation Solutions',
        presentationTone: 'Professional, ROI-focused',
      },
      currentState: {
        mainBottleneck: painPoints[0]?.problem || '',
        teamInefficiencies: painPoints.slice(1).map((p: any) => p.problem).join('. ') || '',
        opportunityCost: painPoints[0]?.estimatedCost || '',
      },
      futureState: {
        proposedTeamStructure: deal?.solutionStack?.phase2CoreSystem?.expectedOutcome || '',
        ownerExecutiveRole: deal?.executiveBrief?.topPriority || '',
      },
      solutions: phases.filter(Boolean).map((phase: any, i: number) => ({
        id: String(i + 1),
        solutionName: phase?.phaseName || `Phase ${i + 1}`,
        howItWorks: (phase?.tools || []).map((t: any) => t.toolName).join(' → ') || '',
        keyBenefits: phase?.expectedOutcome || '',
        setupFee: i === 0
          ? `$${deal?.pricingStrategy?.setupFee?.recommended?.toLocaleString() || 'TBD'}`
          : '',
        monthlyFee: i === 1
          ? `$${deal?.pricingStrategy?.monthlyRetainer?.recommended?.toLocaleString() || 'TBD'}/mo`
          : '',
      })),
      closeDetails: {
        bundleDiscountOffer: deal?.pricingStrategy?.contractTerms?.discountForLongerTerm || '',
        callToAction: 'Book Your Strategy Call',
        bookingLink: '',
      },
    };
  };

  const handleQuickGenerate = async () => {
    const prefill = buildProposalPrefill();
    try {
      const res = await fetch('/api/proposal-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefill),
      });
      const result = await res.json();
      if (result.success) {
        // Navigate to proposal generator with the output shown
        const encoded = encodeURIComponent(JSON.stringify({ ...prefill, _quickGenerated: result.data.gammaPrompt }));
        go({ to: `/proposal-generator?prefill=${encoded}` });
      } else {
        message.error(result.error || 'Failed to generate prompt.');
      }
    } catch {
      message.error('Something went wrong generating the proposal.');
    }
  };

  const handleOpenProposalEditor = () => {
    const prefill = buildProposalPrefill();
    const encoded = encodeURIComponent(JSON.stringify(prefill));
    go({ to: `/proposal-generator?prefill=${encoded}` });
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

  return (
    <div className=" mx-auto px-8 py-14" style={{ fontFamily: "'Manrope', sans-serif" }}>

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

      <div className="flex flex-wrap gap-2 mb-10">
        <button onClick={handleDownloadView} className="text-sm text-gray-500 border border-white/10 rounded px-3 py-1.5 hover:text-gray-300 hover:border-white/20 transition-colors flex items-center gap-1.5">
          <DownloadOutlined className="text-xs" /> Download
        </button>
        <button onClick={handleShare} disabled={shareLoading} className="text-sm text-gray-500 border border-white/10 rounded px-3 py-1.5 hover:text-gray-300 hover:border-white/20 transition-colors flex items-center gap-1.5 disabled:opacity-50">
          <ShareAltOutlined className="text-xs" /> {shareLoading ? 'Generating...' : 'Share'}
        </button>
        {deal && (
          <>
            <button onClick={handleQuickGenerate} className="text-sm text-[#5CC49D] border border-[#5CC49D]/30 rounded px-3 py-1.5 hover:bg-[#5CC49D]/10 transition-colors flex items-center gap-1.5">
              <ThunderboltOutlined className="text-xs" /> Quick Generate Proposal
            </button>
            <button onClick={handleOpenProposalEditor} className="text-sm text-gray-500 border border-white/10 rounded px-3 py-1.5 hover:text-gray-300 hover:border-white/20 transition-colors flex items-center gap-1.5">
              <FileTextOutlined className="text-xs" /> Open in Proposal Editor
            </button>
          </>
        )}
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
        <TabPane tab={<span className="font-manrope text-sm tracking-wide">Call Architecture</span>} key="deal-architecture">
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
            <p className="text-base text-gray-500 py-8">Call architecture analysis is not available for this call.</p>
          )}
        </TabPane>

        {/* ─── OVERVIEW ─── */}
        {/* <TabPane tab={<span className="font-manrope text-sm tracking-wide">Overview</span>} key="overview">
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
        </TabPane> */}

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
        {/* <TabPane tab={<span className="font-manrope text-sm tracking-wide">Analysis</span>} key="analysis">
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
        </TabPane> */}

      </Tabs>

      {/* Proposal Generator CTA */}
      {deal && (
        <>
          <Rule />
          <div className="border border-[#5CC49D]/20 rounded-lg p-6 text-center">
            <h3 className="text-base font-medium text-gray-200 mb-2">Generate a Client Proposal</h3>
            <p className="text-sm text-gray-500 mb-4">
              Turn this analysis into a polished Gamma.app presentation prompt for your prospect.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={handleQuickGenerate}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#5CC49D] text-black font-semibold text-sm hover:bg-[#4db38c] transition-colors"
              >
                <ThunderboltOutlined /> Quick Generate
              </button>
              <button
                onClick={handleOpenProposalEditor}
                className="flex items-center gap-2 px-5 py-2 rounded-lg border border-white/10 text-gray-400 text-sm hover:text-gray-200 hover:border-white/20 transition-colors"
              >
                <FileTextOutlined /> Open in Proposal Editor
              </button>
            </div>
          </div>
        </>
      )}

      {/* Footer */}
      <Rule />
      <div className="flex justify-center gap-3 pb-12">
        <button onClick={() => go({ to: "/sales-call-analyzer" })} className="text-sm text-gray-500 border border-white/10 rounded px-4 py-2 hover:text-gray-300 hover:border-white/20 transition-colors">Back</button>
        <button onClick={handleDownloadView} className="text-sm text-gray-500 border border-white/10 rounded px-4 py-2 hover:text-gray-300 hover:border-white/20 transition-colors flex items-center gap-1.5">
          <DownloadOutlined className="text-xs" /> Download Report
        </button>
        <button onClick={handleShare} disabled={shareLoading} className="text-sm text-gray-500 border border-white/10 rounded px-4 py-2 hover:text-gray-300 hover:border-white/20 transition-colors flex items-center gap-1.5 disabled:opacity-50">
          <ShareAltOutlined className="text-xs" /> {shareLoading ? 'Generating...' : 'Share'}
        </button>
      </div>
    </div>
  );
}