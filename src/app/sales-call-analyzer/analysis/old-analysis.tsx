// app/sales-call-analyzer/analysis/[id]/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import {
  ArrowLeftOutlined,
  DownloadOutlined,
  ShareAltOutlined,
  EditOutlined,
  StarOutlined,
  TrophyOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  UserOutlined,
  ClockCircleOutlined,
  PhoneOutlined
} from '@ant-design/icons';
import {
  Button,
  Card,
  Typography,
  Space,
  Tag,
  Progress,
  Tabs,
  List,
  Avatar,
  Statistic,
  Row,
  Col,
  Timeline,
  Alert,
  message,
  Spin
} from 'antd';
import { useGo } from "@refinedev/core";
import { useSalesCallAnalyzer } from '../../../hooks/useSalesCallAnalyzer';
import { useParams } from "next/navigation";

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

export default function AnalysisDetailPage() {
  const go = useGo();
  const params = useParams();
  const analysisId = params?.id as string;
  
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const { getAnalysis, exportAnalysis } = useSalesCallAnalyzer();

  useEffect(() => {
    if (analysisId) {
      loadAnalysis();
    }
  }, [analysisId]);

  const loadAnalysis = async () => {
    try {
      setLoading(true);
      const data = await getAnalysis(analysisId);
      setAnalysis(data);
    } catch (error) {
      console.error('Failed to load analysis:', error);
      message.error('Failed to load analysis');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'summary' | 'detailed' | 'presentation' | 'follow-up') => {
    try {
      await exportAnalysis(analysisId, format);
      message.success(`${format} exported successfully`);
    } catch (error) {
      message.error('Failed to export analysis');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spin size="large" />
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="text-center py-12">
        <ExclamationCircleOutlined className="text-4xl text-gray-400 mb-4" />
        <Title level={4}>Analysis Not Found</Title>
        <Button type="primary" onClick={() => go({ to: "/sales-call-analyzer" })}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const callData = analysis.analysis.callResults;
  const metadata = analysis.metadata;
  const summaryPresentation = analysis.analysis.summaryPresentation || [];
  const nextStepsStrategy = analysis.analysis.nextStepsStrategy || {};

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'green';
      case 'negative': return 'red';
      case 'mixed': return 'orange';
      default: return 'blue';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#52c41a';
    if (score >= 60) return '#faad14';
    return '#ff4d4f';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
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
            <Space>
              <Tag color="blue">{metadata.callType}</Tag>
              <Tag color={getSentimentColor(callData.analysis.sentiment)}>
                {callData.analysis.sentiment}
              </Tag>
              <Text type="secondary">
                {new Date(analysis.createdAt).toLocaleDateString()}
              </Text>
            </Space>
          </div>
        </div>
        
        <Space>
          <Button 
            icon={<EditOutlined />}
            onClick={() => go({ to: `/sales-call-analyzer/edit/${analysisId}` })}
          >
            Edit
          </Button>
          <Button.Group>
            <Button 
              icon={<DownloadOutlined />}
              onClick={() => handleExport('summary')}
            >
              Export Summary
            </Button>
            <Button 
              onClick={() => handleExport('detailed')}
            >
              Detailed
            </Button>
            <Button 
              onClick={() => handleExport('presentation')}
            >
              Presentation
            </Button>
          </Button.Group>
        </Space>
      </div>

      {/* Key Metrics */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Overall Score"
              value={callData.analysis.overallScore}
              suffix="/ 100"
              valueStyle={{ color: getScoreColor(callData.analysis.overallScore) }}
            />
            <Progress
              percent={callData.analysis.overallScore}
              strokeColor={getScoreColor(callData.analysis.overallScore)}
              size="small"
              className="mt-2"
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Duration"
              value={Math.floor(callData.duration / 60)}
              suffix="min"
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Participants"
              value={callData.participants.length}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Talk Time Balance"
              value={analysis.analysis.performanceMetrics?.talkTime || 0}
              suffix="%"
              prefix={<PhoneOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Content Tabs */}
      <Tabs defaultActiveKey="overview" className="mb-6">
        <TabPane tab="Overview" key="overview">
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={16}>
              <Card title="Key Insights" className="mb-4">
                <List
                  dataSource={callData.analysis.keyInsights}
                  renderItem={(insight: string, index: number) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<Avatar icon={<StarOutlined />} size="small" />}
                        description={insight}
                      />
                    </List.Item>
                  )}
                />
              </Card>

              <Card title="Action Items">
                <List
                  dataSource={callData.analysis.actionItems}
                  renderItem={(item: string, index: number) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<Avatar icon={<CheckCircleOutlined />} size="small" />}
                        description={item}
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </Col>

            <Col xs={24} lg={8}>
              <Card title="Call Details" className="mb-4">
                <div className="space-y-3">
                  <div>
                    <Text type="secondary">Company:</Text>
                    <div>{metadata.companyName || 'Not specified'}</div>
                  </div>
                  <div>
                    <Text type="secondary">Prospect:</Text>
                    <div>{metadata.prospectName || 'Not specified'}</div>
                  </div>
                  <div>
                    <Text type="secondary">Industry:</Text>
                    <div>{metadata.companyIndustry || 'Not specified'}</div>
                  </div>
                  <div>
                    <Text type="secondary">Sentiment:</Text>
                    <div>
                      <Tag color={getSentimentColor(callData.analysis.sentiment)}>
                        {callData.analysis.sentiment}
                      </Tag>
                    </div>
                  </div>
                </div>
              </Card>

              <Card title="Speaker Breakdown">
                {callData.analysis.speakerBreakdown?.map((speaker: any, index: number) => (
                  <div key={index} className="mb-3">
                    <div className="flex justify-between mb-1">
                      <Text strong>{speaker.speaker}</Text>
                      <Text type="secondary">{speaker.percentage}%</Text>
                    </div>
                    <Progress 
                      percent={speaker.percentage} 
                      size="small"
                      showInfo={false}
                    />
                  </div>
                ))}
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab="Performance Analysis" key="performance">
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card title="Strengths" className="mb-4">
                <List
                  dataSource={callData.coachingFeedback.strengths}
                  renderItem={(strength: string) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<Avatar icon={<TrophyOutlined />} style={{ backgroundColor: '#52c41a' }} size="small" />}
                        description={strength}
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card title="Areas for Improvement" className="mb-4">
                <List
                  dataSource={callData.coachingFeedback.improvements}
                  renderItem={(improvement: string) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<Avatar icon={<ExclamationCircleOutlined />} style={{ backgroundColor: '#faad14' }} size="small" />}
                        description={improvement}
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
          </Row>

          <Card title="Specific Suggestions">
            <List
              dataSource={callData.coachingFeedback.specificSuggestions}
              renderItem={(suggestion: string) => (
                <List.Item>
                  <Text>{suggestion}</Text>
                </List.Item>
              )}
            />
          </Card>
        </TabPane>

        <TabPane tab="Next Steps" key="nextsteps">
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card title="Immediate Actions" className="mb-4">
                <Timeline
                  items={nextStepsStrategy.immediateActions?.map((action: string) => ({
                    children: action,
                    color: 'red'
                  })) || []}
                />
              </Card>

              <Card title="Short Term Goals">
                <Timeline
                  items={nextStepsStrategy.shortTermGoals?.map((goal: string) => ({
                    children: goal,
                    color: 'blue'
                  })) || []}
                />
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card title="Long Term Strategy" className="mb-4">
                <Timeline
                  items={nextStepsStrategy.longTermStrategy?.map((strategy: string) => ({
                    children: strategy,
                    color: 'green'
                  })) || []}
                />
              </Card>

              {callData.followUpEmail && (
                <Card title="Generated Follow-up Email">
                  <Paragraph copyable className="whitespace-pre-wrap text-sm">
                    {callData.followUpEmail}
                  </Paragraph>
                </Card>
              )}
            </Col>
          </Row>
        </TabPane>

        <TabPane tab="Transcript" key="transcript">
          <Card>
            <Paragraph copyable className="whitespace-pre-wrap">
              {callData.transcript}
            </Paragraph>
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
}