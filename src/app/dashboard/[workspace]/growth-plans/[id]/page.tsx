"use client";

import React, { useState, useEffect } from 'react';
import {
  RocketOutlined,
  ArrowLeftOutlined,
  DownloadOutlined,
  CopyOutlined,
  EditOutlined,
  ShareAltOutlined,
  EyeOutlined,
  CalendarOutlined,
  UserOutlined,
  TeamOutlined,
  FundOutlined,
  PieChartOutlined,
  BarChartOutlined,
  AreaChartOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  TrophyOutlined,
  ThunderboltOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import {
  Button,
  Card,
  Typography,
  Divider,
  Space,
  Tag,
  Alert,
  Spin,
  message,
  Badge,
  Descriptions,
  Collapse,
  List,
  Modal,

  Tabs,
  Timeline,
  Progress,
  Avatar,
  notification
} from 'antd';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useParams, useRouter } from 'next/navigation';
import { useWorkspaceContext } from '../../../../hooks/useWorkspaceContext';

import { ConfigProvider } from "antd";

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;
const { TabPane } = Tabs;

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

// types/growthPlan.ts
export interface GeneratedGrowthPlan {
  executiveSummary: string;
  strategy: {
    stages: Array<{
      title: string;
      duration: string;
      tasks: string[];
      kpis: string[];
      budget: number;
    }>;
    priorities: Array<{
      area: string;
      impact: string;
      effort: string;
      timeline: string;
    }>;
    recommendations: string[];
    risks: Array<{
      risk: string;
      mitigation: string;
      probability: string;
    }>;
  };
  metrics: {
    timeline: Array<{
      month: string;
      leads: number;
      revenue: number;
      customers: number;
      cac: number;
      ltv: number;
    }>;
    kpis: Array<{
      name: string;
      current: number;
      target: number;
      improvement: number;
    }>;
    channels: Array<{
      name: string;
      allocation: number;
      expectedROI: number;
      status: string;
    }>;
  };
  implementation: {
    phases: Array<{
      name: string;
      duration: string;
      objectives: string[];
      deliverables: string[];
      resources: string[];
    }>;
    timeline: string;
    budget: {
      total: number;
      breakdown: Array<{
        category: string;
        amount: number;
        percentage: number;
      }>;
    };
  };
  nextSteps: string[];
  tokensUsed: number;
  generationTime: number;
}

export interface GrowthPlanDetail {
  id: string;
  title: string;
  plan: GeneratedGrowthPlan;
  metadata: {
    clientCompany: string;
    industry: string;
    timeframe: string;
    contactName: string;
    contactRole: string;
    generatedAt: string;
    tokensUsed: number;
    generationTime: number;
    consultant: {
      name: string;
      company: string;
      expertise: string[];
    };
  };
  createdAt: string;
  updatedAt: string;
  workspaceId: string;
  status: 'completed' | 'processing' | 'failed';
}

const GrowthPlanDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const { currentWorkspace, isWorkspaceReady } = useWorkspaceContext();
  const [loading, setLoading] = useState(true);
  const [planDetail, setPlanDetail] = useState<GrowthPlanDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [exportLoading, setExportLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const planId = params.id as string;

  useEffect(() => {
    if (isWorkspaceReady && currentWorkspace) {
      fetchPlanDetail();
    }
  }, [isWorkspaceReady, currentWorkspace, planId]);

  useEffect(() => {
    if (planDetail) {
      console.log('Current planDetail:', JSON.stringify(planDetail, null, 2));
      console.log('Metrics KPIs:', JSON.stringify(planDetail.plan.metrics?.kpis, null, 2));
    }
  }, [planDetail]);

  const fetchPlanDetail = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/growth-plans/${planId}?workspaceId=${currentWorkspace?.id}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch plan details: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('API Response:', JSON.stringify(data, null, 2));

      if (!data.success) {
        throw new Error(data.error || 'Failed to load plan details');
      }

      const plan = data.data.plan as GrowthPlanDetail;
      console.log('Parsed Plan:', JSON.stringify(plan, null, 2));

      if (!plan || !plan.metadata || !plan.metadata.clientCompany) {
        console.warn('Invalid plan data: Missing required fields', {
          hasPlan: !!plan,
          hasMetadata: !!plan?.metadata,
          hasClientCompany: !!plan?.metadata?.clientCompany,
          metadataKeys: plan?.metadata ? Object.keys(plan.metadata) : [],
        });
        throw new Error('Invalid plan data: Missing required fields');
      }

      setPlanDetail(plan);
      console.log('Set planDetail:', JSON.stringify(plan, null, 2));
    } catch (err) {
      console.error('Error fetching plan detail:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      message.error('Failed to load plan details');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      message.success('Copied to clipboard!');
    } catch (error) {
      message.error('Failed to copy to clipboard');
    }
  };

  const downloadPlan = async (format: 'pdf' | 'word' | 'markdown' = 'markdown') => {
    if (!planDetail) return;

    setExportLoading(true);
    try {
      const response = await fetch(`/api/growth-plans/${planId}/export?format=${format}&workspaceId=${currentWorkspace?.id}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to export plan');
      }

      if (result.success && result.data) {
        const blob = new Blob([result.data.content], { type: result.data.mimeType });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = result.data.filename;
        anchor.style.display = 'none';
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);
        message.success('Growth plan exported successfully');
      } else {
        throw new Error(result.error || 'Export failed');
      }
    } catch (err) {
      console.error('Export error:', err);
      notification.error({
        message: 'Export Failed',
        description: err instanceof Error ? err.message : 'Please try again later',
        placement: 'topRight',
      });
    } finally {
      setExportLoading(false);
    }
  };

  const handleRegenerate = async () => {
    if (!planDetail) return;

    setRegenerating(true);
    try {
      message.info('Regeneration feature coming soon!');
    } catch (err) {
      console.error('Regeneration error:', err);
      notification.error({
        message: 'Regeneration Failed',
        description: err instanceof Error ? err.message : 'Please try again later',
        placement: 'topRight',
      });
    } finally {
      setRegenerating(false);
    }
  };

  const navigateToEditor = () => {
    if (planDetail) {
      router.push(`/dashboard/${currentWorkspace?.slug}/growth-plans?load=${planId}`);
    }
  };

  const getTimeframeDisplay = (timeframe: string) => {
    const timeframeMap: Record<string, string> = {
      '3m': '3 Months',
      '6m': '6 Months',
      '12m': '12 Months'
    };
    return timeframeMap[timeframe] || timeframe;
  };

  const sanitizeChartData = (data: any[]): any[] | null => {
    try {
      if (!Array.isArray(data)) return null;
      if (data.length === 0) return null;

      return data
        .filter(item => item && typeof item === 'object')
        .map((item, index) => {
          const sanitized: any = {};
          sanitized.name = item.name || item.month || `Item ${index + 1}`;
          sanitized.month = item.month || item.name || `Period ${index + 1}`;
          if (typeof sanitized.month !== 'string') {
            sanitized.month = String(sanitized.month);
          }
          ['revenue', 'leads', 'customers', 'cac', 'ltv', 'allocation', 'expectedROI', 'current', 'target', 'improvement'].forEach(field => {
            let value = item[field];
            if (value !== null && value !== undefined) {
              const numValue = Number(value);
              if (!isNaN(numValue) && isFinite(numValue) && numValue >= 0) {
                sanitized[field] = Math.round(numValue);
              } else {
                sanitized[field] = 0;
              }
            } else {
              sanitized[field] = 0;
            }
          });
          sanitized.status = item.status || 'unknown';
          return sanitized;
        })
        .filter(item =>
          Object.keys(item).some(key =>
            key !== 'month' && key !== 'name' && key !== 'status' &&
            typeof item[key] === 'number' && item[key] > 0
          )
        );
    } catch (error) {
      console.error('Data sanitization error:', error);
      return null;
    }
  };

  const renderSafeLineChart = (data: any[]) => {
    try {
      const sanitizedData = sanitizeChartData(data);
      if (!sanitizedData || sanitizedData.length === 0) {
        return <Text type="secondary">No growth data available</Text>;
      }

      return (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={sanitizedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => {
                if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
                return value.toString();
              }}
            />
            <Tooltip
              formatter={(value: any, name: string) => [
                typeof value === 'number' ? value.toLocaleString() : value,
                name
              ]}
              labelFormatter={(label) => `Period: ${label}`}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#8884d8"
              strokeWidth={2}
              dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="leads"
              stroke="#82ca9d"
              strokeWidth={2}
              dot={{ fill: '#82ca9d', strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      );
    } catch (error) {
      console.error('LineChart error:', error);
      return <Alert message="Chart unavailable" description="Unable to display growth chart" type="warning" showIcon />;
    }
  };

  const renderSafePieChart = (data: any[]) => {
    try {
      const sanitizedData = sanitizeChartData(data);
      if (!sanitizedData || sanitizedData.length === 0) {
        return <Text type="secondary">No channel data available</Text>;
      }

      return (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={sanitizedData}
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill="#8884d8"
              dataKey="allocation"
              label={({ name, allocation }) => `${name}: ${allocation}%`}
            >
              {sanitizedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      );
    } catch (error) {
      console.error('PieChart error:', error);
      return <Alert message="Chart unavailable" description="Unable to display channel chart" type="warning" showIcon />;
    }
  };

    const handleBack = () => {
    router.push(`/submissions`);
  };


  const renderSafeBarChart = (data: any[]) => {
    try {
      const sanitizedData = sanitizeChartData(data);
      if (!sanitizedData || sanitizedData.length === 0) {
        return <Text type="secondary">No KPI data available</Text>;
      }

      return (
       <ResponsiveContainer width="100%" height="100%">
  <BarChart data={sanitizedData}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="name" />
    <YAxis />
    <Tooltip />
    <Legend />
    <Bar dataKey="current" fill="#4ade80" name="Current" />
    <Bar dataKey="target" fill="#60a5fa" name="Target" />
  </BarChart>
</ResponsiveContainer>

      );
    } catch (error) {
      console.error('BarChart error:', error);
      return <Alert message="Chart unavailable" description="Unable to display KPI chart" type="warning" showIcon />;
    }
  };

  if (!isWorkspaceReady) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 text-center">

        <ConfigProvider
  theme={{
    token: {
      colorPrimary: '#5CC49D',
    },
  }}
>
     <Spin size="large" tip="Loading workspace..." />
</ConfigProvider>
   
        <p className="mt-4"></p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 text-center">

        <ConfigProvider
  theme={{
    token: {
      colorPrimary: '#5CC49D',
    },
  }}
>
 <Spin size="large" tip="Loading growth plan details.." />
</ConfigProvider>
       
        <p className="mt-4">.</p>
      </div>
    );
  }

  if (error || !planDetail) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Alert
          message="Error Loading Growth Plan"
          description={error || "Could not find the requested growth plan"}
          type="error"
          showIcon
          action={
            <Button type="primary" onClick={fetchPlanDetail}>
              Try Again
            </Button>
          }
        />
        <div className="mt-4 text-center">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push(`/dashboard/${currentWorkspace?.slug}/work`)}
          >
            Back to Work Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const planData = planDetail.plan;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button
          icon={<ArrowLeftOutlined />}
         onClick={handleBack}
        >
          Back to Work
        </Button>

        <Space>
          {/* <Button
            icon={<EditOutlined />}
            onClick={navigateToEditor}
          >
            Edit & Regenerate
          </Button> */}
          {/* <Button
            type="primary"
            icon={<DownloadOutlined />}
            loading={exportLoading}
            onClick={() => downloadPlan('markdown')}
          >
            Export
          </Button> */}
        </Space>
      </div>

      <div className="text-center mb-8">
        <Title level={2} className="flex items-center justify-center">
          <RocketOutlined className="mr-2" />
          Growth Plan Details
        </Title>
        <Text type="secondary">
          Generated on {new Date(planDetail.createdAt).toLocaleDateString()}
        </Text>
      </div>

      {/* Plan Information */}
      <Card className="mb-6">
        {planDetail && !planDetail.metadata && (
          <Alert
            message="Missing Plan Metadata"
            description="The plan data is incomplete. Please try refreshing or contact support."
            type="warning"
            showIcon
            className="mb-4"
          />
        )}
        <Descriptions title="Plan Information" bordered column={1}>
          <Descriptions.Item label="Title">
            <Text strong>{planDetail?.title || 'Untitled'}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Client Company">
            {planDetail?.metadata?.clientCompany || 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Industry">
            <Tag color="blue">{planDetail?.metadata?.industry || 'N/A'}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Timeframe">
            <Tag color="green">{getTimeframeDisplay(planDetail?.metadata?.timeframe || 'N/A')}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Contact">
            {planDetail?.metadata?.contactName
              ? `${planDetail.metadata.contactName} (${planDetail.metadata.contactRole || 'N/A'})`
              : 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Consultant">
            {planDetail?.metadata?.consultant?.name
              ? `${planDetail.metadata.consultant.name} - ${planDetail.metadata.consultant.company || 'N/A'}`
              : 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Expertise">
            <Space wrap>
              {planDetail?.metadata?.consultant?.expertise?.map((expertise: string, index: number) => (
                <Tag key={index} color="purple">{expertise}</Tag>
              )) || <Text type="secondary">No expertise listed</Text>}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Created">
            <Space>
              <CalendarOutlined />
              {planDetail?.createdAt ? new Date(planDetail.createdAt).toLocaleString() : 'N/A'}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <Badge
              status={planDetail?.status === 'completed' ? 'success' : 'processing'}
              text={planDetail?.status?.toUpperCase() || 'UNKNOWN'}
            />
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Plan Content */}
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          type="card"
          size="large"
        >
          {/* Overview Tab */}
          <TabPane
            key="overview"
            tab={
              <span>
                <EyeOutlined />
                Overview
              </span>
            }
          >
            <div className="space-y-6">
              <Card>
                <Title level={4}>Executive Summary</Title>
                <Paragraph>
                  {planData.executiveSummary || 'No executive summary available.'}
                </Paragraph>
              </Card>

              <Card>
                <Title level={4}>Key Objectives</Title>
                {planData.strategy?.stages?.length > 0 ? (
                  <List
                    dataSource={planData.strategy.stages.flatMap((stage: any) => stage.kpis || [])}
                    renderItem={(objective: string, index: number) => (
                   <List.Item style={{ display: "flex", alignItems: "center", justifyContent: "flex-start" }}>
  <CheckCircleOutlined className="text-green-500 mr-2" />
  <Text>{objective}</Text>
</List.Item>
                    )}
                  />
                ) : (
                  <Text type="secondary">No objectives available</Text>
                )}
              </Card>

              <Card>
                <Title level={4}>Expected Outcomes</Title>
                {planData.metrics?.kpis && planData.metrics.kpis.length > 0 ? (
                  <div className="space-y-6">
                    <div className="h-80">
                      {renderSafeBarChart(planData.metrics.kpis)}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {planData.metrics.kpis.map((kpi: any, index: number) => (
                        <Card key={index} size="small">
                          <Text strong>{kpi.name || 'Unnamed KPI'}</Text>
                          <div className="mt-2">
                            <Progress
                              percent={Math.min(100, (kpi.current / (kpi.target || 1)) * 100)}
                              status="active"
                              format={() => `${kpi.current} / ${kpi.target}`}
                            />
                          </div>
                          <Text type="secondary" className="text-sm">
                            {kpi.improvement}% improvement target
                          </Text>
                        </Card>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Text type="secondary">No KPI data available</Text>
                )}
              </Card>
            </div>
          </TabPane>

          {/* Strategy Tab */}
          <TabPane
            key="strategy"
            tab={
              <span>
                <FundOutlined />
                Strategy
              </span>
            }
          >
            <div className="space-y-6">
              <Card>
                <Title level={4}>Implementation Timeline</Title>
                <Timeline>
                  {planData.strategy?.stages?.map((stage: any, index: number) => (
                    <Timeline.Item
                      key={index}
                      dot={<ClockCircleOutlined style={{ fontSize: '16px' }} />}
                    >
                      <Title level={5}>{stage.title}</Title>
                      <Text type="secondary">{stage.duration}</Text>
                      {stage.budget && (
                        <div className="mt-1">
                          <Text strong>Budget: ${stage.budget.toLocaleString()}</Text>
                        </div>
                      )}
                      <ul className="mt-2">
                        {stage.tasks?.map((task: string, i: number) => (
                          <li key={i}>{task}</li>
                        ))}
                      </ul>
                    </Timeline.Item>
                  ))}
                </Timeline>
              </Card>

              <Card>
                <Title level={4}>Strategic Priorities</Title>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {planData.strategy?.priorities?.map((priority: any, index: number) => (
                    <Card key={index} size="small">
                      <Title level={5}>{priority.area}</Title>
                      <div className="flex justify-between mt-2">
                        <span>Impact:</span>
                        <Tag color={priority.impact === 'high' ? 'red' : priority.impact === 'medium' ? 'orange' : 'green'}>
                          {priority.impact}
                        </Tag>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span>Effort:</span>
                        <Tag color={priority.effort === 'high' ? 'red' : priority.effort === 'medium' ? 'orange' : 'green'}>
                          {priority.effort}
                        </Tag>
                      </div>
                      <div className="mt-2">
                        <Text type="secondary">{priority.timeline}</Text>
                      </div>
                    </Card>
                  ))}
                </div>
              </Card>
            </div>
          </TabPane>

          {/* Metrics Tab */}
          <TabPane
            key="metrics"
            tab={
              <span>
                <BarChartOutlined />
                Metrics
              </span>
            }
          >
            <div className="space-y-6">
              <Card>
                <Title level={4}>Growth Projection</Title>
                <div className="h-80">
                  {renderSafeLineChart(planData.metrics?.timeline || [])}
                </div>
              </Card>

              <Card>
                <Title level={4}>Channel Performance</Title>
                <div className="h-80">
                  {renderSafePieChart(planData.metrics?.channels || [])}
                </div>
              </Card>
            </div>
          </TabPane>

          {/* Channels Tab */}
          <TabPane
            key="channels"
            tab={
              <span>
                <PieChartOutlined />
                Channels
              </span>
            }
          >
            <Card>
              <Title level={4}>Marketing Channels</Title>
              <List
                dataSource={planData.metrics?.channels || []}
                renderItem={(channel: any) => (
                  <List.Item
                    actions={[
                      <Tag
                        key="status-tag"
                        color={channel.status === 'active' ? 'green' : 'orange'}
                      >
                        {channel.status}
                      </Tag>
                    ]}
                  >
                    <List.Item.Meta
                      title={channel.name}
                      description={
                        <div>
                          <div>Allocation: {channel.allocation}%</div>
                          <div>Expected ROI: {channel.expectedROI}%</div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          </TabPane>

          {/* Next Steps Tab */}
          <TabPane
            key="next-steps"
            tab={
              <span>
                <CheckCircleOutlined />
                Next Steps
              </span>
            }
          >
            <Card>
              <Title level={4}>Implementation Roadmap</Title>
              <List
                dataSource={planData.nextSteps || []}
                renderItem={(step: string, index: number) => (
                  <List.Item>
                    <div className="flex items-start">
                      <div className="bg-blue-100 text-blue-600 rounded-full p-2 mr-3">
                        <Text strong>{index + 1}</Text>
                      </div>
                      <div className="flex-1">
                        <Text>{step}</Text>
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            </Card>
          </TabPane>
        </Tabs>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4 mt-8">
        <Button
          icon={<DownloadOutlined />}
          loading={exportLoading}
          onClick={() => downloadPlan('markdown')}
          size="large"
        >
          Export Plan
        </Button>
        {/* <Button
          icon={<ShareAltOutlined />}
          onClick={() => {
            copyToClipboard(`${window.location.origin}/dashboard/${currentWorkspace?.slug}/growth-plans/${planId}`);
            message.success('Link copied to clipboard!');
          }}
          size="large"
        >
          Share Link
        </Button> */}
        {/* <Button
          icon={<ReloadOutlined />}
          loading={regenerating}
          onClick={handleRegenerate}
          size="large"
        >
          Regenerate
        </Button> */}
      </div>
    </div>
  );
};

export default GrowthPlanDetailPage;