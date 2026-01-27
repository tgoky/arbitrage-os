"use client";

import React, { useState, useEffect } from 'react';
import {
  PhoneOutlined,
  UserOutlined,
  BankOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  DownloadOutlined,
  ArrowLeftOutlined,
  BarChartOutlined,
  FileTextOutlined,
  TeamOutlined,
  LikeOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
  ShareAltOutlined,
  EditOutlined
} from '@ant-design/icons';
import {
  Card,
  Typography,
  Button,
  Space,
  Row,
  Col,
  Statistic,
  List,
  Tag,
  Progress,
  Alert,
  Spin,
  notification,
  Tabs,
  Avatar,
  Breadcrumb
} from 'antd';
import { useParams, useRouter } from 'next/navigation';
import { useWorkspaceContext } from '../../../../hooks/useWorkspaceContext';

import { ConfigProvider } from "antd";

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

const SalesCallAnalysisDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const { currentWorkspace, isWorkspaceReady } = useWorkspaceContext();
  
  const [analysis, setAnalysis] = useState<any>(null);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const analysisId = params.id as string;

  const fetchAnalysisDetail = async () => {
    if (!isWorkspaceReady || !currentWorkspace || !analysisId) {
      console.log('Prerequisites not met for fetching analysis');
      return;
    }

    setFetchLoading(true);
    setFetchError(null);

    try {
      console.log(`Fetching analysis ${analysisId} for workspace ${currentWorkspace.id}`);
      
      const response = await fetch(
        `/api/sales-call-analyzer/${analysisId}?workspaceId=${currentWorkspace.id}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-Workspace-Id': currentWorkspace.id,
          },
          credentials: 'include'
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch analysis`);
      }

      const result = await response.json();
      console.log('✅ Detail page API response:', result);

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch analysis data');
      }

      if (!result.data) {
        throw new Error('No analysis data returned from API');
      }

      setAnalysis(result.data);
      
    } catch (err) {
      console.error('Error fetching analysis:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setFetchError(errorMessage);
      notification.error({
        message: 'Failed to Load Analysis',
        description: errorMessage
      });
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    if (isWorkspaceReady && analysisId && currentWorkspace) {
      fetchAnalysisDetail();
    }
  }, [analysisId, isWorkspaceReady, currentWorkspace?.id]);

  const handleExport = async (format: 'summary' | 'detailed' | 'presentation' | 'follow-up' = 'summary') => {
    if (!currentWorkspace || !analysisId) {
      notification.error({
        message: 'Export Failed',
        description: 'Missing workspace or analysis ID'
      });
      return;
    }

    setExporting(true);
    try {
      const response = await fetch(
        `/api/sales-call-analyzer/export/${analysisId}?format=${format}&workspaceId=${currentWorkspace.id}`,
        {
          method: 'GET',
          headers: {
            'X-Workspace-Id': currentWorkspace.id,
          },
          credentials: 'include'
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `call-analysis-${format}-${analysisId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      notification.success({
        message: 'Export Successful',
        description: `${format.charAt(0).toUpperCase() + format.slice(1)} report downloaded.`
      });
    } catch (err) {
      console.error('Export error:', err);
      notification.error({
        message: 'Export Failed',
        description: err instanceof Error ? err.message : 'Failed to export analysis'
      });
    } finally {
      setExporting(false);
    }
  };

  // const handleBack = () => {
  //   router.push(`/dashboard/${currentWorkspace?.slug}/sales-call-analyzer`);
  // };

    const handleBack = () => {
    router.push(`/submissions`);
  };

  const handleEdit = () => {
    router.push(`/dashboard/${currentWorkspace?.slug}/sales-call-analyzer/review-recording?edit=${analysisId}`);
  };

  // Loading state
  if (!isWorkspaceReady) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>

        <ConfigProvider
  theme={{
    token: {
      colorPrimary: '#5CC49D',
    },
  }}
>
 <Spin size="large" tip="Loading workspace..." />
</ConfigProvider>
       
        <p></p>
      </div>
    );
  }

  if (fetchLoading && !analysis) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>

        <ConfigProvider
  theme={{
    token: {
      colorPrimary: '#5CC49D',
    },
  }}
>
       <Spin size="large" tip="Loading analysis details..." />
</ConfigProvider>
 
      </div>
    );
  }

  // Error state
  if (fetchError || !analysis) {
    return (
      <div style={{ padding: '40px' }}>
        <Alert
          message="Analysis Not Found"
          description={fetchError || "The requested sales call analysis could not be found."}
          type="error"
          showIcon
          action={
            <Space>
              <Button onClick={handleBack} icon={<ArrowLeftOutlined />}>
                Back to Analyzer
              </Button>
              <Button onClick={fetchAnalysisDetail} icon={<ReloadOutlined />}>
                Try Again
              </Button>
            </Space>
          }
        />
      </div>
    );
  }

  // Helper functions
  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive': return 'green';
      case 'negative': return 'red';
      case 'mixed': return 'orange';
      case 'neutral': return 'blue';
      default: return 'blue';
    }
  };

  const getScoreColor = (score?: number) => {
    if (!score) return 'default';
    if (score >= 80) return 'green';
    if (score >= 60) return 'orange';
    return 'red';
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return '0:00';
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // FIXED: Correct data mapping based on your service structure
  const title = analysis.title || 'Untitled Call';
  const callType = analysis.metadata?.callType || 'discovery';
  const overallScore = analysis.metadata?.overallScore || 0;
  const sentiment = analysis.metadata?.sentiment || 'neutral';
  const duration = analysis.metadata?.duration || 0;
  const createdAt = analysis.createdAt;
  const prospectName = analysis.metadata?.prospectName;
  const companyName = analysis.metadata?.companyName;
  const prospectTitle = analysis.metadata?.prospectTitle;
  const companyLocation = analysis.metadata?.companyLocation;
  const companyIndustry = analysis.metadata?.companyIndustry;

  // Analysis content from the nested structure
  const keyInsights = analysis.analysis?.callResults?.analysis?.keyInsights || [];
  const actionItems = analysis.analysis?.callResults?.analysis?.actionItems || [];
  const executiveSummary = analysis.analysis?.callResults?.executiveSummary;
  const detailedReport = analysis.analysis?.callResults?.detailedReport;
  const transcript = analysis.analysis?.callResults?.transcript;

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Breadcrumb */}
      
      <Breadcrumb style={{ marginBottom: '24px' }}>
        <Breadcrumb.Item>
          <a onClick={handleBack} style={{ cursor: 'pointer' }}>
            Sales Call Analyzer
          </a>
        </Breadcrumb.Item>
        <Breadcrumb.Item>Analysis Details</Breadcrumb.Item>
      </Breadcrumb>

      

      {/* Header */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>
            <PhoneOutlined style={{ marginRight: '12px', color: '#1890ff' }} />
            {title}
          </Title>
          <Text type="secondary">
            Analyzed on {new Date(createdAt || Date.now()).toLocaleDateString()} • {currentWorkspace?.name}
          </Text>
          
        </div>
         <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={handleBack}
          >
            Back to Submissions
          </Button>
        <Space>
         
          {/* <Button 
            icon={<EditOutlined />}
            onClick={handleEdit}
          >
            Edit
          </Button> */}
          {/* <Button 
            type="primary" 
            icon={<DownloadOutlined />}
            onClick={() => handleExport('detailed')}
            loading={exporting}
          >
            Export
          </Button> */}
        </Space>
      </div>

      {/* Quick Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Overall Score"
              value={overallScore}
              suffix="/100"
              valueStyle={{ color: getScoreColor(overallScore) }}
              prefix={<LikeOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Sentiment"
              value={sentiment}
              valueRender={() => (
                <Tag color={getSentimentColor(sentiment)}>
                  {sentiment}
                </Tag>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Duration"
              value={formatDuration(duration)}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Call Type"
              value={callType}
              valueRender={() => (
                <Tag color="blue">
                  {callType}
                </Tag>
              )}
            />
          </Card>
        </Col>
      </Row>

      {/* Export Options */}
      <Card style={{ marginBottom: '24px' }}>
        <Title level={4}>Export Options</Title>
        <Space wrap>
          <Button 
            icon={<FileTextOutlined />}
            onClick={() => handleExport('summary')}
            loading={exporting}
          >
            Summary
          </Button>
          <Button 
            icon={<BarChartOutlined />}
            onClick={() => handleExport('detailed')}
            loading={exporting}
          >
            Detailed Report
          </Button>
          <Button 
            icon={<TeamOutlined />}
            onClick={() => handleExport('presentation')}
            loading={exporting}
          >
            Presentation
          </Button>
          <Button 
            icon={<CheckCircleOutlined />}
            onClick={() => handleExport('follow-up')}
            loading={exporting}
          >
            Follow-up Plan
          </Button>
        </Space>
      </Card>

      {/* Main Content Tabs */}
      <Tabs activeKey={activeTab} onChange={setActiveTab} type="card">
        <TabPane tab="Overview" key="overview">
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              {/* Key Insights */}
              <Card title="Key Insights" style={{ marginBottom: '16px' }}>
                {keyInsights && keyInsights.length > 0 ? (
                  <List
                    dataSource={keyInsights}
                    renderItem={(item: string) => (
                      <List.Item>
                        <CheckCircleOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
                        {item}
                      </List.Item>
                    )}
                  />
                ) : (
                  <Text type="secondary">No key insights available</Text>
                )}
              </Card>

              {/* Participant Info */}
              <Card title="Participant Information" style={{ marginBottom: '16px' }}>
                <List
                  itemLayout="horizontal"
                  dataSource={[
                    {
                      label: 'Prospect',
                      value: prospectName,
                      icon: <UserOutlined />
                    },
                    {
                      label: 'Company',
                      value: companyName,
                      icon: <BankOutlined />
                    },
                    {
                      label: 'Title',
                      value: prospectTitle,
                      icon: <UserOutlined />
                    },
                    {
                      label: 'Location',
                      value: companyLocation,
                      icon: <EnvironmentOutlined />
                    },
                    {
                      label: 'Industry',
                      value: companyIndustry,
                      icon: <BankOutlined />
                    }
                  ]}
                  renderItem={(item) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<Avatar icon={item.icon} />}
                        title={item.label}
                        description={item.value || 'Not provided'}
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              {/* Action Items */}
              <Card title="Action Items" style={{ marginBottom: '16px' }}>
                {actionItems && actionItems.length > 0 ? (
                  <List
                    dataSource={actionItems}
                    renderItem={(item: string) => (
                      <List.Item>
                        <WarningOutlined style={{ color: '#faad14', marginRight: '8px' }} />
                        {item}
                      </List.Item>
                    )}
                  />
                ) : (
                  <Text type="secondary">No action items identified</Text>
                )}
              </Card>

              {/* Sentiment Analysis */}
              <Card title="Sentiment Analysis">
                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                  <Progress
                    type="circle"
                    percent={overallScore}
                    strokeColor={getScoreColor(overallScore)}
                    format={percent => `${percent}%`}
                  />
                </div>
                <Paragraph>
                  Overall sentiment: <Tag color={getSentimentColor(sentiment)}>
                    {sentiment}
                  </Tag>
                </Paragraph>
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab="Analysis" key="analysis">
          <Row gutter={[16, 16]}>
            <Col xs={24}>
              {/* Executive Summary */}
              <Card title="Executive Summary" style={{ marginBottom: '16px' }}>
                {executiveSummary ? (
                  <Paragraph>{executiveSummary}</Paragraph>
                ) : (
                  <Text type="secondary">Executive summary not available</Text>
                )}
              </Card>

              {/* Detailed Report */}
              <Card title="Detailed Analysis Report">
                {detailedReport ? (
                  <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                    {detailedReport}
                  </div>
                ) : (
                  <Text type="secondary">Detailed report not available</Text>
                )}
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab="Follow-up" key="followup">
          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <Card title="Follow-up Email Template">
                {analysis.analysis?.callResults?.followUpEmail ? (
                  <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, fontFamily: 'monospace', padding: '16px', borderRadius: '4px' }}>
                    {analysis.analysis.callResults.followUpEmail}
                  </div>
                ) : (
                  <Text type="secondary">Follow-up email template not available</Text>
                )}
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab="Transcript" key="transcript">
          <Card title="Call Transcript">
            {transcript ? (
              <div style={{ whiteSpace: 'pre-wrap', maxHeight: '600px', overflowY: 'auto', lineHeight: 1.6 }}>
                {transcript}
              </div>
            ) : (
              <Text type="secondary">No transcript available.</Text>
            )}
          </Card>
        </TabPane>
      </Tabs>

      {/* Additional Actions */}
      <Card style={{ marginTop: '24px' }}>
        <Title level={4}>Additional Actions</Title>
        <Space wrap>
          <Button 
            icon={<ShareAltOutlined />}
            onClick={() => {
              notification.info({
                message: 'Share Feature',
                description: 'Sharing functionality will be implemented soon.'
              });
            }}
          >
            Share Analysis
          </Button>
          <Button 
            icon={<ReloadOutlined />}
            onClick={fetchAnalysisDetail}
          >
            Refresh
          </Button>
        </Space>
      </Card>
    </div>
  );
};

export default SalesCallAnalysisDetailPage;