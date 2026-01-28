"use client";

import React, { useState, useEffect, useMemo } from 'react';
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
import {
  RocketOutlined,
  UserOutlined,
  TeamOutlined,
  BulbOutlined,
  ThunderboltOutlined,
  FundOutlined,
  PieChartOutlined,
  BarChartOutlined,
  ArrowLeftOutlined,
  AreaChartOutlined,
  DownloadOutlined,
  DeleteOutlined,
  HistoryOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SearchOutlined,
  EditOutlined,
  SaveOutlined,
  ShareAltOutlined,
  CopyOutlined,
  SettingOutlined,
  AimOutlined,
  DollarOutlined,
  LineChartOutlined
} from '@ant-design/icons';
import {
  Button,
  Card,
  Form,
  Input,
  Select,
  Typography,
  Divider,
  Space,
  Tag,
  Alert,
  Collapse,
  Tabs,
  Timeline,
  Progress,
  Avatar,
  Badge,
  message,
  Radio,
  InputNumber,
  List,
  Modal,
  Table,
  Spin,
  Empty,
  notification,
  ConfigProvider,
  Tooltip,
  theme
} from 'antd';
import { useGrowthPlan } from '../hooks/useGrowthPlan';
import { GrowthPlanInput, SavedGrowthPlan, GrowthPlanSummary } from '@/types/growthPlan';
import { debounce } from 'lodash';
import LoadingOverlay from './LoadingOverlay';
import { useWorkspaceContext } from '../hooks/useWorkspaceContext';
import { useRouter } from 'next/navigation';



const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { Panel } = Collapse;

// --- DARK THEME DESIGN TOKENS ---
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

