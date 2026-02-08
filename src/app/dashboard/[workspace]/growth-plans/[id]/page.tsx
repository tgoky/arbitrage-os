"use client";

import React, { useState, useEffect } from 'react';
import {
  RocketOutlined,
  ArrowLeftOutlined,
  DownloadOutlined,
  CopyOutlined,
  EditOutlined,
  EyeOutlined,
  CalendarOutlined,
  FundOutlined,
  PieChartOutlined,
  BarChartOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  DeleteOutlined,
  SaveOutlined
} from '@ant-design/icons';
import {
  Button,
  Card,
  Typography,
  Space,
  Tag,
  Alert,
  Spin,
  message,
  Badge,
  List,
  Tabs,
  Timeline,
  Progress,
  Avatar,
  notification,
  ConfigProvider,
  Tooltip,
  theme
} from 'antd';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { useParams, useRouter } from 'next/navigation';
import { useWorkspaceContext } from '../../../../hooks/useWorkspaceContext';

const { Title, Text, Paragraph } = Typography;

// --- DARK THEME DESIGN TOKENS (Match main page) ---
const BRAND_GREEN = '#5CC49D';
const SPACE_COLOR = '#9DA2B3';
const DARK_BG = '#0a0a0f';
const DARK_SURFACE = '#040404';
const DARK_CARD = '#000000';
const DARK_BORDER = '#2a2a3a';
const DARK_HOVER = '#242430';
const TEXT_PRIMARY = '#f0f0f5';
const TEXT_SECONDARY = '#9DA2B3';
const TEXT_MUTED = '#6b6b7a';

