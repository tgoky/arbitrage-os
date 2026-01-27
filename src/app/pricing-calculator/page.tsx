"use client";

import React, { useState, useEffect } from 'react';
import {
  DollarOutlined,
  CalculatorOutlined,
  PieChartOutlined,
  ShareAltOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  SaveOutlined,
  DownloadOutlined,
  BulbOutlined,
  TrophyOutlined,
  BookOutlined,
  FileTextOutlined,
  EyeOutlined,
  ArrowLeftOutlined,
  DeleteOutlined,
  BarChartOutlined,
  ContainerOutlined,
  BankOutlined,
  CheckCircleOutlined,
  ThunderboltOutlined,
  RiseOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  CalendarOutlined,
  TeamOutlined,
  SafetyCertificateOutlined,
  EnvironmentOutlined,
  LineChartOutlined
} from '@ant-design/icons';
import {
  Button,
  Card,
  Form,
  Input,
  Slider,
  Typography,
  Divider,
  Space,
  Tag,
  Alert,
  Row,
  Col,
  Statistic,
  Tooltip,
  Select,
  Switch,
  Tabs,
  Modal,
  Table,
  Progress,
  Spin,
  notification,
  Collapse,
  List,
  Badge,
  InputNumber,
  ConfigProvider,
  theme
} from 'antd';

// Import our custom hooks
import {
  usePricingCalculator,
  useSavedCalculations,
  usePricingBenchmarks,
  useCalculationExport,
  usePricingValidation,
  type SavedCalculation,
  type GeneratedPricingPackage
} from '../hooks/usePricingCalculator';




import LoadingOverlay from './LoadingOverlay';
import { useWorkspaceContext } from '../hooks/useWorkspaceContext';
import { useRouter } from 'next/navigation';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Panel } = Collapse;
const { Option } = Select;

// --- DARK THEME DESIGN TOKENS (Matching Growth Plan) ---
const BRAND_GREEN = '#5CC49D';
const SPACE_COLOR = '#9DA2B3';
const DARK_BG = '#0a0a0f';
const DARK_SURFACE = '#12121a';
const DARK_CARD = '#1a1a24';
const DARK_BORDER = '#2a2a3a';
const DARK_HOVER = '#242430';
const TEXT_PRIMARY = '#f0f0f5';
const TEXT_SECONDARY = '#9DA2B3';
const TEXT_MUTED = '#6b6b7a';

