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
        systemIntegration: {
          dataFlowDescription: string;
          integrationPoints: string[];
          potentialChallenges: string[];
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
          monthlyRecurring: number;
          lifetimeValueEstimate: string;
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
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center">
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => go({ to: "/sales-call-analyzer" })}
            className="mr-4"
          >
            Back
          </Button>
          <div>
            <Title level={3} className="mb-1">{analysis.title}</Title>
            <div className="flex items-center space-x-4">
              <Tag color={getSentimentColor(sentiment)}>
                {sentiment} sentiment
              </Tag>
              <Text type="secondary">
                <ClockCircleOutlined className="mr-1" />
                {Math.floor(duration / 60)}:
                {(duration % 60).toString().padStart(2, '0')}
              </Text>
              <Text type="secondary">
                <CalendarOutlined className="mr-1" />
                {new Date(analysis.createdAt).toLocaleDateString()}
              </Text>
            </div>
          </div>
        </div>
        <Space>
          <Button icon={<DownloadOutlined />} onClick={() => handleExport()}>
            Export
          </Button>
          <Button icon={<ShareAltOutlined />}>
            Share
          </Button>
        </Space>
      </div>

      {/* DEBUG SECTION - Remove this after fixing */}
      {/* {process.env.NODE_ENV === 'development' && (
        <Card className="mb-6 border-orange-200">
          <Title level={4}>🔍 Debug Information</Title>
          <div className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-96">
            <pre>{JSON.stringify(analysis, null, 2)}</pre>
          </div>
          <div className="mt-4">
            <Text strong>Data Structure Summary:</Text>
            <ul className="ml-4 mt-2">
              <li>Top level keys: {analysis ? Object.keys(analysis).join(', ') : 'none'}</li>
              <li>Has analysis: {analysis?.analysis ? 'Yes' : 'No'}</li>
              <li>Has analysis.callResults: {analysis?.analysis?.callResults ? 'Yes' : 'No'}</li>
              <li>Has metadata: {analysis?.metadata ? 'Yes' : 'No'}</li>
              <li>Overall Score: {analysis?.analysis?.callResults?.analysis?.overallScore || 0}</li>
              <li>Sentiment: {analysis?.analysis?.callResults?.analysis?.sentiment || 'none'}</li>
            </ul>
          </div>
        </Card>
      )} */}

      {/* Score Card */}
      <Card className="mb-6">
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <div className="text-center">
              <Progress
                type="circle"
                percent={overallScore}
                format={percent => (
                  <div>
                    <Title level={2} className="mb-0">{percent}</Title>
                    <Text type="secondary">Overall Score</Text>
                  </div>
                )}
                size={150}
                strokeColor={overallScore >= 80 ? '#52c41a' : 
                            overallScore >= 60 ? '#faad14' : '#f5222d'}
              />
            </div>
          </Col>
          <Col xs={24} md={16}>
            <Row gutter={16}>
              <Col xs={12} sm={6}>
                <Statistic
                  title="Talk Ratio (You)"
                  value={Math.round(talkRatio.agent)}
                  suffix="%"
                  prefix={<UserOutlined />}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="Talk Ratio (Prospect)"
                  value={Math.round(talkRatio.prospect)}
                  suffix="%"
                  prefix={<TeamOutlined />}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="Silence"
                  value={Math.round(talkRatio.silence)}
                  suffix="%"
                  prefix={<ClockCircleOutlined />}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="Buying Signals"
                  value={buyingSignals.length}
                  prefix={<BulbOutlined />}
                />
              </Col>
            </Row>
            <Divider className="my-4" />
            <div>
              <Text strong className="block mb-2">Key Strengths:</Text>
              <Space wrap>
                {strengths.slice(0, 3).map((strength, index) => (
                  <Tag color="green" key={index}>{strength}</Tag>
                ))}
                {strengths.length === 0 && <Text type="secondary">No strengths identified.</Text>}
              </Space>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Main Content Tabs */}
      <Tabs activeKey={activeTab} onChange={setActiveTab} className="mb-6">
        <TabPane tab="Overview" key="overview">
          <Row gutter={16}>
            <Col xs={24} lg={12}>
            <Card title="Report Preview" className="mb-4">
  <Paragraph ellipsis={{ rows: 3, expandable: true }}>
    {analysis?.analysis?.callResults?.detailedReport || 'No detailed report available.'}
  </Paragraph>
  <Button size="small" onClick={() => setActiveTab('detailed-report')}>
    View Full Report
  </Button>
