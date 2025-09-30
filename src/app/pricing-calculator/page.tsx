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
  InputNumber,
  
} from 'antd';

// Import our custom hooks
import {
  usePricingCalculator,
  useSavedCalculations,
  useScenarioComparison,
  usePricingBenchmarks,
  useCalculationExport,
  usePricingValidation,

   type SavedCalculation, 
  type PricingCalculatorInput,
  type GeneratedPricingPackage
} from '../hooks/usePricingCalculator';

import LoadingOverlay from './LoadingOverlay'; 
import { useWorkspaceContext } from '../hooks/useWorkspaceContext';
import { useRouter } from 'next/navigation';


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
   const { currentWorkspace, isWorkspaceReady } = useWorkspaceContext();
     const router = useRouter();

  
  // Hooks
  const { generatePricing, quickCalculate, generating } = usePricingCalculator();
  const { calculations, fetchCalculations, loading: calculationsLoading } = useSavedCalculations();
  const { benchmarks, fetchBenchmarks,  loading: benchmarksLoading  } = usePricingBenchmarks();
  const { exportCalculation, loading: exportLoading } = useCalculationExport();
  const { validateInput, getBusinessInsights } = usePricingValidation();
  const [viewingCalculation, setViewingCalculation] = useState<GeneratedPricingPackage | null>(null);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
const [viewDetailLoading, setViewDetailLoading] = useState(false); // Loading for fetching detail

const [viewLoadingStates, setViewLoadingStates] = useState<{[key: string]: boolean}>({});

  const [exportState, setExportState] = useState<{
  loading: boolean;
  type: string | null;
}>({
  loading: false,
  type: null
});



// Update the useEffect in PricingCalculator component:
useEffect(() => {
  if (currentWorkspace) {
    fetchCalculations(); // Remove the parameter
  }
  // Make benchmarks optional - don't block the UI if it fails
  fetchBenchmarks().catch(err => {
    console.warn('Benchmarks unavailable:', err);
  });
}, [fetchCalculations, fetchBenchmarks, currentWorkspace?.id]); // Add currentWorkspace dependency

  // Quick calculation results (real-time)
const [quickResults, setQuickResults] = useState({
  totalClientImpact: 0,
  monthlyImpact: 0,
  directSavingsComponent: 0,      // NEW
  revenueComponent: 0,            // NEW  
  timeValueComponent: 0,          // NEW
  recommendedRetainer: 0,
  annualFee: 0,
  netSavings: 0,
  roiPercentage: 0,
  hourlyRate: 0,
  monthlyHours: 0,
  clientHourlyValue: 95,          // NEW
  hoursFreedAnnually: 0,          // NEW
  timeValueRatio: 0,              // NEW
});
const {

  getCalculation, // <-- Correctly get getCalculation

} = useSavedCalculations();





 // WORKSPACE VALIDATION - AFTER ALL HOOKS
  if (!isWorkspaceReady) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center">
        <Spin size="large" tip="Loading workspace..."/>
        {/* <p className="mt-4"></p> */}
      </div>
    );
  }

  if (!currentWorkspace) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Alert
          message="Workspace Required"
          description="The pricing calculator must be accessed from within a workspace. Please navigate to a workspace first."
          type="error"
          showIcon
          action={
            <Button type="primary" href="/dashboard">
              Go to Dashboard
            </Button>
          }
        />
      </div>
    );
  }


   const handleBack = () => {
    router.push(`/dashboard/${currentWorkspace?.slug}`);
  };



  const calculatorDisabledStyle = {
  pointerEvents: 'none' as const,
  opacity: 0.6,
  position: 'relative' as const
};



// Then use these derived values:
const isExporting = exportState.loading;
const exportingType = exportState.type;


    // Unified loading state
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
      industry: values.industry || 'Technology'  // FIXED: Add industry parameter
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

         // Refresh saved calculations to show the new one
    fetchCalculations();
      
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
    totalClientImpact: 0,
    monthlyImpact: 0,
    directSavingsComponent: 0,      // FIXED: Use correct field name
    revenueComponent: 0,
    timeValueComponent: 0,          // FIXED: Add missing field
    recommendedRetainer: 0,
    annualFee: 0,
    netSavings: 0,
    roiPercentage: 0,
    hourlyRate: 0,
    monthlyHours: 0,
    clientHourlyValue: 95,          // FIXED: Add missing field
    hoursFreedAnnually: 0,          // FIXED: Add missing field
    timeValueRatio: 0,              // FIXED: Add missing field
  });
  setCurrentPackage(null);
  setSavedCalculationId(null);
  setActiveTab('calculator');
};

