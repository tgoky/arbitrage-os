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
  CalendarOutlined
} from '@ant-design/icons';
import {
  Button,
  Card,
  Typography,
  Space,
  Progress,
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
       
    detailedReport?: string;  // ADD THIS
    followUpEmail?: string;   // ADD THIS
    proposalTemplate?: string; // ADD THIS TOO (from your service)
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
            <Card title="Detailed Report Preview" className="mb-4">
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
                  {keyMoments.length > 0 ? keyMoments.map((moment, index) => (
                    <Timeline.Item
                      key={index}
                      color={
                        moment.type === 'positive' ? 'green' :
                        moment.type === 'negative' ? 'red' :
                        moment.type === 'action' ? 'blue' : 'gray'
                      }
                    >
                      {/* <Text strong>{moment.timestamp}</Text> */}
                      <br />
                      {moment.description}
                    </Timeline.Item>
                  )) : <Text type="secondary">No key moments identified.</Text>}
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