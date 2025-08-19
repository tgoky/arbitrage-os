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
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
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
  AreaChartOutlined,
  FileTextOutlined,
  CrownOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  DownloadOutlined,
  ShareAltOutlined,
  EditOutlined,
  StarOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  SaveOutlined,
  HistoryOutlined
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
  Popover,
  Switch,
  message,
  Radio,
  InputNumber,
  List,
  Modal,
  Table,
  Spin,
  Empty,
  notification
} from 'antd';
import { useGrowthPlan } from '../hooks/useGrowthPlan';
import { GrowthPlanInput, SavedGrowthPlan, GrowthPlanSummary } from '@/types/growthPlan';
import { debounce } from 'lodash';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { Panel } = Collapse;

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function GrowthPlanCreatorPage() {
  const [form] = Form.useForm();
  const [viewMode, setViewMode] = useState<'create' | 'view' | 'list'>('list');
  const [activeTab, setActiveTab] = useState('strategy');
  const [timeframe, setTimeframe] = useState('6m');
  const [currentStage, setCurrentStage] = useState(0);
  const [showSimulation, setShowSimulation] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<SavedGrowthPlan | null>(null);
  const [isTemplateModalVisible, setIsTemplateModalVisible] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(true);

  // Use the custom hook
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
    workspaceId: 'default' 
  });

  // Cleanup on unmount
  useEffect(() => {
  setIsMounted(true); // Ensure it's set to true on mount
  
  return () => {
    setIsMounted(false);
    cleanup();
  };
}, []); 

  // Load templates on mount
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const templateData = await fetchTemplates();
        if (isMounted) {
          setTemplates(templateData);
        }
      } catch (error) {
        console.error('Failed to load templates:', error);
      }
    };
    loadTemplates();
  }, [fetchTemplates, isMounted]);

  // Load analytics on mount
  useEffect(() => {
    if (isMounted) {
      fetchAnalytics('month');
    }
  }, [fetchAnalytics, isMounted]);

  // Debounced search function
  const debouncedSearch = useMemo(
    () => debounce(async (query: string) => {
      if (!isMounted) return;
      
      try {
        if (query.trim()) {
          await searchPlans(query);
        } else {
          await fetchPlans();
        }
      } catch (error) {
        console.error('Search error:', error);
      }
    }, 300),
    [searchPlans, fetchPlans, isMounted]
  );

  // Data sanitization function
  const sanitizeChartData = (data: any[]): any[] | null => {
    try {
      if (!Array.isArray(data)) return null;
      if (data.length === 0) return null;

      return data
        .filter(item => item && typeof item === 'object')
        .map((item, index) => {
          const sanitized: any = {};
          
          // Handle different key variations
          sanitized.month = item.month || item.name || item.period || `Period ${index + 1}`;
          if (typeof sanitized.month !== 'string') {
            sanitized.month = String(sanitized.month);
          }

          // Sanitize numeric fields
          ['revenue', 'leads', 'customers', 'cac', 'ltv', 'allocation', 'expectedROI'].forEach(field => {
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

          // Handle string fields
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

  // Safe chart rendering functions
  const renderSafeLineChart = (data: any[]) => {
    try {
      const sanitizedData = sanitizeChartData(data);
      if (!sanitizedData || sanitizedData.length === 0) {
        return <Empty description="No growth data available" image={Empty.PRESENTED_IMAGE_SIMPLE} />;
      }
      
      return (
        <ResponsiveContainer width="100%" height="100%">
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
        return <Empty description="No channel data available" image={Empty.PRESENTED_IMAGE_SIMPLE} />;
      }
      
      return (
        <ResponsiveContainer width="100%" height="100%">
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
              {sanitizedData.map((entry: any, index: number) => (
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

  const renderSafeBarChart = (data: any[]) => {
    try {
      const sanitizedData = sanitizeChartData(data);
      if (!sanitizedData || sanitizedData.length === 0) {
        return <Empty description="No KPI data available" image={Empty.PRESENTED_IMAGE_SIMPLE} />;
      }
      
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sanitizedData} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={80} />
            <Tooltip />
            <Legend />
            <Bar dataKey="current" fill="#8884d8" name="Current" />
            <Bar dataKey="target" fill="#82ca9d" name="Target" />
          </BarChart>
        </ResponsiveContainer>
      );
    } catch (error) {
      console.error('BarChart error:', error);
      return <Alert message="Chart unavailable" description="Unable to display KPI chart" type="warning" showIcon />;
    }
  };

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
      budget: values.budget || undefined,
      currentRevenue: values.currentRevenue || undefined,
      targetRevenue: values.targetRevenue || undefined,
      businessModel: values.businessModel || undefined,
      teamSize: values.teamSize || undefined,
      currentChannels: Array.isArray(values.currentChannels) ? values.currentChannels : [],
      painPoints: Array.isArray(values.painPoints) ? values.painPoints : [],
      objectives: Array.isArray(values.objectives) ? values.objectives : []
    };

    console.log('📋 Input data prepared for:', inputData.clientCompany);
    console.log('📋 Industry:', inputData.industry);
    console.log('📋 Timeframe:', inputData.timeframe);

    const plan = await generateGrowthPlan(inputData);
    
    console.log('✅ Plan generated:', plan ? 'Success' : 'Failed');
    console.log('📊 Current plan state:', currentPlan ? 'Set' : 'Not set');
    console.log('🔍 Selected plan state:', selectedPlan ? 'Set' : 'Not set');
    console.log('🎭 Current view mode:', viewMode);
    console.log('🏠 Is mounted:', isMounted);
    
    if (plan && isMounted) {
      console.log('🎯 Switching to view mode...');
      setViewMode('view');
      console.log('🔄 setViewMode("view") called');
      
      // Check state after a brief delay
      setTimeout(() => {
        console.log('⏰ States after 100ms timeout:');
        console.log('- Current plan:', currentPlan ? `Set (${currentPlan.id})` : 'Not set');
        console.log('- Selected plan:', selectedPlan ? `Set (${selectedPlan.id})` : 'Not set');
        console.log('- View mode:', viewMode);
        console.log('- Plan data exists:', currentPlan?.plan ? 'Yes' : 'No');
        if (currentPlan?.plan) {
          console.log('- Executive summary length:', currentPlan.plan.executiveSummary?.length || 0);
          console.log('- Has strategy:', !!currentPlan.plan.strategy);
          console.log('- Has metrics:', !!currentPlan.plan.metrics);
        }
      }, 100);
    } else {
      console.log('❌ Cannot switch to view mode:');
      console.log('- Plan exists:', !!plan);
      console.log('- Is mounted:', isMounted);
    }
  } catch (error) {
    console.error('💥 Generation error:', error);
    if (isMounted) {
      notification.error({
        message: 'Generation Failed',
        description: 'Please check your inputs and try again.',
        placement: 'topRight',
      });
    }
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
      if (isMounted) {
        message.error('Failed to load plan');
      }
    }
  };

  const handlePlanUpdate = async (updates: Partial<GrowthPlanInput>) => {
    if (selectedPlan) {
      try {
        const updated = await updatePlan(selectedPlan.id, updates);
        if (updated && isMounted) {
          setSelectedPlan(updated);
          setEditMode(false);
        }
      } catch (error) {
        console.error('Update error:', error);
        if (isMounted) {
          message.error('Failed to update plan');
        }
      }
    }
  };

  const handlePlanDelete = async (planId: string) => {
    Modal.confirm({
      title: 'Delete Growth Plan',
      content: 'Are you sure you want to delete this growth plan? This action cannot be undone.',
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
          }
        } catch (error) {
          console.error('Delete error:', error);
          if (isMounted) {
            message.error('Failed to delete plan');
          }
        }
      }
    });
  };

  const handleExport = async (planId: string, format: 'pdf' | 'word' | 'markdown') => {
    try {
      await exportPlan(planId, format);
    } catch (error) {
      console.error('Export error:', error);
      if (isMounted) {
        message.error('Failed to export plan');
      }
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
      
      // ✅ Fix: Properly type the templateData
      const templateData: Partial<GrowthPlanInput> = {
        industry: selectedPlan.metadata.industry,
        timeframe: selectedPlan.metadata.timeframe as '3m' | '6m' | '12m', // Type assertion
      };
      
      await createTemplate(templateName, description, templateData);
      if (isMounted) {
        message.success('Template created successfully');
      }
    } catch (error) {
      console.error('Template creation error:', error);
      if (isMounted) {
        message.error('Failed to create template');
      }
    } finally {
      if (isMounted) {
        setTemplateLoading(false);
      }
    }
  }
};

  // Render plans list view
  const renderPlansList = () => (
    <div className="space-y-6">
      {/* Header with search and actions */}
      <Card>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <Title level={3} className="mb-1">Growth Plans</Title>
            <Text type="secondary">Manage your client growth strategies</Text>
          </div>
          <Space>
            <Input.Search
              placeholder="Search plans..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              loading={loading}
              style={{ width: 250 }}
              allowClear
            />
            <Button 
              type="primary" 
              icon={<RocketOutlined />}
              onClick={() => setViewMode('create')}
            >
              New Plan
            </Button>
          </Space>
        </div>
      </Card>

      {/* Analytics Overview */}
      {analytics && (
        <Card title="Analytics Overview">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <Title level={2} className="mb-0">{analytics.totalPlans}</Title>
              <Text type="secondary">Total Plans</Text>
            </div>
            <div className="text-center">
              <Title level={2} className="mb-0">
                {analytics.topIndustries[0]?.industry || 'N/A'}
              </Title>
              <Text type="secondary">Top Industry</Text>
            </div>
            <div className="text-center">
              <Title level={2} className="mb-0">
                {Object.keys(analytics.timeframeDistribution)[0] || 'N/A'}
              </Title>
              <Text type="secondary">Popular Timeframe</Text>
            </div>
            <div className="text-center">
              <Title level={2} className="mb-0">
                {analytics.insights.length}
              </Title>
              <Text type="secondary">Key Insights</Text>
            </div>
          </div>
        </Card>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex justify-center py-12">
            <Spin size="large" />
          </div>
        ) : plans.length === 0 ? (
          <div className="col-span-full">
            <Empty
              description="No growth plans found"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Button 
                type="primary" 
                icon={<RocketOutlined />}
                onClick={() => setViewMode('create')}
              >
                Create Your First Plan
              </Button>
            </Empty>
          </div>
        ) : (
          plans.map((plan) => (
            <Card
              key={plan.id}
              hoverable
              actions={[
                <Button
                  key="view"
                  type="text"
                  icon={<AreaChartOutlined />}
                  onClick={() => handlePlanSelect(plan.id)}
                >
                  View
                </Button>,
                <Button
                  key="export"
                  type="text"
                  icon={<DownloadOutlined />}
                  loading={exportLoading[plan.id]}
                  onClick={() => handleExport(plan.id, 'markdown')}
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
              <Card.Meta
                avatar={
                  <Avatar style={{ backgroundColor: '#1890ff' }}>
                    {plan.clientCompany.charAt(0)}
                  </Avatar>
                }
                title={plan.clientCompany}
                description={
                  <div>
                    <Tag color="blue">{plan.industry}</Tag>
                    <Tag color="green">{plan.timeframe}</Tag>
                    <div className="mt-2">
                      <Text type="secondary" className="text-xs">
                        Created {new Date(plan.createdAt).toLocaleDateString()}
                      </Text>
                    </div>
                  </div>
                }
              />
            </Card>
          ))
        )}
      </div>
    </div>
  );

  // Render plan creation form
  const renderCreateForm = () => (
    <Card className="mb-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Title level={3}>Create Growth Plan</Title>
          <Text type="secondary">Generate a customized growth strategy</Text>
        </div>
        <Button onClick={() => setViewMode('list')}>
          Back to Plans
        </Button>
      </div>

      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          closable
          onClose={clearError}
          className="mb-4"
        />
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Title level={4} className="flex items-center mb-4">
              <UserOutlined className="mr-2" />
              Your Information
            </Title>
            
            <Form.Item
              name="email"
              label="Email"
              rules={[{ required: true, type: 'email' }]}
              initialValue="consultant@example.com"
            >
              <Input prefix={<UserOutlined />} />
            </Form.Item>
            
            <Form.Item
              name="name"
              label="Your Name"
              rules={[{ required: true }]}
              initialValue="Alex Growth"
            >
              <Input />
            </Form.Item>
            
            <Form.Item
              name="company"
              label="Company"
              rules={[{ required: true }]}
              initialValue="Growth Partners Inc."
            >
              <Input />
            </Form.Item>
          </div>
          
          <div>
            <Title level={4} className="flex items-center mb-4">
              <TeamOutlined className="mr-2" />
              Client Information
            </Title>
            
            <Form.Item
              name="clientCompany"
              label="Company Name"
              rules={[{ required: true }]}
              initialValue="TechFlow Solutions"
            >
              <Input />
            </Form.Item>
            
            <Form.Item
              name="industry"
              label="Industry"
              rules={[{ required: true }]}
              initialValue="SaaS"
            >
              <Select>
                <Option value="SaaS">SaaS</Option>
                <Option value="E-commerce">E-commerce</Option>
                <Option value="Healthcare">Healthcare</Option>
                <Option value="Finance">Finance</Option>
                <Option value="Education">Education</Option>
                <Option value="Manufacturing">Manufacturing</Option>
                <Option value="Real Estate">Real Estate</Option>
                <Option value="Consulting">Consulting</Option>
              </Select>
            </Form.Item>
            
            <Form.Item
              name="contactName"
              label="Contact Name"
              rules={[{ required: true }]}
              initialValue="Sarah Johnson"
            >
              <Input />
            </Form.Item>
            
            <Form.Item
              name="contactRole"
              label="Contact Role"
              rules={[{ required: true }]}
              initialValue="CEO"
            >
              <Input />
            </Form.Item>
          </div>
        </div>
        
        <Divider />
        
        <Title level={4} className="flex items-center mb-4">
          <BulbOutlined className="mr-2" />
          Expertise & Experience
        </Title>
        
        <Form.Item
          name="expertise"
          label="Your Core Skills/Services"
          rules={[{ required: true }]}
          initialValue={['SEO', 'PPC', 'Content Marketing', 'Conversion Optimization']}
        >
          <Select
            mode="tags"
            style={{ width: '100%' }}
            placeholder="e.g., SEO, PPC, Cold Email, Sales Funnels"
          />
        </Form.Item>
        
        <Form.Item
          name="experience"
          label="Your Experience & Achievements"
          rules={[{ required: true, min: 50 }]}
          initialValue="Over 8 years of experience helping B2B SaaS companies scale from startup to $10M+ ARR. Successfully implemented growth strategies for 150+ clients, with an average revenue increase of 180% within 12 months. Specialized in full-funnel optimization, from lead generation to customer retention."
        >
          <TextArea rows={4} placeholder="Describe your relevant experience, years in business, notable results..." showCount maxLength={2000} />
        </Form.Item>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
       <Form.Item
  name="currentRevenue"
  label="Client's Current Monthly Revenue"
  normalize={(value) => {
    // Convert string to number when storing
    if (typeof value === 'string') {
      const num = parseFloat(value.replace(/[,$\s]/g, ''));
      return isNaN(num) ? undefined : num;
    }
    return value;
  }}
>
  <Input
    style={{ width: '100%' }}
    placeholder="50,000"
    onChange={(e) => {
      // Format display value
      let value = e.target.value.replace(/[^0-9]/g, '');
      if (value) {
        value = parseInt(value).toLocaleString();
      }
      e.target.value = value;
    }}
  />
</Form.Item>

       <Form.Item
  name="targetRevenue"
  label="Target Monthly Revenue"
  rules={[
    {
      validator: (_, value) => {
        if (value && value < 1000) {
          return Promise.reject(new Error('Minimum target revenue is $1,000'));
        }
        return Promise.resolve();
      }
    }
  ]}
  normalize={(value) => {
    if (typeof value === 'string') {
      const num = parseFloat(value.replace(/[,$\s]/g, ''));
      return isNaN(num) ? undefined : num;
    }
    return value;
  }}
>
  <Input
    style={{ width: '100%' }}
    placeholder="150,000"
    prefix="$"
    onChange={(e) => {
      let value = e.target.value.replace(/[^0-9]/g, '');
      if (value) {
        value = parseInt(value).toLocaleString();
        e.target.value = value;
      }
    }}
  />
</Form.Item>

          <Form.Item
            name="teamSize"
            label="Team Size"
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="25"
              min={1}
            />
          </Form.Item>
        </div>

        <Form.Item
          name="transcript"
          label="Discovery Call Notes (Optional)"
        >
          <TextArea rows={4} placeholder="Paste notes from your discovery call or key insights about the client..." />
        </Form.Item>

        <Divider />

        <div className="text-center">
          <Title level={5} className="mb-4">Timeframe</Title>
          <Radio.Group 
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            buttonStyle="solid"
            className="mb-6"
          >
            <Radio.Button value="3m">3 Months</Radio.Button>
            <Radio.Button value="6m">6 Months</Radio.Button>
            <Radio.Button value="12m">12 Months</Radio.Button>
          </Radio.Group>
        </div>
        
        <div className="text-center">
          <Button 
            type="primary" 
            size="large" 
            htmlType="submit"
            loading={generationLoading}
            icon={<ThunderboltOutlined />}
            className="min-w-48"
          >
            {generationLoading ? 'Generating Plan...' : 'Generate Growth Plan'}
          </Button>
        </div>
      </Form>
    </Card>
  );

  // Render plan view
  const renderPlanView = () => {
    const plan = selectedPlan || currentPlan;
    if (!plan) return <Empty description="No plan selected" />;

    const planData = plan.plan;

    return (
      <div className="space-y-8">
        {/* Header */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <Button 
                type="text" 
                icon={<HistoryOutlined />}
                onClick={() => setViewMode('list')}
                className="mb-2"
              >
                Back to Plans
              </Button>
              <Title level={3} className="mb-1">Growth Plan for</Title>
              <Title level={2} className="mt-0">{plan.metadata.clientCompany}</Title>
              <div className="flex items-center space-x-4">
                <Tag icon={<ClockCircleOutlined />} color="blue">
                  {plan.metadata.timeframe === '3m' ? '3-Month Plan' : plan.metadata.timeframe === '6m' ? '6-Month Plan' : '12-Month Plan'}
                </Tag>
                <Tag icon={<FundOutlined />} color="green">
                  {plan.metadata.industry} Industry
                </Tag>
              </div>
            </div>
            <div className="mt-4 md:mt-0">
              <Space>
                <Button 
                  icon={<DownloadOutlined />}
                  loading={exportLoading[plan.id]}
                  onClick={() => handleExport(plan.id, 'markdown')}
                >
                  Export
                </Button>
                <Button 
                  icon={<SaveOutlined />}
                  loading={templateLoading}
                  onClick={handleCreateTemplate}
                >
                  Save as Template
                </Button>
                <Button 
                  icon={<EditOutlined />}
                  onClick={() => setEditMode(true)}
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
          </div>
        </Card>

        {/* Executive Summary */}
        <Card>
          <Title level={4}>Executive Summary</Title>
          <Text>{planData.executiveSummary}</Text>
        </Card>

        {/* Tabs for different views */}
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          type="card"
          size="large"
          items={[
            {
              key: 'strategy',
              label: (
                <span>
                  <FundOutlined />
                  Strategy
                </span>
              ),
              children: (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card className="lg:col-span-2">
                    <Title level={4}>Implementation Stages</Title>
                    <Timeline>
                      {planData.strategy?.stages?.map((stage: any, index: number) => (
                        <Timeline.Item
                          key={index}
                          dot={
                            <CheckCircleOutlined 
                              style={{ fontSize: '16px', color: '#52c41a' }} 
                            />
                          }
                        >
                          <Title level={5}>{stage.title}</Title>
                          <Text type="secondary">{stage.duration}</Text>
                          <div className="mt-2">
                            <Text strong>Budget: ${stage.budget?.toLocaleString()}</Text>
                          </div>
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
                    <div className="space-y-4">
                      {planData.strategy?.priorities?.map((priority: any, index: number) => (
                        <Card key={index} size="small">
                          <Title level={5} className="mb-2">{priority.area}</Title>
                          <div className="flex justify-between">
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
              )
            },
            {
              key: 'metrics',
              label: (
                <span>
                  <BarChartOutlined />
                  Metrics
                </span>
              ),
              children: (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <Title level={4}>Growth Projection</Title>
                    <div className="h-80">
                      {renderSafeLineChart(planData.metrics?.timeline)}
                    </div>
                  </Card>
                  
                  <Card>
                    <Title level={4}>KPI Targets</Title>
                    <div className="space-y-4">
                      {planData.metrics?.kpis?.map((kpi: any, index: number) => (
                        <div key={index}>
                          <div className="flex justify-between mb-1">
                            <Text strong>{kpi.name}</Text>
                            <Text>{kpi.current} → {kpi.target}</Text>
                          </div>
                          <Progress 
                            percent={Math.min(100, Math.max(0, (kpi.target / Math.max(kpi.current, 1)) * 50))} 
                            strokeColor="#52c41a"
                          />
                          <Text type="secondary" className="text-sm">
                            {kpi.improvement}% improvement target
                          </Text>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              )
            },
            {
              key: 'channels',
              label: (
                <span>
                  <PieChartOutlined />
                  Channels
                </span>
              ),
              children: (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <Title level={4}>Channel Mix</Title>
                    <div className="h-80">
                      {renderSafePieChart(planData.metrics?.channels)}
                    </div>
                  </Card>
                  
                  <Card>
                    <Title level={4}>Channel Details</Title>
                    <List
                      dataSource={planData.metrics?.channels || []}
                      renderItem={(channel: any) => (
                        <List.Item>
                          <List.Item.Meta
                            title={channel.name}
                            description={
                              <div>
                                <div>Allocation: {channel.allocation}%</div>
                                <div>Expected ROI: {channel.expectedROI}%</div>
                                <Tag color={channel.status === 'active' ? 'green' : channel.status === 'testing' ? 'orange' : 'default'}>
                                  {channel.status}
                                </Tag>
                              </div>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  </Card>
                </div>
              )
            }
          ]}
        />

        {/* Next Steps */}
        <Card>
          <Title level={4}>Next Steps</Title>
          <List
            dataSource={planData.nextSteps || []}
            renderItem={(step: string, index: number) => (
              <List.Item>
                <Text>
                  <strong>{index + 1}.</strong> {step}
                </Text>
              </List.Item>
            )}
          />
        </Card>
      </div>
    );
  };

  // Main render
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <Title level={2} className="flex items-center justify-center">
          <RocketOutlined className="mr-2 text-purple-600" />
          <span className="bg-clip-text">
            AI Growth Plan Creator
          </span>
        </Title>
        <Text type="secondary" className="text-lg">
          Build your customized, data-driven growth roadmap
        </Text>
      </div>

      {/* Error Display */}
      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          closable
          onClose={clearError}
          className="mb-6"
        />
      )}

      {/* Content based on view mode */}
      {viewMode === 'list' && renderPlansList()}
      {viewMode === 'create' && renderCreateForm()}
      {viewMode === 'view' && renderPlanView()}

      {/* Edit Modal */}
      <Modal
        title="Edit Growth Plan"
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
        />
      </Modal>
    </div>
  );
}