// Handler for the View button
const handleView = async (record: SavedCalculation) => {
  setViewLoadingStates(prev => ({ ...prev, [record.id]: true }));
  setViewDetailLoading(true);
  setViewingCalculation(null);
  
  try {
    const fullData = await getCalculation(record.id);
    if (fullData) {
      const pricingPackage = fullData.calculation as GeneratedPricingPackage | undefined;
      if (pricingPackage) {
        setViewingCalculation(pricingPackage);
        setIsViewModalVisible(true);
      } else {
        console.warn("Pricing package data not found in API response for ID:", record.id);
        notification.warning({
          message: 'View Warning',
          description: 'Calculation data structure was incomplete.',
        });
      }
    } else {
      notification.error({
        message: 'View Failed',
        description: 'Could not load the calculation details.',
      });
    }
  } catch (err) {
    console.error("Error fetching calculation detail:", err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    notification.error({
      message: 'View Failed',
      description: errorMessage,
    });
  } finally {
    setViewDetailLoading(false);
    setViewLoadingStates(prev => ({ ...prev, [record.id]: false }));
  }
};

// // Handler for the Export button (using the existing hook)
// const handleSavedExport = async (record: any, format: 'proposal' | 'presentation' | 'contract' | 'complete' = 'complete') => {
//   try {
//     // The useCalculationExport hook's exportCalculation function likely just needs the ID and format
//     // Make sure your hook implementation matches this expectation.
//     await exportCalculation(record.id, format);
//     // Success notification is handled inside the hook
//   } catch (err) {
//     // Error notification is handled inside the hook
//     console.error("Saved Export failed:", err);
//     // You could add additional logging or handling here if needed
//   }
// };


const handleViewOk = () => {
  setIsViewModalVisible(false);
};

const handleViewCancel = () => {
  setIsViewModalVisible(false);
};


const handleExport = async (format: 'proposal' | 'presentation' | 'contract' | 'complete') => {
  setExportState({ loading: true, type: format });

  try {
    const values = form.getFieldsValue();
    
    // FIXED: Use correct field names
    if (!values.annualClientSavings || !values.annualRevenueIncrease || !values.hoursPerWeek || !values.roiMultiple) {
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
      annualClientSavings: values.annualClientSavings,        // FIXED
      annualRevenueIncrease: values.annualRevenueIncrease,    // FIXED
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
  // FIXED: Use correct field names
  if (values.annualClientSavings && values.annualRevenueIncrease && values.hoursPerWeek && values.roiMultiple) {
    return getBusinessInsights(values);
  }
  return null;
};
  const insights = getBusinessInsightsForCurrent();

  return (
    
    <div className="max-w-7xl mx-auto px-4 py-8">
      
           <LoadingOverlay visible={isGenerating} />
                   <Button 
  icon={<ArrowLeftOutlined />} 
  onClick={handleBack}
// negative margin top
>
  Back
</Button>
      <div className="text-center mb-8">
        <Title level={2} className="flex items-center justify-center">
          <CalculatorOutlined className="mr-2 text-blue-600" />
          <span style={{ color: '#5CC49D' }}>a</span>rb
  <span style={{ color: '#5CC49D' }}>i</span>trageOS Pricing Calculator
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
      {currentPackage && (
        <Badge 
          count="Results Generated" 
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
  } 
  key="calculator"
>
  <div style={currentPackage ? calculatorDisabledStyle : {}}>
    {/* Show overlay message when calculator is disabled */}
    {currentPackage && (
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
          >
            Go to Results
          </Button>
        }
        className="mb-6"
        banner
      />
    )}
    
    <Row gutter={[24, 24]}>
      <Col xs={24} lg={12}>
        <Card>
          <div className="flex justify-between items-center mb-4">
            <Title level={4} className="flex items-center mb-0">
              <DollarOutlined className="mr-2" />
              Pricing Inputs
              {currentPackage && (
                <Tag color="green" className="ml-2">Completed</Tag>
              )}
            </Title>
            <Switch
              checkedChildren="Advanced"
              unCheckedChildren="Basic"
              checked={showAdvanced}
              onChange={setShowAdvanced}
              disabled={!!currentPackage} // ✅ Disable switch when results generated
            />
          </div>
<Form
  form={form}
  layout="vertical"
  onFinish={onFinish}
  onValuesChange={handleFormChange}
  disabled={!!currentPackage}
  initialValues={{
    annualClientSavings: 50000,        // Default: $50K savings
    annualRevenueIncrease: 100000,     // Default: $100K revenue lift
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
  {/* Client Value Impact Section */}
  <div className=" p-4 rounded-lg mb-4">
    <Title level={5} className="mb-3 text-blue-800">
      💰 Client Value Impact
    </Title>
    <Text type="secondary" className="block mb-3">
      Break down the total measurable value you will deliver to your client
    </Text>
    
    <Form.Item
      name="annualClientSavings"
      label={
        <span>
          Annual Client Savings{' '}
          <Tooltip title="How much money will your client save each year by using your service? (reduced costs, eliminated waste, efficiency gains)">
            <InfoCircleOutlined />
          </Tooltip>
        </span>
      }
      rules={[
        { required: true, message: 'Please input estimated savings!' },
        { type: 'number', min: 0, message: 'Must be positive' }
      ]}
    >
      <InputNumber
        prefix="$"
        placeholder="50000"
        size="large"
        style={{ width: '100%' }}
        formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
        parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
      />
    </Form.Item>

    <Form.Item
      name="annualRevenueIncrease"
      label={
        <span>
          Expected Annual Client Revenue Lift{' '}
          <Tooltip title="How much extra money will your client earn each year from your service? (new sales, improved conversion, expanded market reach)">
            <InfoCircleOutlined />
          </Tooltip>
        </span>
      }
      rules={[
        { required: true, message: 'Please input expected revenue increase!' },
        { type: 'number', min: 0, message: 'Must be positive' }
      ]}
    >
      <InputNumber
        prefix="$"
        placeholder="100000"
        size="large"
        style={{ width: '100%' }}
        formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
        parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
      />
    </Form.Item>

    {/* Total Impact Display */}
    <div className=" p-3 rounded border-2 border-blue-200">
      <Text strong >Total Client Impact: </Text>
      <Text className="text-xl font-bold text-green-600">
        ${((form.getFieldValue('annualClientSavings') || 0) + (form.getFieldValue('annualRevenueIncrease') || 0)).toLocaleString()}/year
      </Text>
      <br />
      <Text type="secondary" className="text-sm">
        This is the total measurable value you deliver annually
      </Text>
    </div>
  </div>

  {/* Rest of your existing fields stay the same */}
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
        <Tooltip title="How much should the client get back for every $1 they invest? Higher multiples for more specialized expertise.">
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
                       disabled={!!currentPackage}
                    >
                      Reset
                    </Button>
                      {!currentPackage ? (
                // ✅ Show generate button only when no results
                <Button
                  type="primary"
                  htmlType="submit"
                  disabled={isGenerating}
                  icon={<BulbOutlined />}
                  loading={isGenerating}
                  size="large"
                       style={{
    backgroundColor: '#5CC49D',
    borderColor: '#5CC49D',
    color: '#000000',
    fontWeight: '500'
  }}
                >
                  {isGenerating ? 'Generating AI Insights...' : 'Generate Pricing Strategy'}
                </Button>
              ) : (
                // ✅ Show locked message when results exist
                <Button
                  type="default"
                  icon={<BulbOutlined />}
                  onClick={() => setActiveTab('results')}
                  size="large"
                >
                  View Generated Results
                </Button>
              )}
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
    {/* Value Breakdown - NEW SECTION */}
    <div className=" p-3 rounded">
    <Title level={5} className="mb-2">Client Value Breakdown</Title>
      <Row gutter={8}>
        <Col span={8}>
          <Statistic
            title="Cost Savings"
            value={quickResults.directSavingsComponent || 0}
            precision={0}
            prefix="$"
            suffix="/mo"
            valueStyle={{ fontSize: '14px' }}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="Revenue Lift"
            value={quickResults.revenueComponent || 0}
            precision={0}
            prefix="$"
            suffix="/mo"
            valueStyle={{ fontSize: '14px' }}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="Time Value"
            value={quickResults.timeValueComponent || 0}
            precision={0}
            prefix="$"
            suffix="/mo"
            valueStyle={{ fontSize: '14px', color: '#52c41a' }}
          />
        </Col>
      </Row>
      
      <Divider style={{ margin: '12px 0' }} />
      
      <Statistic
        title="Total Monthly Impact"
        value={quickResults.monthlyImpact}
        precision={0}
        prefix="$"
        suffix="/mo"
        valueStyle={{ color: '#3f8600', fontSize: '1.2em', fontWeight: 'bold' }}
      />
    </div>

    <Row gutter={16}>
      <Col span={12}>
        <Statistic
          title="Monthly Hours Freed"
          value={quickResults.monthlyHours}
          precision={0}
          suffix="hrs"
        />
      </Col>
      <Col span={12}>
        <Statistic
          title="Client Hourly Value"
          value={quickResults.clientHourlyValue || 95}
          precision={0}
          prefix="$"
          suffix="/hr"
          valueStyle={{ color: '#52c41a' }}
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
          title="Your Hourly Rate"
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
          title="Client Net Benefit"
          value={quickResults.netSavings}
          precision={0}
          prefix="$"
          suffix="/mo"
          valueStyle={{
            color: quickResults.netSavings >= 0 ? '#3f8600' : '#cf1322'
          }}
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

    {/* Time Impact Insights - NEW SECTION */}
    {quickResults.hoursFreedAnnually > 0 && (
      <div className=" p-3 rounded border border-green-200">
        <Title level={5} className="mb-2 text-green-800">Annual Time Impact</Title>
        <div className="space-y-1">
          <Text className="text-sm">
            Total hours freed: <strong>{(quickResults.hoursFreedAnnually || 0).toLocaleString()} hours/year</strong>
          </Text>
          <Text className="text-sm block">
            Time value at ${quickResults.clientHourlyValue}/hr: <strong>
              ${((quickResults.hoursFreedAnnually || 0) * (quickResults.clientHourlyValue || 95)).toLocaleString()}/year
            </strong>
          </Text>
          <Text className="text-sm block text-green-700">
            Time represents <strong>
              {quickResults.timeValueRatio ? Math.round(quickResults.timeValueRatio * 100) : 0}%
            </strong> of total client value
          </Text>
        </div>
      </div>
    )}

    {/* ROI Warning */}
    {quickResults.roiPercentage > 0 && quickResults.roiPercentage < 100 && (
      <Alert
        message="Low Client ROI"
        description="Consider adjusting your ROI multiple or increasing the time value component to improve client value proposition."
        type="warning"
        showIcon
      />
    )}

    {/* Excellent ROI Alert */}
    {quickResults.roiPercentage > 500 && (
      <Alert
        message="Excellent Client ROI"
        description="Your client gets exceptional value. You may be underpricing your services."
        type="success"
        showIcon
      />
    )}

    {/* Business Insights */}
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

    {/* Value Proposition Preview - NEW SECTION */}
    {quickResults.monthlyImpact > 0 && quickResults.recommendedRetainer > 0 && (
      <div className=" p-3 rounded border border-blue-200">
        <Title level={5} className="mb-2 text-blue-800">Value Proposition Preview</Title>
        <Text className="text-sm">
          We will deliver <strong>${quickResults.monthlyImpact.toLocaleString()}/month</strong> in measurable impact 
          through cost savings, revenue growth, and <strong>{quickResults.monthlyHours} hours</strong> of freed time. 
          Your investment of <strong>${quickResults.recommendedRetainer.toLocaleString()}/month</strong> delivers 
          <strong>{quickResults.roiPercentage.toFixed(0)}% ROI</strong>
        </Text>
      </div>
    )}
  </div>
</Card>


              </Col> 
          </Row> 
        </div> 
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
  style={{ backgroundColor: '#28a745', borderColor: '#28a745' }} // Bootstrap green
>
  Complete Package
</Button>

          
          {/* ✅ NEW: Generate New Strategy Button */}
       <Button
  type="primary"   // ✅ makes it AntD blue
  icon={<BulbOutlined />}
  onClick={() => {
    setActiveTab('calculator');
    setCurrentPackage(null);
    setSavedCalculationId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }}
  disabled={isExporting || isGenerating}
  size="middle"
  className="ml-4"
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
              {calculationsLoading && <Spin tip="Loading saved calculations..." />}
            <Table
              dataSource={calculations}
              rowKey="id"
                className="no-vertical-borders"
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
      <Button 
        size="small" 
        type="link"
        icon={viewLoadingStates[record.id] ? <Spin size="small" /> : <EyeOutlined />}
        loading={viewLoadingStates[record.id]}
            onClick={() => router.push(`/pricing-calculator/${record.id}`)}
        disabled={viewLoadingStates[record.id]}
      >
        View
      </Button>
    </Space>
  )
}
              ]}
              pagination={{ pageSize: 10 }}
                loading={calculationsLoading}
            />
          </Card>
      <Modal
  title={viewingCalculation ? `Details for ${viewingCalculation.benchmarks?.industry || 'Calculation'}` : "Calculation Details"}
  open={isViewModalVisible}
  onOk={handleViewOk}
  onCancel={handleViewCancel}
  width={1000}
  footer={null}
  className="pricing-modal"
  style={{ top: 20 }}
>
  {viewDetailLoading ? (
    <div style={{ textAlign: 'center', padding: '40px' }}>
      <Spin tip="Loading details..." size="large" />
    </div>
  ) : viewingCalculation ? (
    <div className="pricing-details-container">
      {/* Main title */}
      <div className="header-card">
        <Title level={4} className="modal-main-title">
          Calculation Details
        </Title>
      </div>
      
      {/* Key metrics in cards */}
      <div className="metrics-cards">
        <Card className="metric-card" size="small">
          <div className="metric-content">
            <div className="metric-label">Monthly Retainer</div>
            <div className="metric-value highlight">${viewingCalculation?.calculations?.recommendedRetainer?.toLocaleString() ?? 'N/A'}</div>
          </div>
        </Card>
        
        <Card className="metric-card" size="small">
          <div className="metric-content">
            <div className="metric-label">ROI</div>
            <div className="metric-value">{viewingCalculation?.calculations?.roiPercentage?.toFixed(2) ?? 'N/A'}%</div>
          </div>
        </Card>
        
        <Card className="metric-card" size="small">
          <div className="metric-content">
            <div className="metric-label">Hourly Rate</div>
            <div className="metric-value">${viewingCalculation?.calculations?.hourlyRate?.toFixed(2) ?? 'N/A'}</div>
          </div>
        </Card>
        
        <Card className="metric-card" size="small">
          <div className="metric-content">
            <div className="metric-label">Recommended Approach</div>
            <div className="metric-value">{viewingCalculation?.strategy?.recommendedApproach ?? 'N/A'}</div>
          </div>
        </Card>
      </div>
      
      {/* Pricing Options */}
      <Card className="section-card">
        <div className="section-header">
          <Title level={5} className="section-title">Pricing Options</Title>
        </div>
        <div className="pricing-options-list">
          {viewingCalculation?.calculations?.pricingOptions?.map((option, index) => (
            <Card 
              key={index} 
              className="pricing-option-card" 
              size="small"
            >
              <div className="pricing-option-content">
                <div className="pricing-option-header">
                  <Text strong>{option.model.charAt(0).toUpperCase() + option.model.slice(1)} Model</Text>
                  <div className="price-tag">${option.price?.toLocaleString()}</div>
                </div>
                <div className="pricing-option-description">
                  <Text type="secondary">{option.description}</Text>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      {/* Strategy Summary */}
      <Card className="section-card">
        <div className="section-header">
          <Title level={5} className="section-title">Strategy</Title>
        </div>
        <div className="strategy-content">
          <div className="strategy-item">
            <Text strong>Framework:</Text> {viewingCalculation?.strategy?.pricingFramework ?? 'N/A'}
          </div>
          <div className="strategy-item">
            <Text strong>Value Proposition:</Text> {viewingCalculation?.strategy?.valueProposition ?? 'N/A'}
          </div>
        </div>
      </Card>
    </div>
  ) : (
    <Card className="no-data-card">
      <div className="no-data-message">
        <Text>No data available or failed to load.</Text>
      </div>
    </Card>
  )}
</Modal>
        </TabPane>
      </Tabs>
    </div>
    
  );
};

export default PricingCalculator;