// Professional Chart Colors for Dark Theme
const CHART_COLORS = ['#5CC49D', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

const PricingCalculator = () => {
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('calculator');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [currentPackage, setCurrentPackage] = useState<GeneratedPricingPackage | null>(null);
  const [savedCalculationId, setSavedCalculationId] = useState<string | null>(null);
  const { currentWorkspace, isWorkspaceReady } = useWorkspaceContext();
  const router = useRouter();

  // Hooks
  const { generatePricing, quickCalculate, generating } = usePricingCalculator();
  const { calculations, fetchCalculations, loading: calculationsLoading, getCalculation, deleteCalculation } = useSavedCalculations();
  const { benchmarks, fetchBenchmarks } = usePricingBenchmarks();
  const { exportCalculation } = useCalculationExport();
  const { validateInput, getBusinessInsights } = usePricingValidation();

  const [viewingCalculation, setViewingCalculation] = useState<GeneratedPricingPackage | null>(null);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [viewDetailLoading, setViewDetailLoading] = useState(false);
  const [viewLoadingStates, setViewLoadingStates] = useState<{[key: string]: boolean}>({});

  const [exportState, setExportState] = useState<{
    loading: boolean;
    type: string | null;
  }>({
    loading: false,
    type: null
  });

  // Quick calculation results (real-time)
  const [quickResults, setQuickResults] = useState({
    totalClientImpact: 0,
    monthlyImpact: 0,
    directSavingsComponent: 0,
    revenueComponent: 0,
    timeValueComponent: 0,
    recommendedRetainer: 0,
    annualFee: 0,
    netSavings: 0,
    roiPercentage: 0,
    hourlyRate: 0,
    monthlyHours: 0,
    clientHourlyValue: 95,
    hoursFreedAnnually: 0,
    timeValueRatio: 0,
  });

  // Calculator disabled style
  const calculatorDisabledStyle = currentPackage ? {
    pointerEvents: 'none' as const,
    opacity: 0.7,
    position: 'relative' as const
  } : {};

  // Google Font Injection
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  useEffect(() => {
    if (currentWorkspace) {
      fetchCalculations();
    }
    fetchBenchmarks().catch(err => {
      console.warn('Benchmarks unavailable:', err);
    });
  }, [fetchCalculations, fetchBenchmarks, currentWorkspace?.id]);

  // WORKSPACE VALIDATION
  if (!isWorkspaceReady) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center min-h-[50vh] flex items-center justify-center" style={{ background: DARK_BG }}>

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

  const handleBack = () => {
    router.push(`/dashboard/${currentWorkspace?.slug}`);
  };

  const isExporting = exportState.loading;
  const exportingType = exportState.type;
  const isGenerating = generating;

  // Real-time calculation updates
  const handleFormChange = () => {
    const values = form.getFieldsValue();
    if (values.annualClientSavings && values.annualRevenueIncrease && values.hoursPerWeek && values.roiMultiple) {
      const results = quickCalculate({
        annualClientSavings: values.annualClientSavings,
        annualRevenueIncrease: values.annualRevenueIncrease,
        hoursPerWeek: values.hoursPerWeek,
        roiMultiple: values.roiMultiple,
        industry: values.industry || 'Technology'
      });
      setQuickResults(results);
    }
  };

  const onFinish = async (values: any) => {
    const validation = validateInput(values);
    if (!validation.isValid) {
      Object.entries(validation.errors).forEach(([field, error]) => {
        notification.error({ 
          message: 'Validation Error', 
          description: `${field}: ${error}`,
          placement: 'topRight'
        });
      });
      return;
    }

    const result = await generatePricing(values);
    if (result) {
      setCurrentPackage(result.package);
      setSavedCalculationId(result.calculationId);
      setActiveTab('results');
      fetchCalculations();
      notification.success({ 
        message: 'Pricing Package Generated!', 
        description: 'Your comprehensive pricing strategy is ready.',
        placement: 'topRight'
      });
    }
  };

  const resetForm = () => {
    form.resetFields();
    setQuickResults({
      totalClientImpact: 0, monthlyImpact: 0, directSavingsComponent: 0, revenueComponent: 0,
      timeValueComponent: 0, recommendedRetainer: 0, annualFee: 0, netSavings: 0,
      roiPercentage: 0, hourlyRate: 0, monthlyHours: 0, clientHourlyValue: 95,
      hoursFreedAnnually: 0, timeValueRatio: 0,
    });
    setCurrentPackage(null);
    setSavedCalculationId(null);
    setActiveTab('calculator');
  };

  const handleView = async (record: SavedCalculation) => {
    setViewLoadingStates(prev => ({ ...prev, [record.id]: true }));
    setViewDetailLoading(true);
    setViewingCalculation(null);

    try {
      const fullData = await getCalculation(record.id);
      if (fullData && fullData.calculation) {
        setViewingCalculation(fullData.calculation as GeneratedPricingPackage);
        setIsViewModalVisible(true);
      } else {
        notification.warning({ 
          message: 'View Warning', 
          description: 'Calculation data structure was incomplete.',
          placement: 'topRight'
        });
      }
    } catch (err) {
      notification.error({ 
        message: 'View Failed', 
        description: 'Could not load calculation details.',
        placement: 'topRight'
      });
    } finally {
      setViewDetailLoading(false);
      setViewLoadingStates(prev => ({ ...prev, [record.id]: false }));
    }
  };

  const handleDelete = async (record: SavedCalculation) => {
    Modal.confirm({
      title: <span style={{ color: TEXT_PRIMARY }}>Delete Calculation</span>,
      content: <span style={{ color: TEXT_SECONDARY }}>Are you sure you want to delete the calculation for "{record.clientName || 'Unnamed Client'}"?</span>,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await deleteCalculation(record.id);
          notification.success({ 
            message: 'Calculation deleted successfully',
            placement: 'topRight'
          });
          fetchCalculations();
        } catch (error) {
          notification.error({ 
            message: 'Failed to delete calculation',
            placement: 'topRight'
          });
        }
      },
    });
  };

  const handleExportFromHistory = async (record: SavedCalculation, format: 'proposal' | 'presentation' | 'contract' | 'complete' = 'complete') => {
    try {
      await exportCalculation(record.id, format);
    } catch (err) {
      console.error("Saved Export failed:", err);
    }
  };

  const handleExport = async (format: 'proposal' | 'presentation' | 'contract' | 'complete') => {
    setExportState({ loading: true, type: format });
    try {
      const values = form.getFieldsValue();
      if (!values.annualClientSavings || !values.annualRevenueIncrease || !values.hoursPerWeek || !values.roiMultiple) {
        notification.error({ 
          message: 'Incomplete Form', 
          description: 'Please fill in basic pricing info.',
          placement: 'topRight'
        });
        return;
      }

      const calculationData = {
        clientName: values.clientName || 'Valued Client',
        projectName: values.projectName || 'AI Services Project',
        industry: values.industry || 'Technology',
        annualClientSavings: values.annualClientSavings,
        annualRevenueIncrease: values.annualRevenueIncrease,
        recommendedRetainer: quickResults.recommendedRetainer,
        netSavings: quickResults.netSavings,
        roiPercentage: quickResults.roiPercentage,
        hourlyRate: quickResults.hourlyRate,
        monthlyHours: quickResults.monthlyHours
      };

      const response = await fetch('/api/pricing-calculator/export-linear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format, calculationData })
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      // Get filename from response headers
      const contentDisposition = response.headers.get('content-disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch?.[1] || `pricing-${format}-${calculationData.clientName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.html`;

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      notification.success({ 
        message: 'Export Successful! 🎉', 
        description: `${format.charAt(0).toUpperCase() + format.slice(1)} has been downloaded.`,
        placement: 'topRight'
      });
    } catch (err) {
      notification.error({ 
        message: 'Export Failed', 
        description: String(err),
        placement: 'topRight'
      });
    } finally {
      setExportState({ loading: false, type: null });
    }
  };

  const getBusinessInsightsForCurrent = () => {
    const values = form.getFieldsValue();
    if (values.annualClientSavings && values.annualRevenueIncrease && values.hoursPerWeek && values.roiMultiple) {
      return getBusinessInsights(values);
    }
    return null;
  };

  const insights = getBusinessInsightsForCurrent();

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
          Slider: {
            handleColor: BRAND_GREEN,
            trackBg: BRAND_GREEN,
            colorPrimary: BRAND_GREEN,
            railBg: DARK_SURFACE,
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
        <LoadingOverlay visible={isGenerating} />
        
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex flex-col items-center mb-10">
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={handleBack}
              className="self-start mb-4 border-none shadow-none p-0"
              style={{ background: 'transparent', color: TEXT_MUTED }}
            >
              Back to Dashboard
            </Button>

            <div className="px-6 py-2 rounded-full mb-4" style={{ background: `${DARK_SURFACE}80`, border: `1px solid ${DARK_BORDER}` }}>
              <span className="text-[15px] font-bold tracking-widest uppercase" style={{ color: TEXT_PRIMARY }}>
                <span style={{ color: BRAND_GREEN }}>a</span>rb<span style={{ color: BRAND_GREEN }}>i</span>trageOS
              </span>
            </div>
            <Title level={1} className="m-0 mb-2" style={{ color: TEXT_PRIMARY }}>Pricing Calculator</Title>
            <Text className="text-lg" style={{ color: TEXT_MUTED }}>AI-powered strategy to maximize your deal value</Text>
          </div>

          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            type="line"
            size="large"
            className="custom-tabs mb-8"
            items={[
              {
                key: 'calculator',
                label: (
                  <span className="px-4">
                    <CalculatorOutlined /> Calculator
                    {currentPackage && (
                      <Badge
                        count="✓"
                        style={{
                          backgroundColor: '#52c41a',
                          marginLeft: 8,
                          fontSize: '10px',
                          height: '16px',
                          lineHeight: '16px'
                        }}
                      />
                    )}
                  </span>
                ),
                children: (
                  <div style={calculatorDisabledStyle}>
                    {currentPackage && (
                      <div className="mb-6 animate-fade-in">
                        <Alert
                          message="Calculator Locked"
                          description={
                            <div>
                              <p>Your pricing strategy has been generated! The calculator is now locked to prevent accidental changes.</p>
                              <p>Click <strong>Generate New Strategy</strong> in the Results tab to create a new calculation.</p>
                            </div>
                          }
                          type="info"
                          showIcon
                          action={
                            <Button
                              type="primary"
                              onClick={() => {
                                setActiveTab('results');
                                setTimeout(() => {
                                  const resultsElement = document.getElementById('pricing-results');
                                  if (resultsElement) {
                                    resultsElement.scrollIntoView({
                                      behavior: 'smooth',
                                      block: 'start'
                                    });
                                  }
                                }, 100);
                              }}
                              style={{ background: BRAND_GREEN, borderColor: BRAND_GREEN, color: '#000' }}
                            >
                              Go to Results
                            </Button>
                          }
                          className="shadow-md rounded-xl"
                          style={{ background: DARK_SURFACE, borderColor: DARK_BORDER }}
                        />
                      </div>
                    )}

                    <Row gutter={[32, 32]}>
                      {/* Left Column: Input Form */}
                      <Col xs={24} lg={14}>
                        <Card className="shadow-sm rounded-2xl" style={{ background: DARK_CARD, border: `1px solid ${DARK_BORDER}` }}>
                          <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
                            <Title level={4} className="m-0 flex items-center" style={{ color: TEXT_PRIMARY }}>
                              <DollarOutlined className="mr-2" style={{ color: BRAND_GREEN }} /> Inputs
                            </Title>
                            <Switch
                              checkedChildren="Advanced Mode"
                              unCheckedChildren="Basic Mode"
                              checked={showAdvanced}
                              onChange={setShowAdvanced}
                              disabled={!!currentPackage}
                            />
                          </div>

                          <Form
                            form={form}
                            layout="vertical"
                            onFinish={onFinish}
                            onValuesChange={handleFormChange}
                            requiredMark={false}
                            disabled={!!currentPackage}
                            initialValues={{
                              annualClientSavings: 50000,
                              annualRevenueIncrease: 100000,
                              hoursPerWeek: 20,
                              roiMultiple: 5,
                              experienceLevel: 'intermediate',
                              deliveryRisk: 'medium',
                              clientUrgency: 'medium',
                              relationshipType: 'new',
                              paymentTerms: 'monthly',
                              marketDemand: 'medium',
                              competitionLevel: 'medium',
                              guaranteeOffered: false,
                              seasonality: false,
                            }}
                          >
                            {/* Value Impact Section - UPDATED with SPACE_COLOR background */}
                            <div 
                              className="p-6 rounded-xl border mb-8"
                              style={{ 
                                background: DARK_SURFACE, 
                                border: `1px solid ${DARK_BORDER}`,
                                backgroundColor: DARK_SURFACE // Using DARK_SURFACE instead of SPACE_COLOR for better contrast
                              }}
                            >
                              <Title level={5} className="mb-1 flex items-center" style={{ color: TEXT_PRIMARY }}>
                                <ThunderboltOutlined className="mr-2" style={{ color: BRAND_GREEN }} /> Value Impact
                              </Title>
                              <Text className="text-sm block mb-6" style={{ color: TEXT_MUTED }}>Quantify the financial upside for your client</Text>

                              <Row gutter={16}>
                                <Col span={12}>
                                  <Form.Item
                                    name="annualClientSavings"
                                    label={<span className="font-medium" style={{ color: TEXT_SECONDARY }}>Cost Savings (Annual)</span>}
                                    rules={[
                                      { required: true, message: 'Please input estimated savings!' },
                                      { type: 'number', min: 0, message: 'Must be positive' }
                                    ]}
                                  >
                                    <InputNumber
                                      prefix={<span style={{ color: TEXT_MUTED }}>$</span>}
                                      size="large"
                                      className="w-full font-bold"
                                      style={{ 
                                        background: DARK_CARD,
                                        borderColor: DARK_BORDER,
                                        color: TEXT_PRIMARY
                                      }}
                                      formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                      parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
                                    />
                                  </Form.Item>
                                </Col>
                                <Col span={12}>
                                  <Form.Item
                                    name="annualRevenueIncrease"
                                    label={<span className="font-medium" style={{ color: TEXT_SECONDARY }}>Revenue Lift (Annual)</span>}
                                    rules={[
                                      { required: true, message: 'Please input expected revenue increase!' },
                                      { type: 'number', min: 0, message: 'Must be positive' }
                                    ]}
                                  >
                                    <InputNumber
                                      prefix={<span style={{ color: TEXT_MUTED }}>$</span>}
                                      size="large"
                                      className="w-full font-bold"
                                      style={{ 
                                        background: DARK_CARD,
                                        borderColor: DARK_BORDER,
                                        color: TEXT_PRIMARY
                                      }}
                                      formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                      parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
                                    />
                                  </Form.Item>
                                </Col>
                              </Row>

                              <div className="mt-2 flex justify-between items-center p-3 rounded-lg border" style={{ background: DARK_CARD, borderColor: DARK_BORDER }}>
                                <Text style={{ color: TEXT_SECONDARY }}>Total Client Impact</Text>
                                <Text className="text-xl font-bold" style={{ color: BRAND_GREEN }}>
                                  ${((form.getFieldValue('annualClientSavings') || 0) + (form.getFieldValue('annualRevenueIncrease') || 0)).toLocaleString()}/yr
                                </Text>
                              </div>
                            </div>

                            <Row gutter={24}>
                              <Col span={12}>
                                <Form.Item
                                  name="hoursPerWeek"
                                  label={<span style={{ color: TEXT_SECONDARY }}>Hours/Week Commitment</span>}
                                  rules={[{ required: true, message: 'Please input hours!' }]}
                                >
                                  <Slider 
                                    min={5} 
                                    max={40} 
                                    marks={{ 5: '5h', 20: '20h', 40: '40h' }}
                                    trackStyle={{ background: BRAND_GREEN }}
                                    handleStyle={{ borderColor: BRAND_GREEN }}
                                  />
                                </Form.Item>
                              </Col>
                              <Col span={12}>
                                <Form.Item
                                  name="roiMultiple"
                                  label={
                                    <span style={{ color: TEXT_SECONDARY }}>
                                      Target ROI Multiple
                                      <Tooltip title="Higher multiples for specialized work">
                                        <InfoCircleOutlined className="ml-1" style={{ color: SPACE_COLOR }} />
                                      </Tooltip>
                                    </span>
                                  }
                                  rules={[{ required: true, message: 'Please select ROI multiple!' }]}
                                >
                                  <Slider 
                                    min={2} 
                                    max={15} 
                                    step={0.5} 
                                    marks={{ 2: '2x', 5: '5x', 10: '10x', 15: '15x' }}
                                    trackStyle={{ background: BRAND_GREEN }}
                                    handleStyle={{ borderColor: BRAND_GREEN }}
                                  />
                                </Form.Item>
                              </Col>
                            </Row>

                            {showAdvanced && (
                              <div className="animate-fade-in mt-8 pt-8 border-t" style={{ borderColor: DARK_BORDER }}>
                                <Divider orientation="left">
                                  <Title level={5} className="flex items-center" style={{ color: TEXT_PRIMARY }}>
                                    <EnvironmentOutlined className="mr-2" />
                                    Project Context
                                  </Title>
                                </Divider>

                                <Row gutter={16}>
                                  <Col span={12}>
                                    <Form.Item name="clientName" label={<span style={{ color: TEXT_SECONDARY }}>Client Name</span>}>
                                      <Input placeholder="Client name" style={{ background: DARK_SURFACE, borderColor: DARK_BORDER, color: TEXT_PRIMARY }} />
                                    </Form.Item>
                                  </Col>
                                  <Col span={12}>
                                    <Form.Item name="projectName" label={<span style={{ color: TEXT_SECONDARY }}>Project Name</span>}>
                                      <Input placeholder="Project name" style={{ background: DARK_SURFACE, borderColor: DARK_BORDER, color: TEXT_PRIMARY }} />
                                    </Form.Item>
                                  </Col>
                                </Row>

                                <Row gutter={16}>
                                  <Col span={12}>
                                    <Form.Item name="industry" label={<span style={{ color: TEXT_SECONDARY }}>Industry</span>}>
                                      <Select placeholder="Select industry" style={{ background: DARK_SURFACE, borderColor: DARK_BORDER }}>
                                        <Option value="Technology">Technology</Option>
                                        <Option value="Healthcare">Healthcare</Option>
                                        <Option value="Finance">Finance</Option>
                                        <Option value="Manufacturing">Manufacturing</Option>
                                        <Option value="Retail">Retail</Option>
                                        <Option value="Education">Education</Option>
                                        <Option value="Real Estate">Real Estate</Option>
                                      </Select>
                                    </Form.Item>
                                  </Col>
                                  <Col span={12}>
                                    <Form.Item name="serviceType" label={<span style={{ color: TEXT_SECONDARY }}>Service Type</span>}>
                                      <Select placeholder="Select service type" style={{ background: DARK_SURFACE, borderColor: DARK_BORDER }}>
                                        <Option value="AI Consulting">AI Consulting</Option>
                                        <Option value="Process Automation">Process Automation</Option>
                                        <Option value="Data Analytics">Data Analytics</Option>
                                        <Option value="Digital Transformation">Digital Transformation</Option>
                                        <Option value="Custom Development">Custom Development</Option>
                                      </Select>
                                    </Form.Item>
                                  </Col>
                                </Row>

                                <Divider orientation="left">
                                  <Title level={5} className="flex items-center" style={{ color: TEXT_PRIMARY }}>
                                    <LineChartOutlined className="mr-2" />
                                    Pricing Factors
                                  </Title>
                                </Divider>

                                <Row gutter={16}>
                                  <Col span={12}>
                                    <Form.Item name="experienceLevel" label={<span style={{ color: TEXT_SECONDARY }}>Experience Level</span>}>
                                      <Select style={{ background: DARK_SURFACE, borderColor: DARK_BORDER }}>
                                        <Option value="beginner">Beginner</Option>
                                        <Option value="intermediate">Intermediate</Option>
                                        <Option value="expert">Expert</Option>
                                        <Option value="premium">Premium</Option>
                                      </Select>
                                    </Form.Item>
                                  </Col>
                                  <Col span={12}>
                                    <Form.Item name="deliveryRisk" label={<span style={{ color: TEXT_SECONDARY }}>Delivery Risk</span>}>
                                      <Select style={{ background: DARK_SURFACE, borderColor: DARK_BORDER }}>
                                        <Option value="low">Low Risk</Option>
                                        <Option value="medium">Medium Risk</Option>
                                        <Option value="high">High Risk</Option>
                                      </Select>
                                    </Form.Item>
                                  </Col>
                                </Row>

                                <Row gutter={16}>
                                  <Col span={12}>
                                    <Form.Item name="clientUrgency" label={<span style={{ color: TEXT_SECONDARY }}>Client Urgency</span>}>
                                      <Select style={{ background: DARK_SURFACE, borderColor: DARK_BORDER }}>
                                        <Option value="low">Low Urgency</Option>
                                        <Option value="medium">Medium Urgency</Option>
                                        <Option value="high">High Urgency</Option>
                                      </Select>
                                    </Form.Item>
                                  </Col>
                                  <Col span={12}>
                                    <Form.Item name="relationshipType" label={<span style={{ color: TEXT_SECONDARY }}>Relationship Type</span>}>
                                      <Select style={{ background: DARK_SURFACE, borderColor: DARK_BORDER }}>
                                        <Option value="new">New Client</Option>
                                        <Option value="existing">Existing Client</Option>
                                        <Option value="referral">Referral</Option>
                                        <Option value="strategic">Strategic Partner</Option>
                                      </Select>
                                    </Form.Item>
                                  </Col>
                                </Row>

                                <Row gutter={16}>
                                  <Col span={12}>
                                    <Form.Item name="paymentTerms" label={<span style={{ color: TEXT_SECONDARY }}>Payment Terms</span>}>
                                      <Select style={{ background: DARK_SURFACE, borderColor: DARK_BORDER }}>
                                        <Option value="upfront">Upfront</Option>
                                        <Option value="monthly">Monthly</Option>
                                        <Option value="milestone">Milestone</Option>
                                        <Option value="success-based">Success-based</Option>
                                      </Select>
                                    </Form.Item>
                                  </Col>
                                  <Col span={12}>
                                    <Form.Item name="projectDuration" label={<span style={{ color: TEXT_SECONDARY }}>Project Duration (months)</span>}>
                                      <InputNumber 
                                        min={1} 
                                        max={60} 
                                        placeholder="6" 
                                        style={{ width: '100%', background: DARK_SURFACE, borderColor: DARK_BORDER, color: TEXT_PRIMARY }} 
                                      />
                                    </Form.Item>
                                  </Col>
                                </Row>

                                <Row gutter={16}>
                                  <Col span={12}>
                                    <Form.Item name="marketDemand" label={<span style={{ color: TEXT_SECONDARY }}>Market Demand</span>}>
                                      <Select style={{ background: DARK_SURFACE, borderColor: DARK_BORDER }}>
                                        <Option value="low">Low</Option>
                                        <Option value="medium">Medium</Option>
                                        <Option value="high">High</Option>
                                      </Select>
                                    </Form.Item>
                                  </Col>
                                  <Col span={12}>
                                    <Form.Item name="competitionLevel" label={<span style={{ color: TEXT_SECONDARY }}>Competition Level</span>}>
                                      <Select style={{ background: DARK_SURFACE, borderColor: DARK_BORDER }}>
                                        <Option value="low">Low</Option>
                                        <Option value="medium">Medium</Option>
                                        <Option value="high">High</Option>
                                      </Select>
                                    </Form.Item>
                                  </Col>
                                </Row>

                                <Row gutter={16}>
                                  <Col span={12}>
                                    <Form.Item name="guaranteeOffered" valuePropName="checked">
                                      <Switch /> <span className="ml-2" style={{ color: TEXT_SECONDARY }}>Offer Performance Guarantee</span>
                                    </Form.Item>
                                  </Col>
                                  <Col span={12}>
                                    <Form.Item name="seasonality" valuePropName="checked">
                                      <Switch /> <span className="ml-2" style={{ color: TEXT_SECONDARY }}>Seasonal Project</span>
                                    </Form.Item>
                                  </Col>
                                </Row>
                              </div>
                            )}

                            <div className="flex gap-4 mt-8 pt-6 border-t" style={{ borderColor: DARK_BORDER }}>
                              <Button 
                                size="large" 
                                onClick={resetForm} 
                                icon={<ReloadOutlined />} 
                                disabled={!!currentPackage}
                                style={{ borderColor: DARK_BORDER, color: TEXT_SECONDARY }}
                              >
                                Reset
                              </Button>
                              {!currentPackage ? (
                                <Button
                                  type="primary"
                                  htmlType="submit"
                                  size="large"
                                  block
                                  loading={isGenerating}
                                  icon={<BulbOutlined />}
                                  className="shadow-lg hover:scale-105 transition-transform"
                                  style={{ 
                                    background: BRAND_GREEN, 
                                    borderColor: BRAND_GREEN, 
                                    color: '#000',
                                    boxShadow: `0 8px 32px ${BRAND_GREEN}40`
                                  }}
                                >
                                  Generate Pricing Strategy
                                </Button>
                              ) : (
                                <Button 
                                  size="large" 
                                  block 
                                  disabled 
                                  icon={<CheckCircleOutlined />}
                                  style={{ borderColor: DARK_BORDER, color: TEXT_MUTED }}
                                >
                                  Strategy Generated
                                </Button>
                              )}
                            </div>
                          </Form>
                        </Card>
                      </Col>

                      {/* Right Column: Live Preview */}
                      <Col xs={24} lg={10}>
                        <div className="sticky top-6">
                          <Card className="shadow-xl border-none overflow-hidden relative rounded-2xl" style={{ background: DARK_CARD, border: `1px solid ${DARK_BORDER}` }}>
                            <div className="absolute top-0 right-0 p-3 opacity-10"><PieChartOutlined style={{ fontSize: 150, color: BRAND_GREEN }} /></div>
                            <div className="relative z-10">
                              <Title level={4} className="mb-6 flex items-center" style={{ color: TEXT_PRIMARY }}>
                                <EyeOutlined className="mr-2" style={{ color: BRAND_GREEN }} /> Live Preview
                              </Title>

                              <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="p-3 rounded-lg text-center" style={{ background: DARK_SURFACE, border: `1px solid ${DARK_BORDER}` }}>
                                  <div className="text-xs mb-1" style={{ color: TEXT_MUTED }}>Savings</div>
                                  <div className="font-bold text-lg" style={{ color: BRAND_GREEN }}>${Number(quickResults.directSavingsComponent).toLocaleString()}/mo</div>
                                </div>
                                <div className="p-3 rounded-lg text-center" style={{ background: DARK_SURFACE, border: `1px solid ${DARK_BORDER}` }}>
                                  <div className="text-xs mb-1" style={{ color: TEXT_MUTED }}>Revenue</div>
                                  <div className="font-bold text-lg" style={{ color: '#3B82F6' }}>${Number(quickResults.revenueComponent).toLocaleString()}/mo</div>
                                </div>
                                <div className="p-3 rounded-lg text-center" style={{ background: DARK_SURFACE, border: `1px solid ${DARK_BORDER}` }}>
                                  <div className="text-xs mb-1" style={{ color: TEXT_MUTED }}>Time Value</div>
                                  <div className="font-bold text-lg" style={{ color: '#F59E0B' }}>${Number(quickResults.timeValueComponent).toLocaleString()}/mo</div>
                                </div>
                              </div>

                              <Divider style={{ borderColor: DARK_BORDER }} />

                              <div className="text-center py-4">
                                <div className="mb-2 uppercase tracking-wide text-xs font-bold" style={{ color: TEXT_MUTED }}>Total Monthly Impact</div>
                                <div className="text-4xl font-extrabold tracking-tight" style={{ color: BRAND_GREEN }}>
                                  ${quickResults.monthlyImpact.toLocaleString()}
                                </div>
                                <div className="text-sm mt-2 font-medium" style={{ color: TEXT_SECONDARY }}>Monthly Client Benefit</div>
                              </div>

                              <Divider style={{ borderColor: DARK_BORDER }} />

                              <div className="text-center py-4">
                                <div className="mb-2 uppercase tracking-wide text-xs font-bold" style={{ color: TEXT_MUTED }}>Recommended Monthly Retainer</div>
                                <div className="text-5xl font-extrabold tracking-tight" style={{ color: TEXT_PRIMARY }}>
                                  ${quickResults.recommendedRetainer.toLocaleString()}
                                </div>
                                <div className="text-sm mt-2 font-medium" style={{ color: BRAND_GREEN }}>
                                  {quickResults.roiPercentage.toFixed(0)}% Client ROI
                                </div>
                              </div>

                              <Divider style={{ borderColor: DARK_BORDER }} />

                              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                                <div className="flex justify-between">
                                  <span style={{ color: TEXT_SECONDARY }}>Your Hourly Rate:</span>
                                  <span className="font-bold" style={{ color: TEXT_PRIMARY }}>${quickResults.hourlyRate}/hr</span>
                                </div>
                                <div className="flex justify-between">
                                  <span style={{ color: TEXT_SECONDARY }}>Monthly Hours:</span>
                                  <span className="font-bold" style={{ color: TEXT_PRIMARY }}>{quickResults.monthlyHours}h</span>
                                </div>
                              </div>

                              {/* Annual Time Impact Section */}
                              {quickResults.hoursFreedAnnually > 0 && (
                                <div className="p-4 rounded-lg border mt-4" style={{ background: DARK_SURFACE, borderColor: BRAND_GREEN + '30' }}>
                                  <div className="flex items-center mb-2">
                                    <ClockCircleOutlined className="mr-2" style={{ color: BRAND_GREEN }} />
                                    <Text className="font-bold" style={{ color: TEXT_PRIMARY }}>Annual Time Impact</Text>
                                  </div>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                      <span style={{ color: TEXT_SECONDARY }}>Hours Freed Annually:</span>
                                      <span className="font-bold" style={{ color: TEXT_PRIMARY }}>{quickResults.hoursFreedAnnually.toLocaleString()} hours</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span style={{ color: TEXT_SECONDARY }}>Value at ${quickResults.clientHourlyValue}/hr:</span>
                                      <span className="font-bold" style={{ color: '#F59E0B' }}>
                                        ${(quickResults.hoursFreedAnnually * quickResults.clientHourlyValue).toLocaleString()}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span style={{ color: TEXT_SECONDARY }}>Time Value Ratio:</span>
                                      <span className="font-bold" style={{ color: BRAND_GREEN }}>
                                        {Math.round((quickResults.timeValueRatio || 0) * 100)}% of total value
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* ROI Warnings */}
                              {quickResults.roiPercentage > 0 && quickResults.roiPercentage < 100 && (
                                <Alert
                                  message="Low Client ROI"
                                  description="Consider adjusting your ROI multiple or increasing the time value component."
                                  type="warning"
                                  showIcon
                                  className="mt-4 rounded-lg"
                                  style={{ background: DARK_SURFACE, borderColor: '#8B5A2B' }}
                                  icon={<WarningOutlined style={{ color: '#F59E0B' }} />}
                                />
                              )}

                              {quickResults.roiPercentage > 500 && (
                                <Alert
                                  message="Excellent Client ROI"
                                  description="Your client gets exceptional value. You may be underpricing your services."
                                  type="success"
                                  showIcon
                                  className="mt-4 rounded-lg"
                                  style={{ background: DARK_SURFACE, borderColor: BRAND_GREEN }}
                                />
                              )}
                            </div>
                          </Card>

                          {/* Business Insights Card */}
                          {insights && (
                            <Card className="mt-4 shadow-sm rounded-2xl" style={{ background: DARK_CARD, border: `1px solid ${DARK_BORDER}` }}>
                              <div className="flex items-center mb-3">
                                <BulbOutlined className="mr-2" style={{ color: BRAND_GREEN }} />
                                <Title level={5} className="m-0" style={{ color: TEXT_PRIMARY }}>Business Insights</Title>
                              </div>
                              <div className="flex flex-wrap gap-2 mb-3">
                                <Tag 
                                  style={{ 
                                    background: insights.hourlyRateCategory === 'premium' ? `${BRAND_GREEN}20` : `${CHART_COLORS[1]}20`, 
                                    color: insights.hourlyRateCategory === 'premium' ? BRAND_GREEN : CHART_COLORS[1],
                                    border: 'none',
                                    borderRadius: '6px'
                                  }}
                                  className="font-bold"
                                >
                                  {insights.hourlyRateCategory.toUpperCase()} PRICING
                                </Tag>
                                <Tag 
                                  style={{ 
                                    background: insights.clientROICategory === 'excellent' ? `${BRAND_GREEN}20` : `${CHART_COLORS[2]}20`, 
                                    color: insights.clientROICategory === 'excellent' ? BRAND_GREEN : CHART_COLORS[2],
                                    border: 'none',
                                    borderRadius: '6px'
                                  }}
                                  className="font-bold"
                                >
                                  {insights.clientROICategory.toUpperCase()} ROI
                                </Tag>
                              </div>
                              {insights.recommendations.length > 0 && (
                                <div>
                                  <Text strong style={{ color: TEXT_PRIMARY }}>Recommendations:</Text>
                                  <ul className="mt-2 space-y-1 pl-4">
                                    {insights.recommendations.map((rec, idx) => (
                                      <li key={idx} className="text-sm flex items-start" style={{ color: TEXT_SECONDARY }}>
                                        <CheckCircleOutlined className="mr-2 mt-0.5" style={{ fontSize: '12px', color: BRAND_GREEN }} />
                                        {rec}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Value Proposition Preview */}
                              {quickResults.monthlyImpact > 0 && quickResults.recommendedRetainer > 0 && (
                                <div className="mt-4 pt-4 border-t" style={{ borderColor: DARK_BORDER }}>
                                  <Text strong style={{ color: TEXT_PRIMARY }}>Value Proposition:</Text>
                                  <Text className="text-sm block mt-1" style={{ color: TEXT_SECONDARY }}>
                                    Deliver <strong style={{ color: TEXT_PRIMARY }}>${quickResults.monthlyImpact.toLocaleString()}/month</strong> in measurable impact
                                    through cost savings, revenue growth, and <strong style={{ color: TEXT_PRIMARY }}>{quickResults.monthlyHours} hours</strong> of freed time.
                                    Client investment of <strong style={{ color: TEXT_PRIMARY }}>${quickResults.recommendedRetainer.toLocaleString()}/month</strong> delivers
                                    <strong style={{ color: TEXT_PRIMARY }}> {quickResults.roiPercentage.toFixed(0)}% ROI</strong>.
                                  </Text>
                                </div>
                              )}
                            </Card>
                          )}
                        </div>
                      </Col>
                    </Row>
                  </div>
                )
              },
              {
                key: 'results',
                label: (
                  <span className="px-4">
                    <BookOutlined /> Results
                  </span>
                ),
                disabled: !currentPackage,
                children: currentPackage ? (
                  <div className="space-y-8 animate-fade-in" id="pricing-results">
                    {/* Header Actions */}
                    <div className="p-6 rounded-xl border flex flex-wrap justify-between items-center gap-4" style={{ background: DARK_CARD, border: `1px solid ${DARK_BORDER}` }}>
                      <div>
                        <Title level={4} className="m-0" style={{ color: TEXT_PRIMARY }}>Pricing Package Ready</Title>
                        <Text style={{ color: TEXT_MUTED }}>Export your strategy or create contracts</Text>
                      </div>
                      <Space wrap>
                        <Button
                          icon={<FileTextOutlined />}
                          loading={isExporting && exportingType === 'proposal'}
                          onClick={() => handleExport('proposal')}
                          style={{ borderColor: DARK_BORDER, color: TEXT_SECONDARY }}
                        >
                          Proposal
                        </Button>
                        <Button
                          icon={<BarChartOutlined />}
                          loading={isExporting && exportingType === 'presentation'}
                          onClick={() => handleExport('presentation')}
                          style={{ borderColor: DARK_BORDER, color: TEXT_SECONDARY }}
                        >
                          Presentation
                        </Button>
                        <Button
                          icon={<ContainerOutlined />}
                          loading={isExporting && exportingType === 'contract'}
                          onClick={() => handleExport('contract')}
                          style={{ borderColor: DARK_BORDER, color: TEXT_SECONDARY }}
                        >
                          Contract
                        </Button>
                        <Button
                          type="primary"
                          icon={<DownloadOutlined />}
                          loading={isExporting && exportingType === 'complete'}
                          onClick={() => handleExport('complete')}
                          style={{ background: BRAND_GREEN, borderColor: BRAND_GREEN, color: '#000' }}
                        >
                          Complete Package
                        </Button>
                     <Button
  type="primary"
  icon={<BulbOutlined />}
  onClick={() => {
    setActiveTab('calculator');
    setCurrentPackage(null);
    setSavedCalculationId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }}
  style={{ background: DARK_SURFACE, borderColor: DARK_BORDER, color: TEXT_PRIMARY }}
>
  Generate New Strategy
</Button>
                      </Space>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { title: 'Monthly Retainer', value: currentPackage.calculations.recommendedRetainer, prefix: '$', color: BRAND_GREEN },
                        { title: 'Hourly Rate', value: currentPackage.calculations.hourlyRate, prefix: '$', color: TEXT_PRIMARY },
                        { title: 'Client ROI', value: currentPackage.calculations.roiPercentage, suffix: '%', color: '#F59E0B' },
                        { title: 'Total Project Value', value: currentPackage.calculations.totalProjectValue, prefix: '$', color: '#3B82F6' },
                      ].map((stat, i) => (
                        <Card key={i} className="text-center shadow-sm rounded-xl" style={{ background: DARK_CARD, border: `1px solid ${DARK_BORDER}` }}>
                          <div className="text-xs uppercase tracking-wider font-semibold mb-1" style={{ color: TEXT_MUTED }}>{stat.title}</div>
                          <div className="text-2xl font-bold" style={{ color: stat.color }}>
                            {stat.prefix}{stat.value.toLocaleString()}{stat.suffix}
                          </div>
                        </Card>
                      ))}
                    </div>

                    {/* Pricing Models */}
                    <Title level={4} style={{ color: TEXT_PRIMARY }}>Recommended Models</Title>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {currentPackage.calculations.pricingOptions.map((option, idx) => (
                        <Card
                          key={idx}
                          className={`h-full shadow-sm relative overflow-hidden rounded-2xl ${idx === 0 ? 'ring-2' : ''}`}
                          style={{ 
                            background: DARK_CARD, 
                            border: `1px solid ${DARK_BORDER}`,
                            borderColor: idx === 0 ? BRAND_GREEN : DARK_BORDER
                          }}
                          title={<span className="capitalize" style={{ color: TEXT_PRIMARY }}>{option.model} Model</span>}
                        >
                          {idx === 0 && <div className="absolute top-0 right-0 text-xs px-2 py-1 rounded-bl-lg font-bold" style={{ background: BRAND_GREEN, color: '#000' }}>RECOMMENDED</div>}
                          <div className="text-3xl font-bold mb-4" style={{ color: TEXT_PRIMARY }}>${option.price?.toLocaleString()}</div>
                          <Paragraph className="text-sm h-12" style={{ color: TEXT_SECONDARY }}>{option.description}</Paragraph>

                          <div className="space-y-3 mt-4">
                            <div>
                              <div className="text-xs font-bold uppercase mb-1" style={{ color: BRAND_GREEN }}>Pros</div>
                              <ul className="text-xs list-disc pl-4" style={{ color: TEXT_MUTED }}>{option.pros?.map((p, i) => <li key={i}>{p}</li>)}</ul>
                            </div>
                            <div>
                              <div className="text-xs font-bold uppercase mb-1" style={{ color: '#EF4444' }}>Cons</div>
                              <ul className="text-xs list-disc pl-4" style={{ color: TEXT_MUTED }}>{option.cons?.map((c, i) => <li key={i}>{c}</li>)}</ul>
                            </div>
                          </div>

                          <div className="mt-6 pt-4 border-t flex items-center justify-between" style={{ borderColor: DARK_BORDER }}>
                            <span className="text-xs" style={{ color: TEXT_MUTED }}>Suitability Score</span>
                            <Progress type="circle" percent={option.recommendationScore} width={40} strokeColor={BRAND_GREEN} trailColor={DARK_SURFACE} />
                          </div>
                        </Card>
                      ))}
                    </div>

                    {/* Detailed Strategy Sections */}
                    <Collapse defaultActiveKey={['strategy']} ghost className="site-collapse-custom-collapse">
                      <Panel header={<span className="font-bold text-lg flex items-center" style={{ color: TEXT_PRIMARY }}><RiseOutlined className="mr-2" /> Strategic Approach</span>} key="strategy" className="rounded-xl border mb-4" style={{ background: DARK_CARD, border: `1px solid ${DARK_BORDER}` }}>
                        <div className="p-4 space-y-4">
                          <div className="p-4 rounded-lg" style={{ background: DARK_SURFACE, border: `1px solid ${DARK_BORDER}` }}>
                            <div className="font-bold mb-2" style={{ color: TEXT_PRIMARY }}>Value Proposition</div>
                            <Paragraph className="mb-0" style={{ color: TEXT_SECONDARY }}>{currentPackage.strategy.valueProposition}</Paragraph>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <div className="font-bold mb-2" style={{ color: TEXT_PRIMARY }}>Recommended Approach</div>
                              <Paragraph style={{ color: TEXT_SECONDARY }}>{currentPackage.strategy.recommendedApproach}</Paragraph>
                            </div>
                            <div>
                              <div className="font-bold mb-2" style={{ color: TEXT_PRIMARY }}>Negotiation Tactics</div>
                              <ul className="list-disc pl-5 text-sm space-y-1" style={{ color: TEXT_SECONDARY }}>
                                {currentPackage.strategy.negotiationTactics.map((t, i) => <li key={i}>{t}</li>)}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </Panel>

                      {/* Implementation Phases Panel - RESTORED */}
                      <Panel header={<span className="font-bold text-lg flex items-center" style={{ color: TEXT_PRIMARY }}><CalendarOutlined className="mr-2" /> Implementation Phases</span>} key="phases" className="rounded-xl border mb-4" style={{ background: DARK_CARD, border: `1px solid ${DARK_BORDER}` }}>
                        <List
                          dataSource={currentPackage.strategy.phases}
                          renderItem={(phase, index) => (
                            <List.Item>
                              <Card size="small" className="w-full rounded-xl" style={{ background: DARK_SURFACE, border: `1px solid ${DARK_BORDER}` }}>
                                <Title level={5} style={{ color: TEXT_PRIMARY }}>Phase {index + 1}: {phase.phase}</Title>
                                <Row gutter={16}>
                                  <Col span={8}>
                                    <Statistic title="Duration" value={phase.duration} valueStyle={{ color: TEXT_PRIMARY }} />
                                  </Col>
                                  <Col span={8}>
                                    <Statistic
                                      title="Payment"
                                      value={phase.payment}
                                      prefix="$"
                                      precision={0}
                                      valueStyle={{ color: BRAND_GREEN }}
                                    />
                                  </Col>
                                  <Col span={8}>
                                    <Text strong style={{ color: TEXT_PRIMARY }}>Deliverables:</Text>
                                    <ul className="mt-1">
                                      {phase.deliverables.map((deliverable, idx) => (
                                        <li key={idx} className="text-sm" style={{ color: TEXT_SECONDARY }}>{deliverable}</li>
                                      ))}
                                    </ul>
                                  </Col>
                                </Row>
                              </Card>
                            </List.Item>
                          )}
                        />
                      </Panel>

                      <Panel header={<span className="font-bold text-lg flex items-center" style={{ color: TEXT_PRIMARY }}><TeamOutlined className="mr-2" /> Objection Handling</span>} key="objections" className="rounded-xl border mb-4" style={{ background: DARK_CARD, border: `1px solid ${DARK_BORDER}` }}>
                        <List
                          grid={{ gutter: 16, column: 2 }}
                          dataSource={currentPackage.objectionHandling}
                          renderItem={(item) => (
                            <List.Item>
                              <Card size="small" className="h-full rounded-xl" style={{ background: DARK_SURFACE, border: `1px solid ${DARK_BORDER}`, borderLeftColor: '#EF4444' }}>
                                <div className="font-bold mb-2" style={{ color: '#EF4444' }}>{item.objection}</div>
                                <div className="text-sm mb-2" style={{ color: TEXT_PRIMARY }}><strong>Response:</strong> {item.response}</div>
                                <div className="text-xs" style={{ color: TEXT_MUTED }}><strong>Alternatives:</strong> {item.alternatives.join(', ')}</div>
                              </Card>
                            </List.Item>
                          )}
                        />
                      </Panel>
                    </Collapse>
                  </div>
                ) : (
                  <div className="text-center py-20 rounded-xl border border-dashed" style={{ background: DARK_CARD, borderColor: DARK_BORDER }}>
                    <BulbOutlined className="text-4xl mb-4" style={{ color: DARK_BORDER }} />
                    <Title level={4} style={{ color: TEXT_PRIMARY }}>No Package Generated</Title>
                    <Text style={{ color: TEXT_MUTED }}>Use the Calculator tab to generate your first pricing strategy.</Text>
                  </div>
                )
              },
              {
                key: 'history',
                label: <span className="px-4"><BankOutlined /> Saved History</span>,
                children: (
                  <Card className="shadow-sm rounded-2xl" style={{ background: DARK_CARD, border: `1px solid ${DARK_BORDER}` }}>
                    <Table
                      dataSource={calculations}
                      rowKey="id"
                      loading={calculationsLoading}
                      pagination={{ pageSize: 8 }}
                      className="no-vertical-borders"
                      columns={[
                        { 
                          title: 'Client / Project', 
                          key: 'name', 
                          render: (_, r) => (
                            <div>
                              <div className="font-bold" style={{ color: TEXT_PRIMARY }}>{r.clientName || 'Unnamed Client'}</div>
                              <div className="text-xs" style={{ color: TEXT_MUTED }}>{r.projectName || 'Unnamed Project'}</div>
                            </div>
                          ) 
                        },
                        { 
                          title: 'Industry', 
                          dataIndex: 'industry', 
                          render: (t) => t ? (
                            <Tag style={{ background: 'transparent', borderColor: BRAND_GREEN, color: BRAND_GREEN }}>{t}</Tag>
                          ) : '-' 
                        },
                        { 
                          title: 'Annual Savings', 
                          dataIndex: 'annualSavings', 
                          render: (v) => v ? (
                            <span style={{ color: BRAND_GREEN, fontWeight: 600 }}>${v.toLocaleString()}</span>
                          ) : '-' 
                        },
                        { 
                          title: 'Monthly Retainer', 
                          dataIndex: 'recommendedRetainer', 
                          render: (v) => v ? (
                            <span className="font-bold" style={{ color: TEXT_PRIMARY }}>${v.toLocaleString()}</span>
                          ) : '-' 
                        },
                        { 
                          title: 'ROI', 
                          dataIndex: 'roiPercentage', 
                          render: (v) => v ? (
                            <span className="font-bold" style={{ color: v >= 100 ? BRAND_GREEN : '#EF4444' }}>{v.toFixed(0)}%</span>
                          ) : '-' 
                        },
                        { 
                          title: 'Date', 
                          dataIndex: 'createdAt', 
                          render: (d) => (
                            <span className="text-xs" style={{ color: TEXT_MUTED }}>{new Date(d).toLocaleDateString()}</span>
                          ) 
                        },
                        {
                          title: 'Actions',
                          key: 'actions',
                          render: (_, record) => (
                            <Space>
                              <Button
                                size="small"
                                icon={viewLoadingStates[record.id] ? 


<ConfigProvider
  theme={{
    token: {
      colorPrimary: '#5CC49D',
    },
  }}
>
     <Spin size="small" />
</ConfigProvider>
                                
                           
                                
                                
                                : <EyeOutlined />}
                                loading={viewLoadingStates[record.id]}
                                onClick={() => handleView(record)}
                                style={{ borderColor: DARK_BORDER, color: TEXT_SECONDARY }}
                              >
                                View
                              </Button>
                              <Button
                                size="small"
                                icon={<DownloadOutlined />}
                                onClick={() => handleExportFromHistory(record, 'complete')}
                                style={{ borderColor: DARK_BORDER, color: TEXT_SECONDARY }}
                              >
                                Export
                              </Button>
                              <Button
                                size="small"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => handleDelete(record)}
                              >
                                Delete
                              </Button>
                            </Space>
                          )
                        }
                      ]}
                    />
                  </Card>
                )
              }
            ]}
          />

          {/* View Details Modal */}
          <Modal
            open={isViewModalVisible}
            onCancel={() => setIsViewModalVisible(false)}
            footer={null}
            width={1000}
            title={<span className="font-bold text-lg" style={{ color: TEXT_PRIMARY }}>{viewingCalculation?.benchmarks?.industry || 'Calculation'} Details</span>}
            style={{ top: 20 }}
          >
            {viewDetailLoading ? (
              <div className="py-20 text-center">
                

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
            ) : viewingCalculation ? (
              <div className="space-y-6 pt-4 pricing-details-container">
                {/* Key metrics in cards */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <Card className="text-center rounded-xl" style={{ background: DARK_SURFACE, border: `1px solid ${DARK_BORDER}` }}>
                    <div className="text-xs uppercase mb-1" style={{ color: TEXT_MUTED }}>Monthly Retainer</div>
                    <div className="text-2xl font-bold" style={{ color: BRAND_GREEN }}>${viewingCalculation.calculations.recommendedRetainer?.toLocaleString()}</div>
                  </Card>
                  <Card className="text-center rounded-xl" style={{ background: DARK_SURFACE, border: `1px solid ${DARK_BORDER}` }}>
                    <div className="text-xs uppercase mb-1" style={{ color: TEXT_MUTED }}>ROI</div>
                    <div className="text-2xl font-bold" style={{ color: '#3B82F6' }}>{viewingCalculation.calculations.roiPercentage?.toFixed(0)}%</div>
                  </Card>
                  <Card className="text-center rounded-xl" style={{ background: DARK_SURFACE, border: `1px solid ${DARK_BORDER}` }}>
                    <div className="text-xs uppercase mb-1" style={{ color: TEXT_MUTED }}>Hourly Rate</div>
                    <div className="text-2xl font-bold" style={{ color: TEXT_PRIMARY }}>${viewingCalculation.calculations.hourlyRate?.toFixed(0)}/hr</div>
                  </Card>
                  <Card className="text-center rounded-xl" style={{ background: DARK_SURFACE, border: `1px solid ${DARK_BORDER}` }}>
                    <div className="text-xs uppercase mb-1" style={{ color: TEXT_MUTED }}>Project Value</div>
                    <div className="text-2xl font-bold" style={{ color: '#8B5CF6' }}>${viewingCalculation.calculations.totalProjectValue?.toLocaleString()}</div>
                  </Card>
                </div>

                {/* Pricing Options */}
                <Card className="rounded-2xl" style={{ background: DARK_CARD, border: `1px solid ${DARK_BORDER}` }}>
                  <Title level={5} className="mb-4" style={{ color: TEXT_PRIMARY }}>Pricing Options</Title>
                  <div className="space-y-4">
                    {viewingCalculation.calculations.pricingOptions?.map((option, index) => (
                      <Card key={index} size="small" className="rounded-xl border" style={{ background: DARK_SURFACE, borderColor: DARK_BORDER }}>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <Title level={5} className="mb-2 capitalize" style={{ color: TEXT_PRIMARY }}>
                              {option.model} Model
                            </Title>
                            <Text className="text-lg font-semibold" style={{ color: BRAND_GREEN }}>
                              ${option.price?.toLocaleString()}
                            </Text>
                            <Paragraph className="mt-2 mb-2 text-sm" style={{ color: TEXT_SECONDARY }}>{option.description}</Paragraph>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Text strong className="text-sm" style={{ color: BRAND_GREEN }}>Pros: </Text>
                                <ul className="text-xs list-disc pl-4" style={{ color: TEXT_MUTED }}>
                                  {option.pros?.map((p, i) => <li key={i}>{p}</li>)}
                                </ul>
                              </div>
                              <div>
                                <Text strong className="text-sm" style={{ color: '#EF4444' }}>Cons: </Text>
                                <ul className="text-xs list-disc pl-4" style={{ color: TEXT_MUTED }}>
                                  {option.cons?.map((c, i) => <li key={i}>{c}</li>)}
                                </ul>
                              </div>
                            </div>
                          </div>
                          <div className="ml-4">
                            <Progress
                              type="circle"
                              size={60}
                              percent={option.recommendationScore}
                              format={(percent) => `${percent}`}
                              strokeColor={BRAND_GREEN}
                              trailColor={DARK_BORDER}
                            />
                            <div className="text-center mt-1">
                              <Text style={{ fontSize: '12px', color: TEXT_MUTED }}>Score</Text>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </Card>

                {/* Strategy Summary */}
                <Card className="rounded-2xl" style={{ background: DARK_CARD, border: `1px solid ${DARK_BORDER}` }}>
                  <Title level={5} className="mb-4" style={{ color: TEXT_PRIMARY }}>Strategy Summary</Title>
                  <div className="space-y-4">
                    <div>
                      <Text strong style={{ color: TEXT_PRIMARY }}>Framework:</Text>
                      <Paragraph style={{ color: TEXT_SECONDARY }}>{viewingCalculation.strategy?.pricingFramework || 'N/A'}</Paragraph>
                    </div>
                    <div>
                      <Text strong style={{ color: TEXT_PRIMARY }}>Value Proposition:</Text>
                      <Paragraph style={{ color: TEXT_SECONDARY }}>{viewingCalculation.strategy?.valueProposition || 'N/A'}</Paragraph>
                    </div>
                    <div>
                      <Text strong style={{ color: TEXT_PRIMARY }}>Recommended Approach:</Text>
                      <Paragraph style={{ color: TEXT_SECONDARY }}>{viewingCalculation.strategy?.recommendedApproach || 'N/A'}</Paragraph>
                    </div>
                  </div>
                </Card>

                {/* Implementation Phases */}
                {viewingCalculation.strategy?.phases && viewingCalculation.strategy.phases.length > 0 && (
                  <Card className="rounded-2xl" style={{ background: DARK_CARD, border: `1px solid ${DARK_BORDER}` }}>
                    <Title level={5} className="mb-4" style={{ color: TEXT_PRIMARY }}>Implementation Phases</Title>
                    <List
                      dataSource={viewingCalculation.strategy.phases}
                      renderItem={(phase, index) => (
                        <List.Item>
                          <Card size="small" className="w-full rounded-xl border" style={{ background: DARK_SURFACE, borderColor: DARK_BORDER }}>
                            <Title level={5} className="mb-2" style={{ color: TEXT_PRIMARY }}>Phase {index + 1}: {phase.phase}</Title>
                            <Row gutter={16}>
                              <Col span={8}>
                                <Statistic title="Duration" value={phase.duration} valueStyle={{ color: TEXT_PRIMARY }} />
                              </Col>
                              <Col span={8}>
                                <Statistic
                                  title="Payment"
                                  value={phase.payment}
                                  prefix="$"
                                  precision={0}
                                  valueStyle={{ color: BRAND_GREEN }}
                                />
                              </Col>
                              <Col span={8}>
                                <Text strong style={{ color: TEXT_PRIMARY }}>Deliverables:</Text>
                                <ul className="mt-1">
                                  {phase.deliverables.map((deliverable, idx) => (
                                    <li key={idx} className="text-sm" style={{ color: TEXT_SECONDARY }}>{deliverable}</li>
                                  ))}
                                </ul>
                              </Col>
                            </Row>
                          </Card>
                        </List.Item>
                      )}
                    />
                  </Card>
                )}
              </div>
            ) : (
              <div className="text-center py-10" style={{ color: TEXT_MUTED }}>No data available</div>
            )}
          </Modal>
        </div>
      </div>
    </ConfigProvider>
  );
};

export default PricingCalculator;