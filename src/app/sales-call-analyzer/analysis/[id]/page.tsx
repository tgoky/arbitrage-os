"use client";

import React, { useState, useEffect } from 'react';
import {
  PlayCircleOutlined,
  DownloadOutlined,
  ShareAltOutlined,
  EditOutlined,
  ArrowLeftOutlined,
  UserOutlined,
  PhoneOutlined,
  ClockCircleOutlined,
  BarChartOutlined,
  MessageOutlined,
  BulbOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  LikeOutlined,
  DislikeOutlined,
  TeamOutlined,
  BankOutlined,
  EnvironmentOutlined,
  LinkOutlined,
  CalendarOutlined,
  CloseCircleOutlined,
  DollarOutlined,
  RocketOutlined,
  ThunderboltOutlined,
  TrophyOutlined,
  FireOutlined,
  ToolOutlined,
  StarOutlined,
  AlertOutlined,
  AimOutlined
} from '@ant-design/icons';
import {
  Button,
  Card,
  Typography,
  Space,
  Progress,
  Alert,
  Tag,
  Avatar,
  List,
  Divider,
  Row,
  Col,
  Statistic,
  Tabs,
  Timeline,
  Collapse,
  Badge,
  Tooltip,
  message,
  Skeleton
} from 'antd';
import {  useGo } from "@refinedev/core";
import { useParams } from 'next/navigation';
import { useSalesCallAnalyzer } from '../../../hooks/useSalesCallAnalyzer';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Panel } = Collapse;


const getEmotionalEmoji = (tag: string) => {
  const emojiMap: Record<string, string> = {
    'excited': '🤩',
    'concerned': '😟',
    'confused': '😕',
    'engaged': '💬',
    'frustrated': '😤',
    'breakthrough': '💡',
    'committed': '🤝',
    'curious': '🤔',
    'focused': '🎯',
    'neutral': '😐',
    'positive': '😊',
    'negative': '😞'
  };
  return emojiMap[tag?.toLowerCase()] || '💬';
};

const getTypeColor = (type: string) => {
  const colorMap: Record<string, string> = {
    'positive': 'green',
    'negative': 'red',
    'critical': 'orange',
    'neutral': 'blue'
  };
  return colorMap[type] || 'blue';
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'positive': return <LikeOutlined />;
    case 'negative': return <DislikeOutlined />;
    case 'critical': return <WarningOutlined />;
    default: return <ClockCircleOutlined />;
  }
};


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

