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

    BarChartOutlined,
  ContainerOutlined,
  BankOutlined
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
  Popover,
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
  InputNumber
} from 'antd';

// Import our custom hooks
import {
  usePricingCalculator,
  useSavedCalculations,
  useScenarioComparison,
  usePricingBenchmarks,
  useCalculationExport,
  usePricingValidation,
  type PricingCalculatorInput,
  type GeneratedPricingPackage
} from '../hooks/usePricingCalculator';

import LoadingOverlay from './LoadingOverlay'; 

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Panel } = Collapse;
const { Option } = Select;

const PricingCalculator = () => {
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('calculator');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [currentPackage, setCurrentPackage] = useState<GeneratedPricingPackage | null>(null);
  const [savedCalculationId, setSavedCalculationId] = useState<string | null>(null);
  
  // Hooks
  const { generatePricing, quickCalculate, generating } = usePricingCalculator();
  const { calculations, fetchCalculations, loading: calculationsLoading } = useSavedCalculations();
  const { benchmarks, fetchBenchmarks,  loading: benchmarksLoading  } = usePricingBenchmarks();
  const { exportCalculation, loading: exportLoading } = useCalculationExport();
  const { validateInput, getBusinessInsights } = usePricingValidation();

  const [exportState, setExportState] = useState<{
  loading: boolean;
  type: string | null;
}>({
  loading: false,
  type: null
});

// Then use these derived values:
const isExporting = exportState.loading;
const exportingType = exportState.type;


    // Unified loading state
  const isGenerating = generating;


  // Quick calculation results (real-time)
  const [quickResults, setQuickResults] = useState({
    monthlySavings: 0,
    recommendedRetainer: 0,
    netSavings: 0,
    roiPercentage: 0,
    hourlyRate: 0,
    monthlyHours: 0
  });


// Update the useEffect to handle errors gracefully
useEffect(() => {
  fetchCalculations();
  // Make benchmarks optional - don't block the UI if it fails
  fetchBenchmarks().catch(err => {
    console.warn('Benchmarks unavailable:', err);
    // Don't show error to user, just log it
  });
}, [fetchCalculations, fetchBenchmarks]);

  // Real-time calculation updates
  const handleFormChange = () => {
    const values = form.getFieldsValue();
    if (values.annualSavings && values.hoursPerWeek && values.roiMultiple) {
      const results = quickCalculate({
        annualSavings: values.annualSavings,
        hoursPerWeek: values.hoursPerWeek,
        roiMultiple: values.roiMultiple
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
        });
      });
      return;
    }

    const result = await generatePricing(values);
    
    if (result) {
      setCurrentPackage(result.package);
      setSavedCalculationId(result.calculationId);
      setActiveTab('results');
      
      notification.success({
        message: 'Pricing Package Generated!',
        description: 'Your comprehensive pricing strategy is ready.',
        duration: 4
      });
    }
  };

 const resetForm = () => {
  form.resetFields();
  setQuickResults({
    monthlySavings: 0,
    recommendedRetainer: 0,
    netSavings: 0,
    roiPercentage: 0,
    hourlyRate: 0,
    monthlyHours: 0
  });
  setCurrentPackage(null);
  setSavedCalculationId(null);
  setActiveTab('calculator'); // ✅ Return to calculator tab
  

};

