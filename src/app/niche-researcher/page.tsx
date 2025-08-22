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
  Col
} from 'antd';
import { 
  UserOutlined, 
  SolutionOutlined, 
  StarOutlined, 
  HeartOutlined, 
  TeamOutlined, 
  BulbOutlined, 
  ClockCircleOutlined, 
  DollarOutlined, 
  EnvironmentOutlined,
  FileTextOutlined,
  DownloadOutlined,
  EyeOutlined,
  DeleteOutlined,
  ReloadOutlined,
  RocketOutlined,
  BarChartOutlined,
  CustomerServiceOutlined,
  ShopOutlined,
  GlobalOutlined,
  SafetyOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import { useNicheResearcher } from '../hooks/useNicheResearcher';
import { NicheResearchInput, GeneratedNicheReport } from '@/types/nicheResearcher';
import { debounce } from 'lodash';
import LoadingOverlay from './LoadingOverlay';

interface FormValues {
  // Business & Strategic Goals
  primaryObjective: 'cashflow' | 'equity-exit' | 'lifestyle' | 'audience-build' | 'saas' | 'agency' | 'ecomm';
  riskAppetite: 'low' | 'medium' | 'high';
  
  // Target Customer Preferences
  marketType: 'b2b-saas' | 'b2c-consumer' | 'professional-services' | 'local-business' | 'info-education';
  customerSize: 'startups' | 'smb' | 'enterprise' | 'consumers' | 'government';
  industries?: string[];
  geographicFocus?: 'local' | 'regional' | 'us-only' | 'global';
  
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

  // Form submission
  // Form submission
const onFinish = async (values: FormValues) => {
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
      })
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

    const result = await generateNicheReport(requestData);
    
    setReportData(result.report);
    setCurrentReportId(result.reportId);
    setReportGenerated(true);
    setCurrentStep(5);
    
    notification.success({
      message: 'Niche Research Report Generated!',
      description: `Found your perfect niche opportunities`,
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
                <Select placeholder="Select geographic focus">
                  <Option value="local">Local</Option>
                  <Option value="regional">Regional</Option>
                  <Option value="us-only">US-only</Option>
                  <Option value="global">Global</Option>
                </Select>
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
                  <Option value="solo">Solo Founder</Option>
                  <Option value="small-team">Small Team (2-5 people)</Option>
                  <Option value="established-team">Established Team (5+ people)</Option>
                </Select>
              </Form.Item>
              
              <Form.Item
                name="skills"
                label="Key Skills Available (Select all that apply)"
              >
                <Select
                  mode="multiple"
                  placeholder="Select skills available"
                  options={skillOptions.map(skill => ({ value: skill, label: skill }))}
                />
              </Form.Item>
              
              <Form.Item
                name="timeCommitment"
                label="Time Commitment (Optional)"
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
            {reportGenerated && reportData ? (
              <>
                <Card className="mb-6">
                  <div className="text-center mb-6">
                    <Title level={3}>Your Niche Research Report</Title>
                    <Text type="secondary">Generated based on your inputs</Text>
                    {currentReportId && (
                      <div className="mt-4">
                        <Space>
                          <Button 
                            icon={<DownloadOutlined />}
                            onClick={() => currentReportId && handleExportReport(currentReportId, 'html')}
                          >
                            Download HTML Report
                          </Button>
                          <Button 
                            icon={<DownloadOutlined />}
                            onClick={() => currentReportId && handleExportReport(currentReportId, 'json')}
                          >
                            Download JSON Data
                          </Button>
                        </Space>
                      </div>
                    )}
                  </div>
                  
                  {/* Niche Overview */}
                  <Card title="1. Niche Overview" className="mb-4">
                    <Row gutter={16}>
                      <Col span={12}>
                        <Title level={5}>{reportData.nicheOverview?.name}</Title>
                        <Text>{reportData.nicheOverview?.summary}</Text>
                      </Col>
                      <Col span={12}>
                        <Title level={5}>Why This Niche Fits Your Inputs</Title>
                        <Text>{reportData.nicheOverview?.whyItFits}</Text>
                      </Col>
                    </Row>
                  </Card>
                  
                  {/* Market Demand Snapshot */}
                  <Card title="2. Market Demand Snapshot" className="mb-4">
                    <Row gutter={16}>
                      <Col span={8}>
                        <Title level={5}>Market Size</Title>
                        <Text>{reportData.marketDemand?.marketSize}</Text>
                      </Col>
                      <Col span={8}>
                        <Title level={5}>Trend Signal</Title>
                        <Tag color={reportData.marketDemand?.trend === 'growing' ? 'green' : 
                                  reportData.marketDemand?.trend === 'plateauing' ? 'orange' : 'red'}>
                          {reportData.marketDemand?.trend}
                        </Tag>
                      </Col>
                      <Col span={8}>
                        <Title level={5}>Willingness to Pay</Title>
                        <Text>{reportData.marketDemand?.willingnessToPay}</Text>
                      </Col>
                    </Row>
                  </Card>
                  
                  {/* Customer Pain Points */}
                  <Card title="3. Customer Pain Points" className="mb-4">
                    <ol>
                      {reportData.painPoints?.map((point, index) => (
                        <li key={index} className="mb-2">
                          <Text strong>{point.problem}</Text> - {point.intensity} intensity
                        </li>
                      ))}
                    </ol>
                  </Card>
                  
                  {/* Competitive Landscape */}
                  <Card title="4. Competitive Landscape" className="mb-4">
                    <Title level={5}>Top Competitors</Title>
                    <ul>
                      {reportData.competitiveLandscape?.competitors.map((competitor, index) => (
                        <li key={index} className="mb-2">
                          <Text strong>{competitor.name}</Text>: {competitor.description}
                        </li>
                      ))}
                    </ul>
                    
                    <Title level={5} className="mt-4">Gap Analysis</Title>
                    <Text>{reportData.competitiveLandscape?.gapAnalysis}</Text>
                    
                    <Title level={5} className="mt-4">Barrier to Entry</Title>
                    <Tag color={reportData.competitiveLandscape?.barrierToEntry === 'Low' ? 'green' : 
                              reportData.competitiveLandscape?.barrierToEntry === 'Medium' ? 'orange' : 'red'}>
                      {reportData.competitiveLandscape?.barrierToEntry}
                    </Tag>
                  </Card>
                  
                  {/* Arbitrage Opportunity */}
                  <Card title="5. Arbitrage Opportunity" className="mb-4">
                    <Text>{reportData.arbitrageOpportunity?.explanation}</Text>
                    <div className="mt-2 p-3 bg-blue-50 rounded">
                      <Text strong>Concrete Angle:</Text> {reportData.arbitrageOpportunity?.concreteAngle}
                    </div>
                  </Card>
                  
                  {/* Suggested Entry Offers */}
                  <Card title="6. Suggested Entry Offers" className="mb-4">
                    {reportData.entryOffers?.map((offer, index) => (
                      <Card key={index} type="inner" title={offer.positioning} className="mb-2">
                        <Row gutter={16}>
                          <Col span={8}>
                            <Text strong>Business Model:</Text> {offer.businessModel}
                          </Col>
                          <Col span={8}>
                            <Text strong>Price Point:</Text> {offer.pricePoint}
                          </Col>
                        </Row>
                      </Card>
                    ))}
                  </Card>
                  
                  {/* Go-To-Market Strategy */}
                  <Card title="7. Go-To-Market Strategy" className="mb-4">
                    <Row gutter={16}>
                      <Col span={12}>
                        <Title level={5}>Primary Channel</Title>
                        <Text>{reportData.gtmStrategy?.primaryChannel}</Text>
                      </Col>
                      <Col span={12}>
                        <Title level={5}>Justification</Title>
                        <Text>{reportData.gtmStrategy?.justification}</Text>
                      </Col>
                    </Row>
                  </Card>
                  
                  {/* Scalability & Exit Potential */}
                  <Card title="8. Scalability & Exit Potential" className="mb-4">
                    <Row gutter={16}>
                      <Col span={12}>
                        <Title level={5}>Scalability Score</Title>
                        <Tag color={reportData.scalabilityExit?.scalabilityScore === 'High' ? 'green' : 
                                  reportData.scalabilityExit?.scalabilityScore === 'Medium' ? 'orange' : 'blue'}>
                          {reportData.scalabilityExit?.scalabilityScore}
                        </Tag>
                      </Col>
                      <Col span={12}>
                        <Title level={5}>Exit Potential</Title>
                        <Text>{reportData.scalabilityExit?.exitPotential}</Text>
                      </Col>
                    </Row>
                  </Card>
                  
                  {/* Risk Factors & Constraints */}
                  <Card title="9. Risk Factors & Constraints" className="mb-4">
                    <ul>
                      {reportData.riskFactors?.map((risk, index) => (
                        <li key={index} className="mb-2">
                          <Text strong>{risk.risk}</Text> - {risk.impact}
                        </li>
                      ))}
                    </ul>
                  </Card>
                  
                  {/* Difficulty vs Reward Scorecard */}
                  <Card title="10. Difficulty vs Reward Scorecard">
                    <Row gutter={16}>
                      <Col span={6}>
                        <Title level={5}>Market Demand</Title>
                        <Tag color={reportData.scorecard?.marketDemand === 'High' ? 'green' : 
                                  reportData.scorecard?.marketDemand === 'Medium' ? 'orange' : 'red'}>
                          {reportData.scorecard?.marketDemand}
                        </Tag>
                      </Col>
                      <Col span={6}>
                        <Title level={5}>Competition Intensity</Title>
                        <Tag color={reportData.scorecard?.competition === 'High' ? 'red' : 
                                  reportData.scorecard?.competition === 'Medium' ? 'orange' : 'green'}>
                          {reportData.scorecard?.competition}
                        </Tag>
                      </Col>
                      <Col span={6}>
                        <Title level={5}>Ease of Entry</Title>
                        <Tag color={reportData.scorecard?.easeOfEntry === 'High' ? 'green' : 
                                  reportData.scorecard?.easeOfEntry === 'Medium' ? 'orange' : 'red'}>
                          {reportData.scorecard?.easeOfEntry}
                        </Tag>
                      </Col>
                      <Col span={6}>
                        <Title level={5}>Profitability Potential</Title>
                        <Tag color={reportData.scorecard?.profitability === 'High' ? 'green' : 
                                  reportData.scorecard?.profitability === 'Medium' ? 'orange' : 'red'}>
                          {reportData.scorecard?.profitability}
                        </Tag>
                      </Col>
                    </Row>
                  </Card>
                </Card>
                
                <div className="text-center">
                  <Space>
                    <Button 
                      type="primary" 
                      size="large"
                      onClick={() => {
                        setCurrentStep(0);
                        setReportGenerated(false);
                        setReportData(null);
                        setCurrentReportId(null);
                        form.resetFields();
                      }}
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
                <Title level={4}>Ready to Generate Your Niche Report</Title>
                <Text type="secondary">Review your information and click below to analyze</Text>
                <div className="mt-6">
                  <Space>
                    <Button 
                      type="primary" 
                      size="large" 
                      loading={loading}
                      onClick={() => form.submit()}
                    >
                      {loading ? 'Generating Report...' : 'Generate Niche Research Report'}
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
      <div className="text-center mb-8">
        <Title level={2} className="flex items-center justify-center">
          <UserOutlined className="mr-2" />
          Niche Research Report
        </Title>
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