// Updated interface to match your ACTUAL data structure
interface AnalysisData {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  
  // The main analysis object that contains everything
  analysis: {
    callResults: {
      callId: string;
      status: string;
      duration: number;
       
      detailedReport?: string;
      followUpEmail?: string;
      proposalTemplate?: string;
      callStructureAnalysis?: CallStructureAnalysis; // ✅ ADD THIS LINE
      
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
      talkTimePercentage: number;
      questionToStatementRatio: number;
      averageResponseTime: number;
      engagementScore: number;
      clarityScore: number;
      enthusiasmLevel: number;
      professionalismScore: number;
    };
    tokensUsed: number;
    processingTime: number;

    // Deal Architecture Package (for sales/discovery calls)
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
        // Matches types file: integrationMap not systemIntegration
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
        // Matches types file: lifetimeValueEstimate is number, profitMarginEstimate is string
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

  // Metadata contains the input information
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
  const [activeTab, setActiveTab] = useState('overview');
  
  const { getAnalysis, exportAnalysis } = useSalesCallAnalyzer();

  useEffect(() => {
    loadAnalysis();
  }, [id]);

  const loadAnalysis = async () => {
    try {
      setLoading(true);
      console.log('Loading analysis for ID:', id);
      const data = await getAnalysis(id as string);
      console.log('=== FULL DATA STRUCTURE ===');
      console.log('Raw data:', JSON.stringify(data, null, 2));
      console.log('=== DATA KEYS ===');
      console.log('Top level keys:', Object.keys(data || {}));
      if (data?.callResults) {
        console.log('callResults keys:', Object.keys(data.callResults));
        if (data.callResults.analysis) {
          console.log('analysis keys:', Object.keys(data.callResults.analysis));
        }
      }
      if (data?.inputData) {
        console.log('inputData keys:', Object.keys(data.inputData));
      }
      console.log('=== END DEBUG ===');
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

  const getSentimentColor = (sentiment?: string) => {
    if (!sentiment) return 'blue';
    
    switch (sentiment.toLowerCase()) {
      case 'positive': return 'green';
      case 'negative': return 'red';
      case 'mixed': return 'orange';
      default: return 'blue';
    }
  };

  const getPriorityColor = (priority?: string) => {
    if (!priority) return 'blue';
    
    switch (priority) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'green';
      default: return 'blue';
    }
  };

  // Helper functions to safely extract data - FIXED FOR ACTUAL DATA STRUCTURE
  const getDuration = (): number => {
    return analysis?.analysis?.callResults?.duration || 
           analysis?.metadata?.duration || 
           0;
  };

  const getOverallScore = (): number => {
    return analysis?.analysis?.callResults?.analysis?.overallScore || 
           analysis?.metadata?.overallScore || 
           0;
  };

  const getSentiment = (): string => {
    return analysis?.analysis?.callResults?.analysis?.sentiment || 
           analysis?.metadata?.sentiment || 
           'neutral';
  };

  const getTalkRatio = (): { agent: number; prospect: number; silence: number } => {
    // First try to get from participants data
    const participants = analysis?.analysis?.callResults?.participants || [];
    if (participants.length > 0) {
      const agentParticipant = participants.find(p => 
        p.role?.toLowerCase().includes('agent') || 
        p.role?.toLowerCase().includes('host') ||
        p.name?.toLowerCase().includes('sarah') // Based on your data
      );
      const prospectParticipant = participants.find(p => 
        p.role?.toLowerCase().includes('customer') || 
        p.role?.toLowerCase().includes('prospect') ||
        p.name?.toLowerCase().includes('james') // Based on your data
      );
      
      if (agentParticipant && prospectParticipant) {
        const agentPercentage = agentParticipant.speakingPercentage || 0;
        const prospectPercentage = prospectParticipant.speakingPercentage || 0;
        return {
          agent: agentPercentage,
          prospect: prospectPercentage,
          silence: Math.max(0, 100 - agentPercentage - prospectPercentage)
        };
      }
    }
    
    // Fallback to speaker breakdown
    const speakerBreakdown = analysis?.analysis?.callResults?.analysis?.speakerBreakdown || [];
    const agentSpeaker = speakerBreakdown.find(s => s.speaker.toLowerCase().includes('sarah'));
    const prospectSpeaker = speakerBreakdown.find(s => s.speaker.toLowerCase().includes('james'));
    
    return {
      agent: agentSpeaker?.percentage || 0,
      prospect: prospectSpeaker?.percentage || 0,
      silence: Math.max(0, 100 - (agentSpeaker?.percentage || 0) - (prospectSpeaker?.percentage || 0))
    };
  };

  const getBuyingSignals = (): string[] => {
    // For discovery calls, check discoveryMetrics instead of salesMetrics
    const discoveryMetrics = analysis?.analysis?.callResults?.analysis?.discoveryMetrics;
    const salesMetrics = analysis?.analysis?.callResults?.analysis?.salesMetrics;
    
    return salesMetrics?.buyingSignals || 
           discoveryMetrics?.evaluationCriteria || 
           [];
  };

  const getKeyMoments = (): Array<{timestamp: string, description: string, type: 'positive' | 'negative' | 'neutral' | 'action'}> => {
    const insights = analysis?.analysis?.callResults?.analysis?.keyInsights || [];
    const actionItems = analysis?.analysis?.callResults?.analysis?.actionItems || [];
    
    // Create moments from insights and action items with varied types
    const insightMoments = insights.map((insight, index) => ({
      timestamp: `${Math.floor(index * 5)}:00`,
      description: insight,
      type: (index % 3 === 0 ? 'positive' : index % 3 === 1 ? 'neutral' : 'action') as 'positive' | 'negative' | 'neutral' | 'action'
    }));
    
    const actionMoments = actionItems.map((action, index) => ({
      timestamp: `${Math.floor((insights.length + index) * 5)}:00`,
      description: `Action: ${action}`,
      type: 'action' as 'positive' | 'negative' | 'neutral' | 'action'
    }));
    
    return [...insightMoments, ...actionMoments];
  };

  const getImprovementSuggestions = (): Array<{area: string, suggestion: string, priority: 'high' | 'medium' | 'low'}> => {
    const improvements = analysis?.analysis?.callResults?.coachingFeedback?.improvements || [];
    const suggestions = analysis?.analysis?.callResults?.coachingFeedback?.specificSuggestions || [];
    
    return [
      ...improvements.map(imp => ({ area: 'Improvement', suggestion: imp, priority: 'medium' as const })),
      ...suggestions.map(sug => ({ area: 'Suggestion', suggestion: sug, priority: 'low' as const }))
    ];
  };

  const getNextSteps = (): string[] => {
    const actionItems = analysis?.analysis?.callResults?.analysis?.actionItems || [];
    const immediateActions = analysis?.analysis?.nextStepsStrategy?.immediateActions || [];
    
    return actionItems.length > 0 ? actionItems : 
           immediateActions.length > 0 ? immediateActions :
           ['Review call recording', 'Follow up with prospect', 'Prepare next meeting agenda'];
  };

  const getExecutiveSummary = (): string => {
    return analysis?.analysis?.callResults?.executiveSummary || 
           'No summary available.';
  };

  const getProspectInfo = (): { name: string; title?: string; email?: string } => {
    return {
      name: analysis?.metadata?.prospectName || 'Not specified',
      title: analysis?.metadata?.prospectTitle,
      email: analysis?.metadata?.prospectEmail
    };
  };

  const getCompanyInfo = (): { name: string; industry?: string; location?: string } => {
    return {
      name: analysis?.metadata?.companyName || 'Not specified',
      industry: analysis?.metadata?.companyIndustry,
      location: analysis?.metadata?.companyLocation
    };
  };

  const getStrengths = (): string[] => {
    return analysis?.analysis?.callResults?.coachingFeedback?.strengths || [];
  };

  const getPerformanceMetrics = (): { talkTime: number; engagement: number; clarity: number; professionalism: number } => {
    const metrics = analysis?.analysis?.performanceMetrics;
    return {
      talkTime: metrics?.talkTimePercentage || 0,
      engagement: metrics?.engagementScore || 0,
      clarity: metrics?.clarityScore || 0,
      professionalism: metrics?.professionalismScore || 0
    };
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6">
        <Skeleton active paragraph={{ rows: 10 }} />
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6 text-center">
        <Title level={3}>Analysis Not Found</Title>
        <Text type="secondary">The requested analysis could not be found.</Text>
        <div className="mt-4">
          <Button 
            type="primary" 
            icon={<ArrowLeftOutlined />}
            onClick={() => go({ to: "/sales-call-analyzer" })}
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const duration = getDuration();
  const overallScore = getOverallScore();
  const sentiment = getSentiment();
  const talkRatio = getTalkRatio();
  const buyingSignals = getBuyingSignals();
  const keyMoments = getKeyMoments();
  const improvementSuggestions = getImprovementSuggestions();
  const nextSteps = getNextSteps();
  const executiveSummary = getExecutiveSummary();
  const prospectInfo = getProspectInfo();
  const companyInfo = getCompanyInfo();
  const strengths = getStrengths();
  const performanceMetrics = getPerformanceMetrics();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-10">
        <button
           onClick={() => go({ to: "/sales-call-analyzer" })}
          className="flex items-center gap-2 mb-6 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeftOutlined className="text-xs" />
          <span className="text-sm">Back</span>
        </button>
        <Title level={3} className="mb-2">{analysis.title}</Title>
        <div className="flex items-center gap-3 flex-wrap">
          <Tag color={getSentimentColor(sentiment)}>{sentiment}</Tag>
          <Text type="secondary">
            <ClockCircleOutlined className="mr-1" />
            {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
          </Text>
          <Text type="secondary">
            <CalendarOutlined className="mr-1" />
            {new Date(analysis.createdAt).toLocaleDateString()}
          </Text>
        </div>
        <div className="mt-4 flex gap-2">
          <Button size="small" icon={<DownloadOutlined />} onClick={() => handleExport()}>Export</Button>
          <Button size="small" icon={<ShareAltOutlined />}>Share</Button>
        </div>
      </div>

      {/* Score */}
      <div className="mb-10">
        <div className="text-center mb-6">
          <Progress
            type="circle"
            percent={overallScore}
            format={percent => (
              <div>
                <Title level={2} className="mb-0">{percent}</Title>
                <Text type="secondary" className="text-xs">Overall</Text>
              </div>
            )}
            size={120}
            strokeColor={overallScore >= 80 ? '#52c41a' : overallScore >= 60 ? '#faad14' : '#f5222d'}
          />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <Text type="secondary" className="text-xs block">You</Text>
            <Text strong className="text-lg">{Math.round(talkRatio.agent)}%</Text>
          </div>
          <div className="text-center">
            <Text type="secondary" className="text-xs block">Prospect</Text>
            <Text strong className="text-lg">{Math.round(talkRatio.prospect)}%</Text>
          </div>
          <div className="text-center">
            <Text type="secondary" className="text-xs block">Silence</Text>
            <Text strong className="text-lg">{Math.round(talkRatio.silence)}%</Text>
          </div>
          <div className="text-center">
            <Text type="secondary" className="text-xs block">Buying Signals</Text>
            <Text strong className="text-lg">{buyingSignals.length}</Text>
          </div>
        </div>
        {strengths.length > 0 && (
          <div>
            <Text type="secondary" className="text-xs block mb-2">STRENGTHS</Text>
            <Space wrap>
              {strengths.slice(0, 3).map((strength, index) => (
                <Tag color="green" key={index}>{strength}</Tag>
              ))}
            </Space>
          </div>
        )}
      </div>

      <Divider className="my-6" />

      {/* Main Content Tabs */}
      <Tabs activeKey={activeTab} onChange={setActiveTab} className="mb-6">

         {/* Deal Architecture Tab */}
        <TabPane tab="Deal Architecture" key="deal-architecture">
          {analysis?.analysis?.dealArchitecture ? (
            <div className="space-y-8">
              {/* Executive Brief */}
              <div>
                <div className="text-center mb-4">
                  <div className={`text-5xl font-bold ${
                    analysis.analysis.dealArchitecture.dealGrade.grade === 'A' ? 'text-green-600' :
                    analysis.analysis.dealArchitecture.dealGrade.grade === 'B' ? 'text-blue-600' :
                    analysis.analysis.dealArchitecture.dealGrade.grade === 'C' ? 'text-yellow-600' :
                    analysis.analysis.dealArchitecture.dealGrade.grade === 'D' ? 'text-orange-600' : 'text-red-600'
                  }`}>
                    {analysis.analysis.dealArchitecture.dealGrade.grade}
                  </div>
                  <Text type="secondary" className="text-xs">Deal Grade</Text>
                  <div className="max-w-xs mx-auto mt-2">
                    <Progress
                      percent={analysis.analysis.dealArchitecture.dealGrade.winProbability}
                      status={analysis.analysis.dealArchitecture.dealGrade.winProbability >= 60 ? 'success' : 'normal'}
                      size="small"
                    />
                    <Text type="secondary" className="text-xs">Win Probability</Text>
                  </div>
                </div>
                <Title level={4} className="text-center">{analysis.analysis.dealArchitecture.executiveBrief.oneLineSummary}</Title>
                <div className="space-y-3 mt-4">
                  <div className="p-3 rounded border border-white/10">
                    <Text type="secondary" className="text-xs block">DEAL VALUE</Text>
                    <Text strong className="text-lg text-green-600">{analysis.analysis.dealArchitecture.executiveBrief.dealValue}</Text>
                  </div>
                  <div className="p-3 rounded border border-white/10">
                    <Text type="secondary" className="text-xs block">TOP PRIORITY</Text>
                    <Text strong className="text-sm">{analysis.analysis.dealArchitecture.executiveBrief.topPriority}</Text>
                  </div>
                  <div className="p-3 rounded border border-white/10">
                    <Text type="secondary" className="text-xs block">IMMEDIATE ACTION</Text>
                    <Text strong className="text-sm">{analysis.analysis.dealArchitecture.executiveBrief.immediateAction}</Text>
                  </div>
                </div>
              </div>

              <Divider />

              {/* Prospect Diagnosis */}
              {analysis.analysis.dealArchitecture.prospectDiagnosis && (
                <div>
                  <Title level={5}><FireOutlined className="text-red-500 mr-2" />Prospect Diagnosis</Title>

                  <div className="space-y-3 mt-4">
                    <Text type="secondary" className="text-xs block">BUSINESS PROFILE</Text>
                    <div className="space-y-2 text-sm">
                      <div><Text type="secondary">Industry:</Text> <Text strong>{analysis.analysis.dealArchitecture.prospectDiagnosis.businessProfile?.industry || 'N/A'}</Text></div>
                      <div><Text type="secondary">Type:</Text> <Tag color="blue">{(analysis.analysis.dealArchitecture.prospectDiagnosis.businessProfile?.businessType || '').replace(/_/g, ' ') || 'N/A'}</Tag></div>
                      <div><Text type="secondary">Team Size:</Text> <Text>{analysis.analysis.dealArchitecture.prospectDiagnosis.businessProfile?.estimatedTeamSize || 'N/A'}</Text></div>
                      <div><Text type="secondary">Revenue:</Text> <Text>{analysis.analysis.dealArchitecture.prospectDiagnosis.businessProfile?.estimatedRevenue || 'N/A'}</Text></div>
                      {analysis.analysis.dealArchitecture.prospectDiagnosis.businessProfile?.location && (
                        <div><Text type="secondary">Location:</Text> <Text>{analysis.analysis.dealArchitecture.prospectDiagnosis.businessProfile.location}</Text></div>
                      )}
                      <div>
                        <Text type="secondary">Tech Stack:</Text>
                        <div className="mt-1">
                          {(analysis.analysis.dealArchitecture.prospectDiagnosis.businessProfile?.currentTechStack || []).map((tech, i) => (
                            <Tag key={i} className="mb-1">{tech}</Tag>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {analysis.analysis.dealArchitecture.prospectDiagnosis.financialQualification && (
                    <div className="mt-6">
                      <Text type="secondary" className="text-xs block mb-2">FINANCIAL QUALIFICATION</Text>
                      <Tag
                        color={
                          analysis.analysis.dealArchitecture.prospectDiagnosis.financialQualification.isQualified === 'yes' ? 'green' :
                          analysis.analysis.dealArchitecture.prospectDiagnosis.financialQualification.isQualified === 'maybe' ? 'orange' : 'red'
                        }
                        className="text-sm px-3 py-0.5 mb-3"
                      >
                        {analysis.analysis.dealArchitecture.prospectDiagnosis.financialQualification.isQualified === 'yes' ? 'QUALIFIED' :
                         analysis.analysis.dealArchitecture.prospectDiagnosis.financialQualification.isQualified === 'maybe' ? 'NEEDS VALIDATION' : 'NOT QUALIFIED'}
                      </Tag>
                      <div className="space-y-2 text-sm mt-2">
                        <div><Text type="secondary">Reason:</Text> <Text>{analysis.analysis.dealArchitecture.prospectDiagnosis.financialQualification.qualificationReason || 'N/A'}</Text></div>
                        {analysis.analysis.dealArchitecture.prospectDiagnosis.financialQualification.estimatedBudget && (
                          <div><Text type="secondary">Budget:</Text> <Text strong className="text-green-600">{analysis.analysis.dealArchitecture.prospectDiagnosis.financialQualification.estimatedBudget}</Text></div>
                        )}
                        <div><Text type="secondary">Urgency:</Text> <Tag color="purple">{(analysis.analysis.dealArchitecture.prospectDiagnosis.financialQualification.urgencyLevel || '').replace(/_/g, ' ') || 'N/A'}</Tag></div>
                        <div><Text type="secondary">Decision Maker Present:</Text> {analysis.analysis.dealArchitecture.prospectDiagnosis.financialQualification.decisionMakerPresent ? <CheckCircleOutlined className="text-green-500 ml-1" /> : <CloseCircleOutlined className="text-red-500 ml-1" />}</div>
                      </div>
                    </div>
                  )}

                  <Divider className="my-6" />
                  <Text type="secondary" className="text-xs block mb-3">PAIN POINTS</Text>
                  <List
                    dataSource={analysis.analysis.dealArchitecture.prospectDiagnosis.bleedingNeckProblems || []}
                    renderItem={(problem, index) => (
                      <List.Item>
                        <div className="w-full">
                          <div className="flex items-center gap-2 mb-1">
                            <Text strong>{index + 1}. {problem.problem}</Text>
                            <Tag color={
                              problem.severity === 'critical' ? 'red' :
                              problem.severity === 'high' ? 'orange' :
                              problem.severity === 'medium' ? 'gold' : 'green'
                            } className="text-xs">{(problem.severity || '').toUpperCase()}</Tag>
                          </div>
                          <div className="text-sm text-gray-400">
                            <span className="mr-4"><ClockCircleOutlined className="mr-1" />{problem.frequency || 'N/A'}</span>
                            <span><DollarOutlined className="mr-1" />{problem.estimatedCost || 'N/A'}</span>
                          </div>
                          {problem.quotedEvidence && (
                            <div className="mt-2 pl-3 border-l-2 border-yellow-400 text-sm italic text-gray-400">
                              {problem.quotedEvidence}
                            </div>
                          )}
                        </div>
                      </List.Item>
                    )}
                  />

                  {/* Buying Signals & Red Flags */}
                  <div className="mt-6 space-y-4">
                    <div className="p-3 rounded border border-green-900/30">
                      <Text strong className="text-green-600 text-xs block mb-2"><LikeOutlined className="mr-1" /> BUYING SIGNALS</Text>
                      <ul className="ml-4 text-sm space-y-1">
                        {(analysis.analysis.dealArchitecture.prospectDiagnosis.financialQualification?.buyingSignals || []).map((signal, i) => (
                          <li key={i} className="text-green-600">{signal}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="p-3 rounded border border-red-900/30">
                      <Text strong className="text-red-600 text-xs block mb-2"><WarningOutlined className="mr-1" /> RED FLAGS</Text>
                      <ul className="ml-4 text-sm space-y-1">
                        {(analysis.analysis.dealArchitecture.prospectDiagnosis.financialQualification?.redFlags || []).map((flag, i) => (
                          <li key={i} className="text-red-600">{flag}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <Divider />

              {/* Solution Stack */}
              {analysis.analysis.dealArchitecture.solutionStack && (
                <div>
                  <Title level={5}><ToolOutlined className="text-blue-500 mr-2" />Solution Stack</Title>

                  {/* Phase 1 */}
                  {analysis.analysis.dealArchitecture.solutionStack.phase1QuickWin && (
                    <div className="mt-6 pl-3 border-l-2 border-green-500">
                      <div className="flex items-center gap-2 mb-2">
                        <ThunderboltOutlined className="text-green-500" />
                        <Text strong className="text-green-600">Phase 1: Quick Win</Text>
                        <Tag color="green" className="text-xs">{analysis.analysis.dealArchitecture.solutionStack.phase1QuickWin.timeline || 'N/A'}</Tag>
                      </div>
                      <Text className="text-sm block mb-3">{analysis.analysis.dealArchitecture.solutionStack.phase1QuickWin.phaseName || 'Quick Win'}</Text>
                      {(analysis.analysis.dealArchitecture.solutionStack.phase1QuickWin.tools || []).map((tool, i) => (
                        <div key={i} className="mb-2 p-2 rounded border border-white/5 text-sm">
                          <div className="flex justify-between"><Text strong>{tool.toolName}</Text><Tag className="text-xs">{(tool.toolType || '').replace(/_/g, ' ')}</Tag></div>
                          <Text type="secondary" className="text-xs">{tool.description}</Text>
                          <div className="text-xs text-gray-500 mt-1">{tool.estimatedSetupHours || 0}h setup &middot; {tool.setupComplexity || 'N/A'} complexity</div>
                        </div>
                      ))}
                      <div className="text-sm mt-2"><Text type="secondary">Outcome:</Text> {analysis.analysis.dealArchitecture.solutionStack.phase1QuickWin.expectedOutcome || 'N/A'}</div>
                      <div className="text-sm"><Text type="secondary">PoC:</Text> {analysis.analysis.dealArchitecture.solutionStack.phase1QuickWin.proofOfConcept || 'N/A'}</div>
                    </div>
                  )}

                  {/* Phase 2 */}
                  {analysis.analysis.dealArchitecture.solutionStack.phase2CoreSystem && (
                    <div className="mt-6 pl-3 border-l-2 border-blue-500">
                      <div className="flex items-center gap-2 mb-2">
                        <ToolOutlined className="text-blue-500" />
                        <Text strong className="text-blue-600">Phase 2: Core System</Text>
                        <Tag color="blue" className="text-xs">{analysis.analysis.dealArchitecture.solutionStack.phase2CoreSystem.timeline || 'N/A'}</Tag>
                      </div>
                      <Text className="text-sm block mb-3">{analysis.analysis.dealArchitecture.solutionStack.phase2CoreSystem.phaseName || 'Core System'}</Text>
                      {(analysis.analysis.dealArchitecture.solutionStack.phase2CoreSystem.tools || []).map((tool, i) => (
                        <div key={i} className="mb-2 p-2 rounded border border-white/5 text-sm">
                          <div className="flex justify-between"><Text strong>{tool.toolName}</Text><Tag className="text-xs">{(tool.toolType || '').replace(/_/g, ' ')}</Tag></div>
                          <Text type="secondary" className="text-xs">{tool.description}</Text>
                          <div className="text-xs text-gray-500 mt-1">
                            {tool.estimatedSetupHours || 0}h setup &middot; {tool.setupComplexity || 'N/A'} complexity
                            {tool.monthlyMaintenanceHours && <span> &middot; {tool.monthlyMaintenanceHours}h/mo</span>}
                          </div>
                        </div>
                      ))}
                      <div className="text-sm mt-2"><Text type="secondary">Outcome:</Text> {analysis.analysis.dealArchitecture.solutionStack.phase2CoreSystem.expectedOutcome || 'N/A'}</div>
                      <div className="text-sm"><Text type="secondary">Retainer:</Text> {analysis.analysis.dealArchitecture.solutionStack.phase2CoreSystem.retainerJustification || 'N/A'}</div>
                    </div>
                  )}

                  {/* Phase 3 */}
                  {analysis.analysis.dealArchitecture.solutionStack.phase3AIWowFactor && (
                    <div className="mt-6 pl-3 border-l-2 border-purple-500">
                      <div className="flex items-center gap-2 mb-2">
                        <RocketOutlined className="text-purple-500" />
                        <Text strong className="text-purple-600">Phase 3: AI Wow Factor</Text>
                        <Tag color="purple" className="text-xs">{analysis.analysis.dealArchitecture.solutionStack.phase3AIWowFactor.timeline || 'N/A'}</Tag>
                      </div>
                      <Text className="text-sm block mb-3">{analysis.analysis.dealArchitecture.solutionStack.phase3AIWowFactor.phaseName || 'AI Wow Factor'}</Text>
                      {(analysis.analysis.dealArchitecture.solutionStack.phase3AIWowFactor.tools || []).map((tool, i) => (
                        <div key={i} className="mb-2 p-2 rounded border border-white/5 text-sm">
                          <div className="flex justify-between"><Text strong>{tool.toolName}</Text><Tag className="text-xs">{(tool.toolType || '').replace(/_/g, ' ')}</Tag></div>
                          <Text type="secondary" className="text-xs">{tool.description}</Text>
                          <div className="text-xs text-gray-500 mt-1">{tool.estimatedSetupHours || 0}h setup &middot; {tool.setupComplexity || 'N/A'} complexity</div>
                          {tool.replacesRole && <div className="text-xs text-green-600 mt-1"><StarOutlined className="mr-1" />Replaces: {tool.replacesRole}</div>}
                        </div>
                      ))}
                      <div className="text-sm mt-2"><Text type="secondary">Outcome:</Text> {analysis.analysis.dealArchitecture.solutionStack.phase3AIWowFactor.expectedOutcome || 'N/A'}</div>
                      <div className="text-sm"><Text type="secondary">ROI:</Text> <Text strong>{analysis.analysis.dealArchitecture.solutionStack.phase3AIWowFactor.roiProjection || 'N/A'}</Text></div>
                    </div>
                  )}

                  {/* Integration Map */}
                  {analysis.analysis.dealArchitecture.solutionStack?.integrationMap && (
                    <div className="mt-6 space-y-3">
                      <Text type="secondary" className="text-xs block">INTEGRATIONS</Text>
                      <div>
                        <Text type="secondary" className="text-xs">Required:</Text>
                        <div className="mt-1">{(analysis.analysis.dealArchitecture.solutionStack.integrationMap.requiredIntegrations || []).map((integration, i) => (<Tag key={i} color="green" className="mb-1">{integration}</Tag>))}</div>
                      </div>
                      <div>
                        <Text type="secondary" className="text-xs">Nice to Have:</Text>
                        <div className="mt-1">{(analysis.analysis.dealArchitecture.solutionStack.integrationMap.niceToHaveIntegrations || []).map((integration, i) => (<Tag key={i} color="blue" className="mb-1">{integration}</Tag>))}</div>
                      </div>
                      <div>
                        <Text type="secondary" className="text-xs">Blockers:</Text>
                        <div className="mt-1">{(analysis.analysis.dealArchitecture.solutionStack.integrationMap.potentialBlockers || []).map((blocker, i) => (<Tag key={i} color="orange" className="mb-1">{blocker}</Tag>))}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <Divider />

              {/* Pricing Strategy */}
              {analysis.analysis.dealArchitecture.pricingStrategy && (
                <div>
                  <Title level={5}><DollarOutlined className="text-green-500 mr-2" />Pricing Strategy</Title>

                  <div className="space-y-4 mt-4">
                    {/* Setup Fee */}
                    <div className="p-4 rounded border border-white/10">
                      <Text type="secondary" className="text-xs block">SETUP FEE</Text>
                      <Text strong className="text-2xl text-blue-600">${(analysis.analysis.dealArchitecture.pricingStrategy.setupFee?.recommended || 0).toLocaleString()}</Text>
                      <Text type="secondary" className="text-xs block">Range: ${(analysis.analysis.dealArchitecture.pricingStrategy.setupFee?.minimum || 0).toLocaleString()} - ${(analysis.analysis.dealArchitecture.pricingStrategy.setupFee?.maximum || 0).toLocaleString()}</Text>
                      {(analysis.analysis.dealArchitecture.pricingStrategy.setupFee?.breakdown || []).map((item, i) => (
                        <div key={i} className="flex justify-between text-xs mt-1"><span>{item.item}</span><span>${(item.cost || 0).toLocaleString()}</span></div>
                      ))}
                    </div>

                    {/* Monthly Retainer */}
                    <div className="p-4 rounded border border-white/10">
                      <Text type="secondary" className="text-xs block">MONTHLY RETAINER</Text>
                      <Text strong className="text-2xl text-green-600">${(analysis.analysis.dealArchitecture.pricingStrategy.monthlyRetainer?.recommended || 0).toLocaleString()}<span className="text-sm">/mo</span></Text>
                      <Text type="secondary" className="text-xs block">Range: ${(analysis.analysis.dealArchitecture.pricingStrategy.monthlyRetainer?.minimum || 0).toLocaleString()} - ${(analysis.analysis.dealArchitecture.pricingStrategy.monthlyRetainer?.maximum || 0).toLocaleString()}</Text>
                      {analysis.analysis.dealArchitecture.pricingStrategy.monthlyRetainer?.includedHours && (
                        <Text className="text-xs text-purple-500 block">{analysis.analysis.dealArchitecture.pricingStrategy.monthlyRetainer.includedHours} hrs included{analysis.analysis.dealArchitecture.pricingStrategy.monthlyRetainer.overhourlyRate && <span> | ${analysis.analysis.dealArchitecture.pricingStrategy.monthlyRetainer.overhourlyRate}/hr overage</span>}</Text>
                      )}
                      {(analysis.analysis.dealArchitecture.pricingStrategy.monthlyRetainer?.breakdown || []).map((item, i) => (
                        <div key={i} className="flex justify-between text-xs mt-1"><span>{item.item}</span><span>${(item.monthlyCost || 0).toLocaleString()}/mo</span></div>
                      ))}
                    </div>

                    {/* Total Deal Value */}
                    <div className="p-4 rounded border border-white/10">
                      <Text type="secondary" className="text-xs block">TOTAL DEAL VALUE (YEAR 1)</Text>
                      <Text strong className="text-2xl text-purple-600">${(analysis.analysis.dealArchitecture.pricingStrategy.totalDealValue?.firstYearValue || 0).toLocaleString()}</Text>
                      <div className="flex gap-6 mt-2 text-sm">
                        <div><Text type="secondary">Lifetime:</Text> <Text className="text-green-600">${(analysis.analysis.dealArchitecture.pricingStrategy.totalDealValue?.lifetimeValueEstimate || 0).toLocaleString()}</Text></div>
                        <div><Text type="secondary">Margin:</Text> <Text className="text-purple-600">{analysis.analysis.dealArchitecture.pricingStrategy.totalDealValue?.profitMarginEstimate || 'N/A'}</Text></div>
                      </div>
                    </div>
                  </div>

                  {/* Pitch Angle */}
                  {analysis.analysis.dealArchitecture.pricingStrategy.pitchAngle && (
                    <div className="mt-6 space-y-3">
                      <Text type="secondary" className="text-xs block">PITCH ANGLE</Text>
                      <div className="p-3 rounded border border-white/10">
                        <Text type="secondary" className="text-xs block">HEADLINE</Text>
                        <Text strong>{analysis.analysis.dealArchitecture.pricingStrategy.pitchAngle.headline || 'N/A'}</Text>
                      </div>
                      <div className="p-3 rounded border border-white/10">
                        <Text type="secondary" className="text-xs block">VALUE FRAMING</Text>
                        <Text>{analysis.analysis.dealArchitecture.pricingStrategy.pitchAngle.valueFraming || 'N/A'}</Text>
                      </div>
                      <div className="p-3 rounded border border-white/10">
                        <Text type="secondary" className="text-xs block">COMPARISON</Text>
                        <Text className="text-red-500">{analysis.analysis.dealArchitecture.pricingStrategy.pitchAngle.comparisonPoint || 'N/A'}</Text>
                      </div>
                      <div className="p-3 rounded border border-white/10">
                        <Text type="secondary" className="text-xs block">URGENCY HOOK</Text>
                        <Text className="text-orange-500">{analysis.analysis.dealArchitecture.pricingStrategy.pitchAngle.urgencyHook || 'N/A'}</Text>
                      </div>
                    </div>
                  )}

                  {/* Contract Terms */}
                  {analysis.analysis.dealArchitecture.pricingStrategy.contractTerms && (
                    <div className="mt-6">
                      <Text type="secondary" className="text-xs block mb-2">CONTRACT TERMS</Text>
                      <div className="space-y-1 text-sm">
                        <div><Text type="secondary">Term:</Text> <Tag color="blue">{(analysis.analysis.dealArchitecture.pricingStrategy.contractTerms.recommendedTerm || '').replace(/_/g, ' ')}</Tag></div>
                        {analysis.analysis.dealArchitecture.pricingStrategy.contractTerms.discountForLongerTerm && (
                          <div><Text type="secondary">Discount:</Text> <Text className="text-green-600">{analysis.analysis.dealArchitecture.pricingStrategy.contractTerms.discountForLongerTerm}</Text></div>
                        )}
                        <div><Text type="secondary">Payment:</Text> <Text>{analysis.analysis.dealArchitecture.pricingStrategy.contractTerms.paymentStructure || 'N/A'}</Text></div>
                        {analysis.analysis.dealArchitecture.pricingStrategy.contractTerms.guaranteeOffered && (
                          <div><Text type="secondary">Guarantee:</Text> <Text className="text-blue-600">{analysis.analysis.dealArchitecture.pricingStrategy.contractTerms.guaranteeOffered}</Text></div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Upsells */}
                  {(analysis.analysis.dealArchitecture.pricingStrategy.upsellOpportunities || []).length > 0 && (
                    <div className="mt-6">
                      <Text type="secondary" className="text-xs block mb-2">UPSELL OPPORTUNITIES</Text>
                      {(analysis.analysis.dealArchitecture.pricingStrategy.upsellOpportunities || []).map((upsell, i) => (
                        <div key={i} className="flex justify-between items-center py-2 border-b border-white/5 text-sm">
                          <div><Text strong>{upsell.service}</Text><Text type="secondary" className="text-xs block">{upsell.timing}</Text></div>
                          <Text className="text-green-600">+${(upsell.additionalRevenue || 0).toLocaleString()}</Text>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <Divider />

              {/* Sales Performance */}
              {analysis.analysis.dealArchitecture.salesPerformance && (
                <div>
                  <Title level={5}><TrophyOutlined className="text-yellow-500 mr-2" />Sales Performance</Title>

                  {/* Score Card */}
                  <div className="text-center my-4">
                    <Progress
                      type="circle"
                      percent={analysis.analysis.dealArchitecture.salesPerformance.callScoreCard?.overallScore || 0}
                      format={percent => <div><div className="text-2xl font-bold">{percent}</div><div className="text-xs">Overall</div></div>}
                      size={100}
                      strokeColor={
                        (analysis.analysis.dealArchitecture.salesPerformance.callScoreCard?.overallScore || 0) >= 80 ? '#52c41a' :
                        (analysis.analysis.dealArchitecture.salesPerformance.callScoreCard?.overallScore || 0) >= 60 ? '#faad14' : '#f5222d'
                      }
                    />
                  </div>
                  <div className="space-y-2 mb-6">
                    {[
                      { key: 'rapportBuilding', label: 'Rapport Building' },
                      { key: 'discoveryDepth', label: 'Discovery Depth' },
                      { key: 'painIdentification', label: 'Pain Identification' },
                      { key: 'valuePresentation', label: 'Value Presentation' },
                      { key: 'objectionHandling', label: 'Objection Handling' },
                      { key: 'closingStrength', label: 'Closing Strength' },
                    ].map(({ key, label }) => (
                      <div key={key} className="flex justify-between items-center">
                        <Text className="text-xs">{label}</Text>
                        <Progress
                          percent={((analysis.analysis.dealArchitecture?.salesPerformance?.callScoreCard as any)?.[key] || 0) * 10}
                          size="small"
                          className="w-32"
                          strokeColor={
                            ((analysis.analysis.dealArchitecture?.salesPerformance?.callScoreCard as any)?.[key] || 0) >= 8 ? '#52c41a' :
                            ((analysis.analysis.dealArchitecture?.salesPerformance?.callScoreCard as any)?.[key] || 0) >= 6 ? '#faad14' : '#f5222d'
                          }
                        />
                      </div>
                    ))}
                  </div>

                  {/* Green Flags */}
                  <div className="mb-4">
                    <Text strong className="text-green-600 text-xs block mb-2"><LikeOutlined className="mr-1" /> GREEN FLAGS</Text>
                    {(analysis.analysis.dealArchitecture.salesPerformance.greenFlags || []).map((flag, i) => (
                      <div key={i} className="py-2 border-b border-white/5">
                        <Text strong className="text-sm">{flag.observation}</Text>
                        {flag.example && <div className="text-xs text-gray-500 italic mt-1">{flag.example}</div>}
                        <div className="text-xs text-green-600 mt-1">{flag.impact}</div>
                      </div>
                    ))}
                  </div>

                  {/* Red Flags */}
                  <div className="mb-4">
                    <Text strong className="text-red-600 text-xs block mb-2"><AlertOutlined className="mr-1" /> RED FLAGS</Text>
                    {(analysis.analysis.dealArchitecture.salesPerformance.redFlags || []).map((flag, i) => (
                      <div key={i} className="py-2 border-b border-white/5">
                        <div className="flex justify-between">
                          <Text strong className="text-sm">{flag.observation}</Text>
                          <Tag color={flag.priority === 'high' ? 'red' : flag.priority === 'medium' ? 'orange' : 'blue'} className="text-xs">{flag.priority}</Tag>
                        </div>
                        {flag.example && <div className="text-xs text-gray-500 italic mt-1">{flag.example}</div>}
                        <div className="text-xs text-blue-500 mt-1">Fix: {flag.howToFix}</div>
                      </div>
                    ))}
                  </div>

                  {/* Missed Opportunities */}
                  <div className="mb-4">
                    <Text strong className="text-yellow-600 text-xs block mb-2"><BulbOutlined className="mr-1" /> MISSED OPPORTUNITIES</Text>
                    {(analysis.analysis.dealArchitecture.salesPerformance.missedOpportunities || []).map((opp, i) => (
                      <div key={i} className="py-2 border-b border-white/5">
                        <Text strong className="text-sm">{opp.topic}</Text>
                        <div className="text-sm mt-1 pl-3 border-l-2 border-yellow-500 italic">{opp.questionToAsk}</div>
                        <div className="text-xs text-purple-500 mt-1">{opp.whyItMatters}</div>
                      </div>
                    ))}
                  </div>

                  {/* Next Call Prep */}
                  <div className="mt-6">
                    <Text type="secondary" className="text-xs block mb-2">NEXT CALL PREPARATION</Text>
                    {(analysis.analysis.dealArchitecture.salesPerformance.nextCallPreparation || []).map((item, i) => (
                      <div key={i} className="flex items-start gap-2 py-1 text-sm">
                        <Text type="secondary">{i + 1}.</Text>
                        <Text>{item}</Text>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Divider />

              {/* Deal Grade Summary */}
              {analysis.analysis.dealArchitecture.dealGrade && (
                <div>
                  <div className="mb-4">
                    <Text type="secondary" className="text-xs block mb-2">DEAL STRENGTHS</Text>
                    {(analysis.analysis.dealArchitecture.dealGrade.dealStrengths || []).map((strength, i) => (
                      <div key={i} className="flex items-start gap-2 py-1 text-sm"><CheckCircleOutlined className="text-green-500 mt-0.5" /><Text>{strength}</Text></div>
                    ))}
                  </div>
                  <div className="mb-4">
                    <Text type="secondary" className="text-xs block mb-2">DEAL RISKS</Text>
                    {(analysis.analysis.dealArchitecture.dealGrade.dealRisks || []).map((risk, i) => (
                      <div key={i} className="flex items-start gap-2 py-1 text-sm"><WarningOutlined className="text-orange-500 mt-0.5" /><Text>{risk}</Text></div>
                    ))}
                  </div>
                  <div className="p-4 rounded border border-white/10">
                    <Text type="secondary" className="text-xs block">RECOMMENDED NEXT STEP</Text>
                    <Text strong className="text-blue-500">{analysis.analysis.dealArchitecture.dealGrade.recommendedNextStep || 'N/A'}</Text>
                    <Text type="secondary" className="text-sm block mt-1">{analysis.analysis.dealArchitecture.dealGrade.gradeReason || ''}</Text>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Card>
              <Alert
                message="Deal Architecture Not Available"
                description="Deal architecture analysis is only generated for sales and discovery calls. This may be a different call type, or the analysis was created before this feature was added."
                type="info"
                showIcon
              />
            </Card>
          )}
        </TabPane>

        <TabPane tab="Overview" key="overview">
          <div className="space-y-8">
            <div>
              <Text type="secondary" className="text-xs block mb-2">REPORT PREVIEW</Text>
              <Paragraph ellipsis={{ rows: 3, expandable: true }}>
                {analysis?.analysis?.callResults?.detailedReport || 'No detailed report available.'}
              </Paragraph>
              <Button size="small" onClick={() => setActiveTab('detailed-report')}>View Full Report</Button>
            </div>

            <div>
              <Text type="secondary" className="text-xs block mb-2">CALL SUMMARY</Text>
              <Paragraph>{executiveSummary}</Paragraph>
            </div>

            <div>
              <Text type="secondary" className="text-xs block mb-2">NEXT STEPS</Text>
              {nextSteps.map((step, index) => (
                <div key={index} className="flex items-start gap-2 py-2 border-b border-white/5 text-sm">
                  <CheckCircleOutlined className="text-green-500 mt-0.5" />
                  <Text>{step}</Text>
                </div>
              ))}
            </div>

            <div>
              <Text type="secondary" className="text-xs block mb-2">PARTICIPANTS</Text>
              <div className="space-y-2 text-sm">
                <div>
                  <UserOutlined className="mr-2" />
                  <Text strong>{prospectInfo.name}</Text>
                  {prospectInfo.title && <Text type="secondary"> ({prospectInfo.title})</Text>}
                  {prospectInfo.email && <Text type="secondary" className="block ml-5">{prospectInfo.email}</Text>}
                </div>
                <div>
                  <BankOutlined className="mr-2" />
                  <Text strong>{companyInfo.name}</Text>
                  {companyInfo.industry && <Text type="secondary"> &middot; {companyInfo.industry}</Text>}
                  {companyInfo.location && <Text type="secondary" className="block ml-5"><EnvironmentOutlined className="mr-1" />{companyInfo.location}</Text>}
                </div>
              </div>
            </div>

            <div>
              <Text type="secondary" className="text-xs block mb-2">KEY MOMENTS</Text>
              <Timeline>
          {(() => {
            // Get key moments from call structure analysis if available
            const structureKeyMoments = analysis?.analysis?.callResults?.callStructureAnalysis?.keyMoments;
            
            if (structureKeyMoments && structureKeyMoments.length > 0) {
              return structureKeyMoments.map((moment: any, index: number) => {
                const getEmotionalEmoji = (tag: string) => {
                  const emojiMap: Record<string, string> = {
                    'excited': '🤩', 'concerned': '😟', 'confused': '😕',
                    'engaged': '💬', 'frustrated': '😤', 'breakthrough': '💡',
                    'committed': '🤝', 'curious': '🤔', 'focused': '🎯',
                    'neutral': '😐', 'positive': '😊', 'negative': '😞'
                  };
                  return emojiMap[tag?.toLowerCase()] || '💬';
                };

                const getTypeColor = (type: string) => {
                  const colorMap: Record<string, string> = {
                    'positive': 'green', 'negative': 'red',
                    'critical': 'orange', 'neutral': 'blue'
                  };
                  return colorMap[type] || 'blue';
                };

                return (
                  <Timeline.Item
                    key={index}
                    color={getTypeColor(moment.type)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Text strong>{moment.timestamp}</Text>
                      {moment.emotionalTag && (
                        <span className="text-lg">
                          {getEmotionalEmoji(moment.emotionalTag)}
                        </span>
                      )}
                    </div>
                    <Text>{moment.description}</Text>
                    <div className="mt-1 text-xs text-gray-500">
                      💡 {moment.impact}
                    </div>
                  </Timeline.Item>
                );
              });
            }

            // Fallback to old method if no structure analysis
            const insights = analysis?.analysis?.callResults?.analysis?.keyInsights || [];
            const actionItems = analysis?.analysis?.callResults?.analysis?.actionItems || [];
            
            const insightMoments = insights.map((insight: string, index: number) => ({
              timestamp: `${Math.floor(index * 5)}:00`,
              description: insight,
              type: (index % 3 === 0 ? 'positive' : index % 3 === 1 ? 'neutral' : 'action') as 'positive' | 'negative' | 'neutral' | 'action'
            }));
            
            return insightMoments.map((moment, index) => (
              <Timeline.Item
                key={index}
                color={
                  moment.type === 'positive' ? 'green' :
                  moment.type === 'negative' ? 'red' :
                  moment.type === 'action' ? 'blue' : 'gray'
                }
              >
                <Text strong>{moment.timestamp}</Text>
                <br />
                {moment.description}
              </Timeline.Item>
            ));
          })()}
        </Timeline>

            </div>

            <div>
              <Text type="secondary" className="text-xs block mb-2">IMPROVEMENT SUGGESTIONS</Text>
              {improvementSuggestions.map((suggestion, index) => (
                <div key={index} className="py-2 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <Badge count={index + 1} style={{ backgroundColor: getPriorityColor(suggestion.priority) }} />
                    <Text strong className="text-sm">{suggestion.area}</Text>
                  </div>
                  <Text type="secondary" className="text-sm block mt-1 ml-7">{suggestion.suggestion}</Text>
                </div>
              ))}
            </div>
          </div>
        </TabPane>

        <TabPane tab="Transcript" key="transcript">
          <Card>
            <div className="p-4 rounded">
              <Paragraph className="whitespace-pre-wrap">
                {analysis?.analysis?.callResults?.transcript || 'No transcript available.'}
              </Paragraph>
            </div>
          </Card>
        </TabPane>
        

<TabPane tab="Call Structure" key="call-structure">
  {analysis?.analysis?.callResults?.callStructureAnalysis ? (
    <div className="space-y-6">
      {/* Opening */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Text strong>Opening (First 20%)</Text>
          <Tag color={
            analysis.analysis.callResults.callStructureAnalysis.callStructure.opening.assessment === 'Strong' ? 'green' :
            analysis.analysis.callResults.callStructureAnalysis.callStructure.opening.assessment === 'Good' ? 'blue' : 'orange'
          }>{analysis.analysis.callResults.callStructureAnalysis.callStructure.opening.assessment}</Tag>
        </div>
        <div className="mb-3">
          <Text type="secondary" className="text-xs block mb-1">Strengths</Text>
          {(analysis.analysis.callResults.callStructureAnalysis.callStructure.opening.strengths || []).map((item: string, i: number) => (
            <div key={i} className="text-sm py-1">{item}</div>
          ))}
        </div>
        <div className="mb-3">
          <Text type="secondary" className="text-xs block mb-1">Areas to Improve</Text>
          {(analysis.analysis.callResults.callStructureAnalysis.callStructure.opening.weaknesses || []).map((item: string, i: number) => (
            <div key={i} className="text-sm py-1">{item}</div>
          ))}
        </div>
        <div>
          <Text type="secondary" className="text-xs block mb-1">Recommendations</Text>
          {(analysis.analysis.callResults.callStructureAnalysis.callStructure.opening.recommendations || []).map((item: string, i: number) => (
            <div key={i} className="flex items-start gap-2 text-sm py-1"><CheckCircleOutlined className="text-blue-500 mt-0.5" />{item}</div>
          ))}
        </div>
      </div>

      <Divider />

      {/* Middle */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Text strong>Discovery / Middle (20-70%)</Text>
          <Tag color={
            analysis.analysis.callResults.callStructureAnalysis.callStructure.middle.assessment === 'Strong' ? 'green' :
            analysis.analysis.callResults.callStructureAnalysis.callStructure.middle.assessment === 'Good' ? 'blue' : 'orange'
          }>{analysis.analysis.callResults.callStructureAnalysis.callStructure.middle.assessment}</Tag>
        </div>
        <div className="flex gap-6 mb-3 text-sm">
          <div><Text type="secondary">Quality:</Text> <Text strong style={{
            color: analysis.analysis.callResults.callStructureAnalysis.callStructure.middle.discoveryQuality === 'Excellent' ? '#52c41a' :
                   analysis.analysis.callResults.callStructureAnalysis.callStructure.middle.discoveryQuality === 'Good' ? '#1890ff' : '#faad14'
          }}>{analysis.analysis.callResults.callStructureAnalysis.callStructure.middle.discoveryQuality}</Text></div>
          <div><Text type="secondary">Questions:</Text> <Text strong>{analysis.analysis.callResults.callStructureAnalysis.callStructure.middle.questionCount || 0}</Text></div>
        </div>
        <div className="mb-3">
          <Text type="secondary" className="text-xs block mb-1">Topics Covered</Text>
          <Space wrap>
            {(analysis.analysis.callResults.callStructureAnalysis.callStructure.middle.topicsCovered || []).map((topic: string, i: number) => (
              <Tag key={i} color="blue">{topic}</Tag>
            ))}
          </Space>
        </div>
        <div>
          <Text type="secondary" className="text-xs block mb-1">Recommendations</Text>
          {(analysis.analysis.callResults.callStructureAnalysis.callStructure.middle.recommendations || []).map((item: string, i: number) => (
            <div key={i} className="flex items-start gap-2 text-sm py-1"><CheckCircleOutlined className="text-blue-500 mt-0.5" />{item}</div>
          ))}
        </div>
      </div>

      <Divider />

      {/* Closing */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Text strong>Closing (Last 30%)</Text>
          <Tag color={
            analysis.analysis.callResults.callStructureAnalysis.callStructure.closing.assessment === 'Strong' ? 'green' :
            analysis.analysis.callResults.callStructureAnalysis.callStructure.closing.assessment === 'Good' ? 'blue' : 'orange'
          }>{analysis.analysis.callResults.callStructureAnalysis.callStructure.closing.assessment}</Tag>
        </div>
        <div className="flex gap-6 mb-3 text-sm">
          <div>
            <Text type="secondary">Next Steps Defined: </Text>
            {analysis.analysis.callResults.callStructureAnalysis.callStructure.closing.nextStepsDefined ?
              <CheckCircleOutlined className="text-green-500" /> :
              <CloseCircleOutlined className="text-red-500" />}
          </div>
          <div>
            <Text type="secondary">Commitment: </Text>
            <Text strong style={{
              color: analysis.analysis.callResults.callStructureAnalysis.callStructure.closing.commitmentLevel === 'High' ? '#52c41a' :
                     analysis.analysis.callResults.callStructureAnalysis.callStructure.closing.commitmentLevel === 'Medium' ? '#1890ff' : '#faad14'
            }}>{analysis.analysis.callResults.callStructureAnalysis.callStructure.closing.commitmentLevel || 'Unknown'}</Text>
          </div>
        </div>
        <div>
          <Text type="secondary" className="text-xs block mb-1">Recommendations</Text>
          {(analysis.analysis.callResults.callStructureAnalysis.callStructure.closing.recommendations || []).map((item: string, i: number) => (
            <div key={i} className="flex items-start gap-2 text-sm py-1"><CheckCircleOutlined className="text-blue-500 mt-0.5" />{item}</div>
          ))}
        </div>
      </div>

      <Divider />

      {/* Metrics */}
      <div>
        <Text type="secondary" className="text-xs block mb-3">CALL QUALITY METRICS</Text>
        <div className="space-y-2">
          {Object.entries(analysis.analysis.callResults.callStructureAnalysis.metrics || {}).map(([key, value]) => {
            if (typeof value === 'number') {
              return (
                <div key={key} className="flex justify-between items-center">
                  <Text className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</Text>
                  <Progress percent={value * 10} size="small" className="w-32" strokeColor={value >= 8 ? '#52c41a' : value >= 6 ? '#1890ff' : '#faad14'} format={() => `${value}/10`} />
                </div>
              );
            } else if (typeof value === 'boolean') {
              return (
                <div key={key} className="flex justify-between items-center">
                  <Text className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</Text>
                  {value ? <CheckCircleOutlined className="text-green-500" /> : <CloseCircleOutlined className="text-red-500" />}
                </div>
              );
            }
            return null;
          })}
        </div>
      </div>



      {/* Key Moments Timeline */}
      <Card title="Key Moments During Call">
              <Timeline>
          {(analysis.analysis.callResults.callStructureAnalysis.keyMoments || []).map((moment: any, index: number) => {
            // Get emoji for emotional tag
            const getEmotionalEmoji = (tag: string) => {
              const emojiMap: Record<string, string> = {
                'excited': '🤩',
                'concerned': '😟',
                'confused': '😕',
                'engaged': '💬',
                'frustrated': '😤',
                'breakthrough': '💡',
                'committed': '🤝',
                'curious': '🤔',
                'focused': '🎯',
                'neutral': '😐',
                'positive': '😊',
                'negative': '😞'
              };
              return emojiMap[tag?.toLowerCase()] || '💬';
            };

            // Get color for moment type
            const getTypeColor = (type: string) => {
              const colorMap: Record<string, string> = {
                'positive': 'green',
                'negative': 'red',
                'critical': 'orange',
                'neutral': 'blue'
              };
              return colorMap[type] || 'blue';
            };

            // Get icon for moment type
            const getTypeIcon = (type: string) => {
              switch (type) {
                case 'positive': return <LikeOutlined />;
                case 'negative': return <DislikeOutlined />;
                case 'critical': return <WarningOutlined />;
                default: return <ClockCircleOutlined />;
              }
            };

            return (
              <Timeline.Item
                key={index}
                color={getTypeColor(moment.type)}
                dot={getTypeIcon(moment.type)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-grow">
                    <div className="flex items-center gap-2 mb-2">
                      <Text strong className="text-base">{moment.timestamp}</Text>
                      <Tag color={getTypeColor(moment.type)}>
                        {moment.type}
                      </Tag>
                      {moment.emotionalTag && (
                        <Tag color="purple">
                          {getEmotionalEmoji(moment.emotionalTag)} {moment.emotionalTag}
                        </Tag>
                      )}
                    </div>
                    <div className="mt-1 mb-2">
                      <Text className="text-base">{moment.description}</Text>
                    </div>
                    <div className=" p-2 rounded border-l-4 border-blue-400">
                      <Text type="secondary" className="text-sm">
                        <BulbOutlined className="mr-1" />
                        <strong>Impact:</strong> {moment.impact}
                      </Text>
                    </div>
                  </div>
                </div>
              </Timeline.Item>
            );
          })}
        </Timeline>

         <Divider />
        <div>
          <Text strong className="block mb-2">Emotional Tags Legend:</Text>
          <Space wrap>
            <Tag color="purple">🤩 excited</Tag>
            <Tag color="purple">😟 concerned</Tag>
            <Tag color="purple">😕 confused</Tag>
            <Tag color="purple">💬 engaged</Tag>
            <Tag color="purple">😤 frustrated</Tag>
            <Tag color="purple">💡 breakthrough</Tag>
            <Tag color="purple">🤝 committed</Tag>
            <Tag color="purple">🤔 curious</Tag>
            <Tag color="purple">🎯 focused</Tag>
          </Space>
        </div>

      </Card>

      {/* Missed Opportunities */}
      <Card title="Missed Opportunities & How to Fix Them">
        <List
          dataSource={analysis.analysis.callResults.callStructureAnalysis.missedOpportunities || []}
          renderItem={(opp: any) => (
            <List.Item>
              <List.Item.Meta
                avatar={
                  <Badge 
                    count={opp.priority} 
                    style={{ 
                      backgroundColor: opp.priority === 'HIGH' ? '#f5222d' : 
                                     opp.priority === 'MEDIUM' ? '#faad14' : '#52c41a'
                    }} 
                  />
                }
                title={<Text strong>{opp.area}</Text>}
                description={
                  <div>
                    <div className="mb-2">
                      <Text type="secondary">{opp.description}</Text>
                    </div>
                    <div className=" p-2 rounded">
                      <Text strong className="text-blue-600">💡 How to Fix: </Text>
                      <Text>{opp.howToFix}</Text>
                    </div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  ) : (
    <Card>
      <Alert
        message="Call Structure Analysis Not Available"
        description="Detailed call structure analysis is not available for this call. This may be an older analysis created before this feature was added."
        type="info"
        showIcon
      />
    </Card>
  )}
</TabPane>

<TabPane tab="Detailed Report" key="detailed-report">
  <Card>
    <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, fontSize: '14px' }}>
      {analysis?.analysis?.callResults?.detailedReport || 'No detailed report available.'}
    </div>
  </Card>
</TabPane>

<TabPane tab="Follow-up Email" key="follow-up">
  <Card title="Generated Follow-up Email Template">
    {analysis?.analysis?.callResults?.followUpEmail ? (
      <div style={{ 
        whiteSpace: 'pre-wrap', 
        lineHeight: 1.6, 
        fontFamily: 'monospace', 
     
        padding: '16px', 
        borderRadius: '4px',
        fontSize: '13px'
      }}>
        {analysis.analysis.callResults.followUpEmail}
      </div>
    ) : (
      <Text type="secondary">No follow-up email template available for this call type.</Text>
    )}
  </Card>
</TabPane>

        <TabPane tab="Analysis" key="analysis">
          <div className="space-y-8">
            <div>
              <Text type="secondary" className="text-xs block mb-2">KEY INSIGHTS</Text>
              {(analysis?.analysis?.callResults?.analysis?.keyInsights || []).map((insight, index) => (
                <div key={index} className="flex items-start gap-2 py-2 border-b border-white/5 text-sm">
                  <Badge count={index + 1} />
                  <Text>{insight}</Text>
                </div>
              ))}
              {(!analysis?.analysis?.callResults?.analysis?.keyInsights || analysis.analysis.callResults.analysis.keyInsights.length === 0) && (
                <Text type="secondary">No key insights available.</Text>
              )}
            </div>

            <div>
              <Text type="secondary" className="text-xs block mb-2">PERFORMANCE METRICS</Text>
              <div className="grid grid-cols-2 gap-4">
                <div><Text type="secondary" className="text-xs block">Talk Time</Text><Text strong className="text-lg">{performanceMetrics.talkTime}%</Text></div>
                <div><Text type="secondary" className="text-xs block">Engagement</Text><Text strong className="text-lg">{performanceMetrics.engagement}/10</Text></div>
                <div><Text type="secondary" className="text-xs block">Clarity</Text><Text strong className="text-lg">{performanceMetrics.clarity}/10</Text></div>
                <div><Text type="secondary" className="text-xs block">Professionalism</Text><Text strong className="text-lg">{performanceMetrics.professionalism}/10</Text></div>
              </div>
            </div>

            <div>
              <Text type="secondary" className="text-xs block mb-2">DISCOVERY METRICS</Text>
              <div className="space-y-3">
                {analysis?.analysis?.callResults?.analysis?.discoveryMetrics?.challengesUncovered && (
                  <div>
                    <Text type="secondary" className="text-xs">Challenges Uncovered</Text>
                    <div className="mt-1">{analysis.analysis.callResults.analysis.discoveryMetrics.challengesUncovered.map((challenge, index) => (<Tag key={index} color="orange" className="mb-1">{challenge}</Tag>))}</div>
                  </div>
                )}
                {analysis?.analysis?.callResults?.analysis?.discoveryMetrics?.technicalRequirements && (
                  <div>
                    <Text type="secondary" className="text-xs">Technical Requirements</Text>
                    <div className="mt-1">{analysis.analysis.callResults.analysis.discoveryMetrics.technicalRequirements.map((req, index) => (<Tag key={index} color="blue" className="mb-1">{req}</Tag>))}</div>
                  </div>
                )}
                {analysis?.analysis?.callResults?.analysis?.discoveryMetrics?.stakeholdersIdentified && (
                  <div>
                    <Text type="secondary" className="text-xs">Stakeholders</Text>
                    <div className="mt-1">{analysis.analysis.callResults.analysis.discoveryMetrics.stakeholdersIdentified.map((stakeholder, index) => (<Tag key={index} color="green" className="mb-1">{stakeholder}</Tag>))}</div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <Text type="secondary" className="text-xs block mb-2">BUYING SIGNALS</Text>
              {buyingSignals.length > 0 ? buyingSignals.map((signal, index) => (
                <div key={index} className="flex items-start gap-2 py-2 border-b border-white/5 text-sm">
                  <BulbOutlined style={{ color: '#52c41a' }} className="mt-0.5" />
                  <Text>{signal}</Text>
                </div>
              )) : (
                <Text type="secondary">No buying signals detected.</Text>
              )}
            </div>
          </div>
        </TabPane>

        <TabPane tab="Competitive Intel" key="competitive">
          <Card title="Current Vendors">
            {analysis?.analysis?.callResults?.analysis?.discoveryMetrics?.currentVendors?.length ? (
              <List
                dataSource={analysis.analysis.callResults.analysis.discoveryMetrics.currentVendors}
                renderItem={(vendor, index) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<BankOutlined />}
                      title={vendor}
                      description="Current service provider"
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Text type="secondary">No current vendors identified in this call.</Text>
            )}
          </Card>
        </TabPane>

        <TabPane tab="Buying Signals" key="buying">
          <Card title="Buying Signals Detected">
            {buyingSignals.length > 0 ? (
              <List
                dataSource={buyingSignals}
                renderItem={(signal, index) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={
                        <Progress
                          type="circle"
                          percent={75} // Default confidence
                          width={40}
                          strokeColor="#52c41a"
                        />
                      }
                      title={signal}
                      description="Detected buying signal"
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Text type="secondary">No strong buying signals detected in this call.</Text>
            )}
          </Card>
        </TabPane>

       
      </Tabs>

      {/* Action Buttons */}
      <div className="flex justify-center gap-3 mt-10 pb-8">
        <Button onClick={() => go({ to: "/sales-call-analyzer" })}>Back</Button>
        <Button icon={<DownloadOutlined />} onClick={() => handleExport('detailed')}>Download Report</Button>
      </div>
    </div>
  );
}