const handleExport = async (format: 'proposal' | 'presentation' | 'contract' | 'complete') => {
  // Set loading state for the specific export type
  setExportState({ loading: true, type: format });

  try {
    // Use current form values and quick results instead of requiring savedCalculationId
    const values = form.getFieldsValue();
    
    if (!values.annualSavings || !values.hoursPerWeek || !values.roiMultiple) {
      notification.error({
        message: 'Incomplete Form',
        description: 'Please fill in the basic pricing information before exporting.'
      });
      return;
    }

    const calculationData = {
      clientName: values.clientName || 'Valued Client',
      projectName: values.projectName || 'AI Services Project',
      industry: values.industry || 'Technology',
      annualSavings: values.annualSavings,
      recommendedRetainer: quickResults.recommendedRetainer,
      netSavings: quickResults.netSavings,
      roiPercentage: quickResults.roiPercentage,
      hourlyRate: quickResults.hourlyRate,
      monthlyHours: quickResults.monthlyHours
    };

    console.log('Exporting with data:', calculationData, 'format:', format);
    
    const response = await fetch('/api/pricing-calculator/export-linear', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        format,
        calculationData
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    // Get filename from response headers
    const contentDisposition = response.headers.get('content-disposition');
    const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
    const filename = filenameMatch?.[1] || `pricing-${format}-${calculationData.clientName.toLowerCase().replace(/\s+/g, '-')}.html`;

    const blob = await response.blob();
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    try {
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      notification.success({
        message: 'Export Successful! 🎉',
        description: `${format.charAt(0).toUpperCase() + format.slice(1)} has been downloaded successfully.`,
        duration: 4
      });
    } finally {
      // Cleanup
      window.URL.revokeObjectURL(url);
      if (document.body.contains(a)) {
        document.body.removeChild(a);
      }
    }
    
  } catch (err) {
    console.error('Export error:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    
    notification.error({
      message: 'Export Failed',
      description: `Failed to export ${format}: ${errorMessage}`,
      duration: 8
    });
  } finally {
    // Always clear the loading state
    setExportState({ loading: false, type: null });
  }
};


  const getBusinessInsightsForCurrent = () => {
    const values = form.getFieldsValue();
    if (values.annualSavings && values.hoursPerWeek && values.roiMultiple) {
      return getBusinessInsights(values);
    }
    return null;
  };

  const insights = getBusinessInsightsForCurrent();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
           <LoadingOverlay visible={isGenerating} />
      <div className="text-center mb-8">
        <Title level={2} className="flex items-center justify-center">
          <CalculatorOutlined className="mr-2 text-blue-600" />
          AI-Powered Pricing Calculator
        </Title>
        <Text type="secondary" className="text-lg">
          Generate comprehensive pricing strategies with AI-powered insights and industry benchmarks
        </Text>
      </div>

      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        type="card"
        size="large"
      >
        <TabPane 
          tab={
            <span>
              <CalculatorOutlined />
              Calculator
            </span>
          } 
          key="calculator"
        >
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={12}>
              <Card>
                <div className="flex justify-between items-center mb-4">
                  <Title level={4} className="flex items-center mb-0">
                    <DollarOutlined className="mr-2" />
                    Pricing Inputs
                  </Title>
                  <Switch
                    checkedChildren="Advanced"
                    unCheckedChildren="Basic"
                    checked={showAdvanced}
                    onChange={setShowAdvanced}
                  />
                </div>

                <Form
                  form={form}
                  layout="vertical"
                  onFinish={onFinish}
                  onValuesChange={handleFormChange}
                  initialValues={{
                    annualSavings: 100000,
                    hoursPerWeek: 20,
                    roiMultiple: 5,
                    experienceLevel: 'intermediate',
                    deliveryRisk: 'medium',
                    clientUrgency: 'medium',
                    relationshipType: 'new',
                    paymentTerms: 'monthly',
                    marketDemand: 'medium',
                    competitionLevel: 'medium'
                  }}
                >
                  {/* Basic Fields */}
                  <Form.Item
                    name="annualSavings"
                    label={
                      <span>
                        Annual Client Savings{' '}
                        <Tooltip title="How much money will your services save/make the client per year?">
                          <InfoCircleOutlined />
                        </Tooltip>
                      </span>
                    }
                    rules={[
                      { required: true, message: 'Please input estimated savings!' },
                      { type: 'number', min: 100, message: 'Minimum $100' }
                    ]}
                  >
                   <InputNumber
  prefix="$"
  placeholder="100000"
  size="large"
  style={{ width: '100%' }}
  formatter={(value) => `${value}`.replace(/\\B(?=(\\d{3})+(?!\\d))/g, ',')}
  parser={(value) => value!.replace(/\\$\\s?|(,*)/g, '')}
/>
                  </Form.Item>

                  <Form.Item
                    name="hoursPerWeek"
                    label="Hours Worked Per Week"
                    rules={[{ required: true, message: 'Please input hours!' }]}
                  >
                    <Slider
                      min={5}
                      max={40}
                      marks={{
                        5: '5h',
                        20: '20h',
                        40: '40h'
                      }}
                    />
                  </Form.Item>

                  <Form.Item
                    name="roiMultiple"
                    label={
                      <span>
                        ROI Multiple{' '}
                        <Tooltip title="How much of the value created should you capture? Higher multiples for specialized expertise.">
                          <InfoCircleOutlined />
                        </Tooltip>
                      </span>
                    }
                    rules={[{ required: true, message: 'Please select ROI multiple!' }]}
                  >
                    <Slider
                      min={2}
                      max={15}
                      step={0.5}
                      marks={{
                        2: '2x',
                        5: '5x',
                        10: '10x',
                        15: '15x'
                      }}
                    />
                  </Form.Item>

                  {/* Advanced Fields */}
                  {showAdvanced && (
                    <>
                      <Divider>Project Context</Divider>
                      
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item name="clientName" label="Client Name">
                            <Input placeholder="Client name" />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item name="projectName" label="Project Name">
                            <Input placeholder="Project name" />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item name="industry" label="Industry">
                            <Select placeholder="Select industry">
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
                          <Form.Item name="serviceType" label="Service Type">
                            <Select placeholder="Select service type">
                              <Option value="AI Consulting">AI Consulting</Option>
                              <Option value="Process Automation">Process Automation</Option>
                              <Option value="Data Analytics">Data Analytics</Option>
                              <Option value="Digital Transformation">Digital Transformation</Option>
                              <Option value="Custom Development">Custom Development</Option>
                            </Select>
                          </Form.Item>
                        </Col>
                      </Row>

                      <Divider>Pricing Factors</Divider>

                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item name="experienceLevel" label="Experience Level">
                            <Select>
                              <Option value="beginner">Beginner</Option>
                              <Option value="intermediate">Intermediate</Option>
                              <Option value="expert">Expert</Option>
                              <Option value="premium">Premium</Option>
                            </Select>
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item name="deliveryRisk" label="Delivery Risk">
                            <Select>
                              <Option value="low">Low Risk</Option>
                              <Option value="medium">Medium Risk</Option>
                              <Option value="high">High Risk</Option>
                            </Select>
                          </Form.Item>
                        </Col>
                      </Row>

                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item name="clientUrgency" label="Client Urgency">
                            <Select>
                              <Option value="low">Low Urgency</Option>
                              <Option value="medium">Medium Urgency</Option>
                              <Option value="high">High Urgency</Option>
                            </Select>
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item name="relationshipType" label="Relationship Type">
                            <Select>
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
                          <Form.Item name="paymentTerms" label="Payment Terms">
                            <Select>
                              <Option value="upfront">Upfront</Option>
                              <Option value="monthly">Monthly</Option>
                              <Option value="milestone">Milestone</Option>
                              <Option value="success-based">Success-based</Option>
                            </Select>
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item name="projectDuration" label="Project Duration (months)">
                            <Input type="number" min={1} max={60} placeholder="6" />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Form.Item name="guaranteeOffered" valuePropName="checked">
                        <Switch /> <span className="ml-2">Offer Performance Guarantee</span>
                      </Form.Item>
                    </>
                  )}

                  <div className="flex justify-between mt-8">
                    <Button
                      icon={<ReloadOutlined />}
                      onClick={resetForm}
                      size="large"
                    >
                      Reset
                    </Button>
                    <Button
        type="primary"
        htmlType="submit"
        disabled={isGenerating} // ✅ Only disable during generation
        icon={<BulbOutlined />}
        loading={isGenerating} // ✅ Only loading during generation
        size="large"
      >
        {isGenerating ? 'Generating AI Insights...' : 'Generate Pricing Strategy'}
      </Button>
                  </div>
                </Form>
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card>
                <Title level={4} className="flex items-center mb-4">
                  <PieChartOutlined className="mr-2" />
                  Live Preview
                </Title>

                <div className="space-y-4">
                  <Row gutter={16}>
                    <Col span={12}>
                      <Statistic
                        title="Monthly Savings"
                        value={quickResults.monthlySavings}
                        precision={0}
                        prefix="$"
                        suffix="/mo"
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="Monthly Hours"
                        value={quickResults.monthlyHours}
                        precision={0}
                        suffix="hrs"
                      />
                    </Col>
                  </Row>

                  <Divider />

                  <Row gutter={16}>
                    <Col span={12}>
                      <Statistic
                        title="Recommended Retainer"
                        value={quickResults.recommendedRetainer}
                        precision={0}
                        prefix="$"
                        valueStyle={{ color: '#3f8600', fontSize: '1.2em', fontWeight: 'bold' }}
                        suffix="/mo"
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="Hourly Rate"
                        value={quickResults.hourlyRate}
                        precision={0}
                        prefix="$"
                        suffix="/hr"
                      />
                    </Col>
                  </Row>

                  <Divider />

                  <Row gutter={16}>
                    <Col span={12}>
                      <Statistic
                        title="Client Net Savings"
                        value={quickResults.netSavings}
                        precision={0}
                        prefix="$"
                        suffix="/mo"
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="Client ROI"
                        value={quickResults.roiPercentage}
                        precision={0}
                        suffix="%"
                        valueStyle={{
                          color: quickResults.roiPercentage >= 100 ? '#3f8600' : '#cf1322'
                        }}
                      />
                    </Col>
                  </Row>

                  {quickResults.roiPercentage > 0 && quickResults.roiPercentage < 100 && (
                    <Alert
                      message="Low Client ROI"
                      description="Consider adjusting your ROI multiple or scope to improve client value."
                      type="warning"
                      showIcon
                    />
                  )}

                  {insights && (
                    <div className="mt-6">
                      <Title level={5}>Business Insights</Title>
                      <Space direction="vertical" className="w-full">
                        <Tag color={insights.hourlyRateCategory === 'premium' ? 'gold' : 'blue'}>
                          {insights.hourlyRateCategory.toUpperCase()} Pricing
                        </Tag>
                        <Tag color={insights.clientROICategory === 'excellent' ? 'green' : 'orange'}>
                          {insights.clientROICategory.toUpperCase()} Client ROI
                        </Tag>
                        
                        {insights.recommendations.length > 0 && (
                          <div>
                            <Text strong>Recommendations:</Text>
                            <ul className="mt-2">
                              {insights.recommendations.map((rec, idx) => (
                                <li key={idx} className="text-sm">{rec}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </Space>
                    </div>
                  )}
                </div>
              </Card>

              {/* Benchmarks Card */}
           {benchmarks?.industrySpecific?.hourlyRates && (
  <Card className="mt-6">
    <Title level={5} className="flex items-center">
      <TrophyOutlined className="mr-2" />
      Industry Benchmarks
    </Title>
    
    <div>
      <Text strong>Hourly Rate Ranges:</Text>
      <Row gutter={8} className="mt-2">
        <Col span={6}>
          <Statistic 
            title="Junior" 
            value={benchmarks.industrySpecific.hourlyRates.junior ?? 0} 
            prefix="$" 
          />
        </Col>
        <Col span={6}>
          <Statistic 
            title="Mid" 
            value={benchmarks.industrySpecific.hourlyRates.mid ?? 0} 
            prefix="$" 
          />
        </Col>
        <Col span={6}>
          <Statistic 
            title="Senior" 
            value={benchmarks.industrySpecific.hourlyRates.senior ?? 0} 
            prefix="$" 
          />
        </Col>
        <Col span={6}>
          <Statistic 
            title="Expert" 
            value={benchmarks.industrySpecific.hourlyRates.expert ?? 0} 
            prefix="$" 
          />
        </Col>
      </Row>
    </div>
  </Card>
)}

            </Col>
          </Row>
        </TabPane>

        <TabPane 
          tab={
            <span>
              <BookOutlined />
              Results
              {currentPackage && <Badge dot style={{ marginLeft: 8 }} />}
            </span>
          } 
          key="results"
          disabled={!currentPackage}
        >
        {currentPackage ? (
  <div className="space-y-6">
    {/* Export Actions */}
    <Card>
      <div className="flex justify-between items-center">
        <Title level={4}>Export Your Pricing Package</Title>
        <Space wrap>
         <Button 
  icon={<FileTextOutlined />} 
  onClick={() => handleExport('proposal')}
  disabled={isExporting}
  loading={isExporting && exportingType === 'proposal'} // ✅ Specific loading
>
  Proposal
</Button>
        
<Button 
  icon={<BarChartOutlined />} 
  onClick={() => handleExport('presentation')}
  disabled={isExporting}
  loading={isExporting && exportingType === 'presentation'}
>
  Presentation
</Button>
         <Button 
  icon={<ContainerOutlined />} 
  onClick={() => handleExport('contract')}
  disabled={isExporting}
  loading={isExporting && exportingType === 'contract'}
>
  Contract
</Button>
        <Button 
  type="primary"
  icon={<DownloadOutlined />} 
  onClick={() => handleExport('complete')}
  disabled={isExporting}
  loading={isExporting && exportingType === 'complete'}
>
  Complete Package
</Button>
          
          {/* ✅ NEW: Generate New Strategy Button */}
          <Button
            type="default"
            icon={<BulbOutlined />}
            onClick={() => {
              // Reset to calculator tab and clear results
              setActiveTab('calculator');
              setCurrentPackage(null);
              setSavedCalculationId(null);
              // Optionally scroll back to top
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            disabled={isExporting || isGenerating} // Don't allow during operations
            size="large"
            className="ml-4" // Add some spacing
          >
            Generate New Strategy
          </Button>
        </Space>
      </div>
    </Card>
              {/* Pricing Summary */}
              <Card title="Pricing Summary">
                <Row gutter={24}>
                  <Col span={6}>
                    <Statistic
                      title="Monthly Retainer"
                      value={currentPackage.calculations.recommendedRetainer}
                      precision={0}
                      prefix="$"
                      valueStyle={{ color: '#3f8600', fontSize: '1.5em' }}
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic
                      title="Hourly Rate"
                      value={currentPackage.calculations.hourlyRate}
                      precision={0}
                      prefix="$"
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic
                      title="Client ROI"
                      value={currentPackage.calculations.roiPercentage}
                      precision={0}
                      suffix="%"
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic
                      title="Project Value"
                      value={currentPackage.calculations.totalProjectValue}
                      precision={0}
                      prefix="$"
                    />
                  </Col>
                </Row>
              </Card>

              {/* Pricing Options */}
              <Card title="Pricing Model Options">
                <List
                  dataSource={currentPackage.calculations.pricingOptions}
                  renderItem={(option) => (
                    <List.Item>
                      <Card size="small" className="w-full">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <Title level={5} className="mb-2">
                              {option.model.charAt(0).toUpperCase() + option.model.slice(1)} Model
                            </Title>
                            <Text className="text-lg font-semibold text-green-600">
                              ${option.price?.toLocaleString()}
                            </Text>
                            <Paragraph className="mt-2 mb-2">{option.description}</Paragraph>
                            <div>
                              <Text strong className="text-green-600">Pros: </Text>
                              <Text>{option.pros?.join(', ')}</Text>
                            </div>
                            <div>
                              <Text strong className="text-red-600">Cons: </Text>
                              <Text>{option.cons?.join(', ')}</Text>
                            </div>
                          </div>
                          <div className="ml-4">
                            <Progress
                              type="circle"
                              size={60}
                              percent={option.recommendationScore}
                              format={(percent) => `${percent}`}
                            />
                            <div className="text-center mt-1">
                              <Text type="secondary" style={{ fontSize: '12px' }}>Score</Text>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </List.Item>
                  )}
                />
              </Card>

              {/* Strategy Details */}
              <Collapse defaultActiveKey={['strategy']}>
                <Panel header="Pricing Strategy" key="strategy">
                  <div className="space-y-4">
                    <div>
                      <Title level={5}>Recommended Approach</Title>
                      <Paragraph>{currentPackage.strategy.recommendedApproach}</Paragraph>
                    </div>
                    
                    <div>
                      <Title level={5}>Value Proposition</Title>
                      <Paragraph>{currentPackage.strategy.valueProposition}</Paragraph>
                    </div>

                    <div>
                      <Title level={5}>Negotiation Tactics</Title>
                      <ul>
                        {currentPackage.strategy.negotiationTactics.map((tactic, idx) => (
                          <li key={idx}>{tactic}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Panel>

                <Panel header="Implementation Phases" key="phases">
                  <List
                    dataSource={currentPackage.strategy.phases}
                    renderItem={(phase, index) => (
                      <List.Item>
                        <Card size="small" className="w-full">
                          <Title level={5}>Phase {index + 1}: {phase.phase}</Title>
                          <Row gutter={16}>
                            <Col span={8}>
                              <Statistic title="Duration" value={phase.duration} />
                            </Col>
                            <Col span={8}>
                              <Statistic 
                                title="Payment" 
                                value={phase.payment} 
                                prefix="$" 
                                precision={0}
                              />
                            </Col>
                            <Col span={8}>
                              <Text strong>Deliverables:</Text>
                              <ul className="mt-1">
                                {phase.deliverables.map((deliverable, idx) => (
                                  <li key={idx} className="text-sm">{deliverable}</li>
                                ))}
                              </ul>
                            </Col>
                          </Row>
                        </Card>
                      </List.Item>
                    )}
                  />
                </Panel>

                <Panel header="Objection Handling" key="objections">
                  <List
                    dataSource={currentPackage.objectionHandling}
                    renderItem={(objection) => (
                      <List.Item>
                        <Card size="small" className="w-full">
                          <Title level={5} className="text-orange-600">
                            {objection.objection}
                          </Title>
                          <div className="mt-2">
                            <Text strong>Response: </Text>
                            <Paragraph>{objection.response}</Paragraph>
                          </div>
                          <div>
                            <Text strong>Alternatives: </Text>
                            <Text>{objection.alternatives.join(', ')}</Text>
                          </div>
                        </Card>
                      </List.Item>
                    )}
                  />
                </Panel>
              </Collapse>
            </div>
          ) : (
            <div className="text-center py-12">
              <BulbOutlined style={{ fontSize: '48px', color: '#ccc' }} />
              <Title level={3} type="secondary">No Pricing Package Generated</Title>
              <Text type="secondary">
                Generate a pricing calculation first to see detailed results and AI insights.
              </Text>
            </div>
          )}
        </TabPane>

        <TabPane 
          tab={
            <span>
              <BankOutlined />
              Saved Calculations
            </span>
          } 
          key="history"
        >
          <Card title="Your Pricing Calculations">
            <Table
              dataSource={calculations}
              rowKey="id"
              columns={[
                {
                  title: 'Client',
                  dataIndex: 'clientName',
                  key: 'clientName',
                  render: (text) => text || 'Unnamed Client'
                },
                {
                  title: 'Project',
                  dataIndex: 'projectName',
                  key: 'projectName',
                  render: (text) => text || 'Unnamed Project'
                },
                {
                  title: 'Industry',
                  dataIndex: 'industry',
                  key: 'industry',
                  render: (text) => text ? <Tag>{text}</Tag> : '-'
                },
                {
                  title: 'Annual Savings',
                  dataIndex: 'annualSavings',
                  key: 'annualSavings',
                  render: (value) => value ? `$${value.toLocaleString()}` : '-'
                },
                {
                  title: 'Monthly Retainer',
                  dataIndex: 'recommendedRetainer',
                  key: 'recommendedRetainer',
                  render: (value) => value ? `$${value.toLocaleString()}` : '-'
                },
                {
                  title: 'ROI',
                  dataIndex: 'roiPercentage',
                  key: 'roiPercentage',
                  render: (value) => value ? `${value.toFixed(0)}%` : '-'
                },
                {
                  title: 'Created',
                  dataIndex: 'createdAt',
                  key: 'createdAt',
                  render: (date) => new Date(date).toLocaleDateString()
                },
                {
                  title: 'Actions',
                  key: 'actions',
                  render: (_, record) => (
                    <Space>
                      <Button size="small" type="link">
                        View
                      </Button>
                      <Button size="small" type="link">
                        Export
                      </Button>
                    </Space>
                  )
                }
              ]}
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default PricingCalculator;