// Professional Chart Palette (Match main page)
const CHART_COLORS = ['#5CC49D', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

// Import the same interfaces from main page
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
  const [activeTab, setActiveTab] = useState('strategy');
  const [exportLoading, setExportLoading] = useState(false);

  const planId = params.id as string;

  useEffect(() => {
    if (isWorkspaceReady && currentWorkspace) {
      fetchPlanDetail();
    }
  }, [isWorkspaceReady, currentWorkspace, planId]);

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

      if (!data.success) {
        throw new Error(data.error || 'Failed to load plan details');
      }

      const plan = data.data.plan as GrowthPlanDetail;

      if (!plan || !plan.metadata || !plan.metadata.clientCompany) {
        throw new Error('Invalid plan data: Missing required fields');
      }

      setPlanDetail(plan);
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
      message.error('Failed to copy');
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
      if (!Array.isArray(data) || data.length === 0) return null;
      return data
        .filter(item => item && typeof item === 'object')
        .map((item, index) => {
          const sanitized: any = {};
          sanitized.month = item.month || item.name || item.period || `Period ${index + 1}`;
          if (typeof sanitized.month !== 'string') sanitized.month = String(sanitized.month);

          ['revenue', 'leads', 'customers', 'cac', 'ltv', 'allocation', 'expectedROI', 'current', 'target'].forEach(field => {
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

          sanitized.name = item.name || item.month || `Item ${index + 1}`;
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

  // --- CHART RENDERERS (Match main page) ---
  const renderSafeLineChart = (data: any[]) => {
    const sanitized = sanitizeChartData(data);
    if (!sanitized || sanitized.length === 0) return null;
    
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={sanitized} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={DARK_BORDER} vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: TEXT_MUTED }} axisLine={false} tickLine={false} dy={10} />
          <YAxis tick={{ fontSize: 11, fill: TEXT_MUTED }} axisLine={false} tickLine={false} tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value} />
          <RechartsTooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', background: DARK_SURFACE, color: TEXT_PRIMARY }}
            formatter={(value: number) => [value.toLocaleString(), '']}
          />
          <Legend iconType="circle" wrapperStyle={{ color: TEXT_SECONDARY }} />
          <Line type="monotone" dataKey="revenue" stroke={BRAND_GREEN} strokeWidth={3} dot={{ fill: BRAND_GREEN, r: 4 }} activeDot={{ r: 6 }} name="Revenue" />
          <Line type="monotone" dataKey="leads" stroke="#3B82F6" strokeWidth={3} dot={{ fill: '#3B82F6', r: 4 }} name="Leads" />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  const renderSafePieChart = (data: any[]) => {
    const sanitized = sanitizeChartData(data);
    if (!sanitized || sanitized.length === 0) return null;

    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={sanitized}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="allocation"
            label={({ name, allocation }) => `${name}: ${allocation}%`}
          >
            {sanitized.map((entry: any, index: number) => (
              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Pie>
          <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', background: DARK_SURFACE, color: TEXT_PRIMARY }} />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  const renderSafeBarChart = (data: any[]) => {
    const sanitized = sanitizeChartData(data);
    if (!sanitized || sanitized.length === 0) return null;
    
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={sanitized} layout="vertical" margin={{ top: 20, right: 30, left: 80, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={DARK_BORDER} horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11, fill: TEXT_MUTED }} axisLine={false} tickLine={false} />
          <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: TEXT_MUTED }} axisLine={false} tickLine={false} width={80} />
          <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', background: DARK_SURFACE, color: TEXT_PRIMARY }} />
          <Legend wrapperStyle={{ color: TEXT_SECONDARY }} />
          <Bar dataKey="current" fill={SPACE_COLOR} name="Current" radius={[0, 4, 4, 0]} />
          <Bar dataKey="target" fill={BRAND_GREEN} name="Target" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const handleBack = () => {
    router.push(`/submissions`);
  };

  if (!isWorkspaceReady) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: DARK_BG }}>

         <ConfigProvider
          theme={{
            token: {
              colorPrimary: '#5CC49D',
            },
          }}
        >
            <Spin size="large" />
        </ConfigProvider>
            
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: DARK_BG }}>


                <ConfigProvider
          theme={{
            token: {
              colorPrimary: '#5CC49D',
            },
          }}
        >
            <Spin size="large" tip="Loading growth plan..." />
        </ConfigProvider>
      
      </div>
    );
  }

  if (error || !planDetail) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8" style={{ background: DARK_BG, minHeight: '100vh' }}>
        <Alert
          message="Error Loading Growth Plan"
          description={error || "Could not find the requested growth plan"}
          type="error"
          showIcon
          style={{ background: DARK_SURFACE, borderColor: DARK_BORDER }}
          action={
            <Button type="primary" onClick={fetchPlanDetail} style={{ background: BRAND_GREEN, borderColor: BRAND_GREEN, color: '#000' }}>
              Try Again
            </Button>
          }
        />
        <div className="mt-4 text-center">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={handleBack}
            style={{ borderColor: DARK_BORDER, color: TEXT_SECONDARY }}
          >
            Back to Submissions
          </Button>
        </div>
      </div>
    );
  }

  const planData = planDetail.plan;
  const { metadata } = planDetail;

  if (!planData) {
    return (
      <div className="text-center py-12" style={{ background: DARK_BG, minHeight: '100vh' }}>
        <Alert
          message="Invalid Plan Data"
          description="The plan data appears to be corrupted."
          type="error"
          showIcon
          style={{ background: DARK_SURFACE, borderColor: '#ef4444' }}
        />
      </div>
    );
  }

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          fontFamily: 'Manrope, sans-serif',
          colorPrimary: BRAND_GREEN,
          borderRadius: 12,
          colorBgContainer: DARK_CARD,
          colorBgElevated: DARK_SURFACE,
          colorBgLayout: DARK_BG,
          colorBorder: DARK_BORDER,
          colorText: TEXT_PRIMARY,
          colorTextSecondary: TEXT_SECONDARY,
          colorTextTertiary: TEXT_MUTED,
        },
        components: {
          // Match main page component styles
          Button: {
            colorPrimary: BRAND_GREEN,
            algorithm: true,
            fontWeight: 600,
            colorTextLightSolid: '#000',
            defaultBorderColor: DARK_BORDER,
            defaultColor: TEXT_SECONDARY,
            defaultBg: DARK_CARD,
          },
          Card: {
            headerFontSize: 18,
            colorBgContainer: DARK_CARD,
            colorBorderSecondary: DARK_BORDER,
          },
          Tabs: {
            itemActiveColor: BRAND_GREEN,
            itemSelectedColor: BRAND_GREEN,
            inkBarColor: BRAND_GREEN,
            titleFontSize: 16,
            colorBgContainer: DARK_CARD,
          },
          Alert: {
            colorInfoBg: DARK_SURFACE,
            colorInfoBorder: DARK_BORDER,
            colorWarningBg: DARK_SURFACE,
            colorWarningBorder: '#8B5A2B',
            colorSuccessBg: DARK_SURFACE,
            colorSuccessBorder: BRAND_GREEN,
            colorErrorBg: DARK_SURFACE,
            colorErrorBorder: '#ef4444',
          },
          Tag: {
            defaultBg: DARK_SURFACE,
            defaultColor: TEXT_SECONDARY,
          },
          Timeline: {
            dotBg: DARK_BG,
            tailColor: DARK_BORDER,
          },
          Progress: {
            remainingColor: DARK_SURFACE,
          },
          List: {
            colorSplit: DARK_BORDER,
          },
          Tooltip: {
            colorBgSpotlight: DARK_SURFACE,
            colorTextLightSolid: TEXT_PRIMARY,
          },
        }
      }}
    >
      <div className="min-h-screen font-manrope" style={{ background: DARK_BG }}>
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header Bar - Match main page styling */}
          <div className="flex flex-col items-center mb-10">
           <div className="self-start">
  <button 
    onClick={handleBack}
    className="group flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300 bg-white/5 border border-white/10 hover:border-white/20 text-gray-400 hover:text-white"
  >
    <ArrowLeftOutlined className="text-xs transition-transform group-hover:-translate-x-1" />
    <span className="text-sm font-medium font-manrope">Back to Submissions</span>
  </button>