// Professional Chart Palette for Dark Theme
const CHART_COLORS = ['#5CC49D', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function GrowthPlanCreatorPage() {
  const [form] = Form.useForm();
  const [viewMode, setViewMode] = useState<'create' | 'view' | 'list'>('list');
  const [activeTab, setActiveTab] = useState('strategy');
  const [timeframe, setTimeframe] = useState('6m');
  const [currentStage, setCurrentStage] = useState(0);
  const [showSimulation, setShowSimulation] = useState(false);
  const { currentWorkspace, isWorkspaceReady } = useWorkspaceContext();
  const router = useRouter();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<SavedGrowthPlan | null>(null);
  const [isTemplateModalVisible, setIsTemplateModalVisible] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(true);
  const [activePanels, setActivePanels] = useState<string[]>(['1', '2', '3', '4']);

  // --- CUSTOM HOOK ---
  const {
    generateGrowthPlan,
    plans,
    currentPlan,
    analytics,
    loading,
    generationLoading,
    updateLoading,
    deleteLoading,
    exportLoading,
    error,
    fetchPlans,
    fetchPlan,
    updatePlan,
    deletePlan,
    exportPlan,
    searchPlans,
    fetchAnalytics,
    fetchTemplates,
    createTemplate,
    clearError,
    setCurrentPlan,
    cleanup
  } = useGrowthPlan({ 
    autoFetch: true,
    workspaceId: currentWorkspace?.id 
  });

  // --- GOOGLE FONT INJECTION ---
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  // --- LIFECYCLE EFFECTS ---
  useEffect(() => {
    setIsMounted(true);
    return () => {
      setIsMounted(false);
      cleanup();
    };
  }, []); 

  useEffect(() => {
    if (currentPlan && viewMode === 'create' && isMounted) {
      setViewMode('view');
    }
  }, [currentPlan, viewMode, isMounted]);

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const templateData = await fetchTemplates();
        if (isMounted) setTemplates(templateData);
      } catch (error) {
        console.error('Failed to load templates:', error);
      }
    };
    loadTemplates();
  }, [fetchTemplates, isMounted]);

  useEffect(() => {
    if (isMounted) fetchAnalytics('month');
  }, [fetchAnalytics, isMounted]);

  const debouncedSearch = useMemo(
    () => debounce(async (query: string) => {
      if (!isMounted) return;
      try {
        query.trim() ? await searchPlans(query) : await fetchPlans();
      } catch (error) {
        console.error('Search error:', error);
      }
    }, 300),
    [searchPlans, fetchPlans, isMounted]
  );

  // --- RENDER GUARDS ---
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

  if (!currentWorkspace) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8" style={{ background: DARK_BG, minHeight: '100vh' }}>
        <Alert
          message="Workspace Required"
          description="Please navigate to a workspace first."
          type="error"
          showIcon
          style={{ background: DARK_CARD, borderColor: DARK_BORDER }}
          action={<Button type="primary" href="/dashboard" style={{ background: BRAND_GREEN, borderColor: BRAND_GREEN, color: '#000' }}>Dashboard</Button>}
        />
      </div>
    );
  }

  const isLoading = generationLoading;

  // --- DATA SANITIZATION ---
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

  // --- CHART RENDERERS ---
  const renderSafeLineChart = (data: any[]) => {
    const sanitized = sanitizeChartData(data);
    if (!sanitized) return <Empty description="No growth data available" image={Empty.PRESENTED_IMAGE_SIMPLE} />;
    
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
    if (!sanitized) return <Empty description="No channel data available" image={Empty.PRESENTED_IMAGE_SIMPLE} />;

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
    if (!sanitized) return <Empty description="No KPI data available" image={Empty.PRESENTED_IMAGE_SIMPLE} />;
    
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

  // --- ACTION HANDLERS ---
  const onFinish = async (values: any) => {
    try {
      console.log('🚀 Starting plan generation...');
      
      const inputData: Omit<GrowthPlanInput, 'userId'> = {
        email: values.email?.trim() || 'user@example.com',
        name: values.name?.trim() || '',
        company: values.company?.trim() || '',
        clientCompany: values.clientCompany?.trim() || '',
        industry: values.industry || '',
        contactName: values.contactName?.trim() || '',
        contactRole: values.contactRole?.trim() || '',
        expertise: Array.isArray(values.expertise) ? values.expertise.filter(Boolean) : [],
        experience: values.experience?.trim() || '',
        timeframe: timeframe as '3m' | '6m' | '12m',
        transcript: values.transcript?.trim(),
        caseStudies: Array.isArray(values.caseStudies) ? values.caseStudies : [],
        focusAreas: Array.isArray(values.focusAreas) ? values.focusAreas : [],
        budget: values.budget ? Number(values.budget) : undefined,
        currentRevenue: values.currentRevenue ? Number(values.currentRevenue) : undefined,
        targetRevenue: values.targetRevenue ? Number(values.targetRevenue) : undefined,
        businessModel: values.businessModel || undefined,
        teamSize: values.teamSize ? Number(values.teamSize) : undefined,
        currentChannels: Array.isArray(values.currentChannels) ? values.currentChannels : [],
        painPoints: Array.isArray(values.painPoints) ? values.painPoints : [],
        objectives: Array.isArray(values.objectives) ? values.objectives : []
      };

      console.log('📋 Input data prepared for:', inputData.clientCompany);

      const plan = await generateGrowthPlan(inputData);
      
      if (plan && isMounted) {
        setTimeout(() => {
          if (currentPlan || selectedPlan) {
            setViewMode('view');
            form.resetFields();
            setTimeframe('6m');
            setCurrentStage(0);
          } else {
            notification.info({
              message: 'Plan Generated',
              description: 'Your growth plan was created successfully. Check the plans list to view it.',
              placement: 'topRight',
            });
          }
        }, 500);
      }
    } catch (error) {
      console.error('💥 Generation error:', error);
    }
  };

  const handlePlanSelect = async (planId: string) => {
    try {
      const plan = await fetchPlan(planId);
      if (plan && isMounted) {
        setSelectedPlan(plan);
        setCurrentPlan(plan);
        setViewMode('view');
      }
    } catch (error) {
      console.error('Error selecting plan:', error);
      message.error('Failed to load plan');
    }
  };

  const handlePlanUpdate = async (updates: Partial<GrowthPlanInput>) => {
    if (selectedPlan) {
      try {
        const updated = await updatePlan(selectedPlan.id, updates);
        if (updated && isMounted) {
          setSelectedPlan(updated);
          setEditMode(false);
          message.success('Plan updated successfully');
        }
      } catch (error) {
        console.error('Update error:', error);
        message.error('Failed to update plan');
      }
    }
  };

  const handlePlanDelete = async (planId: string) => {
    Modal.confirm({
      title: <span style={{ color: TEXT_PRIMARY }}>Delete Growth Plan</span>,
      content: <span style={{ color: TEXT_SECONDARY }}>Are you sure you want to delete this plan? This cannot be undone.</span>,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const success = await deletePlan(planId);
          if (success && isMounted) {
            if (selectedPlan?.id === planId) {
              setSelectedPlan(null);
              setViewMode('list');
            }
            message.success('Plan deleted successfully');
          }
        } catch (error) {
          console.error('Delete error:', error);
          message.error('Failed to delete plan');
        }
      }
    });
  };

  const handleExport = async (planId: string, format: 'pdf' | 'word' | 'markdown') => {
    try {
      await exportPlan(planId, format);
      message.success(`Plan exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export error:', error);
      message.error('Failed to export plan');
    }
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    debouncedSearch(value);
  };

  const handleCreateTemplate = async () => {
    if (selectedPlan) {
      setTemplateLoading(true);
      try {
        const templateName = `Template - ${selectedPlan.metadata.clientCompany} - ${new Date().toLocaleDateString()}`;
        const description = `Growth plan template based on ${selectedPlan.metadata.industry} industry`;
        
        const templateData: Partial<GrowthPlanInput> = {
          industry: selectedPlan.metadata.industry,
          timeframe: selectedPlan.metadata.timeframe as '3m' | '6m' | '12m',
        };
        
        await createTemplate(templateName, description, templateData);
        if (isMounted) {
          message.success('Template created successfully');
          const updatedTemplates = await fetchTemplates();
          setTemplates(updatedTemplates);
        }
      } catch (error) {
        console.error('Template creation error:', error);
        message.error('Failed to create template');
      } finally {
        if (isMounted) setTemplateLoading(false);
      }
    }
  };

  const handleApplyTemplate = (template: any) => {
    form.setFieldsValue({
      industry: template.data?.industry,
    });
    setTimeframe(template.data?.timeframe || '6m');
    setIsTemplateModalVisible(false);
    message.success(`Applied template: ${template.name}`);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      message.success('Copied to clipboard!');
    } catch (error) {
      message.error('Failed to copy');
    }
  };

  const handleBack = () => {
    router.push(`/dashboard/${currentWorkspace?.slug}`);
  };

  // --- TEMPLATE COLUMNS ---
  const templateColumns = [
    {
      title: 'Template Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <span className="font-semibold" style={{ color: TEXT_PRIMARY }}>{text}</span>
    },
    {
      title: 'Industry',
      dataIndex: ['data', 'industry'],
      key: 'industry',
      render: (industry: string) => <Tag style={{ background: 'transparent', borderColor: BRAND_GREEN, color: BRAND_GREEN }}>{industry || 'General'}</Tag>
    },
    {
      title: 'Timeframe',
      dataIndex: ['data', 'timeframe'],
      key: 'timeframe',
      render: (tf: string) => <span style={{ color: TEXT_SECONDARY }}>{tf === '3m' ? '3 Months' : tf === '6m' ? '6 Months' : '12 Months'}</span>
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, template: any) => (
        <Button 
          type="primary" 
          size="small" 
          onClick={() => handleApplyTemplate(template)}
          style={{ background: BRAND_GREEN, borderColor: BRAND_GREEN, color: '#000' }}
        >
          Apply
        </Button>
      ),
    },
  ];

  // --- UI RENDERERS ---

  const renderPlansList = () => (
    <div className="space-y-8 animate-fade-in">
      {/* List Header */}
      <div className="rounded-2xl p-8 flex flex-col md:flex-row justify-between items-center gap-6" style={{ background: DARK_CARD, border: `1px solid ${DARK_BORDER}` }}>
        <div>
          <Title level={3} className="m-0 font-bold" style={{ color: TEXT_PRIMARY }}>Growth Plans</Title>
          <Text style={{ color: TEXT_MUTED }}>Manage and track your client growth strategies</Text>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <Input 
            prefix={<SearchOutlined style={{ color: TEXT_MUTED }} />} 
            placeholder="Search plans..." 
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="rounded-lg"
            style={{ background: DARK_SURFACE, borderColor: DARK_BORDER, color: TEXT_PRIMARY }}
          />
          <Button 
            type="primary" 
            size="large"
            icon={<RocketOutlined />}
            onClick={() => setViewMode('create')}
            className="rounded-lg shadow-md hover:scale-105 transition-transform"
            style={{ background: BRAND_GREEN, borderColor: BRAND_GREEN, color: '#000', fontWeight: 600 }}
          >
            New Plan
          </Button>
        </div>
      </div>

      {/* Analytics Overview */}
      {analytics && (
        <div className="rounded-2xl p-6" style={{ background: DARK_CARD, border: `1px solid ${DARK_BORDER}` }}>
          <Title level={4} style={{ color: TEXT_PRIMARY }} className="mb-6">Analytics Overview</Title>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-4 rounded-xl" style={{ background: DARK_SURFACE }}>
              <Title level={2} className="mb-0" style={{ color: BRAND_GREEN }}>{analytics.totalPlans || plans.length}</Title>
              <Text style={{ color: TEXT_MUTED }}>Total Plans</Text>
            </div>
            <div className="text-center p-4 rounded-xl" style={{ background: DARK_SURFACE }}>
              <Title level={2} className="mb-0" style={{ color: TEXT_PRIMARY }}>
                {analytics.topIndustries?.[0]?.industry || 'N/A'}
              </Title>
              <Text style={{ color: TEXT_MUTED }}>Top Industry</Text>
            </div>
            <div className="text-center p-4 rounded-xl" style={{ background: DARK_SURFACE }}>
              <Title level={2} className="mb-0" style={{ color: TEXT_PRIMARY }}>
                {Object.keys(analytics.timeframeDistribution || {})[0] || '6m'}
              </Title>
              <Text style={{ color: TEXT_MUTED }}>Popular Timeframe</Text>
            </div>
            <div className="text-center p-4 rounded-xl" style={{ background: DARK_SURFACE }}>
              <Title level={2} className="mb-0" style={{ color: TEXT_PRIMARY }}>
                {analytics.insights?.length || 0}
              </Title>
              <Text style={{ color: TEXT_MUTED }}>Key Insights</Text>
            </div>
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 flex justify-center">

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
        ) : plans.length === 0 ? (
          <div className="col-span-full">
            <Empty 
              description={<span style={{ color: TEXT_MUTED }}>No growth plans found</span>} 
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Button 
                type="primary" 
                onClick={() => setViewMode('create')}
                style={{ background: BRAND_GREEN, borderColor: BRAND_GREEN, color: '#000' }}
              >
                Create First Plan
              </Button>
            </Empty>
          </div>
        ) : (
          plans.map((plan) => (
            <Card
              key={plan.id}
              hoverable
              className="rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl group"
              style={{ background: DARK_CARD, borderColor: DARK_BORDER }}
              bodyStyle={{ padding: '24px' }}
            actions={[
  <Button 
    key="view"
    type="text" 
    icon={<AreaChartOutlined />} 
    onClick={() => handlePlanSelect(plan.id)}
    style={{ color: TEXT_SECONDARY }}
  >
    View
  </Button>,
  <Button 
    key="export"
    type="text" 
    icon={<DownloadOutlined />} 
    loading={exportLoading[plan.id]} 
    onClick={() => handleExport(plan.id, 'markdown')}
    style={{ color: TEXT_SECONDARY }}
  >
    Export
  </Button>,
  <Button 
    key="delete"
    type="text" 
    danger 
    icon={<DeleteOutlined />} 
    loading={deleteLoading[plan.id]} 
    onClick={() => handlePlanDelete(plan.id)}
  >
    Delete
  </Button>
]}
            >
              <div className="flex justify-between items-start mb-4">
                <Avatar 
                  size={48} 
                  style={{ backgroundColor: BRAND_GREEN, color: '#000', fontSize: '20px', fontWeight: 'bold' }}
                >
                  {plan.clientCompany.charAt(0)}
                </Avatar>
                <Tag className="m-0 border-none rounded-full px-3" style={{ background: DARK_SURFACE, color: TEXT_MUTED }}>
                  {new Date(plan.createdAt).toLocaleDateString()}
                </Tag>
              </div>
              <Title level={4} className="mt-0 mb-2 truncate" style={{ color: TEXT_PRIMARY }} title={plan.clientCompany}>
                {plan.clientCompany}
              </Title>
              <div className="flex flex-wrap gap-2 mt-3">
                <Tag style={{ background: `${BRAND_GREEN}20`, color: BRAND_GREEN, border: 'none', borderRadius: '6px' }}>
                  {plan.industry}
                </Tag>
                <Tag style={{ background: `#3B82F620`, color: '#3B82F6', border: 'none', borderRadius: '6px' }}>
                  {plan.timeframe === '3m' ? '3 Months' : plan.timeframe === '6m' ? '6 Months' : '1 Year'}
                </Tag>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );

  const renderCreateForm = () => (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <Title level={3} className="m-0" style={{ color: TEXT_PRIMARY }}>Create Growth Plan</Title>
          <Text style={{ color: TEXT_MUTED }}>Generate a customized strategy using AI</Text>
        </div>
        <Space>
          <Button 
            onClick={() => setIsTemplateModalVisible(true)}
            style={{ borderColor: DARK_BORDER, color: TEXT_SECONDARY }}
          >
            Load Template
          </Button>
          <Button 
            onClick={() => setViewMode('list')} 
            style={{ borderColor: DARK_BORDER, color: TEXT_SECONDARY }}
          >
            Cancel
          </Button>
        </Space>
      </div>

      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          closable
          onClose={clearError}
          className="mb-6 rounded-xl"
          style={{ background: DARK_SURFACE, borderColor: '#ef4444' }}
        />
      )}

      <Form form={form} layout="vertical" onFinish={onFinish} requiredMark="optional">
        <Collapse
          activeKey={activePanels}
          onChange={(keys) => setActivePanels(keys as string[])}
          ghost
          expandIconPosition="end"
        >
          {/* Section 1: Core Information */}
          <Panel 
            header={
              <div className="flex items-center py-2">
                <div className="w-10 h-10 rounded-full flex items-center justify-center mr-4" style={{ background: DARK_SURFACE, color: TEXT_SECONDARY }}>
                  <UserOutlined style={{ fontSize: '18px' }} />
                </div>
                <div>
                  <div className="font-bold text-lg" style={{ color: TEXT_PRIMARY }}>Core Information</div>
                  <div className="text-sm font-medium" style={{ color: TEXT_MUTED }}>Your profile and client details</div>
                </div>
              </div>
            } 
            key="1"
            className="mb-4 rounded-xl overflow-hidden"
            style={{ background: DARK_CARD, border: `1px solid ${DARK_BORDER}` }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-2">
              {/* Your Profile */}
              <div className="p-6 rounded-xl" style={{ background: DARK_SURFACE, border: `1px solid ${DARK_BORDER}` }}>
                <div className="flex items-center gap-2 mb-4 font-semibold" style={{ color: TEXT_PRIMARY }}>
                  <UserOutlined /> Your Profile
                </div>
                <Form.Item name="name" label={<span style={{ color: TEXT_SECONDARY }}>Your Name</span>} rules={[{ required: true }]}>
                  <Input placeholder="John Doe" />
                </Form.Item>
                <Form.Item name="company" label={<span style={{ color: TEXT_SECONDARY }}>Your Agency/Company</span>} rules={[{ required: true }]}>
                  <Input placeholder="Growth Agency Inc." />
                </Form.Item>
                <Form.Item name="email" label={<span style={{ color: TEXT_SECONDARY }}>Your Email</span>} rules={[{ required: true, type: 'email' }]}>
                  <Input placeholder="john@agency.com" />
                </Form.Item>
              </div>

              {/* Client Profile */}
              <div className="p-6 rounded-xl" style={{ background: DARK_SURFACE, border: `1px solid ${DARK_BORDER}` }}>
                <div className="flex items-center gap-2 mb-4 font-semibold" style={{ color: TEXT_PRIMARY }}>
                  <TeamOutlined /> Client Profile
                </div>
                <Form.Item name="clientCompany" label={<span style={{ color: TEXT_SECONDARY }}>Client Company</span>} rules={[{ required: true }]}>
                  <Input placeholder="Acme Corp" />
                </Form.Item>
                <Form.Item name="contactName" label={<span style={{ color: TEXT_SECONDARY }}>Contact Person</span>} rules={[{ required: true }]}>
                  <Input placeholder="Jane Smith" />
                </Form.Item>
                <Form.Item name="contactRole" label={<span style={{ color: TEXT_SECONDARY }}>Contact Role</span>} rules={[{ required: true }]}>
                  <Input placeholder="CEO, CMO, Head of Growth..." />
                </Form.Item>
                <Form.Item name="industry" label={<span style={{ color: TEXT_SECONDARY }}>Industry</span>} rules={[{ required: true }]}>
                  <Select placeholder="Select industry">
                    {['SaaS', 'E-commerce', 'Healthcare', 'Finance', 'Education', 'Manufacturing', 'Real Estate', 'Consulting'].map(i => (
                      <Option key={i} value={i}>{i}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </div>
            </div>
          </Panel>

          {/* Section 2: Strategic Context */}
          <Panel 
            header={
              <div className="flex items-center py-2">
                <div className="w-10 h-10 rounded-full flex items-center justify-center mr-4" style={{ background: DARK_SURFACE, color: TEXT_SECONDARY }}>
                  <BulbOutlined style={{ fontSize: '18px' }} />
                </div>
                <div>
                  <div className="font-bold text-lg" style={{ color: TEXT_PRIMARY }}>Strategic Context</div>
                  <div className="text-sm font-medium" style={{ color: TEXT_MUTED }}>Expertise, experience and business details</div>
                </div>
              </div>
            } 
            key="2"
            className="mb-4 rounded-xl overflow-hidden"
            style={{ background: DARK_CARD, border: `1px solid ${DARK_BORDER}` }}
          >
            <div className="p-4 space-y-6">
              <Form.Item name="expertise" label={<span style={{ color: TEXT_SECONDARY }}>Your Core Skills/Services</span>} rules={[{ required: true }]}>
                <Select mode="tags" placeholder="e.g. SEO, PPC, Content Marketing, Email Automation" />
              </Form.Item>
              
              <Form.Item name="experience" label={<span style={{ color: TEXT_SECONDARY }}>Agency Experience & Wins</span>} rules={[{ required: true, min: 50, message: 'Please provide at least 50 characters' }]}>
                <TextArea rows={3} placeholder="Describe your track record, years in business, notable results..." showCount maxLength={2000} />
              </Form.Item>

              <Form.Item name="caseStudies" label={<span style={{ color: TEXT_SECONDARY }}>Relevant Case Studies (Optional)</span>}>
                <Select mode="tags" placeholder="Add case study titles or client names" />
              </Form.Item>

              <Divider style={{ borderColor: DARK_BORDER }} />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Form.Item name="currentRevenue" label={<span style={{ color: TEXT_SECONDARY }}>Current Monthly Revenue ($)</span>}>
                  <InputNumber 
                    style={{ width: '100%' }} 
                    placeholder="50,000"
                    formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} 
                    parser={value => value!.replace(/\$\s?|(,*)/g, '') as any} 
                  />
                </Form.Item>
                <Form.Item name="targetRevenue" label={<span style={{ color: TEXT_SECONDARY }}>Target Monthly Revenue ($)</span>}>
                  <InputNumber 
                    style={{ width: '100%' }} 
                    placeholder="150,000"
                    formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} 
                    parser={value => value!.replace(/\$\s?|(,*)/g, '') as any} 
                  />
                </Form.Item>
                <Form.Item name="budget" label={<span style={{ color: TEXT_SECONDARY }}>Available Budget ($)</span>}>
                  <InputNumber 
                    style={{ width: '100%' }} 
                    placeholder="10,000"
                    formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} 
                    parser={value => value!.replace(/\$\s?|(,*)/g, '') as any} 
                  />
                </Form.Item>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Form.Item name="teamSize" label={<span style={{ color: TEXT_SECONDARY }}>Team Size</span>}>
                  <InputNumber style={{ width: '100%' }} placeholder="25" min={1} />
                </Form.Item>
                <Form.Item name="businessModel" label={<span style={{ color: TEXT_SECONDARY }}>Business Model</span>}>
                  <Select placeholder="Select business model">
                    <Option value="B2B">B2B</Option>
                    <Option value="B2C">B2C</Option>
                    <Option value="B2B2C">B2B2C</Option>
                    <Option value="D2C">D2C</Option>
                    <Option value="Marketplace">Marketplace</Option>
                    <Option value="SaaS">SaaS</Option>
                    <Option value="Agency">Agency</Option>
                  </Select>
                </Form.Item>
              </div>
            </div>
          </Panel>

          {/* Section 3: Goals & Challenges */}
          <Panel 
            header={
              <div className="flex items-center py-2">
                <div className="w-10 h-10 rounded-full flex items-center justify-center mr-4" style={{ background: DARK_SURFACE, color: TEXT_SECONDARY }}>
                  <AimOutlined style={{ fontSize: '18px' }} />
                </div>
                <div>
                  <div className="font-bold text-lg" style={{ color: TEXT_PRIMARY }}>Goals & Challenges</div>
                  <div className="text-sm font-medium" style={{ color: TEXT_MUTED }}>Objectives, pain points and focus areas</div>
                </div>
              </div>
            } 
            key="3"
            className="mb-4 rounded-xl overflow-hidden"
            style={{ background: DARK_CARD, border: `1px solid ${DARK_BORDER}` }}
          >
            <div className="p-4 space-y-6">
              <Form.Item name="objectives" label={<span style={{ color: TEXT_SECONDARY }}>Primary Objectives</span>}>
                <Select 
                  mode="tags" 
                  placeholder="e.g. Increase MRR, Reduce CAC, Improve retention..."
                  options={[
                    { value: 'Increase Revenue' },
                    { value: 'Reduce Customer Acquisition Cost' },
                    { value: 'Improve Customer Retention' },
                    { value: 'Scale Operations' },
                    { value: 'Enter New Markets' },
                    { value: 'Launch New Products' },
                    { value: 'Build Brand Awareness' },
                    { value: 'Optimize Conversion Rates' },
                  ]}
                />
              </Form.Item>

              <Form.Item name="painPoints" label={<span style={{ color: TEXT_SECONDARY }}>Current Pain Points</span>}>
                <Select 
                  mode="tags" 
                  placeholder="e.g. High churn, low conversion, inefficient processes..."
                  options={[
                    { value: 'High Customer Churn' },
                    { value: 'Low Conversion Rates' },
                    { value: 'Inconsistent Lead Flow' },
                    { value: 'Poor Marketing ROI' },
                    { value: 'Lack of Automation' },
                    { value: 'Team Capacity Issues' },
                    { value: 'Competitive Pressure' },
                    { value: 'Limited Budget' },
                  ]}
                />
              </Form.Item>

              <Form.Item name="focusAreas" label={<span style={{ color: TEXT_SECONDARY }}>Focus Areas for Growth</span>}>
                <Select 
                  mode="tags" 
                  placeholder="e.g. Content Marketing, Paid Ads, Partnerships..."
                  options={[
                    { value: 'Content Marketing' },
                    { value: 'Paid Advertising' },
                    { value: 'SEO' },
                    { value: 'Email Marketing' },
                    { value: 'Social Media' },
                    { value: 'Partnerships' },
                    { value: 'Product Development' },
                    { value: 'Sales Optimization' },
                  ]}
                />
              </Form.Item>

              <Form.Item name="currentChannels" label={<span style={{ color: TEXT_SECONDARY }}>Current Marketing Channels</span>}>
                <Select 
                  mode="tags" 
                  placeholder="e.g. Google Ads, LinkedIn, Email..."
                  options={[
                    { value: 'Google Ads' },
                    { value: 'Facebook Ads' },
                    { value: 'LinkedIn' },
                    { value: 'Email Marketing' },
                    { value: 'SEO/Organic' },
                    { value: 'Content Marketing' },
                    { value: 'Referrals' },
                    { value: 'Events' },
                    { value: 'Cold Outreach' },
                  ]}
                />
              </Form.Item>

              <Form.Item name="transcript" label={<span style={{ color: TEXT_SECONDARY }}>Discovery Notes (Optional)</span>}>
                <TextArea rows={4} placeholder="Paste raw notes from your discovery call here for AI to analyze..." />
              </Form.Item>
            </div>
          </Panel>

          {/* Section 4: Plan Duration */}
          <Panel 
            header={
              <div className="flex items-center py-2">
                <div className="w-10 h-10 rounded-full flex items-center justify-center mr-4" style={{ background: DARK_SURFACE, color: TEXT_SECONDARY }}>
                  <ClockCircleOutlined style={{ fontSize: '18px' }} />
                </div>
                <div>
                  <div className="font-bold text-lg" style={{ color: TEXT_PRIMARY }}>Plan Duration</div>
                  <div className="text-sm font-medium" style={{ color: TEXT_MUTED }}>Select the timeframe for projections</div>
                </div>
              </div>
            } 
            key="4"
            className="mb-4 rounded-xl overflow-hidden"
            style={{ background: DARK_CARD, border: `1px solid ${DARK_BORDER}` }}
          >
            <div className="p-6 flex flex-col items-center justify-center">
              <Text className="mb-4" style={{ color: TEXT_MUTED }}>How far into the future should we project?</Text>
              <Radio.Group 
                value={timeframe} 
                onChange={e => setTimeframe(e.target.value)} 
                buttonStyle="solid"
                size="large"
              >
                <Radio.Button value="3m">3 Months</Radio.Button>
                <Radio.Button value="6m">6 Months</Radio.Button>
                <Radio.Button value="12m">1 Year</Radio.Button>
              </Radio.Group>
            </div>
          </Panel>
        </Collapse>

        {/* Generate Button */}
        <div className="sticky bottom-4 z-10 flex justify-center mt-8">
          <Button 
            type="primary" 
            size="large" 
            htmlType="submit"
            loading={generationLoading}
            disabled={generationLoading}
            icon={<ThunderboltOutlined />}
            className="h-14 px-12 rounded-full text-lg font-bold hover:scale-105 transition-transform"
            style={{ 
              background: BRAND_GREEN, 
              borderColor: BRAND_GREEN, 
              color: '#000',
              boxShadow: `0 8px 32px ${BRAND_GREEN}40`
            }}
          >
            {generationLoading ? 'Analyzing & Generating...' : 'Generate Growth Plan'}
          </Button>
        </div>
      </Form>
    </div>
  );

  const renderPlanView = () => {
    const plan = selectedPlan || currentPlan;
    
    if (!plan) {
      return (
        <div className="text-center py-12">
          <Empty 
            description={<span style={{ color: TEXT_MUTED }}>No plan selected</span>}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button 
              type="primary" 
              icon={<RocketOutlined />}
              onClick={() => setViewMode('list')}
              style={{ background: BRAND_GREEN, borderColor: BRAND_GREEN, color: '#000' }}
            >
              Browse Plans
            </Button>
          </Empty>
        </div>
      );
    }

    const planData = plan.plan;

    if (!planData) {
      return (
        <div className="text-center py-12">
          <Alert
            message="Invalid Plan Data"
            description="The plan data appears to be corrupted. Please try generating a new plan."
            type="error"
            showIcon
            style={{ background: DARK_SURFACE, borderColor: '#ef4444' }}
            action={
              <Button size="small" onClick={() => setViewMode('list')} style={{ borderColor: DARK_BORDER, color: TEXT_SECONDARY }}>
                Back to Plans
              </Button>
            }
          />
        </div>
      );
    }

    const { metadata } = plan;

    return (
      <div className="space-y-6 animate-fade-in">
        {/* Dashboard Header */}
        <div className="p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4" style={{ background: DARK_CARD, border: `1px solid ${DARK_BORDER}` }}>
          <div>
            <Button 
              type="link" 
              icon={<ArrowLeftOutlined />} 
              onClick={() => setViewMode('list')} 
              className="p-0 mb-1"
              style={{ color: TEXT_MUTED }}
            >
              All Plans
            </Button>
            <div className="flex items-center gap-3">
              <Avatar size="large" style={{ backgroundColor: BRAND_GREEN, color: '#000' }}>
                {metadata.clientCompany.charAt(0)}
              </Avatar>
              <div>
                <Title level={3} className="m-0" style={{ color: TEXT_PRIMARY }}>{metadata.clientCompany}</Title>
                <div className="flex gap-2 text-sm" style={{ color: TEXT_MUTED }}>
                  <span>{metadata.industry}</span> • <span>{metadata.timeframe === '3m' ? '3 Month' : metadata.timeframe === '6m' ? '6 Month' : '12 Month'} Plan</span>
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
              loading={exportLoading[plan.id]} 
              onClick={() => handleExport(plan.id, 'markdown')}
              style={{ borderColor: DARK_BORDER, color: TEXT_SECONDARY }}
            >
              Export Report
            </Button>
            <Button 
              icon={<SaveOutlined />}
              loading={templateLoading}
              onClick={handleCreateTemplate}
              style={{ borderColor: DARK_BORDER, color: TEXT_SECONDARY }}
            >
              Save as Template
            </Button>
            <Button 
              icon={<EditOutlined />}
              onClick={() => setEditMode(true)}
              style={{ borderColor: DARK_BORDER, color: TEXT_SECONDARY }}
            >
              Edit Plan
            </Button>
            <Button 
              danger 
              icon={<DeleteOutlined />} 
              loading={deleteLoading[plan.id]} 
              onClick={() => handlePlanDelete(plan.id)}
            >
              Delete
            </Button>
          </Space>
        </div>

        {/* Executive Summary Card */}
        <div className="rounded-2xl p-6" style={{ background: `linear-gradient(135deg, ${DARK_CARD} 0%, ${DARK_SURFACE} 100%)`, border: `1px solid ${DARK_BORDER}` }}>
          <Title level={4} className="flex items-center gap-2" style={{ color: TEXT_PRIMARY }}>
            <RocketOutlined style={{ color: BRAND_GREEN }} /> Executive Summary
          </Title>
          <Paragraph className="text-lg leading-relaxed mb-0" style={{ color: TEXT_SECONDARY }}>
            {planData.executiveSummary}
          </Paragraph>
        </div>

        {/* Main Content Tabs */}
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
                      {renderSafeLineChart(planData.metrics?.timeline)}
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
                      {renderSafeBarChart(planData.metrics?.kpis)}
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
                      {renderSafePieChart(planData.metrics?.channels)}
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
    );
  };

  // --- ROOT RENDER ---
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
            // headerFontWeight: 700,
            colorBgContainer: DARK_CARD,
            colorBorderSecondary: DARK_BORDER,
          },
          Input: {
            controlHeight: 44,
            colorBgContainer: DARK_SURFACE,
            colorBorder: DARK_BORDER,
            activeBorderColor: BRAND_GREEN,
            hoverBorderColor: BRAND_GREEN,
            colorText: TEXT_PRIMARY,
            colorTextPlaceholder: TEXT_MUTED,
          },
          Select: {
            controlHeight: 44,
            colorPrimary: BRAND_GREEN,
            colorBgContainer: DARK_SURFACE,
            colorBorder: DARK_BORDER,
            optionSelectedBg: DARK_HOVER,
          },
          InputNumber: {
            controlHeight: 44,
            colorBgContainer: DARK_SURFACE,
            colorBorder: DARK_BORDER,
            activeBorderColor: BRAND_GREEN,
            hoverBorderColor: BRAND_GREEN,
          },
          Tabs: {
            itemActiveColor: BRAND_GREEN,
            itemSelectedColor: BRAND_GREEN,
            inkBarColor: BRAND_GREEN,
            titleFontSize: 16,
            colorBgContainer: DARK_CARD,
          },
          Radio: {
            buttonSolidCheckedBg: BRAND_GREEN,
            buttonSolidCheckedColor: '#000',
            colorBgContainer: DARK_SURFACE,
          },
          Collapse: {
            headerBg: 'transparent',
            contentBg: DARK_CARD,
            colorBorder: 'transparent',
          },
          Table: {
            colorBgContainer: DARK_CARD,
            headerBg: DARK_SURFACE,
            rowHoverBg: DARK_HOVER,
            borderColor: DARK_BORDER,
          },
          Modal: {
            contentBg: DARK_CARD,
            headerBg: DARK_CARD,
            titleColor: TEXT_PRIMARY,
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
          Empty: {
            colorTextDescription: TEXT_MUTED,
          },
          Tooltip: {
            colorBgSpotlight: DARK_SURFACE,
            colorTextLightSolid: TEXT_PRIMARY,
          },
          Notification: {
            colorBgElevated: DARK_CARD,
          },
          Message: {
            contentBg: DARK_CARD,
          }
        }
      }}
    >
      <div className="min-h-screen font-manrope" style={{ background: DARK_BG }}>
        <LoadingOverlay visible={isLoading} />
        
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header Bar */}
          <div className="flex flex-col items-center mb-10">
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={handleBack}
              className="self-start mb-4 border-none shadow-none p-0"
              style={{ background: 'transparent', color: TEXT_MUTED }}
            >
              Back to Dashboard
            </Button>

         
            <Title level={1} className="m-0 mb-2" style={{ color: TEXT_PRIMARY }}>Growth Plan Creator</Title>
            <Text className="text-lg" style={{ color: TEXT_MUTED }}>Data-driven roadmaps to scale your clients</Text>
          </div>

          {error && (
            <Alert 
              message={error} 
              type="error" 
              closable 
              onClose={clearError} 
              className="mb-6 rounded-xl" 
              style={{ background: DARK_SURFACE, borderColor: '#ef4444' }}
            />
          )}

          {/* View Router */}
          {viewMode === 'list' && renderPlansList()}
          {viewMode === 'create' && renderCreateForm()}
          {viewMode === 'view' && renderPlanView()}
        </div>

        {/* Edit Modal */}
        <Modal
          title={<span style={{ color: TEXT_PRIMARY }}>Edit Growth Plan</span>}
          open={editMode}
          onCancel={() => setEditMode(false)}
          footer={null}
          width={800}
        >
          <Alert
            message="Edit Feature"
            description="Plan editing functionality will be implemented here. You can modify client information, timeframe, and regenerate the plan with updated parameters."
            type="info"
            showIcon
            style={{ background: DARK_SURFACE, borderColor: DARK_BORDER }}
          />
          <div className="mt-4 flex justify-end">
            <Button onClick={() => setEditMode(false)} style={{ borderColor: DARK_BORDER, color: TEXT_SECONDARY }}>
              Close
            </Button>
          </div>
        </Modal>

        {/* Template Selection Modal */}
        <Modal
          title={<span style={{ color: TEXT_PRIMARY }}>Load Template</span>}
          open={isTemplateModalVisible}
          onCancel={() => setIsTemplateModalVisible(false)}
          footer={null}
          width={800}
        >
          {templates.length === 0 ? (
            <Empty 
              description={<span style={{ color: TEXT_MUTED }}>No templates saved yet</span>}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <Table 
              dataSource={templates} 
              columns={templateColumns} 
              rowKey="id" 
              pagination={{ pageSize: 5 }} 
            />
          )}
        </Modal>
      </div>
    </ConfigProvider>
  );
}