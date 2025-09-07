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

  Avatar
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

} from '@ant-design/icons';
import { useNicheResearcher } from '../hooks/useNicheResearcher';
import { NicheResearchInput, GeneratedNicheReport, MultiNicheReport } from '@/types/nicheResearcher';
import { debounce } from 'lodash';
import {useWorkspaceContext} from '../hooks/useWorkspaceContext'
import LoadingOverlay from './LoadingOverlay';
const { TabPane } = Tabs;

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

  const steps = [
    'Business Goals',
    'Target Customers',
    'Resources & Constraints',
    'Market Direction',
    'Validation Preferences',
    'Generate Report'
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

  // Add this function to render individual niche reports
const renderSingleNicheReport = (niche: GeneratedNicheReport) => {
  return (
    <div className="single-niche-report">
      {/* Niche Overview */}
      <Card title="Niche Overview" className="mb-4" 
            extra={<Tag color="blue">Overview</Tag>}>
        <Row gutter={16}>
          <Col span={12}>
            <div className="niche-header">
              <Title level={4} style={{ color: '#1890ff' }}>
                {niche.nicheOverview?.name}
              </Title>
              <Text>{niche.nicheOverview?.summary}</Text>
            </div>
          </Col>
          <Col span={12}>
            <div className="fit-reason">
              <Title level={5}>Why This Niche Fits</Title>
              <div className="highlight-box">
                <Text>{niche.nicheOverview?.whyItFits}</Text>
              </div>
            </div>
          </Col>
        </Row>
      </Card>
      
      {/* Market Demand */}
      <Card title="Market Demand" className="mb-4" extra={<Tag color="green">Demand</Tag>}>
        <Row gutter={16}>
          <Col span={8}>
            <div className="metric-card">
              <Title level={5}>Market Size</Title>
              <Text className="metric-value">{niche.marketDemand?.marketSize}</Text>
            </div>
          </Col>
          <Col span={8}>
            <div className="metric-card">
              <Title level={5}>Trend</Title>
              <Tag color={niche.marketDemand?.trend === 'growing' ? 'green' : 
                        niche.marketDemand?.trend === 'plateauing' ? 'orange' : 'red'}>
                {niche.marketDemand?.trend?.toUpperCase()}
              </Tag>
            </div>
          </Col>
          <Col span={8}>
            <div className="metric-card">
              <Title level={5}>Willingness to Pay</Title>
              <Text>{niche.marketDemand?.willingnessToPay}</Text>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Entry Offers */}
      <Card title="Suggested Entry Offers" className="mb-4" extra={<Tag color="gold">Offers</Tag>}>
        <Row gutter={16}>
          {niche.entryOffers?.map((offer, index) => (
            <Col span={12} key={index}>
              <Card type="inner" title={offer.positioning}>
                <p><strong>Business Model:</strong> {offer.businessModel}</p>
                <p><strong>Price Point:</strong> {offer.pricePoint}</p>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      {/* Scorecard */}
      <Card title="Opportunity Scorecard" className="mb-4" extra={<Tag color="geekblue">Scores</Tag>}>
        <Row gutter={16}>
          <Col span={6}>
            <div className="scorecard-metric text-center">
              <Title level={5}>Market Demand</Title>
              <Tag color={niche.scorecard?.marketDemand === 'High' ? 'green' : 
                          niche.scorecard?.marketDemand === 'Medium' ? 'orange' : 'red'}>
                {niche.scorecard?.marketDemand}
              </Tag>
            </div>
          </Col>
          <Col span={6}>
            <div className="scorecard-metric text-center">
              <Title level={5}>Competition</Title>
              <Tag color={niche.scorecard?.competition === 'High' ? 'red' : 
                          niche.scorecard?.competition === 'Medium' ? 'orange' : 'green'}>
                {niche.scorecard?.competition}
              </Tag>
            </div>
          </Col>
          <Col span={6}>
            <div className="scorecard-metric text-center">
              <Title level={5}>Ease of Entry</Title>
              <Tag color={niche.scorecard?.easeOfEntry === 'High' ? 'green' : 
                          niche.scorecard?.easeOfEntry === 'Medium' ? 'orange' : 'red'}>
                {niche.scorecard?.easeOfEntry}
              </Tag>
            </div>
          </Col>
          <Col span={6}>
            <div className="scorecard-metric text-center">
              <Title level={5}>Profitability</Title>
              <Tag color={niche.scorecard?.profitability === 'High' ? 'green' : 
                          niche.scorecard?.profitability === 'Medium' ? 'orange' : 'red'}>
                {niche.scorecard?.profitability}
              </Tag>
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  );
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

  // Form submission
  // Form submission
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
    case 2: return ['budget'];
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
          <div className="font-medium">{text}</div>
          <div className="text-sm text-gray-500">
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
        <Tag color="blue">{size}</Tag>
      )
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString()
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
            />
          </Tooltip>
          <Tooltip title="Export Report">
            <Button
              icon={<DownloadOutlined />}
              onClick={() => handleExportReport(record.id, 'html')}
              size="small"
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

  useEffect(() => {
  console.log('🔍 Current step:', currentStep);
  console.log('🔍 Current form data:', formData);
  console.log('🔍 Current form values:', form.getFieldsValue());
}, [currentStep, formData]);


// Render detailed niche report using your existing structure
// Render detailed niche report using your existing structure
const renderDetailedNicheReport = (reportData: GeneratedNicheReport) => {
  return (
    <>
      {currentReportId && (
        <Card className="mb-4">
          <div className="text-center">
            <Space>
              {/* <Button 
                icon={<DownloadOutlined />}
                onClick={() => currentReportId && handleExportReport(currentReportId, 'html')}
                type="primary"
              >
                Download HTML Report
              </Button> */}
              {/* <Button 
                icon={<DownloadOutlined />}
                onClick={() => currentReportId && handleExportReport(currentReportId, 'json')}
              >
                Download JSON Data
              </Button> */}
            </Space>
          </div>
        </Card>
      )}

      {/* Niche Overview */}
      <Card title="1. Niche Overview" className="mb-4 section-card" 
            extra={<Tag color="blue">Overview</Tag>}>
        <Row gutter={16}>
          <Col span={12}>
            <div className="niche-header">
              <Title level={4} style={{ color: '#1890ff' }}>
                {reportData.nicheOverview?.name}
              </Title>
              <Text>{reportData.nicheOverview?.summary}</Text>
            </div>
          </Col>
          <Col span={12}>
            <div className="fit-reason">
              <Title level={5}>Why This Niche Fits Your Inputs</Title>
              <div className="highlight-box">
                <Text>{reportData.nicheOverview?.whyItFits}</Text>
              </div>
            </div>
          </Col>
        </Row>
      </Card>
      
      {/* Market Demand Snapshot */}
      <Card title="2. Market Demand Snapshot" className="mb-4 section-card"
            extra={<Tag color="green">Demand</Tag>}>
        <Row gutter={16}>
          <Col span={8}>
            <div className="metric-card">
              <div className="metric-icon">
                <DollarOutlined style={{ fontSize: '24px', color: '#52c41a' }} />
              </div>
              <Title level={5}>Market Size</Title>
              <Text className="metric-value">{reportData.marketDemand?.marketSize}</Text>
            </div>
          </Col>
   <Col span={8}>
  <div className="metric-card">
    <div className="metric-icon">
      <RiseOutlined style={{ fontSize: '24px', color: '#52c41a' }} />
    </div>
    <Title level={5}>Trend Signal</Title>
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
                <WalletOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
              </div>
              <Title level={5}>Willingness to Pay</Title>
              <Text className="metric-value">{reportData.marketDemand?.willingnessToPay}</Text>
            </div>
          </Col>
        </Row>
      </Card>
      
      {/* Customer Pain Points */}
      <Card title="3. Customer Pain Points" className="mb-4 section-card"
            extra={<Tag color="volcano">Pain Points</Tag>}>
        <Row gutter={16}>
          {reportData.painPoints?.map((point, index) => (
            <Col span={8} key={index}>
              <div className="pain-point-card">
                <div className="intensity-indicator">
                  <div 
                    className={`intensity-level intensity-${point.intensity?.toLowerCase()}`}
                    title={`${point.intensity} intensity`}
                  ></div>
                </div>
                <Text strong>{point.problem}</Text>
                <div className="intensity-tag">
                  <Tag color={
                    point.intensity?.toLowerCase() === 'high' ? 'red' : 
                    point.intensity?.toLowerCase() === 'medium' ? 'orange' : 'blue'
                  }>
                    {point.intensity} intensity
                  </Tag>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </Card>
      
      {/* Competitive Landscape */}
      <Card title="4. Competitive Landscape" className="mb-4 section-card"
            extra={<Tag color="purple">Competition</Tag>}>
        <Title level={4}>Top Competitors</Title>
        <Row gutter={16} className="competitor-cards">
          {reportData.competitiveLandscape?.competitors.map((competitor, index) => (
            <Col span={8} key={index}>
              <Card 
                className="competitor-card" 
                size="small"
                actions={[
                  <span key="position">Market Position: {index + 1}</span>,
                  <span key="strength">Strength: {competitor.strength || 'Unknown'}</span>
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
                  title={competitor.name}
                  description={
                    <Text ellipsis={{ tooltip: competitor.description }}>
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
            <Title level={4}>Gap Analysis</Title>
            <div className="highlight-box">
              <Text>{reportData.competitiveLandscape?.gapAnalysis}</Text>
            </div>
          </Col>
          <Col span={12}>
            <Title level={4}>Barrier to Entry</Title>
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
              />
              <Tag 
                color={
                  reportData.competitiveLandscape?.barrierToEntry === 'High' ? 'red' : 
                  reportData.competitiveLandscape?.barrierToEntry === 'Medium' ? 'orange' : 'green'
                } 
                className="barrier-tag"
              >
                {reportData.competitiveLandscape?.barrierToEntry}
              </Tag>
            </div>
          </Col>
        </Row>
      </Card>
      
      {/* Arbitrage Opportunity */}
      <Card title="5. Arbitrage Opportunity" className="mb-4 section-card"
            extra={<Tag color="cyan">Opportunity</Tag>}>
        <Text>{reportData.arbitrageOpportunity?.explanation}</Text>
        <div className="mt-3 p-3 opportunity-highlight">
          <Title level={5}>Concrete Angle:</Title> 
          <Text>{reportData.arbitrageOpportunity?.concreteAngle}</Text>
        </div>
      </Card>
      
      {/* Suggested Entry Offers */}
      <Card title="6. Suggested Entry Offers" className="mb-4 section-card"
            extra={<Tag color="gold">Offers</Tag>}>
        <Row gutter={16}>
          {reportData.entryOffers?.map((offer, index) => (
            <Col span={12} key={index}>
              <Card 
                className="offer-card" 
                type="inner" 
                title={
                  <span>
                    <StarOutlined /> {offer.positioning}
                  </span>
                }
              >
                <Row gutter={16}>
                  <Col span={12}>
                    <div className="offer-detail">
                      <DollarCircleOutlined className="offer-icon" />
                      <div>
                        <Text strong>Business Model:</Text>
                        <br />
                        <Text>{offer.businessModel}</Text>
                      </div>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div className="offer-detail">
                      <TagOutlined className="offer-icon" />
                      <div>
                        <Text strong>Price Point:</Text>
                        <br />
                        <Text>{offer.pricePoint}</Text>
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
      <Card title="7. Go-To-Market Strategy" className="mb-4 section-card"
            extra={<Tag color="lime">GTM</Tag>}>
        <Row gutter={16}>
          <Col span={12}>
            <div className="strategy-card primary">
              <Title level={5}>Primary Channel</Title>
              <Text className="channel-name">{reportData.gtmStrategy?.primaryChannel}</Text>
            </div>
          </Col>
          <Col span={12}>
            <div className="strategy-card">
              <Title level={5}>Justification</Title>
              <Text>{reportData.gtmStrategy?.justification}</Text>
            </div>
          </Col>
        </Row>
      </Card>
      
      {/* Scalability & Exit Potential */}
      <Card title="8. Scalability & Exit Potential" className="mb-4 section-card"
            extra={<Tag color="magenta">Growth</Tag>}>
        <Row gutter={16}>
          <Col span={12}>
            <div className="scalability-card">
              <Title level={5}>Scalability Score</Title>
              <div className="score-display">
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
                />
                <Tag color={reportData.scalabilityExit?.scalabilityScore === 'High' ? 'green' : 
                          reportData.scalabilityExit?.scalabilityScore === 'Medium' ? 'orange' : 'blue'}
                     className="score-tag">
                  {reportData.scalabilityExit?.scalabilityScore}
                </Tag>
              </div>
            </div>
          </Col>
          <Col span={12}>
            <div className="exit-card">
              <Title level={5}>Exit Potential</Title>
              <div className="highlight-box">
                <Text>{reportData.scalabilityExit?.exitPotential}</Text>
              </div>
            </div>
          </Col>
        </Row>
      </Card>
      
      {/* Risk Factors & Constraints */}
      <Card title="9. Risk Factors & Constraints" className="mb-4 section-card"
            extra={<Tag color="red">Risks</Tag>}>
        <Row gutter={16}>
          {reportData.riskFactors?.map((risk, index) => (
            <Col span={8} key={index}>
              <div className="risk-card">
                <WarningOutlined className="risk-icon" />
                <Text strong>{risk.risk}</Text>
                <div className="risk-impact">
                  <Tag color={
                    risk.impact?.toLowerCase().includes('high') ? 'red' : 
                    risk.impact?.toLowerCase().includes('medium') ? 'orange' : 'blue'
                  }>
                    Impact: {risk.impact}
                  </Tag>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </Card>
      
      {/* Difficulty vs Reward Scorecard */}
      <Card title="10. Difficulty vs Reward Scorecard" className="mb-4 section-card"
            extra={<Tag color="geekblue">Scorecard</Tag>}>
        <Row gutter={16}>
          <Col span={6}>
            <div className="scorecard-metric">
              <Title level={5}>Market Demand</Title>
              <div className="score-indicator">
                <Progress 
                  percent={
                    reportData.scorecard?.marketDemand === 'High' ? 90 : 
                    reportData.scorecard?.marketDemand === 'Medium' ? 60 : 30
                  } 
                  showInfo={false}
                  status="active"
                  strokeColor={
                    reportData.scorecard?.marketDemand === 'High' ? '#52c41a' : 
                    reportData.scorecard?.marketDemand === 'Medium' ? '#faad14' : '#f5222d'
                  }
                />
                <Tag color={reportData.scorecard?.marketDemand === 'High' ? 'green' : 
                          reportData.scorecard?.marketDemand === 'Medium' ? 'orange' : 'red'}
                     className="scorecard-tag">
                  {reportData.scorecard?.marketDemand}
                </Tag>
              </div>
            </div>
          </Col>
          <Col span={6}>
            <div className="scorecard-metric">
              <Title level={5}>Competition Intensity</Title>
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
                    reportData.scorecard?.competition === 'Medium' ? '#faad14' : '#52c41a'
                  }
                />
                <Tag color={reportData.scorecard?.competition === 'High' ? 'red' : 
                          reportData.scorecard?.competition === 'Medium' ? 'orange' : 'green'}
                     className="scorecard-tag">
                  {reportData.scorecard?.competition}
                </Tag>
              </div>
            </div>
          </Col>
          <Col span={6}>
            <div className="scorecard-metric">
              <Title level={5}>Ease of Entry</Title>
              <div className="score-indicator">
                <Progress 
                  percent={
                    reportData.scorecard?.easeOfEntry === 'High' ? 90 : 
                    reportData.scorecard?.easeOfEntry === 'Medium' ? 60 : 30
                  } 
                  showInfo={false}
                  status="active"
                  strokeColor={
                    reportData.scorecard?.easeOfEntry === 'High' ? '#52c41a' : 
                    reportData.scorecard?.easeOfEntry === 'Medium' ? '#faad14' : '#f5222d'
                  }
                />
                <Tag color={reportData.scorecard?.easeOfEntry === 'High' ? 'green' : 
                          reportData.scorecard?.easeOfEntry === 'Medium' ? 'orange' : 'red'}
                     className="scorecard-tag">
                  {reportData.scorecard?.easeOfEntry}
                </Tag>
              </div>
            </div>
          </Col>
          <Col span={6}>
            <div className="scorecard-metric">
              <Title level={5}>Profitability Potential</Title>
              <div className="score-indicator">
                <Progress 
                  percent={
                    reportData.scorecard?.profitability === 'High' ? 90 : 
                    reportData.scorecard?.profitability === 'Medium' ? 60 : 30
                  } 
                  showInfo={false}
                  status="active"
                  strokeColor={
                    reportData.scorecard?.profitability === 'High' ? '#52c41a' : 
                    reportData.scorecard?.profitability === 'Medium' ? '#faad14' : '#f5222d'
                  }
                />
                <Tag color={reportData.scorecard?.profitability === 'High' ? 'green' : 
                          reportData.scorecard?.profitability === 'Medium' ? 'orange' : 'red'}
                     className="scorecard-tag">
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
            
            <Card className="mb-6">
              <Title level={4} className="flex items-center">
                <RocketOutlined className="mr-2" />
                Business & Strategic Goals
              </Title>
              
              <Form.Item
                name="primaryObjective"
                label="Primary Business Objective"
                rules={[{ required: true, message: 'Please select your primary objective' }]}
              >
                <Select placeholder="Select your main goal">
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
                label="Risk Appetite"
                rules={[{ required: true, message: 'Please select your risk appetite' }]}
              >
                <Select placeholder="Select your risk tolerance">
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
            <Card className="mb-6">
              <Title level={4} className="flex items-center">
                <CustomerServiceOutlined className="mr-2" />
                Target Customer Preferences
              </Title>
              
              <Form.Item
                name="marketType"
                label="Preferred Market Type"
                rules={[{ required: true, message: 'Please select your market type' }]}
              >
                <Select placeholder="Select market type">
                  <Option value="b2b-saas">B2B SaaS</Option>
                  <Option value="b2c-consumer">B2C Consumer Products</Option>
                  <Option value="professional-services">Professional Services</Option>
                  <Option value="local-business">Local Business</Option>
                  <Option value="info-education">Information/Education</Option>
                </Select>
              </Form.Item>
              
              <Form.Item
                name="customerSize"
                label="Customer Size Preference"
                rules={[{ required: true, message: 'Please select your customer size preference' }]}
              >
                <Select placeholder="Select customer size">
                  <Option value="startups">Startups</Option>
                  <Option value="smb">SMBs (Small & Medium Businesses)</Option>
                  <Option value="enterprise">Enterprise</Option>
                  <Option value="consumers">Consumers</Option>
                  <Option value="government">Government/Public Sector</Option>
                </Select>
              </Form.Item>
              
              <Form.Item
                name="industries"
                label="Industry Spaces of Interest (Optional)"
              >
                <Select
                  mode="multiple"
                  placeholder="Select industries of interest"
                  options={industryOptions.map(industry => ({ value: industry, label: industry }))}
                />
              </Form.Item>
<Form.Item
  name="geographicFocus"
  label="Geographic Focus (Optional)"
>
  <Select 
    placeholder="Select geographic focus"
    onChange={(value) => {
      // Clear the target area when geographic focus changes
      if (value !== 'local' && value !== 'regional') {
        form.setFieldValue('targetArea', undefined);
      }
    }}
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
          label={geographicFocus === 'local' ? "Target City/Area" : "Target Region"}
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
            <Card className="mb-6">
              <Title level={4} className="flex items-center">
                <SolutionOutlined className="mr-2" />
                Constraints & Resources
              </Title>
              
              <Form.Item
                name="budget"
                label="Budget Available"
                rules={[{ required: true, message: 'Please select your budget range' }]}
              >
                <Select placeholder="Select budget">
                  <Option value="<10k">Less than $10k</Option>
                  <Option value="10k-50k">$10k - $50k</Option>
                  <Option value="50k-250k">$50k - $250k</Option>
                  <Option value="250k+">$250k+</Option>
                </Select>
              </Form.Item>
              
              <Form.Item
                name="teamSize"
                label="Team Size / Capabilities (Optional)"
              >
                <Select placeholder="Select team size">
                  <Option value="solo">Solo Founder (1)</Option>
                  <Option value="small-team">Small Team (2-10)</Option>
                  <Option value="established-team">Established Team (10+ )</Option>
                </Select>
              </Form.Item>
              
              <Form.Item
                name="skills"
                label="What Your Team Can Do (Select all that apply)"
              >
                <Select
                  mode="multiple"
                  placeholder="Select skills available"
                  options={skillOptions.map(skill => ({ value: skill, label: skill }))}
                />
              </Form.Item>
              
              <Form.Item
                name="timeCommitment"
                label="Hours per Week You’ll Invest (Optional)"
              >
                <Select placeholder="Select time commitment">
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
            <Card className="mb-6">
              <Title level={4} className="flex items-center">
                <BulbOutlined className="mr-2" />
                Market Directional Inputs
              </Title>
              
              <Form.Item
                name="problems"
                label="Problems You're Passionate About Solving (Optional)"
              >
                <TextArea 
                  rows={3} 
                  placeholder="e.g. Small business inefficiencies, healthcare access issues, educational gaps..."
                  maxLength={500}
                />
              </Form.Item>
              
              <Form.Item
                name="excludedIndustries"
                label="Industries You Will NOT Touch (Optional)"
              >
                <Select
                  mode="multiple"
                  placeholder="Select industries to exclude"
                  options={industryOptions.map(industry => ({ value: industry, label: industry }))}
                />
              </Form.Item>
              
              <Form.Item
                name="monetizationPreference"
                label="Monetization Preference (Optional)"
              >
                <Select placeholder="Select monetization preference">
                  <Option value="high-ticket">High-Ticket Services/Products</Option>
                  <Option value="subscription">Subscription/Recurring Revenue</Option>
                  <Option value="low-ticket">Low-Ticket/Volume Business</Option>
                  <Option value="ad-supported">Ad-Supported/Free Model</Option>
                </Select>
              </Form.Item>
              
              <Form.Item
                name="acquisitionChannels"
                label="Acquisition Channels You Prefer (Optional)"
              >
                <Select
                  mode="multiple"
                  placeholder="Select preferred acquisition channels"
                  options={acquisitionChannelOptions.map(channel => ({ value: channel, label: channel }))}
                />
              </Form.Item>
            </Card>
          </>
        );
      case 4:
        return (
          <>
            <Card className="mb-6">
              <Title level={4} className="flex items-center">
                <BarChartOutlined className="mr-2" />
                Validation & Scalability Factors
              </Title>
              
              <Form.Item
                name="validationData"
                label="How important is validation data? (Optional)"
              >
                <Checkbox.Group options={validationDataOptions.map(option => ({ label: option, value: option }))} />
              </Form.Item>
              
              <Form.Item
                name="competitionPreference"
                label="Do you prefer low-competition or high-potential markets? (Optional)"
              >
                <Radio.Group>
                  <Radio value="low-competition">Low-Competition / Easy Entry</Radio>
                  <Radio value="high-potential">High-Potential / Competitive Markets</Radio>
                </Radio.Group>
              </Form.Item>
              
              <Form.Item
                name="scalabilityPreference"
                label="Scalability Preference (Optional)"
              >
                <Select placeholder="Select scalability preference">
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
          <Card className="mb-6 recommendation-banner">
            <div className="text-center">
              <Title level={2}>Your Top 3 Niche Opportunities</Title>
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
          <Card className="mb-4">
            <div className="mb-4">
              <Title level={4}>Explore your Niche Reports</Title>
              <Space wrap>
                {multiNicheReport.niches.map((niche, index) => (
                  <Button
                    key={index}
                    type={selectedNicheTab === index ? "primary" : "default"}
                    onClick={() => setSelectedNicheTab(index)}
                    icon={index === multiNicheReport.recommendedNiche ? <StarOutlined /> : undefined}
                    size="large"
                  >
                    {niche.nicheOverview.name}
                    {index === multiNicheReport.recommendedNiche && (
                      <Tag color="gold" className="ml-2">Recommended</Tag>
                    )}
                  </Button>
                ))}
              </Space>
            </div>
          </Card>

          {/* DETAILED NICHE REPORT - Use your existing structure */}
          {renderDetailedNicheReport(multiNicheReport.niches[selectedNicheTab])}

          {/* Comparison Matrix */}
          <Card title="Compare All 3 Niches" className="mb-4">
            <div className="comparison-table">
              <table className="w-full border-collapse">
                <thead>
                  <tr >
                    <th className="border p-3 text-left">Criteria</th>
                    {multiNicheReport.niches.map((niche, index) => (
                      <th key={index} className="border p-3 text-center">
                        {niche.nicheOverview.name}
                        {index === multiNicheReport.recommendedNiche && <Tag color="gold" className="ml-1">★</Tag>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {multiNicheReport.comparisonMatrix.criteria.map((criterion, criterionIndex) => (
                    <tr key={criterionIndex}>
                      <td className="border p-3 font-medium">{criterion}</td>
                      {multiNicheReport.comparisonMatrix.scores.map((score, scoreIndex) => (
                        <td key={scoreIndex} className="border p-3 text-center">
                          <Progress 
                            type="circle" 
                            percent={Object.values(score.scores)[criterionIndex] || 0}
                            width={50}
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
              >
                Generate New Report
              </Button>
              <Button 
                size="large"
                onClick={loadPreviousReports}
                icon={<EyeOutlined />}
              >
                View Previous Reports
              </Button>
            </Space>
          </div>
        </>
      ) : (
        <div className="text-center py-10">
          <Title level={4}>Ready to Generate Your Multi-Niche Report</Title>
          <Text type="secondary">Review your information and click below to analyze</Text>
          <div className="mt-6">
            <Space>
              <Button 
                type="primary" 
                size="large" 
                loading={loading}
                onClick={() => form.submit()}
              >
                {loading ? 'Generating Report...' : 'Generate 3 Niche Opportunities'}
              </Button>
              <Button 
                size="large"
                onClick={loadPreviousReports}
                icon={<EyeOutlined />}
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
    <div className="max-w-5xl mx-auto px-4 py-8">
        <LoadingOverlay visible={isLoading} />
            <Button 
  icon={<ArrowLeftOutlined />} 
  onClick={handleBack}
// negative margin top
>
  Back
</Button>
      <div className="text-center mb-8">
        <Title level={2} className="flex items-center justify-center">
          <UserOutlined className="mr-2" />
          
              <span style={{ color: '#5CC49D' }}>a</span>rb
  <span style={{ color: '#5CC49D' }}>i</span>trageOS Niche Research Report
        </Title>

           {/* Add History Tab Here */}
         <div className="mb-8">
           <Tabs defaultActiveKey="history" type="card">
             <TabPane tab="Generated Niche History" key="history">
               <SavedNicheHistory />
             </TabPane>
           </Tabs>
         </div>
        <Text type="secondary" className="text-lg">
          Discover your perfect business niche based on your goals, resources, and market opportunities
        </Text>
      </div>
      
      <div className="mb-8">
        <Progress 
          percent={(currentStep / (steps.length - 1)) * 100} 
          showInfo={false} 
          strokeColor="#1890ff"
        />
        <div className="flex justify-between mt-2">
          {steps.map((step, index) => (
            <div 
              key={index} 
              className={`text-sm ${currentStep >= index ? 'font-medium text-blue-600' : 'text-gray-400'}`}
            >
              {step}
            </div>
          ))}
        </div>
      </div>
      
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        onValuesChange={(changedValues, allValues) => {
          setFormData(prev => ({ ...prev, ...allValues }));
        }}
        className="dark:bg-white-900 rounded-lg"
      >
        {renderStepContent()}
           
        <div className="flex justify-between mt-8 pb-8 px-4">
          {currentStep > 0 && currentStep < 5 && (
            <Button onClick={prevStep}>
              Back
            </Button>
          )}
          
          {currentStep < 4 && (
            <Button 
              type="primary" 
              onClick={nextStep}
              className="ml-auto"
            >
              Continue
            </Button>
          )}
          
          {currentStep === 4 && !reportGenerated && (
            <Button 
              type="primary" 
              loading={loading}
              onClick={() => form.submit()}
              className="ml-auto"
            >
              {loading ? 'Generating Report...' : 'Generate Report'}
            </Button>
          )}
        </div>
      </Form>

      {/* Previous Reports Modal */}
      <Modal
        title="Previous Niche Research Reports"
        open={showReportsModal}
        onCancel={() => setShowReportsModal(false)}
        footer={null}
        width={1000}
      >
        <div className="mb-4">
          <Button 
            icon={<ReloadOutlined />}
            onClick={loadPreviousReports}
            size="small"
          >
            Refresh
          </Button>
        </div>
        
        <Table
          dataSource={previousReports}
          columns={reportColumns}
          rowKey="id"
          pagination={{ pageSize: 5 }}
          locale={{
            emptyText: (
              <div className="py-8 text-center">
                <FileTextOutlined className="text-3xl mb-2 text-gray-400" />
                <Text type="secondary">No previous reports found</Text>
                <div className="mt-2">
                  <Button 
                    type="primary" 
                    onClick={() => setShowReportsModal(false)}
                    disabled={isLoading}
                  >
                    Create Your First Report
                  </Button>
                </div>
              </div>
            )
          }}
        />
      </Modal>
    </div>
  );
};

export default NicheResearcher;