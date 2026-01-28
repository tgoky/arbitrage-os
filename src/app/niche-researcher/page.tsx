"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Button, 
  Card, 
  Form, 
  Input, 
  Select, 
  Typography, 
  Divider, 
  Progress, 
  Tag, 
  Alert,
  notification,
  Modal,
  Table,
  Space,
  Tooltip,
  message,
  Radio,
  Checkbox,
  Row,
  Col,
  Tabs,
  Avatar,
  Collapse,
  Badge,
  ConfigProvider,
  theme
} from 'antd';
import { 
  UserOutlined, 
  SolutionOutlined, 
  StarOutlined,
  DollarCircleOutlined,
  BulbOutlined, 
  FileAddOutlined,
  DollarOutlined, 
  RiseOutlined,
  FileTextOutlined,
  DownloadOutlined,
  WarningOutlined,
  EyeOutlined,
  DeleteOutlined,
  ReloadOutlined,
  RocketOutlined,
  ArrowLeftOutlined,
  TagOutlined,
  BarChartOutlined,
  CustomerServiceOutlined,
  WalletOutlined,
  HistoryOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { useNicheResearcher } from '../hooks/useNicheResearcher';
import { NicheResearchInput, GeneratedNicheReport, MultiNicheReport } from '@/types/nicheResearcher';
import { debounce } from 'lodash';
import {useWorkspaceContext} from '../hooks/useWorkspaceContext'
import LoadingOverlay from './LoadingOverlay';
const { TabPane } = Tabs;
const { Panel } = Collapse;

import {SavedNicheHistory} from '../niche-researcher/SavedNicheHistory'
import { useRouter } from 'next/navigation';

interface FormValues {
  // Business & Strategic Goals
  primaryObjective: 'cashflow' | 'equity-exit' | 'lifestyle' | 'audience-build' | 'saas' | 'agency' | 'ecomm';
  riskAppetite: 'low' | 'medium' | 'high';
  
  // Target Customer Preferences
  marketType: 'b2b-saas' | 'b2c-consumer' | 'professional-services' | 'local-business' | 'info-education';
  customerSize: 'startups' | 'smb' | 'enterprise' | 'consumers' | 'government';
  industries?: string[];
  geographicFocus?: 'local' | 'regional' | 'us-only' | 'global';
  targetArea?: string; 
  
  // Constraints & Resources
  budget: '<10k' | '10k-50k' | '50k-250k' | '250k+';
  teamSize?: 'solo' | 'small-team' | 'established-team';
  skills?: string[];
  timeCommitment?: '5-10' | '10-20' | '20-30' | '30+';
  
  // Market Directional Inputs
  problems?: string;
  excludedIndustries?: string[];
  monetizationPreference?: 'high-ticket' | 'subscription' | 'low-ticket' | 'ad-supported';
  acquisitionChannels?: string[];
  
  // Validation & Scalability Factors
  validationData?: string[];
  competitionPreference?: 'low-competition' | 'high-potential';
  scalabilityPreference?: 'stay-small' | 'grow-fast' | 'build-exit';
}

interface FormData {
  primaryObjective?: string;
  riskAppetite?: string;
  marketType?: string;
  customerSize?: string;
  industries?: string[];
  geographicFocus?: string;
  budget?: string;
  teamSize?: string;
  skills?: string[];
  timeCommitment?: string;
  problems?: string;
  excludedIndustries?: string[];
  monetizationPreference?: string;
  acquisitionChannels?: string[];
  validationData?: string[];
  competitionPreference?: string;
  scalabilityPreference?: string;
  targetArea?: string;
}

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// Color constants
const SPACE_COLOR = '#9DA2B3';
const BRAND_GREEN = '#5CC49D';
const DARK_BG = '#0f172a';
const SURFACE_BG = '#000000';
const SURFACE_LIGHTER = '#212935';
const TEXT_PRIMARY = '#f1f5f9';
const TEXT_SECONDARY = '#94a3b8';
const BORDER_COLOR = '#334155';

const NicheResearcher = () => {
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [reportGenerated, setReportGenerated] = useState(false);
  const [reportData, setReportData] = useState<GeneratedNicheReport | null>(null);
  const [currentReportId, setCurrentReportId] = useState<string | null>(null);
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [previousReports, setPreviousReports] = useState<any[]>([]);
  const [deletingReportId, setDeletingReportId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({});
  const { currentWorkspace, isWorkspaceReady } = useWorkspaceContext();
  const [activeView, setActiveView] = useState<'research' | 'history'>('research');
  
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const router = useRouter();

  const [multiNicheReport, setMultiNicheReport] = useState<MultiNicheReport | null>(null);
  const [selectedNicheTab, setSelectedNicheTab] = useState(0);

  const {
    generateNicheReport,
    getNicheReport,
    getUserReports,
    deleteNicheReport,
    exportNicheReport,
    loading,
    error,
    setError
  } = useNicheResearcher();

  const isLoading = loading;

  // Load Manrope font
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  // Add this useEffect to handle errors
  useEffect(() => {
    if (error) {
      console.error('Niche researcher error:', error);
      notification.error({
        message: 'Generation Error',
        description: error,
      });
    }
  }, [error]);

  useEffect(() => {
    console.log('🔍 Current step:', currentStep);
    console.log('🔍 Current form data:', formData);
    console.log('🔍 Current form values:', form.getFieldsValue());
  }, [currentStep, formData]);

  // Enhanced steps with icons
  const steps = [
    { title: 'Business Goals', icon: <RocketOutlined /> },
    { title: 'Target Customers', icon: <CustomerServiceOutlined /> },
    { title: 'Resources', icon: <SolutionOutlined /> },
    { title: 'Market Direction', icon: <BulbOutlined /> },
    { title: 'Validation', icon: <BarChartOutlined /> },
    { title: 'Generate', icon: <FileAddOutlined /> }
  ];

  // Industry options
  const industryOptions = [
    'Healthcare', 'Finance', 'Marketing', 'Logistics', 'Real Estate',
    'Education', 'Technology', 'Retail', 'Manufacturing', 'Construction',
    'Hospitality', 'Entertainment', 'Agriculture', 'Energy', 'Transportation'
  ];

  // Skill options
  const skillOptions = [
    'Tech Development', 'Marketing', 'Sales', 'Operations', 'Design',
    'Content Creation', 'Customer Support', 'Data Analysis', 'Project Management',
    'Finance', 'Legal/Compliance', 'AI/ML', 'SEO', 'Social Media'
  ];

  // Acquisition channel options
  const acquisitionChannelOptions = [
    'Outbound Sales', 'Paid Ads', 'SEO/Content', 'Partnerships', 'Social/Influencer',
    'Email Marketing', 'Referral Programs', 'Events/Webinars', 'Affiliate Marketing'
  ];

  // Validation data options
  const validationDataOptions = [
    'Trends Data', 'Search Volumes', 'Competitor Mapping', 'Funding Data',
    'Market Reports', 'Customer Surveys', 'Industry Analysis'
  ];

  const handleBack = () => {
    router.push(`/dashboard/${currentWorkspace?.slug}`);
  };

  // Save form data function
  const saveCurrentStepData = () => {
    const currentValues = form.getFieldsValue();
    console.log('💾 Saving step data:', currentValues);
    setFormData(prev => {
      const merged = { ...prev, ...currentValues };
      console.log('💾 Merged form data:', merged);
      return merged;
    });
  };

  // Load previous reports
  const loadPreviousReports = async () => {
    try {
      const reports = await getUserReports();
      setPreviousReports(reports);
      setShowReportsModal(true);
    } catch (error) {
      console.error('Failed to load previous reports:', error);
    }
  };

  // Handle view report
  const handleViewReport = async (reportId: string) => {
    try {
      const report = await getNicheReport(reportId);
      setReportData(report.report);
      setCurrentReportId(reportId);
      setReportGenerated(true);
      setCurrentStep(5);
      setShowReportsModal(false);
    } catch (error) {
      console.error('Failed to load report:', error);
    }
  };

  // Handle delete report
  const handleDeleteReport = useCallback(async (reportId: string) => {
    setDeletingReportId(reportId);
    try {
      await deleteNicheReport(reportId);
      setPreviousReports(prev => prev.filter(report => report.id !== reportId));
      try {
        const reports = await getUserReports();
        setPreviousReports(reports);
      } catch (refreshError) {
        console.error('Failed to refresh reports after delete:', refreshError);
      }
    } catch (error) {
      console.error('Failed to delete report:', error);
      message.error('Failed to delete report');
    } finally {
      setDeletingReportId(null);
    }
  }, [deleteNicheReport, getUserReports]);

  // Handle export report
  const handleExportReport = async (reportId: string, format: 'html' | 'json' = 'html') => {
    try {
      await exportNicheReport(reportId, format);
    } catch (error) {
      console.error('Failed to export report:', error);
    }
  };

  // Add this at the start of onFinish
  if (!isWorkspaceReady) {
    notification.error({
      message: 'Workspace Not Ready',
      description: 'Please wait for workspace to load',
    });
    return;
  }

  if (!currentWorkspace) {
    notification.error({
      message: 'No Workspace Selected', 
      description: 'Please select a workspace before generating reports',
    });
    return;
  }

  // Form submission
  const onFinish = async (values: FormValues) => {
    if (!currentWorkspace) {
      throw new Error('No workspace selected');
    }
    
    try {
      console.log('🔍 Form submission started');
      console.log('🔍 Current form values:', values);
      console.log('🔍 Stored form data:', formData);
      
      // ✅ FIXED: Properly merge all collected data
      const allFormData = form.getFieldsValue();
      const mergedData = { ...formData, ...allFormData, ...values };
      
      console.log('🔍 Merged data before cleaning:', mergedData);
      
      // ✅ FIXED: Create properly typed request data
      const requestData: NicheResearchInput = {
        // Required fields
        primaryObjective: mergedData.primaryObjective as 'cashflow' | 'equity-exit' | 'lifestyle' | 'audience-build' | 'saas' | 'agency' | 'ecomm',
        riskAppetite: mergedData.riskAppetite as 'low' | 'medium' | 'high',
        marketType: mergedData.marketType as 'b2b-saas' | 'b2c-consumer' | 'professional-services' | 'local-business' | 'info-education',
        customerSize: mergedData.customerSize as 'startups' | 'smb' | 'enterprise' | 'consumers' | 'government',
        budget: mergedData.budget as '<10k' | '10k-50k' | '50k-250k' | '250k+',
        
        // Optional fields - only include if they have actual values
        ...(Array.isArray(mergedData.industries) && mergedData.industries.length > 0 && { 
          industries: mergedData.industries 
        }),
        ...(mergedData.geographicFocus && { 
          geographicFocus: mergedData.geographicFocus as 'local' | 'regional' | 'us-only' | 'global' 
        }),
        ...(mergedData.teamSize && { 
          teamSize: mergedData.teamSize as 'solo' | 'small-team' | 'established-team' 
        }),
        ...(Array.isArray(mergedData.skills) && mergedData.skills.length > 0 && { 
          skills: mergedData.skills 
        }),
        ...(mergedData.timeCommitment && { 
          timeCommitment: mergedData.timeCommitment as '5-10' | '10-20' | '20-30' | '30+' 
        }),
        ...(mergedData.problems && mergedData.problems.trim() && { 
          problems: mergedData.problems 
        }),
        ...(Array.isArray(mergedData.excludedIndustries) && mergedData.excludedIndustries.length > 0 && { 
          excludedIndustries: mergedData.excludedIndustries 
        }),
        ...(mergedData.monetizationPreference && { 
          monetizationPreference: mergedData.monetizationPreference as 'high-ticket' | 'subscription' | 'low-ticket' | 'ad-supported' 
        }),
        ...(Array.isArray(mergedData.acquisitionChannels) && mergedData.acquisitionChannels.length > 0 && { 
          acquisitionChannels: mergedData.acquisitionChannels 
        }),
        ...(Array.isArray(mergedData.validationData) && mergedData.validationData.length > 0 && { 
          validationData: mergedData.validationData 
        }),
        ...(mergedData.competitionPreference && { 
          competitionPreference: mergedData.competitionPreference as 'low-competition' | 'high-potential' 
        }),
        ...(mergedData.scalabilityPreference && { 
          scalabilityPreference: mergedData.scalabilityPreference as 'stay-small' | 'grow-fast' | 'build-exit' 
        }),
        ...(mergedData.targetArea && mergedData.targetArea.trim() && {
          targetArea: mergedData.targetArea
        }),
      };
      
      console.log('🔍 Final typed request data:', requestData);
      
      // ✅ Check required fields before submitting
      const requiredFields: (keyof NicheResearchInput)[] = ['primaryObjective', 'riskAppetite', 'marketType', 'customerSize', 'budget'];
      const missingFields = requiredFields.filter(field => !requestData[field]);
      
      if (missingFields.length > 0) {
        console.error('❌ Missing required fields:', missingFields);
        notification.error({
          message: 'Missing Required Fields',
          description: `Please fill in: ${missingFields.join(', ')}`,
          placement: 'topRight',
        });
        return;
      }

      // Generate multi-niche report
      const result = await generateNicheReport(requestData, currentWorkspace.id);
      
      // ✅ UPDATED: Set multi-niche report state
      setMultiNicheReport(result.report);
      setCurrentReportId(result.reportId);
      setReportGenerated(true);
      setCurrentStep(5);
      setSelectedNicheTab(result.report.recommendedNiche); // Start with recommended niche
      
      // Clear old single niche state (if it exists)
      setReportData(null);
      
      notification.success({
        message: 'Found 3 Perfect Niche Opportunities!',
        description: `We've identified your top matches with AI recommendations`,
        placement: 'topRight',
      });
      
    } catch (error: any) {
      console.error('Error generating niche report:', error);
      notification.error({
        message: 'Generation Failed',
        description: error.message || 'Please try again later',
        placement: 'topRight',
      });
    }
  };

  // Navigation functions
  const nextStep = () => {
    saveCurrentStepData();
    
    // ✅ FIXED: Only validate current step's required fields
    const fieldsToValidate = getRequiredFieldsForStep(currentStep);
    
    if (fieldsToValidate.length > 0) {
      form.validateFields(fieldsToValidate).then(() => {
        setCurrentStep(currentStep + 1);
      }).catch((errorInfo) => {
        console.log('Validation failed:', errorInfo);
        notification.error({
          message: 'Validation Error',
          description: 'Please fill in all required fields before continuing',
        });
      });
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  // ✅ Add this helper function
  const getRequiredFieldsForStep = (step: number): string[] => {
    switch (step) {
      case 0: return ['primaryObjective', 'riskAppetite'];
      case 1: return ['marketType', 'customerSize'];
      case 2: return ['budget', 'skills']; // Added 'skills' here
      case 3: return [];
      case 4: return [];
      default: return [];
    }
  };

  const prevStep = () => {
    saveCurrentStepData();
    setCurrentStep(currentStep - 1);
  };

  // Report columns for modal
  const reportColumns = [
    {
      title: 'Report',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: any) => (
        <div>
          <div className="font-medium" style={{ color: TEXT_PRIMARY }}>{text}</div>
          <div className="text-sm" style={{ color: SPACE_COLOR }}>
            {record.nicheName}
          </div>
        </div>
      )
    },
    {
      title: 'Market',
      dataIndex: 'marketSize',
      key: 'marketSize',
      render: (size: string) => (
        <Tag color="blue" style={{ background: 'transparent', borderColor: SPACE_COLOR, color: SPACE_COLOR }}>
          {size}
        </Tag>
      )
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => (
        <span style={{ color: TEXT_SECONDARY }}>{new Date(date).toLocaleDateString()}</span>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Tooltip title="View Report">
            <Button
              icon={<EyeOutlined />}
              onClick={() => handleViewReport(record.id)}
              size="small"
              style={{ background: SURFACE_LIGHTER, borderColor: BORDER_COLOR, color: TEXT_PRIMARY }}
            />
          </Tooltip>
          <Tooltip title="Export Report">
            <Button
              icon={<DownloadOutlined />}
              onClick={() => handleExportReport(record.id, 'html')}
              size="small"
              style={{ background: SURFACE_LIGHTER, borderColor: BORDER_COLOR, color: TEXT_PRIMARY }}
            />
          </Tooltip>
          <Tooltip title="Delete Report">
            <Button
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteReport(record.id)}
              size="small"
              danger
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  // Render detailed niche report using your existing structure
  const renderDetailedNicheReport = (reportData: GeneratedNicheReport) => {
    return (
      <>
        {currentReportId && (
          <Card className="mb-4" style={{ background: SURFACE_BG, borderColor: BORDER_COLOR }}>
            <div className="text-center">
              <Space>
                <Button 
                  icon={<DownloadOutlined />}
                  onClick={() => currentReportId && handleExportReport(currentReportId, 'html')}
                  type="primary"
                  style={{ background: BRAND_GREEN, borderColor: BRAND_GREEN, color: '#000' }}
                >
                  Download HTML Report
                </Button>
                <Button 
                  icon={<DownloadOutlined />}
                  onClick={() => currentReportId && handleExportReport(currentReportId, 'json')}
                  style={{ background: SURFACE_LIGHTER, borderColor: BORDER_COLOR, color: TEXT_PRIMARY }}
                >
                  Download JSON Data
                </Button>
              </Space>
            </div>
          </Card>
        )}

        {/* Niche Overview */}
        <Card 
          title="1. Niche Overview" 
          className="mb-4 section-card" 
          extra={<Tag color="blue" style={{ background: 'transparent', borderColor: SPACE_COLOR, color: SPACE_COLOR }}>Overview</Tag>}
          style={{ background: SURFACE_BG, borderColor: BORDER_COLOR }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <div className="niche-header">
                <Title level={4} style={{ color: TEXT_PRIMARY }}>
                  {reportData.nicheOverview?.name}
                </Title>
                <Text style={{ color: TEXT_SECONDARY }}>{reportData.nicheOverview?.summary}</Text>
              </div>
            </Col>
            <Col span={12}>
              <div className="fit-reason">
                <Title level={5} style={{ color: TEXT_PRIMARY }}>Why This Niche Fits Your Inputs</Title>
                <div className="highlight-box" style={{ background: SURFACE_LIGHTER, borderColor: BORDER_COLOR, padding: '12px', borderRadius: '8px' }}>
                  <Text style={{ color: TEXT_SECONDARY }}>{reportData.nicheOverview?.whyItFits}</Text>
                </div>
              </div>
            </Col>
          </Row>
        </Card>
        
        {/* Market Demand Snapshot */}
        <Card 
          title="2. Market Demand Snapshot" 
          className="mb-4 section-card"
          extra={<Tag color="green" style={{ background: 'transparent', borderColor: SPACE_COLOR, color: SPACE_COLOR }}>Demand</Tag>}
          style={{ background: SURFACE_BG, borderColor: BORDER_COLOR }}
        >
          <Row gutter={16}>
            <Col span={8}>
              <div className="metric-card">
                <div className="metric-icon">
                  <DollarOutlined style={{ fontSize: '24px', color: BRAND_GREEN }} />
                </div>
                <Title level={5} style={{ color: TEXT_PRIMARY }}>Market Size</Title>
                <Text className="metric-value" style={{ color: TEXT_PRIMARY, fontSize: '18px', fontWeight: 'bold' }}>
                  {reportData.marketDemand?.marketSize}
                </Text>
              </div>
            </Col>
            <Col span={8}>
              <div className="metric-card">
                <div className="metric-icon">
                  <RiseOutlined style={{ fontSize: '24px', color: BRAND_GREEN }} />
                </div>
                <Title level={5} style={{ color: TEXT_PRIMARY }}>Trend Signal</Title>
                <Text className="metric-value">
                  <Tooltip 
                    title={reportData.marketDemand?.trend} 
                    placement="top"
                    overlayStyle={{ maxWidth: '300px', textAlign: 'center' }}
                  >
                    <Tag
                      color={reportData.marketDemand?.trend === 'growing' ? 'green' : 
                            reportData.marketDemand?.trend === 'plateauing' ? 'orange' : 'red'}
                      className="trend-tag"
                      style={{ background: 'transparent' }}
                    >
                      {reportData.marketDemand?.trend?.toUpperCase()}
                    </Tag>
                  </Tooltip>
                </Text>
              </div>
            </Col>
            <Col span={8}>
              <div className="metric-card">
                <div className="metric-icon">
                  <WalletOutlined style={{ fontSize: '24px', color: SPACE_COLOR }} />
                </div>
                <Title level={5} style={{ color: TEXT_PRIMARY }}>Willingness to Pay</Title>
                <Text className="metric-value" style={{ color: TEXT_PRIMARY, fontSize: '18px', fontWeight: 'bold' }}>
                  {reportData.marketDemand?.willingnessToPay}
                </Text>
              </div>
            </Col>
          </Row>
        </Card>
        
        {/* Customer Pain Points */}
        <Card 
          title="3. Customer Pain Points" 
          className="mb-4 section-card"
          extra={<Tag color="volcano" style={{ background: 'transparent', borderColor: SPACE_COLOR, color: SPACE_COLOR }}>Pain Points</Tag>}
          style={{ background: SURFACE_BG, borderColor: BORDER_COLOR }}
        >
          <Row gutter={16}>
            {reportData.painPoints?.map((point, index) => (
              <Col span={8} key={index}>
                <div className="pain-point-card" style={{ background: SURFACE_LIGHTER, padding: '16px', borderRadius: '8px' }}>
                  <div className="intensity-indicator">
                    <div 
                      className={`intensity-level intensity-${point.intensity?.toLowerCase()}`}
                      title={`${point.intensity} intensity`}
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: point.intensity?.toLowerCase() === 'high' ? '#ff4d4f' : 
                                       point.intensity?.toLowerCase() === 'medium' ? '#faad14' : '#1890ff'
                      }}
                    ></div>
                  </div>
                  <Text strong style={{ color: TEXT_PRIMARY, display: 'block', marginBottom: '8px' }}>{point.problem}</Text>
                  <div className="intensity-tag">
                    <Tag color={
                      point.intensity?.toLowerCase() === 'high' ? 'red' : 
                      point.intensity?.toLowerCase() === 'medium' ? 'orange' : 'blue'
                    } style={{ background: 'transparent' }}>
                      {point.intensity} intensity
                    </Tag>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </Card>
        
        {/* Competitive Landscape */}
        <Card 
          title="4. Competitive Landscape" 
          className="mb-4 section-card"
          extra={<Tag color="purple" style={{ background: 'transparent', borderColor: SPACE_COLOR, color: SPACE_COLOR }}>Competition</Tag>}
          style={{ background: SURFACE_BG, borderColor: BORDER_COLOR }}
        >
          <Title level={4} style={{ color: TEXT_PRIMARY }}>Top Competitors</Title>
          <Row gutter={16} className="competitor-cards">
            {reportData.competitiveLandscape?.competitors.map((competitor, index) => (
              <Col span={8} key={index}>
                <Card 
                  className="competitor-card" 
                  size="small"
                  style={{ background: SURFACE_LIGHTER, borderColor: BORDER_COLOR }}
                  actions={[
                    <span key="position" style={{ color: TEXT_SECONDARY }}>Market Position: {index + 1}</span>,
                    <span key="strength" style={{ color: TEXT_SECONDARY }}>Strength: {competitor.strength || 'Unknown'}</span>
                  ]}
                >
                  <Card.Meta
                    avatar={
                      <Avatar 
                        size="large" 
                        style={{ backgroundColor: ['#f56a00', '#7265e6', '#ffbf00', '#00a2ae'][index % 4] }}
                      >
                        {competitor.name.charAt(0)}
                      </Avatar>
                    }
                    title={<span style={{ color: TEXT_PRIMARY }}>{competitor.name}</span>}
                    description={
                      <Text ellipsis={{ tooltip: competitor.description }} style={{ color: TEXT_SECONDARY }}>
                        {competitor.description}
                      </Text>
                    }
                  />
                </Card>
              </Col>
            ))}
          </Row>
          
          <Row gutter={16} className="mt-4">
            <Col span={12}>
              <Title level={4} style={{ color: TEXT_PRIMARY }}>Gap Analysis</Title>
              <div className="highlight-box" style={{ background: SURFACE_LIGHTER, borderColor: BORDER_COLOR, padding: '12px', borderRadius: '8px' }}>
                <Text style={{ color: TEXT_SECONDARY }}>{reportData.competitiveLandscape?.gapAnalysis}</Text>
              </div>
            </Col>
            <Col span={12}>
              <Title level={4} style={{ color: TEXT_PRIMARY }}>Barrier to Entry</Title>
              <div className="barrier-indicator">
                <Progress 
                  percent={
                    reportData.competitiveLandscape?.barrierToEntry === 'High' ? 80 : 
                    reportData.competitiveLandscape?.barrierToEntry === 'Medium' ? 50 : 20
                  } 
                  showInfo={false}
                  status={
                    reportData.competitiveLandscape?.barrierToEntry === 'High' ? 'exception' : 
                    reportData.competitiveLandscape?.barrierToEntry === 'Medium' ? 'active' : 'success'
                  }
                  strokeColor={BRAND_GREEN}
                />
                <Tag 
                  color={
                    reportData.competitiveLandscape?.barrierToEntry === 'High' ? 'red' : 
                    reportData.competitiveLandscape?.barrierToEntry === 'Medium' ? 'orange' : 'green'
                  } 
                  className="barrier-tag"
                  style={{ background: 'transparent' }}
                >
                  {reportData.competitiveLandscape?.barrierToEntry}
                </Tag>
              </div>
            </Col>
          </Row>
        </Card>
        
        {/* Arbitrage Opportunity */}
        <Card 
          title="5. Arbitrage Opportunity" 
          className="mb-4 section-card"
          extra={<Tag color="cyan" style={{ background: 'transparent', borderColor: SPACE_COLOR, color: SPACE_COLOR }}>Opportunity</Tag>}
          style={{ background: SURFACE_BG, borderColor: BORDER_COLOR }}
        >
          <Text style={{ color: TEXT_SECONDARY }}>{reportData.arbitrageOpportunity?.explanation}</Text>
          <div className="mt-3 p-3 opportunity-highlight" style={{ background: SURFACE_LIGHTER, borderRadius: '8px' }}>
            <Title level={5} style={{ color: TEXT_PRIMARY }}>Concrete Angle:</Title> 
            <Text style={{ color: TEXT_SECONDARY }}>{reportData.arbitrageOpportunity?.concreteAngle}</Text>
          </div>
        </Card>
        
        {/* Suggested Entry Offers */}
        <Card 
          title="6. Suggested Entry Offers" 
          className="mb-4 section-card"
          extra={<Tag color="gold" style={{ background: 'transparent', borderColor: SPACE_COLOR, color: SPACE_COLOR }}>Offers</Tag>}
          style={{ background: SURFACE_BG, borderColor: BORDER_COLOR }}
        >
          <Row gutter={16}>
            {reportData.entryOffers?.map((offer, index) => (
              <Col span={12} key={index}>
                <Card 
                  className="offer-card" 
                  type="inner" 
                  style={{ background: SURFACE_LIGHTER, borderColor: BORDER_COLOR }}
                  title={
                    <span style={{ color: TEXT_PRIMARY }}>
                      <StarOutlined /> {offer.positioning}
                    </span>
                  }
                >
                  <Row gutter={16}>
                    <Col span={12}>
                      <div className="offer-detail" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <DollarCircleOutlined className="offer-icon" style={{ color: BRAND_GREEN, fontSize: '20px' }} />
                        <div>
                          <Text strong style={{ color: TEXT_PRIMARY }}>Business Model:</Text>
                          <br />
                          <Text style={{ color: TEXT_SECONDARY }}>{offer.businessModel}</Text>
                        </div>
                      </div>
                    </Col>
                    <Col span={12}>
                      <div className="offer-detail" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <TagOutlined className="offer-icon" style={{ color: SPACE_COLOR, fontSize: '20px' }} />
                        <div>
                          <Text strong style={{ color: TEXT_PRIMARY }}>Price Point:</Text>
                          <br />
                          <Text style={{ color: TEXT_SECONDARY }}>{offer.pricePoint}</Text>
                        </div>
                      </div>
                    </Col>
                  </Row>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
        
        {/* Go-To-Market Strategy */}
        <Card 
          title="7. Go-To-Market Strategy" 
          className="mb-4 section-card"
          extra={<Tag color="lime" style={{ background: 'transparent', borderColor: SPACE_COLOR, color: SPACE_COLOR }}>GTM</Tag>}
          style={{ background: SURFACE_BG, borderColor: BORDER_COLOR }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <div className="strategy-card primary" style={{ background: SURFACE_LIGHTER, padding: '16px', borderRadius: '8px' }}>
                <Title level={5} style={{ color: TEXT_PRIMARY }}>Primary Channel</Title>
                <Text className="channel-name" style={{ color: TEXT_PRIMARY, fontSize: '18px', fontWeight: 'bold' }}>{reportData.gtmStrategy?.primaryChannel}</Text>
              </div>
            </Col>
            <Col span={12}>
              <div className="strategy-card" style={{ background: SURFACE_LIGHTER, padding: '16px', borderRadius: '8px' }}>
                <Title level={5} style={{ color: TEXT_PRIMARY }}>Justification</Title>
                <Text style={{ color: TEXT_SECONDARY }}>{reportData.gtmStrategy?.justification}</Text>
              </div>
            </Col>
          </Row>
        </Card>
        
        {/* Scalability & Exit Potential */}
        <Card 
          title="8. Scalability & Exit Potential" 
          className="mb-4 section-card"
          extra={<Tag color="magenta" style={{ background: 'transparent', borderColor: SPACE_COLOR, color: SPACE_COLOR }}>Growth</Tag>}
          style={{ background: SURFACE_BG, borderColor: BORDER_COLOR }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <div className="scalability-card">
                <Title level={5} style={{ color: TEXT_PRIMARY }}>Scalability Score</Title>
                <div className="score-display" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <Progress 
                    type="circle" 
                    percent={
                      reportData.scalabilityExit?.scalabilityScore === 'High' ? 80 : 
                      reportData.scalabilityExit?.scalabilityScore === 'Medium' ? 50 : 30
                    } 
                    width={80}
                    status={
                      reportData.scalabilityExit?.scalabilityScore === 'High' ? 'success' : 
                      reportData.scalabilityExit?.scalabilityScore === 'Medium' ? 'normal' : 'exception'
                    }
                    strokeColor={BRAND_GREEN}
                  />
                  <Tag color={reportData.scalabilityExit?.scalabilityScore === 'High' ? 'green' : 
                            reportData.scalabilityExit?.scalabilityScore === 'Medium' ? 'orange' : 'blue'}
                       className="score-tag"
                       style={{ background: 'transparent' }}>
                    {reportData.scalabilityExit?.scalabilityScore}
                  </Tag>
                </div>
              </div>
            </Col>
            <Col span={12}>
              <div className="exit-card">
                <Title level={5} style={{ color: TEXT_PRIMARY }}>Exit Potential</Title>
                <div className="highlight-box" style={{ background: SURFACE_LIGHTER, borderColor: BORDER_COLOR, padding: '12px', borderRadius: '8px' }}>
                  <Text style={{ color: TEXT_SECONDARY }}>{reportData.scalabilityExit?.exitPotential}</Text>
                </div>
              </div>
            </Col>
          </Row>
        </Card>
        
        {/* Risk Factors & Constraints */}
        <Card 
          title="9. Risk Factors & Constraints" 
          className="mb-4 section-card"
          extra={<Tag color="red" style={{ background: 'transparent', borderColor: SPACE_COLOR, color: SPACE_COLOR }}>Risks</Tag>}
          style={{ background: SURFACE_BG, borderColor: BORDER_COLOR }}
        >
          <Row gutter={16}>
            {reportData.riskFactors?.map((risk, index) => (
              <Col span={8} key={index}>
                <div className="risk-card" style={{ background: SURFACE_LIGHTER, padding: '16px', borderRadius: '8px' }}>
                  <WarningOutlined className="risk-icon" style={{ color: '#ff4d4f', fontSize: '20px', marginBottom: '8px' }} />
                  <Text strong style={{ color: TEXT_PRIMARY, display: 'block', marginBottom: '8px' }}>{risk.risk}</Text>
                  <div className="risk-impact">
                    <Tag color={
                      risk.impact?.toLowerCase().includes('high') ? 'red' : 
                      risk.impact?.toLowerCase().includes('medium') ? 'orange' : 'blue'
                    } style={{ background: 'transparent' }}>
                      Impact: {risk.impact}
                    </Tag>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </Card>
        
        {/* Difficulty vs Reward Scorecard */}
        <Card 
          title="10. Difficulty vs Reward Scorecard" 
          className="mb-4 section-card"
          extra={<Tag color="geekblue" style={{ background: 'transparent', borderColor: SPACE_COLOR, color: SPACE_COLOR }}>Scorecard</Tag>}
          style={{ background: SURFACE_BG, borderColor: BORDER_COLOR }}
        >
          <Row gutter={16}>
            <Col span={6}>
              <div className="scorecard-metric">
                <Title level={5} style={{ color: TEXT_PRIMARY }}>Market Demand</Title>
                <div className="score-indicator">
                  <Progress 
                    percent={
                      reportData.scorecard?.marketDemand === 'High' ? 90 : 
                      reportData.scorecard?.marketDemand === 'Medium' ? 60 : 30
                    } 
                    showInfo={false}
                    status="active"
                    strokeColor={
                      reportData.scorecard?.marketDemand === 'High' ? BRAND_GREEN : 
                      reportData.scorecard?.marketDemand === 'Medium' ? SPACE_COLOR : '#f5222d'
                    }
                  />
                  <Tag color={reportData.scorecard?.marketDemand === 'High' ? 'green' : 
                            reportData.scorecard?.marketDemand === 'Medium' ? 'orange' : 'red'}
                       className="scorecard-tag"
                       style={{ background: 'transparent' }}>
                    {reportData.scorecard?.marketDemand}
                  </Tag>
                </div>
              </div>
            </Col>
            <Col span={6}>
              <div className="scorecard-metric">
                <Title level={5} style={{ color: TEXT_PRIMARY }}>Competition Intensity</Title>
                <div className="score-indicator">
                  <Progress 
                    percent={
                      reportData.scorecard?.competition === 'High' ? 90 : 
                      reportData.scorecard?.competition === 'Medium' ? 60 : 30
                    } 
                    showInfo={false}
                    status="active"
                    strokeColor={
                      reportData.scorecard?.competition === 'High' ? '#f5222d' : 
                      reportData.scorecard?.competition === 'Medium' ? SPACE_COLOR : BRAND_GREEN
                    }
                  />
                  <Tag color={reportData.scorecard?.competition === 'High' ? 'red' : 
                            reportData.scorecard?.competition === 'Medium' ? 'orange' : 'green'}
                       className="scorecard-tag"
                       style={{ background: 'transparent' }}>
                    {reportData.scorecard?.competition}
                  </Tag>
                </div>
              </div>
            </Col>
            <Col span={6}>
              <div className="scorecard-metric">
                <Title level={5} style={{ color: TEXT_PRIMARY }}>Ease of Entry</Title>
                <div className="score-indicator">
                  <Progress 
                    percent={
                      reportData.scorecard?.easeOfEntry === 'High' ? 90 : 
                      reportData.scorecard?.easeOfEntry === 'Medium' ? 60 : 30
                    } 
                    showInfo={false}
                    status="active"
                    strokeColor={
                      reportData.scorecard?.easeOfEntry === 'High' ? BRAND_GREEN : 
                      reportData.scorecard?.easeOfEntry === 'Medium' ? SPACE_COLOR : '#f5222d'
                    }
                  />
                  <Tag color={reportData.scorecard?.easeOfEntry === 'High' ? 'green' : 
                            reportData.scorecard?.easeOfEntry === 'Medium' ? 'orange' : 'red'}
                       className="scorecard-tag"
                       style={{ background: 'transparent' }}>
                    {reportData.scorecard?.easeOfEntry}
                  </Tag>
                </div>
              </div>
            </Col>
            <Col span={6}>
              <div className="scorecard-metric">
                <Title level={5} style={{ color: TEXT_PRIMARY }}>Profitability Potential</Title>
                <div className="score-indicator">
                  <Progress 
                    percent={
                      reportData.scorecard?.profitability === 'High' ? 90 : 
                      reportData.scorecard?.profitability === 'Medium' ? 60 : 30
                    } 
                    showInfo={false}
                    status="active"
                    strokeColor={
                      reportData.scorecard?.profitability === 'High' ? BRAND_GREEN : 
                      reportData.scorecard?.profitability === 'Medium' ? SPACE_COLOR : '#f5222d'
                    }
                  />
                  <Tag color={reportData.scorecard?.profitability === 'High' ? 'green' : 
                            reportData.scorecard?.profitability === 'Medium' ? 'orange' : 'red'}
                       className="scorecard-tag"
                       style={{ background: 'transparent' }}>
                    {reportData.scorecard?.profitability}
                  </Tag>
                </div>
              </div>
            </Col>
          </Row>
        </Card>
      </>
    );
  };

  // Render step content based on current step
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <>
            {error && (
              <Alert
                message="Error"
                description={error}
                type="error"
                closable
                onClose={() => setError(null)}
                className="mb-4"
              />
            )}
            
            <Card className="mb-6" style={{ background: SURFACE_BG, borderColor: BORDER_COLOR }}>
              <Title level={4} className="flex items-center" style={{ color: TEXT_PRIMARY }}>
                <RocketOutlined className="mr-2" />
                Business & Strategic Goals
              </Title>
              
              <Form.Item
                name="primaryObjective"
                label={<span style={{ color: TEXT_SECONDARY }}>Primary Business Objective</span>}
                rules={[{ required: true, message: 'Please select your primary objective' }]}
              >
                <Select 
                  placeholder="Select your main goal"
                  className="hover:border-[#5CC49D] focus:border-[#5CC49D]"
                >
                  <Option value="cashflow">Cashflow (Immediate revenue)</Option>
                  <Option value="equity-exit">Equity/Exit (Build to sell)</Option>
                  <Option value="lifestyle">Lifestyle Business (Work-life balance)</Option>
                  <Option value="audience-build">Audience Building (Grow audience first)</Option>
                  <Option value="saas">SaaS (Recurring revenue)</Option>
                  <Option value="agency">Agency (Service business)</Option>
                  <Option value="ecomm">E-commerce (Product sales)</Option>
                </Select>
              </Form.Item>
              
              <Form.Item
                name="riskAppetite"
                label={<span style={{ color: TEXT_SECONDARY }}>Risk Appetite</span>}
                rules={[{ required: true, message: 'Please select your risk appetite' }]}
              >
                <Select 
                  placeholder="Select your risk tolerance"
                  className="hover:border-[#5CC49D] focus:border-[#5CC49D]"
                >
                  <Option value="low">Low - Steady, proven industries</Option>
                  <Option value="medium">Medium - Growing markets with some uncertainty</Option>
                  <Option value="high">High - Bleeding edge, emerging markets</Option>
                </Select>
              </Form.Item>
            </Card>
          </>
        );
      case 1:
        return (
          <>
            <Card className="mb-6" style={{ background: SURFACE_BG, borderColor: BORDER_COLOR }}>
              <Title level={4} className="flex items-center" style={{ color: TEXT_PRIMARY }}>
                <CustomerServiceOutlined className="mr-2" />
                Target Customer Preferences
              </Title>
              
              <Form.Item
                name="marketType"
                label={<span style={{ color: TEXT_SECONDARY }}>Preferred Market Type</span>}
                rules={[{ required: true, message: 'Please select your market type' }]}
              >
                <Select 
                  placeholder="Select market type"
                  className="hover:border-[#5CC49D] focus:border-[#5CC49D]"
                >
                  <Option value="b2b-saas">B2B SaaS</Option>
                  <Option value="b2c-consumer">B2C Consumer Products</Option>
                  <Option value="professional-services">Professional Services</Option>
                  <Option value="local-business">Local Business</Option>
                  <Option value="info-education">Information/Education</Option>
                </Select>
              </Form.Item>
              
              <Form.Item
                name="customerSize"
                label={<span style={{ color: TEXT_SECONDARY }}>Customer Size Preference</span>}
                rules={[{ required: true, message: 'Please select your customer size preference' }]}
              >
                <Select 
                  placeholder="Select customer size"
                  className="hover:border-[#5CC49D] focus:border-[#5CC49D]"
                >
                  <Option value="startups">Startups</Option>
                  <Option value="smb">SMBs (Small & Medium Businesses)</Option>
                  <Option value="enterprise">Enterprise</Option>
                  <Option value="consumers">Consumers</Option>
                  <Option value="government">Government/Public Sector</Option>
                </Select>
              </Form.Item>
              
              <Form.Item
                name="industries"
                label={<span style={{ color: TEXT_SECONDARY }}>Industry Spaces of Interest (Optional)</span>}
              >
                <Select
                  mode="multiple"
                  placeholder="Select industries of interest"
                  options={industryOptions.map(industry => ({ value: industry, label: industry }))}
                  className="hover:border-[#5CC49D] focus:border-[#5CC49D]"
                />
              </Form.Item>
              
              <Form.Item
                name="geographicFocus"
                label={<span style={{ color: TEXT_SECONDARY }}>Geographic Focus (Optional)</span>}
              >
                <Select 
                  placeholder="Select geographic focus"
                  onChange={(value) => {
                    // Clear the target area when geographic focus changes
                    if (value !== 'local' && value !== 'regional') {
                      form.setFieldValue('targetArea', undefined);
                    }
                  }}
                  className="hover:border-[#5CC49D] focus:border-[#5CC49D]"
                >
                  <Option value="local">Local</Option>
                  <Option value="regional">Regional</Option>
                  <Option value="us-only">US-only</Option>
                  <Option value="global">Global</Option>
                </Select>
              </Form.Item>

              {/* Conditional Target Area Field */}
              <Form.Item
                noStyle
                shouldUpdate={(prevValues, currentValues) => 
                  prevValues.geographicFocus !== currentValues.geographicFocus
                }
              >
                {({ getFieldValue }) => {
                  const geographicFocus = getFieldValue('geographicFocus');
                  
                  if (geographicFocus === 'local' || geographicFocus === 'regional') {
                    return (
                      <Form.Item
                        name="targetArea"
                        label={<span style={{ color: TEXT_SECONDARY }}>
                          {geographicFocus === 'local' ? "Target City/Area" : "Target Region"}
                        </span>}
                        rules={[
                          { 
                            required: true, 
                            message: `Please specify your target ${geographicFocus === 'local' ? 'city/area' : 'region'}` 
                          }
                        ]}
                      >
                        <Input 
                          placeholder={
                            geographicFocus === 'local' 
                              ? "e.g., San Francisco Bay Area, Austin, TX" 
                              : "e.g., Southeast US, Pacific Northwest, Midwest"
                          }
                          className="hover:border-[#5CC49D] focus:border-[#5CC49D]"
                        />
                      </Form.Item>
                    );
                  }
                  return null;
                }}
              </Form.Item>
            </Card>
          </>
        );
      case 2:
        return (
          <>
            <Card className="mb-6" style={{ background: SURFACE_BG, borderColor: BORDER_COLOR }}>
              <Title level={4} className="flex items-center" style={{ color: TEXT_PRIMARY }}>
                <SolutionOutlined className="mr-2" />
                Constraints & Resources
              </Title>
              
              <Form.Item
                name="budget"
                label={<span style={{ color: TEXT_SECONDARY }}>Budget Available</span>}
                rules={[{ required: true, message: 'Please select your budget range' }]}
              >
                <Select 
                  placeholder="Select budget"
                  className="hover:border-[#5CC49D] focus:border-[#5CC49D]"
                >
                  <Option value="<10k">Less than $10k</Option>
                  <Option value="10k-50k">$10k - $50k</Option>
                  <Option value="50k-250k">$50k - $250k</Option>
                  <Option value="250k+">$250k+</Option>
                </Select>
              </Form.Item>
              
              <Form.Item
                name="teamSize"
                label={<span style={{ color: TEXT_SECONDARY }}>Team Size / Capabilities (Optional)</span>}
              >
                <Select 
                  placeholder="Select team size"
                  className="hover:border-[#5CC49D] focus:border-[#5CC49D]"
                >
                  <Option value="solo">Solo Founder (1)</Option>
                  <Option value="small-team">Small Team (2-10)</Option>
                  <Option value="established-team">Established Team (10+ )</Option>
                </Select>
              </Form.Item>
              
              <Form.Item
                name="skills"
                label={<span style={{ color: TEXT_SECONDARY }}>What Your Team Can Do (Select all that apply)</span>}
                rules={[
                  { 
                    required: true, 
                    message: 'Please select at least one skill',
                    type: 'array',
                    min: 1
                  }
                ]}
              >
                <Select
                  mode="multiple"
                  placeholder="Select skills available"
                  options={skillOptions.map(skill => ({ value: skill, label: skill }))}
                  className="hover:border-[#5CC49D] focus:border-[#5CC49D]"
                />
              </Form.Item>
              
              <Form.Item
                name="timeCommitment"
                label={<span style={{ color: TEXT_SECONDARY }}>Hours per Week  You&apos;ll Invest (Optional)</span>}
              >
                <Select 
                  placeholder="Select time commitment"
                  className="hover:border-[#5CC49D] focus:border-[#5CC49D]"
                >
                  <Option value="5-10">5-10 hours/week</Option>
                  <Option value="10-20">10-20 hours/week</Option>
                  <Option value="20-30">20-30 hours/week</Option>
                  <Option value="30+">30+ hours/week</Option>
                </Select>
              </Form.Item>
            </Card>
          </>
        );
      case 3:
        return (
          <>
            <Card className="mb-6" style={{ background: SURFACE_BG, borderColor: BORDER_COLOR }}>
              <Title level={4} className="flex items-center" style={{ color: TEXT_PRIMARY }}>
                <BulbOutlined className="mr-2" />
                Market Directional Inputs
              </Title>
              
              <Form.Item
                name="problems"
                label={<span style={{ color: TEXT_SECONDARY }}>Problems  You&apos;re Passionate About Solving (Optional)</span>}
              >
                <TextArea 
                  rows={3} 
                  placeholder="e.g. Small business inefficiencies, healthcare access issues, educational gaps..."
                  maxLength={500}
                  className="hover:border-[#5CC49D] focus:border-[#5CC49D]"
                />
              </Form.Item>
              
              <Form.Item
                name="excludedIndustries"
                label={<span style={{ color: TEXT_SECONDARY }}>Industries You Will NOT Touch (Optional)</span>}
              >
                <Select
                  mode="multiple"
                  placeholder="Select industries to exclude"
                  options={industryOptions.map(industry => ({ value: industry, label: industry }))}
                  className="hover:border-[#5CC49D] focus:border-[#5CC49D]"
                />
              </Form.Item>
              
              <Form.Item
                name="monetizationPreference"
                label={<span style={{ color: TEXT_SECONDARY }}>Monetization Preference (Optional)</span>}
              >
                <Select 
                  placeholder="Select monetization preference"
                  className="hover:border-[#5CC49D] focus:border-[#5CC49D]"
                >
                  <Option value="high-ticket">High-Ticket Services/Products</Option>
                  <Option value="subscription">Subscription/Recurring Revenue</Option>
                  <Option value="low-ticket">Low-Ticket/Volume Business</Option>
                  <Option value="ad-supported">Ad-Supported/Free Model</Option>
                </Select>
              </Form.Item>
              
              <Form.Item
                name="acquisitionChannels"
                label={<span style={{ color: TEXT_SECONDARY }}>Acquisition Channels You Prefer (Optional)</span>}
              >
                <Select
                  mode="multiple"
                  placeholder="Select preferred acquisition channels"
                  options={acquisitionChannelOptions.map(channel => ({ value: channel, label: channel }))}
                  className="hover:border-[#5CC49D] focus:border-[#5CC49D]"
                />
              </Form.Item>
            </Card>
          </>
        );
      case 4:
        return (
          <>
            <Card className="mb-6" style={{ background: SURFACE_BG, borderColor: BORDER_COLOR }}>
              <Title level={4} className="flex items-center" style={{ color: TEXT_PRIMARY }}>
                <BarChartOutlined className="mr-2" />
                Validation & Scalability Factors
              </Title>
              
              <Form.Item
                name="validationData"
                label={<span style={{ color: TEXT_SECONDARY }}>How important is validation data? (Optional)</span>}
              >
                <Checkbox.Group options={validationDataOptions.map(option => ({ label: option, value: option }))} />
              </Form.Item>
              
              <Form.Item
                name="competitionPreference"
                label={<span style={{ color: TEXT_SECONDARY }}>Do you prefer low-competition or high-potential markets? (Optional)</span>}
              >
                <Radio.Group className="custom-radio-group">
                  <Radio value="low-competition" className="custom-radio" style={{ color: TEXT_PRIMARY }}>Low-Competition / Easy Entry</Radio>
                  <Radio value="high-potential" className="custom-radio" style={{ color: TEXT_PRIMARY }}>High-Potential / Competitive Markets</Radio>
                </Radio.Group>
              </Form.Item>
              
              <Form.Item
                name="scalabilityPreference"
                label={<span style={{ color: TEXT_SECONDARY }}>Scalability Preference (Optional)</span>}
              >
                <Select 
                  placeholder="Select scalability preference"
                  className="hover:border-[#5CC49D] focus:border-[#5CC49D]"
                >
                  <Option value="stay-small">Stay Small (Lifestyle business)</Option>
                  <Option value="grow-fast">Grow Fast (Scale quickly)</Option>
                  <Option value="build-exit">Build for Exit (Acquisition target)</Option>
                </Select>
              </Form.Item>
            </Card>
          </>
        );
      case 5:
        return (
          <div className="report-container">
            {reportGenerated && multiNicheReport ? (
              <>
                {/* Recommendation Banner */}
                <Card className="mb-6 recommendation-banner" style={{ background: SURFACE_BG, borderColor: BORDER_COLOR }}>
                  <div className="text-center">
                    <Title level={2} style={{ color: TEXT_PRIMARY }}>Your Top 3 Niche Opportunities</Title>
                    <Alert
                      message={`Recommended: ${multiNicheReport.niches[multiNicheReport.recommendedNiche].nicheOverview.name}`}
                      description={multiNicheReport.recommendationReason}
                      type="success"
                      showIcon
                      className="mb-4"
                    />
                  </div>
                </Card>

                {/* Niche Selection Tabs */}
                <Card className="mb-4" style={{ background: SURFACE_BG, borderColor: BORDER_COLOR }}>
                  <div className="mb-4">
                    <Title level={4} style={{ color: TEXT_PRIMARY }}>Explore your Niche Reports</Title>
                    <Space wrap>
                      {multiNicheReport.niches.map((niche, index) => (
                        <Button
                          key={index}
                          type={selectedNicheTab === index ? "primary" : "default"}
                          onClick={() => setSelectedNicheTab(index)}
                          icon={index === multiNicheReport.recommendedNiche ? <StarOutlined /> : undefined}
                          size="large"
                          style={selectedNicheTab === index ? {
                            background: BRAND_GREEN,
                            borderColor: BRAND_GREEN,
                            color: '#000'
                          } : {
                            background: SURFACE_LIGHTER,
                            borderColor: BORDER_COLOR,
                            color: TEXT_PRIMARY
                          }}
                        >
                          {niche.nicheOverview.name}
                          {index === multiNicheReport.recommendedNiche && (
                            <Tag color="gold" className="ml-2" style={{ background: 'transparent', borderColor: SPACE_COLOR, color: SPACE_COLOR }}>
                              Recommended
                            </Tag>
                          )}
                        </Button>
                      ))}
                    </Space>
                  </div>
                </Card>

                {/* DETAILED NICHE REPORT - Use your existing structure */}
                {renderDetailedNicheReport(multiNicheReport.niches[selectedNicheTab])}

                {/* Comparison Matrix */}
                <Card title="Compare All 3 Niches" className="mb-4" style={{ background: SURFACE_BG, borderColor: BORDER_COLOR }}>
                  <div className="comparison-table">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr style={{ background: SURFACE_LIGHTER }}>
                          <th className="border p-3 text-left" style={{ borderColor: BORDER_COLOR, color: TEXT_PRIMARY }}>Criteria</th>
                          {multiNicheReport.niches.map((niche, index) => (
                            <th key={index} className="border p-3 text-center" style={{ borderColor: BORDER_COLOR, color: TEXT_PRIMARY }}>
                              {niche.nicheOverview.name}
                              {index === multiNicheReport.recommendedNiche && (
                                <Tag color="gold" className="ml-1" style={{ background: 'transparent', borderColor: SPACE_COLOR, color: SPACE_COLOR }}>
                                  ★
                                </Tag>
                              )}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {multiNicheReport.comparisonMatrix.criteria.map((criterion, criterionIndex) => (
                          <tr key={criterionIndex}>
                            <td className="border p-3 font-medium" style={{ borderColor: BORDER_COLOR, color: TEXT_PRIMARY }}>{criterion}</td>
                            {multiNicheReport.comparisonMatrix.scores.map((score, scoreIndex) => (
                              <td key={scoreIndex} className="border p-3 text-center" style={{ borderColor: BORDER_COLOR }}>
                                <Progress 
                                  type="circle" 
                                  percent={Object.values(score.scores)[criterionIndex] || 0}
                                  width={50}
                                  strokeColor={BRAND_GREEN}
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>

                <div className="text-center action-buttons">
                  <Space>
                    <Button 
                      type="primary" 
                      size="large"
                      onClick={() => {
                        setCurrentStep(0);
                        setReportGenerated(false);
                        setMultiNicheReport(null);
                        setCurrentReportId(null);
                        form.resetFields();
                      }}
                      icon={<FileAddOutlined />}
                      style={{ background: BRAND_GREEN, borderColor: BRAND_GREEN, color: '#000' }}
                    >
                      Generate New Report
                    </Button>
                    <Button 
                      size="large"
                      onClick={loadPreviousReports}
                      icon={<EyeOutlined />}
                      style={{ background: SURFACE_LIGHTER, borderColor: BORDER_COLOR, color: TEXT_PRIMARY }}
                    >
                      View Previous Reports
                    </Button>
                  </Space>
                </div>
              </>
            ) : (
              <div className="text-center py-10">
                <Title level={4} style={{ color: TEXT_PRIMARY }}>Ready to Generate Your Multi-Niche Report</Title>
                <Text style={{ color: SPACE_COLOR }}>Review your information and click below to analyze</Text>
                <div className="mt-6">
                  <Space>
                    <Button 
                      type="primary" 
                      size="large" 
                      loading={loading}
                      onClick={() => form.submit()}
                      style={{ background: BRAND_GREEN, borderColor: BRAND_GREEN, color: '#000' }}
                    >
                      {loading ? 'Generating Report...' : 'Generate 3 Niche Opportunities'}
                    </Button>
                    <Button 
                      size="large"
                      onClick={loadPreviousReports}
                      icon={<EyeOutlined />}
                      style={{ background: SURFACE_LIGHTER, borderColor: BORDER_COLOR, color: TEXT_PRIMARY }}
                    >
                      View Previous Reports
                    </Button>
                  </Space>
                </div>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          fontFamily: 'Manrope, sans-serif',
          colorPrimary: BRAND_GREEN,
          borderRadius: 8,
          colorTextHeading: TEXT_PRIMARY,
          colorText: TEXT_SECONDARY,
          colorBgContainer: SURFACE_BG,
          colorBgElevated: SURFACE_BG,
          colorBorder: BORDER_COLOR,
        },
        components: {
          Button: {
            colorPrimary: BRAND_GREEN,
            algorithm: true,
            fontWeight: 600,
            colorTextLightSolid: '#000000',
            defaultBorderColor: SPACE_COLOR,
            defaultColor: TEXT_SECONDARY,
            defaultBg: SURFACE_BG,
          },
          Input: {
            paddingBlock: 10,
            // borderColor: SURFACE_LIGHTER,
            activeBorderColor: BRAND_GREEN,
            hoverBorderColor: BRAND_GREEN,
            colorBgContainer: SURFACE_BG,
            colorText: TEXT_PRIMARY,
          },
          Select: {
            controlHeight: 44,
            colorPrimary: BRAND_GREEN,
            optionSelectedBg: SURFACE_LIGHTER,
            colorBgContainer: SURFACE_BG,
            colorText: TEXT_PRIMARY,
            hoverBorderColor: BRAND_GREEN,
          },
          Card: {
            headerBg: SURFACE_BG,
            colorBgContainer: SURFACE_BG,
            colorTextHeading: TEXT_PRIMARY,
            colorBorder: BORDER_COLOR,
          },
          Table: {
            headerBg: SURFACE_LIGHTER,
            headerColor: TEXT_PRIMARY,
            rowHoverBg: '#2d3748',
            colorBgContainer: SURFACE_BG,
            borderColor: BORDER_COLOR,
          },
          Radio: {
            buttonSolidCheckedColor: '#000',
            buttonSolidCheckedBg: BRAND_GREEN,
            colorBorder: BORDER_COLOR,
            colorPrimary: BRAND_GREEN,
            colorPrimaryHover: BRAND_GREEN,
          },
          Checkbox: {
            colorPrimary: BRAND_GREEN,
            colorPrimaryHover: BRAND_GREEN,
          },
          Progress: {
            defaultColor: BRAND_GREEN,
            colorSuccess: BRAND_GREEN,
            remainingColor: SURFACE_LIGHTER,
          }
        }
      }}
    >
      <div className="min-h-screen bg-black font-manrope">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <LoadingOverlay visible={isLoading} />
          
          {/* Header Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <Button 
                  icon={<ArrowLeftOutlined />} 
                  onClick={handleBack}
                  size="small"
                  style={{ background: 'transparent', color: SPACE_COLOR, border: 'none' }}
                >
                  Back to Dashboard
                </Button>
                {/* <Title level={2} className="mb-0 flex items-center">
                  <span style={{
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                    fontSize: '15px',
                    color: TEXT_PRIMARY
                  }}>
                    <span style={{ color: BRAND_GREEN }}>a</span>rb
                    <span style={{ color: BRAND_GREEN }}>i</span>trageOS Niche Research Reports
                  </span>
                </Title> */}
              </div>
              
              <Badge count={previousReports.length} overflowCount={99}>
                <Button 
                  icon={<HistoryOutlined />}
                  type={activeView === 'history' ? 'primary' : 'default'}
                  onClick={() => setActiveView(activeView === 'history' ? 'research' : 'history')}
                  style={activeView === 'history' ? {
                    background: BRAND_GREEN,
                    borderColor: BRAND_GREEN,
                    color: '#000'
                  } : {
                    background: SURFACE_BG,
                    borderColor: BORDER_COLOR,
                    color: TEXT_PRIMARY
                  }}
                >
                  {activeView === 'history' ? 'Back to Research' : 'View History'}
                </Button>
              </Badge>
            </div>
            
            <Text style={{ color: SPACE_COLOR }} className="text-lg">
              Discover your perfect business niche based on your goals, resources, and market opportunities
            </Text>
          </div>

          {/* Main Content Area */}
          {activeView === 'history' ? (
            /* Compact History View */
            <Card 
              title={
                <div className="flex items-center" style={{ color: TEXT_PRIMARY }}>
                  <HistoryOutlined className="mr-2" />
                  Your Generated Niche Reports
                  <Tag color="blue" className="ml-2" style={{ background: 'transparent', borderColor: SPACE_COLOR, color: SPACE_COLOR }}>
                    {previousReports.length} reports
                  </Tag>
                </div>
              }
              className="mb-6"
              style={{ background: SURFACE_BG, borderColor: BORDER_COLOR }}
            >
              <SavedNicheHistory compactMode={true} />
              <div className="text-center mt-4">
                <Button 
                  type="primary" 
                  onClick={() => setActiveView('research')}
                  icon={<SearchOutlined />}
                  style={{ background: BRAND_GREEN, borderColor: BRAND_GREEN, color: '#000' }}
                >
                  Start New Research
                </Button>
              </div>
            </Card>
          ) : (
            /* Research Interface */
            <>
              {/* Progress Stepper */}
              <Card className="mb-6" style={{ background: SURFACE_BG, borderColor: BORDER_COLOR }}>
                <div className="mb-4">
                  <Progress 
                    percent={(currentStep / (steps.length - 1)) * 100} 
                    showInfo={false} 
                    strokeColor={BRAND_GREEN}
                    strokeWidth={8}
                  />
                </div>
                <div className="flex justify-between">
                  {steps.map((step, index) => (
                    <div 
                      key={index} 
                      className={`text-center flex-1 px-2 ${
                        currentStep === index ? 'current-step' : ''
                      }`}
                    >
                      <div className={`step-icon mx-auto mb-2 ${
                        currentStep >= index ? 'active' : 'inactive'
                      }`} style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '16px',
                        transition: 'all 0.3s ease',
                        backgroundColor: currentStep >= index ? BRAND_GREEN : SURFACE_LIGHTER,
                        color: currentStep >= index ? '#000' : TEXT_SECONDARY
                      }}>
                        {step.icon}
                      </div>
                      <div className={`text-xs font-medium ${
                        currentStep >= index ? 'text-[#5CC49D]' : 'text-gray-400'
                      }`} style={{ color: currentStep >= index ? BRAND_GREEN : TEXT_SECONDARY }}>
                        {step.title}
                      </div>
                      {currentStep === index && (
                        <div className="h-1 w-6 mx-auto mt-1 rounded-full" style={{ background: BRAND_GREEN }}></div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>

              {/* Research Form */}
              <div className={`grid grid-cols-1 gap-6 ${isSidebarCollapsed ? 'lg:grid-cols-[80px_1fr]' : 'lg:grid-cols-4'}`}>
                {/* Sidebar with Quick Actions */}
                <div className={`${isSidebarCollapsed ? 'lg:col-span-1 w-auto' : 'lg:col-span-1'}`}>
                  <Card 
                    title={
                      <div className="flex items-center justify-between">
                        {!isSidebarCollapsed && <span style={{ color: TEXT_PRIMARY }}>Quick Actions</span>}
                        <Button 
                          icon={isSidebarCollapsed ? <EyeOutlined /> : <EyeOutlined />}
                          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                          type="text"
                          size="small"
                          style={{ color: SPACE_COLOR }}
                        >
                          {!isSidebarCollapsed ? 'Collapse' : 'Expand'}
                        </Button>
                      </div>
                    } 
                    size="small"
                    className={`sticky top-4 ${isSidebarCollapsed ? 'w-[80px]' : ''}`}
                    style={{ background: SURFACE_BG, borderColor: BORDER_COLOR }}
                    bodyStyle={isSidebarCollapsed ? { padding: '12px' } : {}}
                  >
                    {isSidebarCollapsed ? (
                      // Collapsed - Icon only version
                      <Space direction="vertical" className="w-full">
                        <Tooltip title="View History" placement="right">
                          <Button 
                            icon={<HistoryOutlined />}
                            onClick={() => setActiveView('history')}
                            block
                            type="text"
                            size="large"
                            style={{ height: '40px', color: SPACE_COLOR }}
                          />
                        </Tooltip>
                        <Tooltip title="Previous Reports" placement="right">
                          <Button 
                            icon={<EyeOutlined />}
                            onClick={loadPreviousReports}
                            block
                            type="text"
                            size="large"
                            style={{ height: '40px', color: SPACE_COLOR }}
                          />
                        </Tooltip>
                        {currentStep > 0 && currentStep < 5 && (
                          <Tooltip title="Start Over" placement="right">
                            <Button 
                              icon={<FileAddOutlined />}
                              onClick={() => {
                                setCurrentStep(0);
                                form.resetFields();
                                setReportGenerated(false);
                                setMultiNicheReport(null);
                              }}
                              block
                              type="text"
                              size="large"
                              danger
                              style={{ height: '40px' }}
                            />
                          </Tooltip>
                        )}
                      </Space>
                    ) : (
                      // Expanded - Full version
                      <>
                        <Space direction="vertical" className="w-full">
                          <Button 
                            icon={<HistoryOutlined />}
                            onClick={() => setActiveView('history')}
                            block
                            style={{ background: SURFACE_LIGHTER, borderColor: BORDER_COLOR, color: TEXT_PRIMARY }}
                          >
                            View History
                          </Button>
                          <Button 
                            icon={<EyeOutlined />}
                            onClick={loadPreviousReports}
                            block
                            style={{ background: SURFACE_LIGHTER, borderColor: BORDER_COLOR, color: TEXT_PRIMARY }}
                          >
                            Previous Reports
                          </Button>
                          {currentStep > 0 && currentStep < 5 && (
                            <Button 
                              icon={<FileAddOutlined />}
                              onClick={() => {
                                setCurrentStep(0);
                                form.resetFields();
                                setReportGenerated(false);
                                setMultiNicheReport(null);
                              }}
                              block
                              danger
                              style={{ background: SURFACE_LIGHTER, borderColor: BORDER_COLOR }}
                            >
                              Start Over
                            </Button>
                          )}
                        </Space>

                        <Divider className="my-4" style={{ borderColor: BORDER_COLOR }} />
                        <div className="space-y-3">
                          <Text strong style={{ color: TEXT_PRIMARY }}>Your Progress</Text>
                          <div className="space-y-2">
                            {steps.slice(0, 5).map((step, index) => (
                              <div 
                                key={index}
                                className={`flex items-center justify-between p-2 rounded ${
                                  currentStep >= index ? '' : ''
                                }`}
                                style={{ 
                                  background: currentStep >= index ? 'rgba(92, 196, 157, 0.1)' : SURFACE_LIGHTER,
                                  border: `1px solid ${currentStep >= index ? BRAND_GREEN : BORDER_COLOR}`
                                }}
                              >
                                <Text 
                                  type={currentStep >= index ? undefined : 'secondary'}
                                  className="text-sm"
                                  style={{ color: currentStep >= index ? TEXT_PRIMARY : TEXT_SECONDARY }}
                                >
                                  {step.title}
                                </Text>
                                {currentStep > index && (
                                  <Tag color="green" style={{ background: 'transparent', borderColor: BRAND_GREEN, color: BRAND_GREEN }}>
                                    ✓
                                  </Tag>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </Card>
                </div>

                {/* Main Form Content */}
                <div className={isSidebarCollapsed ? 'lg:col-span-1' : 'lg:col-span-3'}>
                  <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    onValuesChange={(changedValues, allValues) => {
                      setFormData(prev => ({ ...prev, ...allValues }));
                    }}
                  >
                    {renderStepContent()}
                    
                    {/* Navigation Buttons */}
                    {currentStep < 5 && (
                      <Card className="mt-6" style={{ background: SURFACE_BG, borderColor: BORDER_COLOR }}>
                        <div className="flex justify-between">
                          {currentStep > 0 && (
                            <Button 
                              onClick={prevStep}
                              icon={<ArrowLeftOutlined />}
                              size="large"
                              style={{ background: SURFACE_LIGHTER, borderColor: BORDER_COLOR, color: TEXT_PRIMARY }}
                            >
                              Back
                            </Button>
                          )}
                          
                          <Button 
                            type="primary" 
                            onClick={currentStep === 4 ? () => form.submit() : nextStep}
                            loading={loading && currentStep === 4}
                            icon={currentStep === 4 ? <FileAddOutlined /> : undefined}
                            size="large"
                            className="ml-auto"
                            style={{
                              backgroundColor: BRAND_GREEN,
                              borderColor: BRAND_GREEN,
                              color: '#000000',
                              fontWeight: '500'
                            }}
                          >
                            {currentStep === 4 
                              ? (loading ? 'Generating Report...' : 'Generate Report') 
                              : 'Continue'
                            }
                          </Button>
                        </div>
                      </Card>
                    )}
                  </Form>
                </div>
              </div>
            </>
          )}

          {/* Previous Reports Modal */}
          <Modal
            title={
              <div className="flex items-center" style={{ color: TEXT_PRIMARY }}>
                <HistoryOutlined className="mr-2" />
                Your Niche Research History
                <Tag color="blue" className="ml-2" style={{ background: 'transparent', borderColor: SPACE_COLOR, color: SPACE_COLOR }}>
                  {previousReports.length} reports
                </Tag>
              </div>
            }
            open={showReportsModal}
            onCancel={() => setShowReportsModal(false)}
            footer={[
              <Button 
                key="close" 
                onClick={() => setShowReportsModal(false)}
                style={{ background: SURFACE_LIGHTER, borderColor: BORDER_COLOR, color: TEXT_PRIMARY }}
              >
                Close
              </Button>,
              <Button 
                key="new" 
                type="primary" 
                onClick={() => {
                  setShowReportsModal(false);
                  setActiveView('research');
                }}
                style={{ background: BRAND_GREEN, borderColor: BRAND_GREEN, color: '#000' }}
              >
                Start New Research
              </Button>
            ]}
            width={1200}
            styles={{
              content: { backgroundColor: SURFACE_BG },
              header: { backgroundColor: SURFACE_BG, borderColor: BORDER_COLOR }
            }}
          >
            <div className="mb-4 flex justify-between items-center">
              <Button 
                icon={<ReloadOutlined />}
                onClick={loadPreviousReports}
                size="small"
                style={{ background: SURFACE_LIGHTER, borderColor: BORDER_COLOR, color: TEXT_PRIMARY }}
              >
                Refresh
              </Button>
              <Text style={{ color: SPACE_COLOR }}>
                Showing {previousReports.length} reports
              </Text>
            </div>
            
            <Table
              dataSource={previousReports}
              columns={reportColumns}
              rowKey="id"
              pagination={{ pageSize: 8 }}
              scroll={{ x: 800 }}
              locale={{
                emptyText: (
                  <div className="py-12 text-center">
                    <FileTextOutlined className="text-4xl mb-3" style={{ color: SPACE_COLOR }} />
                    <Title level={4} style={{ color: TEXT_PRIMARY }}>No reports yet</Title>
                    <Text style={{ color: SPACE_COLOR }} className="block mb-4">
                      Start your first niche research to see reports here
                    </Text>
                    <Button 
                      type="primary" 
                      onClick={() => setShowReportsModal(false)}
                      icon={<SearchOutlined />}
                      style={{ background: BRAND_GREEN, borderColor: BRAND_GREEN, color: '#000' }}
                    >
                      Start Research
                    </Button>
                  </div>
                )
              }}
            />
          </Modal>

          <style jsx>{`
            .sticky {
              position: sticky;
              top: 20px;
            }
            
            @media (max-width: 1024px) {
              .grid-cols-1.lg\\:grid-cols-4 {
                grid-template-columns: 1fr;
              }
            }
          `}</style>

          {/* Custom CSS for hover effects */}
          <style jsx global>{`
            .ant-input:hover, .ant-input:focus {
              border-color: #5CC49D !important;
              box-shadow: 0 0 0 2px rgba(92, 196, 157, 0.1) !important;
            }
            
            .ant-select-selector:hover, .ant-select-focused .ant-select-selector {
              border-color: #5CC49D !important;
              box-shadow: 0 0 0 2px rgba(92, 196, 157, 0.1) !important;
            }
            
            .ant-select-item-option-active:not(.ant-select-item-option-disabled) {
              background-color: rgba(92, 196, 157, 0.1) !important;
            }
            
            .ant-select-item-option-selected:not(.ant-select-item-option-disabled) {
              background-color: rgba(92, 196, 157, 0.2) !important;
              color: #5CC49D !important;
            }
            
            .ant-radio-button-wrapper:hover {
              color: #5CC49D !important;
              border-color: #5CC49D !important;
            }
            
            .ant-radio-button-wrapper-checked:not(.ant-radio-button-wrapper-disabled) {
              color: #000 !important;
              background: #5CC49D !important;
              border-color: #5CC49D !important;
            }
            
            .ant-radio-wrapper:hover .ant-radio-inner {
              border-color: #5CC49D !important;
            }
            
            .ant-radio-checked .ant-radio-inner {
              border-color: #5CC49D !important;
              background-color: #5CC49D !important;
            }
            
            .ant-btn:hover, .ant-btn:focus {
              border-color: #5CC49D !important;
              color: #5CC49D !important;
            }
            
            .ant-btn-primary:hover, .ant-btn-primary:focus {
              background: #4cb08d !important;
              border-color: #4cb08d !important;
              color: #000 !important;
            }
            
            .ant-card-hoverable:hover {
              border-color: #5CC49D !important;
            }
            
            .ant-form-item-label > label {
              color: ${TEXT_SECONDARY} !important;
            }
          `}</style>
        </div>
      </div>
    </ConfigProvider>
  );
};

export default NicheResearcher;