</Card>
              <Card title="Call Summary" className="mb-4">
                <Paragraph>
                  {executiveSummary}
                </Paragraph>
              </Card>

              <Card title="Next Steps" className="mb-4">
                <List
                  dataSource={nextSteps}
                  renderItem={(step, index) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<Avatar icon={<CheckCircleOutlined />} />}
                        title={`Step ${index + 1}`}
                        description={step}
                      />
                    </List.Item>
                  )}
                />
              </Card>

              <Card title="Participant Information">
                <div className="space-y-4">
                  <div>
                    <Text strong className="block mb-1">Prospect</Text>
                    <div className="flex items-center">
                      <UserOutlined className="mr-2" />
                      <span>{prospectInfo.name}</span>
                      {prospectInfo.title && (
                        <Text type="secondary" className="ml-2">
                          ({prospectInfo.title})
                        </Text>
                      )}
                    </div>
                    {prospectInfo.email && (
                      <div className="mt-1">
                        <Text type="secondary">{prospectInfo.email}</Text>
                      </div>
                    )}
                  </div>

                  <Divider className="my-3" />

                  <div>
                    <Text strong className="block mb-1">Company</Text>
                    <div className="flex items-center">
                      <BankOutlined className="mr-2" />
                      <span>{companyInfo.name}</span>
                    </div>
                    {companyInfo.industry && (
                      <div className="mt-1">
                        <Text type="secondary">{companyInfo.industry}</Text>
                      </div>
                    )}
                    {companyInfo.location && (
                      <div className="mt-1">
                        <EnvironmentOutlined className="mr-2" />
                        <Text type="secondary">{companyInfo.location}</Text>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card title="Key Moments" className="mb-4">
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

              </Card>

              <Card title="Improvement Suggestions">
                <List
                  dataSource={improvementSuggestions}
                  renderItem={(suggestion, index) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={
                          <Badge 
                            count={index + 1} 
                            style={{ 
                              backgroundColor: getPriorityColor(suggestion.priority) 
                            }} 
                          />
                        }
                        title={suggestion.area}
                        description={suggestion.suggestion}
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
          </Row>
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
      {/* Opening Section */}
      <Card 
        title={
          <div className="flex items-center justify-between">
            <span>Opening (First 20%)</span>
            <Tag color={
              analysis.analysis.callResults.callStructureAnalysis.callStructure.opening.assessment === 'Strong' ? 'green' :
              analysis.analysis.callResults.callStructureAnalysis.callStructure.opening.assessment === 'Good' ? 'blue' : 'orange'
            }>
              {analysis.analysis.callResults.callStructureAnalysis.callStructure.opening.assessment}
            </Tag>
          </div>
        }
      >
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <div className="mb-4">
              <Text strong className="block mb-2">✅ Strengths:</Text>
              <List
                size="small"
                dataSource={analysis.analysis.callResults.callStructureAnalysis.callStructure.opening.strengths || []}
                renderItem={(item: string) => <List.Item>{item}</List.Item>}
              />
            </div>
          </Col>
          <Col xs={24} md={12}>
            <div className="mb-4">
              <Text strong className="block mb-2">⚠️ Areas to Improve:</Text>
              <List
                size="small"
                dataSource={analysis.analysis.callResults.callStructureAnalysis.callStructure.opening.weaknesses || []}
                renderItem={(item: string) => <List.Item>{item}</List.Item>}
              />
            </div>
          </Col>
        </Row>
        <Divider />
        <div>
          <Text strong className="block mb-2">💡 Recommendations:</Text>
          <List
            size="small"
            dataSource={analysis.analysis.callResults.callStructureAnalysis.callStructure.opening.recommendations || []}
            renderItem={(item: string) => (
              <List.Item>
                <CheckCircleOutlined className="mr-2 text-blue-500" />
                {item}
              </List.Item>
            )}
          />
        </div>
      </Card>

      {/* Middle Section */}
      <Card 
        title={
          <div className="flex items-center justify-between">
            <span>Discovery/Middle Section (20-70%)</span>
            <Tag color={
              analysis.analysis.callResults.callStructureAnalysis.callStructure.middle.assessment === 'Strong' ? 'green' :
              analysis.analysis.callResults.callStructureAnalysis.callStructure.middle.assessment === 'Good' ? 'blue' : 'orange'
            }>
              {analysis.analysis.callResults.callStructureAnalysis.callStructure.middle.assessment}
            </Tag>
          </div>
        }
      >
        <Row gutter={16} className="mb-4">
          <Col xs={12} sm={6}>
            <Statistic
              title="Discovery Quality"
              value={analysis.analysis.callResults.callStructureAnalysis.callStructure.middle.discoveryQuality}
              valueStyle={{ 
                color: analysis.analysis.callResults.callStructureAnalysis.callStructure.middle.discoveryQuality === 'Excellent' ? '#52c41a' : 
                       analysis.analysis.callResults.callStructureAnalysis.callStructure.middle.discoveryQuality === 'Good' ? '#1890ff' : '#faad14'
              }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="Questions Asked"
              value={analysis.analysis.callResults.callStructureAnalysis.callStructure.middle.questionCount || 0}
              suffix="questions"
            />
          </Col>
          <Col xs={24} sm={12}>
            <div>
              <Text strong className="block mb-2">Topics Covered:</Text>
              <Space wrap>
                {(analysis.analysis.callResults.callStructureAnalysis.callStructure.middle.topicsCovered || []).map((topic: string, i: number) => (
                  <Tag key={i} color="blue">{topic}</Tag>
                ))}
              </Space>
            </div>
          </Col>
        </Row>
        <Divider />
        <div>
          <Text strong className="block mb-2">💡 Recommendations:</Text>
          <List
            size="small"
            dataSource={analysis.analysis.callResults.callStructureAnalysis.callStructure.middle.recommendations || []}
            renderItem={(item: string) => (
              <List.Item>
                <CheckCircleOutlined className="mr-2 text-blue-500" />
                {item}
              </List.Item>
            )}
          />
        </div>
      </Card>

      {/* Closing Section */}
      <Card 
        title={
          <div className="flex items-center justify-between">
            <span>Closing (Last 30%)</span>
            <Tag color={
              analysis.analysis.callResults.callStructureAnalysis.callStructure.closing.assessment === 'Strong' ? 'green' :
              analysis.analysis.callResults.callStructureAnalysis.callStructure.closing.assessment === 'Good' ? 'blue' : 'orange'
            }>
              {analysis.analysis.callResults.callStructureAnalysis.callStructure.closing.assessment}
            </Tag>
          </div>
        }
      >
        <Row gutter={16} className="mb-4">
          <Col xs={12}>
            <div className="text-center p-4  rounded">
              <Text strong className="block mb-2">Next Steps Defined</Text>
              <div className="text-3xl">
                {analysis.analysis.callResults.callStructureAnalysis.callStructure.closing.nextStepsDefined ? 
                  <CheckCircleOutlined className="text-green-500" /> : 
                  <CloseCircleOutlined className="text-red-500" />
                }
              </div>
            </div>
          </Col>
          <Col xs={12}>
            <Statistic
              title="Commitment Level"
              value={analysis.analysis.callResults.callStructureAnalysis.callStructure.closing.commitmentLevel || 'Unknown'}
              valueStyle={{ 
                color: analysis.analysis.callResults.callStructureAnalysis.callStructure.closing.commitmentLevel === 'High' ? '#52c41a' : 
                       analysis.analysis.callResults.callStructureAnalysis.callStructure.closing.commitmentLevel === 'Medium' ? '#1890ff' : '#faad14'
              }}
            />
          </Col>
        </Row>
        <Divider />
        <div>
          <Text strong className="block mb-2">💡 Recommendations:</Text>
          <List
            size="small"
            dataSource={analysis.analysis.callResults.callStructureAnalysis.callStructure.closing.recommendations || []}
            renderItem={(item: string) => (
              <List.Item>
                <CheckCircleOutlined className="mr-2 text-blue-500" />
                {item}
              </List.Item>
            )}
          />
        </div>
      </Card>

      {/* Key Metrics Overview */}
      <Card title="Call Quality Metrics">
        <Row gutter={16}>
          {Object.entries(analysis.analysis.callResults.callStructureAnalysis.metrics || {}).map(([key, value]) => {
            if (typeof value === 'number') {
              return (
                <Col xs={12} sm={8} md={4} key={key}>
                  <div className="text-center mb-4">
                    <Progress
                      type="circle"
                      percent={value * 10}
                      format={() => `${value}/10`}
                      width={80}
                      strokeColor={value >= 8 ? '#52c41a' : value >= 6 ? '#1890ff' : '#faad14'}
                    />
                    <Text className="block mt-2 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </Text>
                  </div>
                </Col>
              );
            } else if (typeof value === 'boolean') {
              return (
                <Col xs={12} sm={8} md={4} key={key}>
                  <div className="text-center mb-4">
                    <div className="text-4xl">
                      {value ? (
                        <CheckCircleOutlined className="text-green-500" />
                      ) : (
                        <CloseCircleOutlined className="text-red-500" />
                      )}
                    </div>
                    <Text className="block mt-2 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </Text>
                  </div>
                </Col>
              );
            }
            return null;
          })}
        </Row>
      </Card>



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
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Card title="Key Insights" className="mb-4">
                <List
                  dataSource={analysis?.analysis?.callResults?.analysis?.keyInsights || []}
                  renderItem={(insight, index) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<Badge count={index + 1} />}
                        description={insight}
                      />
                    </List.Item>
                  )}
                />
                {(!analysis?.analysis?.callResults?.analysis?.keyInsights || analysis.analysis.callResults.analysis.keyInsights.length === 0) && (
                  <Text type="secondary">No key insights available.</Text>
                )}
              </Card>

              <Card title="Performance Metrics">
                <Row gutter={16}>
                  <Col xs={12}>
                    <Statistic
                      title="Talk Time"
                      value={performanceMetrics.talkTime}
                      suffix="%"
                    />
                  </Col>
                  <Col xs={12}>
                    <Statistic
                      title="Engagement Score"
                      value={performanceMetrics.engagement}
                      suffix="/10"
                    />
                  </Col>
                  <Col xs={12}>
                    <Statistic
                      title="Clarity Score"
                      value={performanceMetrics.clarity}
                      suffix="/10"
                    />
                  </Col>
                  <Col xs={12}>
                    <Statistic
                      title="Professionalism"
                      value={performanceMetrics.professionalism}
                      suffix="/10"
                    />
                  </Col>
                </Row>
              </Card>
            </Col>

            <Col xs={24} md={12}>
              <Card title="Discovery Metrics" className="mb-4">
                <div className="space-y-3">
                  {analysis?.analysis?.callResults?.analysis?.discoveryMetrics?.challengesUncovered && (
                    <div>
                      <Text strong>Challenges Uncovered:</Text>
                      <div className="mt-1">
                        {analysis.analysis.callResults.analysis.discoveryMetrics.challengesUncovered.map((challenge, index) => (
                          <Tag key={index} color="orange" className="mb-1">{challenge}</Tag>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {analysis?.analysis?.callResults?.analysis?.discoveryMetrics?.technicalRequirements && (
                    <div>
                      <Text strong>Technical Requirements:</Text>
                      <div className="mt-1">
                        {analysis.analysis.callResults.analysis.discoveryMetrics.technicalRequirements.map((req, index) => (
                          <Tag key={index} color="blue" className="mb-1">{req}</Tag>
                        ))}
                      </div>
                    </div>
                  )}

                  {analysis?.analysis?.callResults?.analysis?.discoveryMetrics?.stakeholdersIdentified && (
                    <div>
                      <Text strong>Stakeholders:</Text>
                      <div className="mt-1">
                        {analysis.analysis.callResults.analysis.discoveryMetrics.stakeholdersIdentified.map((stakeholder, index) => (
                          <Tag key={index} color="green" className="mb-1">{stakeholder}</Tag>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              <Card title="Buying Signals">
                {buyingSignals.length > 0 ? (
                  <List
                    dataSource={buyingSignals}
                    renderItem={(signal, index) => (
                      <List.Item>
                        <List.Item.Meta
                          avatar={<BulbOutlined style={{ color: '#52c41a' }} />}
                          description={signal}
                        />
                      </List.Item>
                    )}
                  />
                ) : (
                  <Text type="secondary">No buying signals detected.</Text>
                )}
              </Card>
            </Col>
          </Row>
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

        {/* Deal Architecture Tab - NEW */}
        <TabPane
          tab={
            <span>
              <RocketOutlined /> Deal Architecture
            </span>
          }
          key="deal-architecture"
        >
          {analysis?.analysis?.dealArchitecture ? (
            <div className="space-y-6">
              {/* Executive Brief Card */}
              <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                <Row gutter={16} align="middle">
                  <Col xs={24} md={6}>
                    <div className="text-center">
                      <div className={`text-6xl font-bold ${
                        analysis.analysis.dealArchitecture.dealGrade.grade === 'A' ? 'text-green-600' :
                        analysis.analysis.dealArchitecture.dealGrade.grade === 'B' ? 'text-blue-600' :
                        analysis.analysis.dealArchitecture.dealGrade.grade === 'C' ? 'text-yellow-600' :
                        analysis.analysis.dealArchitecture.dealGrade.grade === 'D' ? 'text-orange-600' : 'text-red-600'
                      }`}>
                        {analysis.analysis.dealArchitecture.dealGrade.grade}
                      </div>
                      <Text type="secondary">Deal Grade</Text>
                      <div className="mt-2">
                        <Progress
                          percent={analysis.analysis.dealArchitecture.dealGrade.winProbability}
                          status={analysis.analysis.dealArchitecture.dealGrade.winProbability >= 60 ? 'success' : 'normal'}
                          size="small"
                        />
                        <Text type="secondary" className="text-xs">Win Probability</Text>
                      </div>
                    </div>
                  </Col>
                  <Col xs={24} md={18}>
                    <Title level={4}>{analysis.analysis.dealArchitecture.executiveBrief.oneLineSummary}</Title>
                    <Row gutter={16} className="mt-4">
                      <Col xs={12} md={6}>
                        <div className="p-3 bg-white rounded shadow-sm">
                          <Text type="secondary" className="block text-xs">DEAL VALUE</Text>
                          <Text strong className="text-lg text-green-600">{analysis.analysis.dealArchitecture.executiveBrief.dealValue}</Text>
                        </div>
                      </Col>
                      <Col xs={12} md={6}>
                        <div className="p-3 bg-white rounded shadow-sm">
                          <Text type="secondary" className="block text-xs">TOP PRIORITY</Text>
                          <Text strong className="text-sm">{analysis.analysis.dealArchitecture.executiveBrief.topPriority}</Text>
                        </div>
                      </Col>
                      <Col xs={24} md={12}>
                        <div className="p-3 bg-white rounded shadow-sm">
                          <Text type="secondary" className="block text-xs">IMMEDIATE ACTION</Text>
                          <Text strong className="text-sm">{analysis.analysis.dealArchitecture.executiveBrief.immediateAction}</Text>
                        </div>
                      </Col>
                    </Row>
                  </Col>
                </Row>
              </Card>

              {/* Prospect Diagnosis */}
              <Card
                title={
                  <span><FireOutlined className="text-red-500 mr-2" />Prospect Diagnosis - "Bleeding Neck" Problems</span>
                }
              >
                <Row gutter={16}>
                  <Col xs={24} md={8}>
                    <div className="mb-4 p-4 bg-gray-50 rounded">
                      <Title level={5}>Business Profile</Title>
                      <div className="space-y-2">
                        <div><Text type="secondary">Industry:</Text> <Text strong>{analysis.analysis.dealArchitecture.prospectDiagnosis.businessProfile.industry}</Text></div>
                        <div><Text type="secondary">Type:</Text> <Tag color="blue">{analysis.analysis.dealArchitecture.prospectDiagnosis.businessProfile.businessType.replace(/_/g, ' ')}</Tag></div>
                        <div><Text type="secondary">Team Size:</Text> <Text>{analysis.analysis.dealArchitecture.prospectDiagnosis.businessProfile.estimatedTeamSize}</Text></div>
                        <div><Text type="secondary">Revenue:</Text> <Text>{analysis.analysis.dealArchitecture.prospectDiagnosis.businessProfile.estimatedRevenue}</Text></div>
                        {analysis.analysis.dealArchitecture.prospectDiagnosis.businessProfile.location && (
                          <div><Text type="secondary">Location:</Text> <Text>{analysis.analysis.dealArchitecture.prospectDiagnosis.businessProfile.location}</Text></div>
                        )}
                        <div className="mt-2">
                          <Text type="secondary">Tech Stack:</Text>
                          <div className="mt-1">
                            {analysis.analysis.dealArchitecture.prospectDiagnosis.businessProfile.currentTechStack.map((tech, i) => (
                              <Tag key={i} className="mb-1">{tech}</Tag>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded">
                      <Title level={5}>Financial Qualification</Title>
                      <div className="text-center mb-3">
                        <Tag
                          color={
                            analysis.analysis.dealArchitecture.prospectDiagnosis.financialQualification.isQualified === 'yes' ? 'green' :
                            analysis.analysis.dealArchitecture.prospectDiagnosis.financialQualification.isQualified === 'maybe' ? 'orange' : 'red'
                          }
                          className="text-lg px-4 py-1"
                        >
                          {analysis.analysis.dealArchitecture.prospectDiagnosis.financialQualification.isQualified === 'yes' ? 'QUALIFIED' :
                           analysis.analysis.dealArchitecture.prospectDiagnosis.financialQualification.isQualified === 'maybe' ? 'NEEDS VALIDATION' : 'NOT QUALIFIED'}
                        </Tag>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div><Text type="secondary">Reason:</Text> <Text>{analysis.analysis.dealArchitecture.prospectDiagnosis.financialQualification.qualificationReason}</Text></div>
                        {analysis.analysis.dealArchitecture.prospectDiagnosis.financialQualification.estimatedBudget && (
                          <div><Text type="secondary">Budget:</Text> <Text strong className="text-green-600">{analysis.analysis.dealArchitecture.prospectDiagnosis.financialQualification.estimatedBudget}</Text></div>
                        )}
                        <div><Text type="secondary">Urgency:</Text> <Tag color="purple">{analysis.analysis.dealArchitecture.prospectDiagnosis.financialQualification.urgencyLevel.replace(/_/g, ' ')}</Tag></div>
                        <div><Text type="secondary">Decision Maker Present:</Text> {analysis.analysis.dealArchitecture.prospectDiagnosis.financialQualification.decisionMakerPresent ? <CheckCircleOutlined className="text-green-500" /> : <CloseCircleOutlined className="text-red-500" />}</div>
                      </div>
                    </div>
                  </Col>
                  <Col xs={24} md={16}>
                    <Title level={5} className="mb-3">Top Pain Points (Urgency-Ranked)</Title>
                    <List
                      dataSource={analysis.analysis.dealArchitecture.prospectDiagnosis.bleedingNeckProblems}
                      renderItem={(problem, index) => (
                        <List.Item>
                          <List.Item.Meta
                            avatar={
                              <Badge
                                count={index + 1}
                                style={{
                                  backgroundColor: problem.severity === 'critical' ? '#f5222d' :
                                                 problem.severity === 'high' ? '#fa541c' :
                                                 problem.severity === 'medium' ? '#faad14' : '#52c41a'
                                }}
                              />
                            }
                            title={
                              <div className="flex items-center gap-2">
                                <Text strong>{problem.problem}</Text>
                                <Tag color={
                                  problem.severity === 'critical' ? 'red' :
                                  problem.severity === 'high' ? 'orange' :
                                  problem.severity === 'medium' ? 'gold' : 'green'
                                }>{problem.severity.toUpperCase()}</Tag>
                              </div>
                            }
                            description={
                              <div className="mt-2">
                                <div className="flex gap-4 text-sm">
                                  <span><ClockCircleOutlined className="mr-1" />{problem.frequency}</span>
                                  <span><DollarOutlined className="mr-1 text-red-500" />{problem.estimatedCost}</span>
                                </div>
                                {problem.quotedEvidence && (
                                  <div className="mt-2 p-2 bg-yellow-50 border-l-4 border-yellow-400 text-sm italic">
                                    "{problem.quotedEvidence}"
                                  </div>
                                )}
                              </div>
                            }
                          />
                        </List.Item>
                      )}
                    />

                    {/* Buying Signals & Red Flags */}
                    <Row gutter={16} className="mt-4">
                      <Col xs={24} md={12}>
                        <div className="p-3 bg-green-50 rounded border border-green-200">
                          <Text strong className="text-green-700"><LikeOutlined className="mr-1" /> Buying Signals</Text>
                          <ul className="mt-2 ml-4 text-sm">
                            {analysis.analysis.dealArchitecture.prospectDiagnosis.financialQualification.buyingSignals.map((signal, i) => (
                              <li key={i} className="text-green-600">{signal}</li>
                            ))}
                          </ul>
                        </div>
                      </Col>
                      <Col xs={24} md={12}>
                        <div className="p-3 bg-red-50 rounded border border-red-200">
                          <Text strong className="text-red-700"><WarningOutlined className="mr-1" /> Red Flags</Text>
                          <ul className="mt-2 ml-4 text-sm">
                            {analysis.analysis.dealArchitecture.prospectDiagnosis.financialQualification.redFlags.map((flag, i) => (
                              <li key={i} className="text-red-600">{flag}</li>
                            ))}
                          </ul>
                        </div>
                      </Col>
                    </Row>
                  </Col>
                </Row>
              </Card>

              {/* Solution Stack - Three Phases */}
              <Card
                title={
                  <span><ToolOutlined className="text-blue-500 mr-2" />Solution Stack - What to Build</span>
                }
              >
                <Row gutter={16}>
                  {/* Phase 1: Quick Win */}
                  <Col xs={24} md={8}>
                    <Card
                      size="small"
                      className="h-full border-green-200"
                      title={
                        <div className="text-center">
                          <ThunderboltOutlined className="text-green-500 text-xl" />
                          <div className="text-green-600 font-bold">PHASE 1: QUICK WIN</div>
                          <Tag color="green">{analysis.analysis.dealArchitecture.solutionStack.phase1QuickWin.timeline}</Tag>
                        </div>
                      }
                    >
                      <Text strong className="block mb-2">{analysis.analysis.dealArchitecture.solutionStack.phase1QuickWin.phaseName}</Text>
                      <List
                        size="small"
                        dataSource={analysis.analysis.dealArchitecture.solutionStack.phase1QuickWin.tools}
                        renderItem={(tool) => (
                          <List.Item className="py-2">
                            <div className="w-full">
                              <div className="flex justify-between items-center">
                                <Text strong className="text-sm">{tool.toolName}</Text>
                                <Tag color="blue" className="text-xs">{tool.toolType.replace(/_/g, ' ')}</Tag>
                              </div>
                              <Text className="text-xs text-gray-500 block">{tool.description}</Text>
                              <div className="flex justify-between text-xs mt-1">
                                <span><ClockCircleOutlined className="mr-1" />{tool.estimatedSetupHours}h setup</span>
                                <Tag color={tool.setupComplexity === 'low' ? 'green' : tool.setupComplexity === 'medium' ? 'orange' : 'red'} className="text-xs">{tool.setupComplexity}</Tag>
                              </div>
                            </div>
                          </List.Item>
                        )}
                      />
                      <Divider className="my-2" />
                      <div className="p-2 bg-green-50 rounded text-sm">
                        <Text strong className="text-green-700">Expected Outcome:</Text>
                        <div className="mt-1">{analysis.analysis.dealArchitecture.solutionStack.phase1QuickWin.expectedOutcome}</div>
                      </div>
                      <div className="p-2 bg-blue-50 rounded text-sm mt-2">
                        <Text strong className="text-blue-700">Proof of Concept:</Text>
                        <div className="mt-1">{analysis.analysis.dealArchitecture.solutionStack.phase1QuickWin.proofOfConcept}</div>
                      </div>
                    </Card>
                  </Col>

                  {/* Phase 2: Core System */}
                  <Col xs={24} md={8}>
                    <Card
                      size="small"
                      className="h-full border-blue-200"
                      title={
                        <div className="text-center">
                          <ToolOutlined className="text-blue-500 text-xl" />
                          <div className="text-blue-600 font-bold">PHASE 2: CORE SYSTEM</div>
                          <Tag color="blue">{analysis.analysis.dealArchitecture.solutionStack.phase2CoreSystem.timeline}</Tag>
                        </div>
                      }
                    >
                      <Text strong className="block mb-2">{analysis.analysis.dealArchitecture.solutionStack.phase2CoreSystem.phaseName}</Text>
                      <List
                        size="small"
                        dataSource={analysis.analysis.dealArchitecture.solutionStack.phase2CoreSystem.tools}
                        renderItem={(tool) => (
                          <List.Item className="py-2">
                            <div className="w-full">
                              <div className="flex justify-between items-center">
                                <Text strong className="text-sm">{tool.toolName}</Text>
                                <Tag color="blue" className="text-xs">{tool.toolType.replace(/_/g, ' ')}</Tag>
                              </div>
                              <Text className="text-xs text-gray-500 block">{tool.description}</Text>
                              <div className="flex justify-between text-xs mt-1">
                                <span><ClockCircleOutlined className="mr-1" />{tool.estimatedSetupHours}h setup</span>
                                <Tag color={tool.setupComplexity === 'low' ? 'green' : tool.setupComplexity === 'medium' ? 'orange' : 'red'} className="text-xs">{tool.setupComplexity}</Tag>
                              </div>
                              {tool.monthlyMaintenanceHours && (
                                <div className="text-xs text-purple-500 mt-1">
                                  <ClockCircleOutlined className="mr-1" />{tool.monthlyMaintenanceHours}h/mo maintenance
                                </div>
                              )}
                            </div>
                          </List.Item>
                        )}
                      />
                      <Divider className="my-2" />
                      <div className="p-2 bg-blue-50 rounded text-sm">
                        <Text strong className="text-blue-700">Expected Outcome:</Text>
                        <div className="mt-1">{analysis.analysis.dealArchitecture.solutionStack.phase2CoreSystem.expectedOutcome}</div>
                      </div>
                      <div className="p-2 bg-purple-50 rounded text-sm mt-2">
                        <Text strong className="text-purple-700">Why They Need Retainer:</Text>
                        <div className="mt-1">{analysis.analysis.dealArchitecture.solutionStack.phase2CoreSystem.retainerJustification}</div>
                      </div>
                    </Card>
                  </Col>

                  {/* Phase 3: AI Wow Factor */}
                  <Col xs={24} md={8}>
                    <Card
                      size="small"
                      className="h-full border-purple-200"
                      title={
                        <div className="text-center">
                          <RocketOutlined className="text-purple-500 text-xl" />
                          <div className="text-purple-600 font-bold">PHASE 3: AI WOW FACTOR</div>
                          <Tag color="purple">{analysis.analysis.dealArchitecture.solutionStack.phase3AIWowFactor.timeline}</Tag>
                        </div>
                      }
                    >
                      <Text strong className="block mb-2">{analysis.analysis.dealArchitecture.solutionStack.phase3AIWowFactor.phaseName}</Text>
                      <List
                        size="small"
                        dataSource={analysis.analysis.dealArchitecture.solutionStack.phase3AIWowFactor.tools}
                        renderItem={(tool) => (
                          <List.Item className="py-2">
                            <div className="w-full">
                              <div className="flex justify-between items-center">
                                <Text strong className="text-sm">{tool.toolName}</Text>
                                <Tag color="purple" className="text-xs">{tool.toolType.replace(/_/g, ' ')}</Tag>
                              </div>
                              <Text className="text-xs text-gray-500 block">{tool.description}</Text>
                              <div className="flex justify-between text-xs mt-1">
                                <span><ClockCircleOutlined className="mr-1" />{tool.estimatedSetupHours}h setup</span>
                                <Tag color={tool.setupComplexity === 'low' ? 'green' : tool.setupComplexity === 'medium' ? 'orange' : 'red'} className="text-xs">{tool.setupComplexity}</Tag>
                              </div>
                              {tool.replacesRole && (
                                <div className="text-xs text-green-600 mt-1 font-semibold">
                                  <StarOutlined className="mr-1" />Replaces: {tool.replacesRole}
                                </div>
                              )}
                            </div>
                          </List.Item>
                        )}
                      />
                      <Divider className="my-2" />
                      <div className="p-2 bg-purple-50 rounded text-sm">
                        <Text strong className="text-purple-700">Expected Outcome:</Text>
                        <div className="mt-1">{analysis.analysis.dealArchitecture.solutionStack.phase3AIWowFactor.expectedOutcome}</div>
                      </div>
                      <div className="p-2 bg-green-50 rounded text-sm mt-2">
                        <Text strong className="text-green-700">ROI Projection:</Text>
                        <div className="mt-1 font-semibold">{analysis.analysis.dealArchitecture.solutionStack.phase3AIWowFactor.roiProjection}</div>
                      </div>
                    </Card>
                  </Col>
                </Row>

                {/* System Integration */}
                <Card size="small" className="mt-4 bg-gray-50">
                  <Title level={5}><LinkOutlined className="mr-2" />System Integration</Title>
                  <Row gutter={16}>
                    <Col xs={24} md={12}>
                      <Text strong>Data Flow:</Text>
                      <Paragraph className="text-sm">{analysis.analysis.dealArchitecture.solutionStack.systemIntegration.dataFlowDescription}</Paragraph>
                    </Col>
                    <Col xs={24} md={6}>
                      <Text strong>Integration Points:</Text>
                      <div className="mt-1">
                        {analysis.analysis.dealArchitecture.solutionStack.systemIntegration.integrationPoints.map((point, i) => (
                          <Tag key={i} color="blue" className="mb-1">{point}</Tag>
                        ))}
                      </div>
                    </Col>
                    <Col xs={24} md={6}>
                      <Text strong>Potential Challenges:</Text>
                      <div className="mt-1">
                        {analysis.analysis.dealArchitecture.solutionStack.systemIntegration.potentialChallenges.map((challenge, i) => (
                          <Tag key={i} color="orange" className="mb-1">{challenge}</Tag>
                        ))}
                      </div>
                    </Col>
                  </Row>
                </Card>
              </Card>

              {/* Pricing Strategy */}
              <Card
                title={
                  <span><DollarOutlined className="text-green-500 mr-2" />Pricing Strategy</span>
                }
              >
                <Row gutter={16}>
                  {/* Setup Fee */}
                  <Col xs={24} md={8}>
                    <Card size="small" className="text-center bg-blue-50">
                      <Title level={5}>Setup Fee</Title>
                      <div className="text-3xl font-bold text-blue-600">
                        ${analysis.analysis.dealArchitecture.pricingStrategy.setupFee.recommended.toLocaleString()}
                      </div>
                      <Text type="secondary" className="text-xs">
                        Range: ${analysis.analysis.dealArchitecture.pricingStrategy.setupFee.minimum.toLocaleString()} - ${analysis.analysis.dealArchitecture.pricingStrategy.setupFee.maximum.toLocaleString()}
                      </Text>
                      <Divider className="my-2" />
                      <div className="text-left">
                        <Text strong className="text-sm">Breakdown:</Text>
                        <List
                          size="small"
                          dataSource={analysis.analysis.dealArchitecture.pricingStrategy.setupFee.breakdown}
                          renderItem={(item) => (
                            <List.Item className="py-1">
                              <div className="flex justify-between w-full text-xs">
                                <span>{item.item}</span>
                                <span className="font-semibold">${item.cost.toLocaleString()}</span>
                              </div>
                            </List.Item>
                          )}
                        />
                      </div>
                    </Card>
                  </Col>

                  {/* Monthly Retainer */}
                  <Col xs={24} md={8}>
                    <Card size="small" className="text-center bg-green-50">
                      <Title level={5}>Monthly Retainer</Title>
                      <div className="text-3xl font-bold text-green-600">
                        ${analysis.analysis.dealArchitecture.pricingStrategy.monthlyRetainer.recommended.toLocaleString()}<span className="text-sm">/mo</span>
                      </div>
                      <Text type="secondary" className="text-xs">
                        Range: ${analysis.analysis.dealArchitecture.pricingStrategy.monthlyRetainer.minimum.toLocaleString()} - ${analysis.analysis.dealArchitecture.pricingStrategy.monthlyRetainer.maximum.toLocaleString()}
                      </Text>
                      {analysis.analysis.dealArchitecture.pricingStrategy.monthlyRetainer.includedHours && (
                        <div className="text-sm text-purple-600 mt-1">
                          {analysis.analysis.dealArchitecture.pricingStrategy.monthlyRetainer.includedHours} hrs included
                          {analysis.analysis.dealArchitecture.pricingStrategy.monthlyRetainer.overhourlyRate && (
                            <span> | ${analysis.analysis.dealArchitecture.pricingStrategy.monthlyRetainer.overhourlyRate}/hr overage</span>
                          )}
                        </div>
                      )}
                      <Divider className="my-2" />
                      <div className="text-left">
                        <Text strong className="text-sm">Breakdown:</Text>
                        <List
                          size="small"
                          dataSource={analysis.analysis.dealArchitecture.pricingStrategy.monthlyRetainer.breakdown}
                          renderItem={(item) => (
                            <List.Item className="py-1">
                              <div className="flex justify-between w-full text-xs">
                                <span>{item.item}</span>
                                <span className="font-semibold">${item.monthlyCost.toLocaleString()}/mo</span>
                              </div>
                            </List.Item>
                          )}
                        />
                      </div>
                    </Card>
                  </Col>

                  {/* Total Deal Value */}
                  <Col xs={24} md={8}>
                    <Card size="small" className="text-center bg-purple-50">
                      <Title level={5}>Total Deal Value</Title>
                      <div className="text-3xl font-bold text-purple-600">
                        ${analysis.analysis.dealArchitecture.pricingStrategy.totalDealValue.firstYearValue.toLocaleString()}
                      </div>
                      <Text type="secondary" className="text-xs">First Year Value</Text>
                      <Divider className="my-2" />
                      <Row gutter={8}>
                        <Col span={12}>
                          <Statistic
                            title={<span className="text-xs">Monthly Recurring</span>}
                            value={analysis.analysis.dealArchitecture.pricingStrategy.totalDealValue.monthlyRecurring}
                            prefix="$"
                            valueStyle={{ fontSize: '16px', color: '#52c41a' }}
                          />
                        </Col>
                        <Col span={12}>
                          <div className="text-center">
                            <Text type="secondary" className="text-xs block">Lifetime Estimate</Text>
                            <Text strong className="text-purple-600">{analysis.analysis.dealArchitecture.pricingStrategy.totalDealValue.lifetimeValueEstimate}</Text>
                          </div>
                        </Col>
                      </Row>
                    </Card>
                  </Col>
                </Row>

                {/* Pitch Angle */}
                <Card size="small" className="mt-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
                  <Title level={5}><AimOutlined className="mr-2" />The Pitch Angle</Title>
                  <Row gutter={16}>
                    <Col xs={24} md={12}>
                      <div className="p-3 bg-white rounded shadow-sm mb-2">
                        <Text type="secondary" className="text-xs block">HEADLINE</Text>
                        <Text strong className="text-lg">{analysis.analysis.dealArchitecture.pricingStrategy.pitchAngle.headline}</Text>
                      </div>
                      <div className="p-3 bg-white rounded shadow-sm">
                        <Text type="secondary" className="text-xs block">VALUE FRAMING</Text>
                        <Text>{analysis.analysis.dealArchitecture.pricingStrategy.pitchAngle.valueFraming}</Text>
                      </div>
                    </Col>
                    <Col xs={24} md={12}>
                      <div className="p-3 bg-white rounded shadow-sm mb-2">
                        <Text type="secondary" className="text-xs block">COMPARISON POINT</Text>
                        <Text className="text-red-600">{analysis.analysis.dealArchitecture.pricingStrategy.pitchAngle.comparisonPoint}</Text>
                      </div>
                      <div className="p-3 bg-white rounded shadow-sm">
                        <Text type="secondary" className="text-xs block">URGENCY HOOK</Text>
                        <Text className="text-orange-600 font-semibold">{analysis.analysis.dealArchitecture.pricingStrategy.pitchAngle.urgencyHook}</Text>
                      </div>
                    </Col>
                  </Row>
                </Card>

                {/* Contract Terms & Upsells */}
                <Row gutter={16} className="mt-4">
                  <Col xs={24} md={12}>
                    <Card size="small">
                      <Title level={5}>Contract Terms</Title>
                      <div className="space-y-2">
                        <div><Text type="secondary">Recommended Term:</Text> <Tag color="blue">{analysis.analysis.dealArchitecture.pricingStrategy.contractTerms.recommendedTerm.replace(/_/g, ' ')}</Tag></div>
                        {analysis.analysis.dealArchitecture.pricingStrategy.contractTerms.discountForLongerTerm && (
                          <div><Text type="secondary">Discount:</Text> <Text className="text-green-600">{analysis.analysis.dealArchitecture.pricingStrategy.contractTerms.discountForLongerTerm}</Text></div>
                        )}
                        <div><Text type="secondary">Payment:</Text> <Text>{analysis.analysis.dealArchitecture.pricingStrategy.contractTerms.paymentStructure}</Text></div>
                        {analysis.analysis.dealArchitecture.pricingStrategy.contractTerms.guaranteeOffered && (
                          <div><Text type="secondary">Guarantee:</Text> <Text className="text-blue-600">{analysis.analysis.dealArchitecture.pricingStrategy.contractTerms.guaranteeOffered}</Text></div>
                        )}
                      </div>
                    </Card>
                  </Col>
                  <Col xs={24} md={12}>
                    <Card size="small">
                      <Title level={5}>Upsell Opportunities</Title>
                      <List
                        size="small"
                        dataSource={analysis.analysis.dealArchitecture.pricingStrategy.upsellOpportunities}
                        renderItem={(upsell) => (
                          <List.Item>
                            <List.Item.Meta
                              avatar={<StarOutlined className="text-yellow-500" />}
                              title={upsell.service}
                              description={
                                <div className="flex justify-between">
                                  <span className="text-xs">{upsell.timing}</span>
                                  <span className="text-green-600 font-semibold">+${upsell.additionalRevenue.toLocaleString()}</span>
                                </div>
                              }
                            />
                          </List.Item>
                        )}
                      />
                    </Card>
                  </Col>
                </Row>
              </Card>

              {/* Sales Performance */}
              <Card
                title={
                  <span><TrophyOutlined className="text-yellow-500 mr-2" />Sales Performance Coaching</span>
                }
              >
                <Row gutter={16}>
                  {/* Score Card */}
                  <Col xs={24} md={8}>
                    <Card size="small" className="bg-gray-50">
                      <Title level={5} className="text-center">Call Score Card</Title>
                      <div className="text-center mb-4">
                        <Progress
                          type="circle"
                          percent={analysis.analysis.dealArchitecture.salesPerformance.callScoreCard.overallScore}
                          format={percent => (
                            <div>
                              <div className="text-2xl font-bold">{percent}</div>
                              <div className="text-xs">Overall</div>
                            </div>
                          )}
                          size={100}
                          strokeColor={
                            analysis.analysis.dealArchitecture.salesPerformance.callScoreCard.overallScore >= 80 ? '#52c41a' :
                            analysis.analysis.dealArchitecture.salesPerformance.callScoreCard.overallScore >= 60 ? '#faad14' : '#f5222d'
                          }
                        />
                      </div>
                      <div className="space-y-2">
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
                              percent={(analysis.analysis.dealArchitecture?.salesPerformance.callScoreCard as any)[key] * 10}
                              size="small"
                              className="w-24"
                              strokeColor={
                                (analysis.analysis.dealArchitecture?.salesPerformance.callScoreCard as any)[key] >= 8 ? '#52c41a' :
                                (analysis.analysis.dealArchitecture?.salesPerformance.callScoreCard as any)[key] >= 6 ? '#faad14' : '#f5222d'
                              }
                            />
                          </div>
                        ))}
                      </div>
                    </Card>
                  </Col>

                  {/* Green & Red Flags */}
                  <Col xs={24} md={16}>
                    <Row gutter={16}>
                      <Col xs={24} md={12}>
                        <Card size="small" className="bg-green-50 border-green-200 mb-4">
                          <Title level={5} className="text-green-700"><LikeOutlined className="mr-1" /> Green Flags</Title>
                          <List
                            size="small"
                            dataSource={analysis.analysis.dealArchitecture.salesPerformance.greenFlags}
                            renderItem={(flag) => (
                              <List.Item className="py-2">
                                <div>
                                  <Text strong className="text-sm">{flag.observation}</Text>
                                  {flag.example && (
                                    <div className="text-xs text-gray-500 italic mt-1">"{flag.example}"</div>
                                  )}
                                  <div className="text-xs text-green-600 mt-1"><BulbOutlined className="mr-1" />{flag.impact}</div>
                                </div>
                              </List.Item>
                            )}
                          />
                        </Card>
                      </Col>
                      <Col xs={24} md={12}>
                        <Card size="small" className="bg-red-50 border-red-200 mb-4">
                          <Title level={5} className="text-red-700"><AlertOutlined className="mr-1" /> Red Flags</Title>
                          <List
                            size="small"
                            dataSource={analysis.analysis.dealArchitecture.salesPerformance.redFlags}
                            renderItem={(flag) => (
                              <List.Item className="py-2">
                                <div>
                                  <div className="flex justify-between">
                                    <Text strong className="text-sm">{flag.observation}</Text>
                                    <Tag color={flag.priority === 'high' ? 'red' : flag.priority === 'medium' ? 'orange' : 'blue'} className="text-xs">{flag.priority}</Tag>
                                  </div>
                                  {flag.example && (
                                    <div className="text-xs text-gray-500 italic mt-1">"{flag.example}"</div>
                                  )}
                                  <div className="text-xs text-blue-600 mt-1"><ToolOutlined className="mr-1" />Fix: {flag.howToFix}</div>
                                </div>
                              </List.Item>
                            )}
                          />
                        </Card>
                      </Col>
                    </Row>

                    {/* Missed Opportunities */}
                    <Card size="small" className="bg-yellow-50 border-yellow-200">
                      <Title level={5} className="text-yellow-700"><BulbOutlined className="mr-1" /> Missed Opportunities</Title>
                      <List
                        size="small"
                        dataSource={analysis.analysis.dealArchitecture.salesPerformance.missedOpportunities}
                        renderItem={(opp) => (
                          <List.Item className="py-2">
                            <div className="w-full">
                              <Text strong className="text-sm">{opp.topic}</Text>
                              <div className="text-sm mt-1 p-2 bg-white rounded">
                                <Text type="secondary">Ask: </Text>
                                <Text className="italic">"{opp.questionToAsk}"</Text>
                              </div>
                              <div className="text-xs text-purple-600 mt-1"><StarOutlined className="mr-1" />{opp.whyItMatters}</div>
                            </div>
                          </List.Item>
                        )}
                      />
                    </Card>
                  </Col>
                </Row>

                {/* Next Call Preparation */}
                <Card size="small" className="mt-4 bg-blue-50 border-blue-200">
                  <Title level={5}><CalendarOutlined className="mr-2" />Next Call Preparation</Title>
                  <Row gutter={16}>
                    {analysis.analysis.dealArchitecture.salesPerformance.nextCallPreparation.map((item, i) => (
                      <Col xs={24} md={8} key={i}>
                        <div className="p-2 bg-white rounded flex items-start mb-2">
                          <Badge count={i + 1} className="mr-2" />
                          <Text className="text-sm">{item}</Text>
                        </div>
                      </Col>
                    ))}
                  </Row>
                </Card>
              </Card>

              {/* Deal Grade Summary */}
              <Card className="bg-gradient-to-r from-gray-50 to-blue-50">
                <Row gutter={16}>
                  <Col xs={24} md={8}>
                    <div className="text-center">
                      <Title level={5}>Deal Strengths</Title>
                      <List
                        size="small"
                        dataSource={analysis.analysis.dealArchitecture.dealGrade.dealStrengths}
                        renderItem={(strength) => (
                          <List.Item className="py-1">
                            <CheckCircleOutlined className="text-green-500 mr-2" />
                            <Text className="text-sm">{strength}</Text>
                          </List.Item>
                        )}
                      />
                    </div>
                  </Col>
                  <Col xs={24} md={8}>
                    <div className="text-center">
                      <Title level={5}>Deal Risks</Title>
                      <List
                        size="small"
                        dataSource={analysis.analysis.dealArchitecture.dealGrade.dealRisks}
                        renderItem={(risk) => (
                          <List.Item className="py-1">
                            <WarningOutlined className="text-orange-500 mr-2" />
                            <Text className="text-sm">{risk}</Text>
                          </List.Item>
                        )}
                      />
                    </div>
                  </Col>
                  <Col xs={24} md={8}>
                    <Card size="small" className="bg-white">
                      <Title level={5} className="text-center">Recommended Next Step</Title>
                      <div className="p-3 bg-blue-100 rounded text-center">
                        <Text strong className="text-blue-700">{analysis.analysis.dealArchitecture.dealGrade.recommendedNextStep}</Text>
                      </div>
                      <div className="mt-3 text-center">
                        <Text type="secondary" className="text-sm">{analysis.analysis.dealArchitecture.dealGrade.gradeReason}</Text>
                      </div>
                    </Card>
                  </Col>
                </Row>
              </Card>
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

      </Tabs>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4 mt-8">
        <Button 
          type="primary" 
          size="large"
          onClick={() => go({ to: "/sales-call-analyzer" })}
        >
          Back to Dashboard
        </Button>
        <Button 
          size="large"
          icon={<DownloadOutlined />}
          onClick={() => handleExport('detailed')}
        >
          Download Full Report
        </Button>
      </div>
    </div>
  );
}