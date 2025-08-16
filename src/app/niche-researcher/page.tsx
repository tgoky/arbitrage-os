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
  message
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
  ReloadOutlined
} from '@ant-design/icons';
import { useNicheResearcher } from '../hooks/useNicheResearcher';
import { NicheResearchInput, GeneratedNicheReport } from '@/types/nicheResearcher';

interface FormValues {
  roles: string;
  skills: string[];
  competencies: string;
  interests: string;
  connections: string;
  audienceAccess?: string;
  problems: string;
  trends: string;
  time: '5-10' | '10-20' | '20-30' | '30+';
  budget: '0-1k' | '1k-5k' | '5k-10k' | '10k+';
  location: 'remote-only' | 'local-focused' | 'hybrid';
  otherConstraints?: string;
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
  const [skillsSuggestions, setSkillsSuggestions] = useState<any>(null);

  const {
    generateNicheReport,
    getNicheReport,
    getUserReports,
    deleteNicheReport,
    exportNicheReport,
    getSkillsSuggestions,
    loading,
    error,
    setError
  } = useNicheResearcher();

  const steps = [
    'Professional Background',
    'Personal Interests & Network',
    'Market Insights & Constraints',
    'Generate Report'
  ];

   // 5. Safe array rendering with proper null checks
  const renderReasons = (reasons?: string[]) => {
    if (!reasons || !Array.isArray(reasons) || reasons.length === 0) {
      return <li className="text-sm text-gray-500">No reasons available</li>;
    }

    return reasons.map((reason: string, i: number) => (
      <li key={i} className="text-sm">
        {typeof reason === 'string' ? reason : 'Invalid reason'}
      </li>
    ));
  };

  const renderTargetCustomers = (customers?: string[]) => {
    if (!customers || !Array.isArray(customers) || customers.length === 0) {
      return <Tag>No customers defined</Tag>;
    }

    return customers.slice(0, 3).map((customer: string, i: number) => (
      <Tag key={i}>
        {typeof customer === 'string' ? customer : 'Invalid customer'}
      </Tag>
    ));
  };

  const renderNextSteps = (steps?: string[]) => {
    if (!steps || !Array.isArray(steps) || steps.length === 0) {
      return <li className="text-sm text-gray-500">No steps available</li>;
    }

    return steps.slice(0, 3).map((step: string, i: number) => (
      <li key={i} className="text-sm">
        {typeof step === 'string' ? step : 'Invalid step'}
      </li>
    ));
  };
  
  // Load skills suggestions on component mount
  useEffect(() => {
    loadSkillsSuggestions();
  }, []);

   const loadSkillsSuggestions = useCallback(async () => {
    try {
      const suggestions = await getSkillsSuggestions();
      setSkillsSuggestions(suggestions);
    } catch (error) {
      console.error('Failed to load skills suggestions:', error);
      // Optional: Show user-friendly error
      message.error('Failed to load skills suggestions');
    }
  }, [getSkillsSuggestions]);

  // Fixed useEffect with proper dependencies
  useEffect(() => {
    loadSkillsSuggestions();
  }, [loadSkillsSuggestions]);

  const loadPreviousReports = async () => {
    try {
      const reports = await getUserReports();
      setPreviousReports(reports);
      setShowReportsModal(true);
    } catch (error) {
      console.error('Failed to load previous reports:', error);
    }
  };

  const handleViewReport = async (reportId: string) => {
    try {
      const report = await getNicheReport(reportId);
      setReportData(report.report);
      setCurrentReportId(reportId);
      setReportGenerated(true);
      setCurrentStep(3);
      setShowReportsModal(false);
    } catch (error) {
      console.error('Failed to load report:', error);
    }
  };

    const [deletingReportId, setDeletingReportId] = useState<string | null>(null);

    