</div>

            <Title level={1} className="m-0 mb-2" style={{ color: TEXT_PRIMARY }}>Growth Plan</Title>
            <Text className="text-lg" style={{ color: TEXT_MUTED }}>Detailed strategy for {metadata.clientCompany}</Text>
          </div>

          {/* Dashboard Header - Match main page layout */}
          <div className="p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6" style={{ background: DARK_CARD, border: `1px solid ${DARK_BORDER}` }}>
            <div>
              <div className="flex items-center gap-3">
                <Avatar size="large" style={{ backgroundColor: BRAND_GREEN, color: '#000' }}>
                  {metadata.clientCompany.charAt(0)}
                </Avatar>
                <div>
                  <Title level={3} className="m-0" style={{ color: TEXT_PRIMARY }}>{metadata.clientCompany}</Title>
                  <div className="flex gap-2 text-sm" style={{ color: TEXT_MUTED }}>
                    <span>{metadata.industry}</span> • <span>{getTimeframeDisplay(metadata.timeframe)} Plan</span>
                  </div>
                </div>
              </div>
            </div>
            <Space wrap>
              <Tooltip title="Copy plan summary">
                <Button 
                  icon={<CopyOutlined />} 
                  onClick={() => copyToClipboard(planData.executiveSummary)}
                  style={{ borderColor: DARK_BORDER, color: TEXT_SECONDARY }}
                >
                  Copy Summary
                </Button>
              </Tooltip>
              <Button 
                icon={<DownloadOutlined />} 
                loading={exportLoading} 
                onClick={() => downloadPlan('markdown')}
                style={{ borderColor: DARK_BORDER, color: TEXT_SECONDARY }}
              >
                Export Report
              </Button>
              <Button 
                icon={<SaveOutlined />}
                onClick={() => message.info('Save as template feature coming soon')}
                style={{ borderColor: DARK_BORDER, color: TEXT_SECONDARY }}
              >
                Save as Template
              </Button>
            </Space>
          </div>

          {/* Executive Summary Card - Match main page */}
          <div className="rounded-2xl p-6 mb-6" style={{ background: `linear-gradient(135deg, ${DARK_CARD} 0%, ${DARK_SURFACE} 100%)`, border: `1px solid ${DARK_BORDER}` }}>
            <Title level={4} className="flex items-center gap-2" style={{ color: TEXT_PRIMARY }}>
              <RocketOutlined style={{ color: BRAND_GREEN }} /> Executive Summary
            </Title>
            <Paragraph className="text-lg leading-relaxed mb-0" style={{ color: TEXT_SECONDARY }}>
              {planData.executiveSummary}
            </Paragraph>
          </div>

          {/* Main Content Tabs - Match main page exactly */}
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab} 
            type="line" 
            size="large"
            items={[
              {
                key: 'strategy',
                label: <span className="px-4"><FundOutlined /> Strategy Map</span>,
                children: (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
                    {/* Timeline Column */}
                    <div className="lg:col-span-2 space-y-6">
                      <div className="rounded-2xl p-6" style={{ background: DARK_CARD, border: `1px solid ${DARK_BORDER}` }}>
                        <Title level={4} style={{ color: TEXT_PRIMARY }}>Implementation Roadmap</Title>
                        <Timeline mode="left" className="pt-4">
                          {planData.strategy?.stages?.map((stage: any, i: number) => (
                            <Timeline.Item 
                              key={i} 
                              dot={<div className="w-4 h-4 rounded-full border-2" style={{ background: BRAND_GREEN, borderColor: DARK_CARD }} />}
                            >
                              <div className="p-4 rounded-xl ml-2 mb-4 transition-colors" style={{ background: DARK_SURFACE, border: `1px solid ${DARK_BORDER}` }}>
                                <div className="flex justify-between items-center mb-2">
                                  <Title level={5} className="m-0" style={{ color: TEXT_PRIMARY }}>{stage.title}</Title>
                                  <Tag style={{ background: `${BRAND_GREEN}20`, color: BRAND_GREEN, border: 'none' }}>{stage.duration}</Tag>
                                </div>
                                <Text className="block mb-2 font-medium" style={{ color: TEXT_MUTED }}>
                                  Est. Budget: ${stage.budget?.toLocaleString()}
                                </Text>
                                <ul className="list-disc pl-5 space-y-1" style={{ color: TEXT_SECONDARY }}>
                                  {stage.tasks?.map((t: string, idx: number) => <li key={idx}>{t}</li>)}
                                </ul>
                              </div>
                            </Timeline.Item>
                          ))}
                        </Timeline>
                      </div>
                    </div>
                    
                    {/* Priorities Column */}
                    <div className="space-y-6">
                      <div className="rounded-2xl p-6" style={{ background: DARK_CARD, border: `1px solid ${DARK_BORDER}` }}>
                        <Title level={4} style={{ color: TEXT_PRIMARY }}>Strategic Priorities</Title>
                        <div className="space-y-3">
                          {planData.strategy?.priorities?.map((p: any, i: number) => (
                            <div 
                              key={i} 
                              className="p-4 rounded-xl border-l-4"
                              style={{ 
                                background: DARK_SURFACE, 
                                border: `1px solid ${DARK_BORDER}`,
                                borderLeftColor: p.impact === 'high' ? '#EF4444' : p.impact === 'medium' ? '#F59E0B' : BRAND_GREEN 
                              }}
                            >
                              <div className="font-bold mb-1" style={{ color: TEXT_PRIMARY }}>{p.area}</div>
                              <div className="flex justify-between text-xs" style={{ color: TEXT_MUTED }}>
                                <span>Impact: <strong className="uppercase">{p.impact}</strong></span>
                                <span>Effort: <strong className="uppercase">{p.effort}</strong></span>
                              </div>
                              <div className="mt-2 text-xs" style={{ color: TEXT_MUTED }}>{p.timeline}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="rounded-2xl p-6" style={{ background: `${BRAND_GREEN}10`, border: `1px solid ${BRAND_GREEN}30` }}>
                        <Title level={4} style={{ color: TEXT_PRIMARY }}>Immediate Next Steps</Title>
                        <List
                          dataSource={planData.nextSteps || []}
                          renderItem={(item: string, i: number) => (
                            <List.Item style={{ borderBottom: `1px solid ${DARK_BORDER}`, padding: '12px 0' }}>
                              <div className="flex gap-3">
                                <div 
                                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5"
                                  style={{ background: BRAND_GREEN, color: '#000' }}
                                >
                                  {i + 1}
                                </div>
                                <Text style={{ color: TEXT_SECONDARY }}>{item}</Text>
                              </div>
                            </List.Item>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                )
              },
              {
                key: 'metrics',
                label: <span className="px-4"><BarChartOutlined /> Forecasts & KPIs</span>,
                children: (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
                    <div className="rounded-2xl p-6" style={{ background: DARK_CARD, border: `1px solid ${DARK_BORDER}` }}>
                      <Title level={4} style={{ color: TEXT_PRIMARY }}>Projected Growth Trajectory</Title>
                      <div className="h-[350px]">
                        {renderSafeLineChart(planData.metrics?.timeline || []) || (
                          <div className="h-full flex items-center justify-center">
                            <Text style={{ color: TEXT_MUTED }}>No growth data available</Text>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="rounded-2xl p-6" style={{ background: DARK_CARD, border: `1px solid ${DARK_BORDER}` }}>
                      <Title level={4} style={{ color: TEXT_PRIMARY }}>KPI Targets</Title>
                      <div className="space-y-6 pt-2">
                        {planData.metrics?.kpis?.map((kpi: any, i: number) => (
                          <div key={i}>
                            <div className="flex justify-between mb-1">
                              <span className="font-semibold" style={{ color: TEXT_PRIMARY }}>{kpi.name}</span>
                              <span className="text-sm" style={{ color: TEXT_MUTED }}>
                                {kpi.current} → <span className="font-bold" style={{ color: BRAND_GREEN }}>{kpi.target}</span>
                              </span>
                            </div>
                            <Progress 
                              percent={Math.min(100, Math.max(10, (kpi.target / (kpi.current || 1)) * 30))} 
                              strokeColor={BRAND_GREEN} 
                              trailColor={DARK_SURFACE}
                              showInfo={false}
                            />
                            <div className="text-xs mt-1 text-right" style={{ color: TEXT_MUTED }}>
                              Target Improvement: {kpi.improvement}%
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Bar Chart for KPI Comparison */}
                    <div className="lg:col-span-2 rounded-2xl p-6" style={{ background: DARK_CARD, border: `1px solid ${DARK_BORDER}` }}>
                      <Title level={4} style={{ color: TEXT_PRIMARY }}>Current vs Target Comparison</Title>
                      <div className="h-[300px]">
                        {renderSafeBarChart(planData.metrics?.kpis || []) || (
                          <div className="h-full flex items-center justify-center">
                            <Text style={{ color: TEXT_MUTED }}>No KPI data available</Text>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              },
              {
                key: 'channels',
                label: <span className="px-4"><PieChartOutlined /> Channel Mix</span>,
                children: (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
                    <div className="rounded-2xl p-6" style={{ background: DARK_CARD, border: `1px solid ${DARK_BORDER}` }}>
                      <Title level={4} style={{ color: TEXT_PRIMARY }}>Resource Allocation</Title>
                      <div className="h-[350px]">
                        {renderSafePieChart(planData.metrics?.channels || []) || (
                          <div className="h-full flex items-center justify-center">
                            <Text style={{ color: TEXT_MUTED }}>No channel data available</Text>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="rounded-2xl p-6" style={{ background: DARK_CARD, border: `1px solid ${DARK_BORDER}` }}>
                      <Title level={4} style={{ color: TEXT_PRIMARY }}>Channel Strategy Details</Title>
                      <List
                        itemLayout="horizontal"
                        dataSource={planData.metrics?.channels || []}
                        renderItem={(c: any, index: number) => (
                          <List.Item style={{ borderBottom: `1px solid ${DARK_BORDER}`, padding: '16px 0' }}>
                            <List.Item.Meta 
                              avatar={
                                <div 
                                  className="w-3 h-3 rounded-full mt-2"
                                  style={{ background: CHART_COLORS[index % CHART_COLORS.length] }}
                                />
                              }
                              title={<span className="font-bold" style={{ color: TEXT_PRIMARY }}>{c.name}</span>}
                              description={
                                <div className="flex flex-wrap gap-2 mt-1">
                                  <Tag style={{ background: `${BRAND_GREEN}20`, color: BRAND_GREEN, border: 'none' }}>{c.allocation}% Budget</Tag>
                                  <Tag style={{ background: `#3B82F620`, color: '#3B82F6', border: 'none' }}>ROI: {c.expectedROI}%</Tag>
                                  <Tag style={{ background: DARK_SURFACE, color: TEXT_MUTED, border: `1px solid ${DARK_BORDER}` }}>{c.status}</Tag>
                                </div>
                              }
                            />
                          </List.Item>
                        )}
                      />
                    </div>
                  </div>
                )
              }
            ]}
          />
        </div>
      </div>
    </ConfigProvider>
  );
};

export default GrowthPlanDetailPage;