  const handleDeleteReport = useCallback(async (reportId: string) => {
    setDeletingReportId(reportId);
    try {
      await deleteNicheReport(reportId);
      
      // Optimistically update UI first
      setPreviousReports(prev => prev.filter(report => report.id !== reportId));
      
      // Then refresh from server to ensure consistency
      try {
        const reports = await getUserReports();
        setPreviousReports(reports);
      } catch (refreshError) {
        // If refresh fails, log but don't revert optimistic update
        console.error('Failed to refresh reports after delete:', refreshError);
      }
    } catch (error) {
      console.error('Failed to delete report:', error);
      message.error('Failed to delete report');
    } finally {
      setDeletingReportId(null);
    }
  }, [deleteNicheReport, getUserReports]);


  const handleExportReport = async (reportId: string, format: 'html' | 'json' = 'html') => {
    try {
      await exportNicheReport(reportId, format);
    } catch (error) {
      console.error('Failed to export report:', error);
    }
  };

   // Updated onFinish function with proper typing
  const onFinish = async (values: FormValues) => {
    try {
      // ✅ Now you get TypeScript autocomplete and type checking
      const requestData = values; // Backend handles userId
      
      const result = await generateNicheReport(requestData);
      
      setReportData(result.report);
      setCurrentReportId(result.reportId);
      setReportGenerated(true);
      setCurrentStep(3);
      
      notification.success({
        message: 'Niche Research Report Generated!',
        description: `Found ${result.report.recommendedNiches.length} personalized niche opportunities`,
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

  const nextStep = () => {
    form.validateFields().then(() => {
      setCurrentStep(currentStep + 1);
    }).catch(() => {
      notification.error({
        message: 'Validation Error',
        description: 'Please fill in all required fields before continuing',
      });
    });
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const reportColumns = [
    {
      title: 'Report',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: any) => (
        <div>
          <div className="font-medium">{text}</div>
          <div className="text-sm text-gray-500">
            Skills: {record.skills.slice(0, 3).join(', ')}
            {record.skills.length > 3 && ` +${record.skills.length - 3} more`}
          </div>
        </div>
      )
    },
    {
      title: 'Top Niches',
      dataIndex: 'topNiches',
      key: 'topNiches',
      render: (niches: any[]) => (
        <div className="space-y-1">
          {niches.slice(0, 2).map((niche, i) => (
            <div key={i} className="flex items-center">
              <Tag color="blue">{niche.matchScore}%</Tag>
              <span className="text-sm">{niche.name}</span>
            </div>
          ))}
        </div>
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
                <SolutionOutlined className="mr-2" />
                Professional Experience
              </Title>
              <Form.Item
                name="roles"
                label="Describe your past roles and industries"
                rules={[{ required: true, message: 'Please describe your professional background' }]}
              >
                <TextArea 
                  rows={4} 
                  placeholder="e.g. 5 years in HR tech, operations manager at SaaS company, led team of 12 in digital transformation projects..."
                  showCount
                  maxLength={1000}
                />
              </Form.Item>
              
              <Form.Item
                name="skills"
                label="List your strongest skills (select up to 10)"
                rules={[{ required: true, message: 'Please select your skills' }]}
              >
                <Select
                  mode="multiple"
                  placeholder="Search and select skills"
                  showSearch
                  maxTagCount={10}
                  options={skillsSuggestions?.all ? 
                    Object.values(skillsSuggestions.all).flat().map((skill: any) => ({
                      value: skill,
                      label: skill
                    })) : [
                      { value: 'project-management', label: 'Project Management' },
                      { value: 'sales', label: 'Sales' },
                      { value: 'marketing', label: 'Marketing' },
                      { value: 'data-analysis', label: 'Data Analysis' },
                      { value: 'product-development', label: 'Product Development' },
                      { value: 'consulting', label: 'Consulting' },
                      { value: 'software-development', label: 'Software Development' },
                      { value: 'business-strategy', label: 'Business Strategy' }
                    ]
                  }
                />
              </Form.Item>
            </Card>
            
            <Card>
              <Title level={4} className="flex items-center">
                <StarOutlined className="mr-2" />
                Core Competencies
              </Title>
              <Form.Item
                name="competencies"
                label="What unique value can you offer that others can't?"
                rules={[{ required: true, message: 'Please describe your unique competencies' }]}
              >
                <TextArea 
                  rows={3} 
                  placeholder="e.g. Deep understanding of HR pain points combined with technical background, ability to bridge business and technology teams..."
                  showCount
                  maxLength={500}
                />
              </Form.Item>
            </Card>
          </>
        );
      case 1:
        return (
          <>
            <Card className="mb-6">
              <Title level={4} className="flex items-center">
                <HeartOutlined className="mr-2" />
                Personal Passions
              </Title>
              <Form.Item
                name="interests"
                label="What are you genuinely interested in outside of work?"
                rules={[{ required: true, message: 'Please describe your interests' }]}
              >
                <TextArea 
                  rows={3} 
                  placeholder="e.g. Sustainability, personal development, AI applications, health and wellness, education technology..."
                  showCount
                  maxLength={500}
                />
              </Form.Item>
            </Card>
            
            <Card>
              <Title level={4} className="flex items-center">
                <TeamOutlined className="mr-2" />
                Strategic Network
              </Title>
              <Form.Item
                name="connections"
                label="Who do you know in specific industries? (Name or describe)"
                rules={[{ required: true, message: 'Please describe your network connections' }]}
              >
                <TextArea 
                  rows={3} 
                  placeholder="e.g. Commercial real estate broker friend, mentor in SaaS space, former colleagues in Fortune 500 companies..."
                  showCount
                  maxLength={500}
                />
              </Form.Item>
              
              <Form.Item
                name="audienceAccess"
                label="Do you have access to any specific audience groups?"
              >
                <Input 
                  placeholder="e.g. 500 LinkedIn connections in tech, local business owner group, industry newsletter subscribers..."
                  maxLength={300}
                />
              </Form.Item>
            </Card>
          </>
        );
      case 2:
        return (
          <>
            <Card className="mb-6">
              <Title level={4} className="flex items-center">
                <BulbOutlined className="mr-2" />
                Market Opportunities
              </Title>
              <Form.Item
                name="problems"
                label="What problems have you noticed businesses or people facing?"
                rules={[{ required: true, message: 'Please describe problems you\'ve observed' }]}
              >
                <TextArea 
                  rows={4} 
                  placeholder="e.g. HR teams struggling with remote onboarding, small businesses lacking affordable automation, inefficient manual processes in operations..."
                  showCount
                  maxLength={1000}
                />
              </Form.Item>
              
              <Form.Item
                name="trends"
                label="What emerging trends excite you?"
                rules={[{ required: true, message: 'Please describe trends that interest you' }]}
              >
                <TextArea 
                  rows={3} 
                  placeholder="e.g. AI democratization, sustainable business practices, remote work transformation, no-code tools adoption..."
                  showCount
                  maxLength={500}
                />
              </Form.Item>
            </Card>
            
            <Card>
              <Title level={4} className="flex items-center">
                <FileTextOutlined className="mr-2" />
                Personal Constraints
              </Title>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <Form.Item
                  name="time"
                  label={<span><ClockCircleOutlined className="mr-1" /> Weekly Hours Available</span>}
                  rules={[{ required: true, message: 'Please select time commitment' }]}
                >
                  <Select placeholder="Select">
                    <Option value="5-10">5-10 hours</Option>
                    <Option value="10-20">10-20 hours</Option>
                    <Option value="20-30">20-30 hours</Option>
                    <Option value="30+">30+ hours</Option>
                  </Select>
                </Form.Item>
                
                <Form.Item
                  name="budget"
                  label={<span><DollarOutlined className="mr-1" /> Startup Budget</span>}
                  rules={[{ required: true, message: 'Please select budget range' }]}
                >
                  <Select placeholder="Select">
                    <Option value="0-1k">$0-$1,000</Option>
                    <Option value="1k-5k">$1k-$5k</Option>
                    <Option value="5k-10k">$5k-$10k</Option>
                    <Option value="10k+">$10k+</Option>
                  </Select>
                </Form.Item>
                
                <Form.Item
                  name="location"
                  label={<span><EnvironmentOutlined className="mr-1" /> Location Flexibility</span>}
                  rules={[{ required: true, message: 'Please select location preference' }]}
                >
                  <Select placeholder="Select">
                    <Option value="remote-only">Fully remote</Option>
                    <Option value="local-focused">Local market focus</Option>
                    <Option value="hybrid">Hybrid options</Option>
                  </Select>
                </Form.Item>
              </div>
              
              <Form.Item
                name="otherConstraints"
                label="Any other limitations or requirements?"
              >
                <TextArea 
                  rows={2} 
                  placeholder="e.g. Must be family-friendly schedule, need health insurance coverage, geographic restrictions..."
                  maxLength={300}
                />
              </Form.Item>
            </Card>
          </>
        );
      case 3:
        return (
          <div className="report-container">
            {reportGenerated && reportData ? (
              <>
                <Card className="mb-6">
                  <div className="text-center mb-6">
                    <Title level={3}>Your Personalized Niche Report</Title>
                    <Text type="secondary">Generated based on your unique profile</Text>
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
                  
                  {/* Executive Summary */}
                  <Alert
                    message="Executive Summary"
                    description={reportData.executiveSummary}
                    type="info"
                    showIcon
                    className="mb-6"
                  />
                  
                  {/* Recommended Niches */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {reportData.recommendedNiches.map((niche: any, index: number) => (
                      <Card 
                        key={index} 
                        title={
                          <div className="flex justify-between items-center">
                            <span>{niche.name}</span>
                            <Tag color={niche.matchScore > 85 ? 'green' : niche.matchScore > 70 ? 'blue' : 'orange'}>
                              Match: {niche.matchScore}%
                            </Tag>
                          </div>
                        }
                        className="h-full"
                      >
                        <div className="space-y-4">
                          <div>
                            <Text strong>Why This Fits You:</Text>
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                             {renderReasons(niche.reasons)}
                            </ul>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Text strong>Market Size:</Text>
                              <div className="text-sm">{niche.marketSize}</div>
                            </div>
                            <div>
                              <Text strong>Competition:</Text>
                              <div className="text-sm">{niche.competition.level} ({niche.competition.score}/5)</div>
                            </div>
                          </div>
                          
                          <div>
                            <Text strong>Startup Costs:</Text>
                            <div className="text-sm">
                              ${niche.startupCosts.min.toLocaleString()} - ${niche.startupCosts.max.toLocaleString()}
                            </div>
                          </div>
                          
                          <div>
                            <Text strong>Target Customers:</Text>
                            <div className="flex flex-wrap gap-1 mt-2">
                             {renderTargetCustomers(niche.targetCustomers)}
                            </div>
                          </div>
                          
                          <div>
                            <Text strong>Next Steps:</Text>
                            <ol className="list-decimal pl-5 mt-2 space-y-1">
                              {renderNextSteps(niche.nextSteps)}
                            </ol>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                  
                  <Divider />
                  
                  {/* Personal Fit Analysis */}
                  <div className="mb-6">
                    <Title level={4}>Personal Fit Analysis</Title>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <Card title="Your Strengths" size="small">
                        <ul className="list-disc pl-5 space-y-1">
                          {reportData.personalFit.strengths.map((strength: string, i: number) => (
                            <li key={i} className="text-sm">{strength}</li>
                          ))}
                        </ul>
                      </Card>
                      
                      <Card title="Development Areas" size="small">
                        <ul className="list-disc pl-5 space-y-1">
                          {reportData.personalFit.skillGaps.map((gap: string, i: number) => (
                            <li key={i} className="text-sm">{gap}</li>
                          ))}
                        </ul>
                      </Card>
                      
                      <Card title="Network Advantages" size="small">
                        <ul className="list-disc pl-5 space-y-1">
                          {reportData.personalFit.networkAdvantages.map((advantage: string, i: number) => (
                            <li key={i} className="text-sm">{advantage}</li>
                          ))}
                        </ul>
                      </Card>
                    </div>
                    
                    <div className="text-center mt-6">
                      <div className="inline-block bg-blue-50 p-6 rounded-lg">
                        <Title level={4} className="mb-2">Overall Confidence Score</Title>
                        <div className="text-4xl font-bold text-blue-600">
                          {reportData.personalFit.confidenceScore}%
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Divider />
                  
                  {/* Action Plan */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card title="Immediate Steps (This Week)" size="small">
                      <ol className="list-decimal pl-5 space-y-2">
                        {reportData.actionPlan.immediateSteps.map((step: string, i: number) => (
                          <li key={i} className="text-sm">{step}</li>
                        ))}
                      </ol>
                    </Card>
                    
                    <Card title="Short-term Goals (1-3 Months)" size="small">
                      {reportData.actionPlan.shortTerm.map((item: any, i: number) => (
                        <div key={i} className="mb-3 p-3 bg-gray-50 rounded">
                          <div className="font-medium text-sm">{item.action}</div>
                          <div className="text-xs text-gray-600">Timeline: {item.timeline}</div>
                        </div>
                      ))}
                    </Card>
                    
                    <Card title="Long-term Objectives (6-12 Months)" size="small">
                      {reportData.actionPlan.longTerm.map((item: any, i: number) => (
                        <div key={i} className="mb-3 p-3 bg-gray-50 rounded">
                          <div className="font-medium text-sm">{item.goal}</div>
                          <div className="text-xs text-gray-600">Target: {item.timeline}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            Milestones: {item.milestones.slice(0, 2).join(', ')}
                          </div>
                        </div>
                      ))}
                    </Card>
                  </div>
                  
                  <Divider />
                  
                  {/* Financial Projections */}
                  <div className="mb-6">
                    <Title level={4}>Financial Projections</Title>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {reportData.financialProjections.map((projection: any, i: number) => (
                        <Card key={i} title={`${projection.niche} - ${projection.timeline}`} size="small">
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm">Conservative:</span>
                              <span className="font-medium">${projection.revenue.conservative.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm">Realistic:</span>
                              <span className="font-medium text-blue-600">${projection.revenue.realistic.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm">Optimistic:</span>
                              <span className="font-medium text-green-600">${projection.revenue.optimistic.toLocaleString()}</span>
                            </div>
                            <Divider className="my-2" />
                            <div className="flex justify-between">
                              <span className="text-sm">Investment:</span>
                              <span className="text-red-600">${projection.costs.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm font-medium">Net Profit:</span>
                              <span className="font-bold text-green-600">${projection.profitability.toLocaleString()}</span>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                  
                  {/* Risk Assessment */}
                  <div className="mb-6">
                    <Title level={4}>Risk Assessment</Title>
                    <div className="space-y-3">
                      {reportData.riskAssessment.map((risk: any, i: number) => (
                        <Card key={i} size="small" className={`border-l-4 ${
                          risk.impact === 'High' ? 'border-red-500' : 
                          risk.impact === 'Medium' ? 'border-yellow-500' : 'border-green-500'
                        }`}>
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="font-medium">{risk.risk}</div>
                              <div className="text-sm text-gray-600 mt-1">{risk.mitigation}</div>
                            </div>
                            <div className="text-right">
                              <Tag color={risk.probability === 'High' ? 'red' : risk.probability === 'Medium' ? 'orange' : 'green'}>
                                {risk.probability} Probability
                              </Tag>
                              <div className="text-xs mt-1">{risk.impact} Impact</div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
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
      <div className="text-center mb-8">
        <Title level={2} className="flex items-center justify-center">
          <UserOutlined className="mr-2" />
          Niche Researcher
        </Title>
        <Text type="secondary" className="text-lg">
          Discover your perfect business niche based on your unique background, skills, and market opportunities
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
        className="dark:bg-white-900 rounded-lg"
      >
        {renderStepContent()}
        
        <div className="flex justify-between mt-8 pb-8 px-4">
          {currentStep > 0 && currentStep < 3 && (
            <Button onClick={prevStep}>
              Back
            </Button>
          )}
          
          {currentStep < 2 && (
            <Button 
              type="primary" 
              onClick={nextStep}
              className="ml-auto"
            >
              Continue
            </Button>
          )}
          
          {currentStep === 2 && !reportGenerated && (
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