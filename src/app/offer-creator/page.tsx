        "use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  ThunderboltOutlined,
  DollarOutlined,
  PercentageOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  RocketOutlined,
  GiftOutlined,
  FileTextOutlined,
  CopyOutlined,
  DownloadOutlined,
  InfoCircleOutlined,
  BulbOutlined,
  SaveOutlined,
  HistoryOutlined,
  LineChartOutlined,
  ExperimentOutlined,
  TrophyOutlined,
  EyeOutlined,
  EditOutlined
} from '@ant-design/icons';
import { 
  Button, 
  Card, 
  Form, 
  Input, 
  Select, 
  Typography, 
  Divider, 
  Radio, 
  Space,
  Tag,
  Alert,
  Collapse,
  Popover,
  Tooltip,
  Badge,
  Switch,
  InputNumber,
  Modal,
  Tabs,
  Table,
  Statistic,
  Progress,
  List,
  Spin,
  notification,
  Row,
  Col,
  message
} from 'antd';

// Import our custom hooks
import {
  useOfferCreator,
  useSavedOffers,
  useOfferOptimization,
  useOfferAnalysis,
  useOfferPerformance,
  useOfferExport,
  useOfferBenchmarks,
  useOfferTemplates,
  useOfferValidation,
  type OfferCreatorInput,
  type GeneratedOfferPackage
} from '../hooks/useOfferCreator';

import LoadingOverlay from './LoadingOverlay';

// FIX: Define proper interface
interface Template {
  id: string;
  name: string;
  offerType: 'discount' | 'bonus' | 'trial' | 'guarantee'; // Make it more specific
  industry: string;
  headline: string;          // Add missing property
  description: string;
  conversionRate: string;    // Note: this is string, not number in OfferTemplate
  bestFor: string;           // Add missing property
  example: {                 // Note: required, not optional in OfferTemplate
    headline: string;
    subheadline: string;
    discount?: number;
    bonusValue?: string;
    trialPeriod?: number;
    guarantee?: string;
    urgency: string;
  };
}


const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;
const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

export default function OfferCreatorPage() {
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('creator');
  const [generatedOffer, setGeneratedOffer] = useState<GeneratedOfferPackage | null>(null);
  const [savedOfferId, setSavedOfferId] = useState<string | null>(null);
  const [offerType, setOfferType] = useState('discount');
  const [activePanels, setActivePanels] = useState<string[]>(['1', '2', '3']);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [analysisModalVisible, setAnalysisModalVisible] = useState(false);
  const [optimizationModalVisible, setOptimizationModalVisible] = useState(false);
  const [performanceModalVisible, setPerformanceModalVisible] = useState(false);

  // Hooks
  const { generateOffer, generating, quickValidate, calculateSavings } = useOfferCreator();
  const { offers, fetchOffers, getOffer, loading: savedOffersLoading  } = useSavedOffers();
  const { optimizeOffer, loading: optimizationLoading  } = useOfferOptimization();
  const { analyzeOffer,  loading: analysisLoading } = useOfferAnalysis();
  const { exportOffer, loading: exportLoading } = useOfferExport();
  const { benchmarks, fetchBenchmarks, loading: benchmarksLoading  } = useOfferBenchmarks();
  const { templates, fetchTemplates, applyTemplate , loading: templatesLoading } = useOfferTemplates();
  const { validateInput, getOfferInsights } = useOfferValidation();

    const isLoading = generating;

useEffect(() => {
  const loadData = async () => {
    await Promise.all([
      fetchOffers(),
      fetchBenchmarks(),
      fetchTemplates()
    ]);
  };
  loadData();
}, []); // Empty dependency if functions are stable

useEffect(() => {
  // Set initial offer type in form
  form.setFieldValue('offerType', offerType);
  
  // Auto-populate discount fields when prices change
  const formValues = form.getFieldsValue();
  if (offerType === 'discount' && formValues.regularPrice && formValues.offerPrice) {
    const discountCalc = calculateDiscountValues(formValues.regularPrice, formValues.offerPrice);
    
    // Only set if fields are empty
    if (!formValues.discountValue) {
      form.setFieldValue('discountValue', discountCalc.percentage);
    }
    if (!formValues.discountAmount) {
      form.setFieldValue('discountAmount', `$${discountCalc.amount}`);
    }
  }
}, [offerType, form]);



  const offerTypes = [
    {
      value: 'discount',
      label: 'Discount Offer',
      description: 'Percentage or fixed amount off',
      icon: <PercentageOutlined />,
      effectiveness: 'High (58% conversion)',
      bestFor: 'Price-sensitive customers'
    },
    {
      value: 'bonus',
      label: 'Bonus Offer',
      description: 'Add extra value at same price',
      icon: <GiftOutlined />,
      effectiveness: 'Very High (62% conversion)',
      bestFor: 'Value-focused customers'
    },
    {
      value: 'trial',
      label: 'Trial Offer',
      description: 'Limited-time access or sample',
      icon: <CalendarOutlined />,
      effectiveness: 'Medium (45% conversion)',
      bestFor: 'New customer acquisition'
    },
    {
      value: 'guarantee',
      label: 'Guarantee Offer',
      description: 'Risk reversal with strong promise',
      icon: <CheckCircleOutlined />,
      effectiveness: 'Highest (68% conversion)',
      bestFor: 'High-ticket or skeptical buyers'
    }
  ];

  const industries = [
    'B2B SaaS',
    'E-commerce',
    'Healthcare',
    'Finance',
    'Marketing Agencies',
    'Real Estate',
    'Education',
    'Manufacturing'
  ];

  const handlePriceChange = () => {
  const formValues = form.getFieldsValue();
  
  if (offerType === 'discount' && formValues.regularPrice && formValues.offerPrice) {
    const discountCalc = calculateDiscountValues(formValues.regularPrice, formValues.offerPrice);
    
    form.setFieldsValue({
      discountValue: discountCalc.percentage,
      discountAmount: `$${discountCalc.amount}`
    });
  }
};


 // FIX: Add proper error handling
const onFinish = async (values: any) => {
  try {
    console.log('Form values before processing:', values);
    
    // Ensure offer type is set
    if (!values.offerType) {
      values.offerType = offerType;
      form.setFieldValue('offerType', offerType);
    }
    
    // Auto-calculate discount values for discount offers if not provided
    if (values.offerType === 'discount') {
      const discountCalc = calculateDiscountValues(values.regularPrice, values.offerPrice);
      
      if (!values.discountValue) {
        values.discountValue = discountCalc.percentage;
      }
      if (!values.discountAmount) {
        values.discountAmount = `$${discountCalc.amount}`;
      }
      
      // Update form with calculated values
      form.setFieldsValue({
        discountValue: values.discountValue,
        discountAmount: values.discountAmount
      });
    }
    
    console.log('Final values being sent:', values);
    
    const validation = validateInput(values);
    if (!validation.isValid) {
      // Show validation errors
      Object.entries(validation.errors).forEach(([field, error]) => {
        form.setFields([{ name: field, errors: [error] }]);
      });
      notification.error({
        message: 'Validation Failed',
        description: 'Please fix the errors and try again.'
      });
      return;
    }
    
    const result = await generateOffer(values);
    if (result?.offer) {
      setGeneratedOffer(result.offer);
      setSavedOfferId(result.offerId);
      setActiveTab('results');
    }
  } catch (error) {
    console.error('Failed to generate offer:', error);
    notification.error({
      message: 'Generation Failed',
      description: 'Please try again later.'
    });
  }
};



const calculateDiscountValues = (regularPrice: string, offerPrice: string) => {
  const regular = parseFloat(regularPrice.replace(/[$,]/g, ''));
  const offer = parseFloat(offerPrice.replace(/[$,]/g, ''));
  
  if (isNaN(regular) || isNaN(offer)) return { percentage: 0, amount: 0 };
  
  const amount = regular - offer;
  const percentage = Math.round((amount / regular) * 100);
  
  return { percentage, amount };
};


 const handleTemplateApply = (template: Template) => {
    const templateData = applyTemplate(template);
    form.setFieldsValue(templateData);
    setOfferType(template.offerType);
    notification.success({
      message: 'Template Applied',
      description: `${template.name} template has been applied to your form.`
    });
  };

  const handleOptimize = async (type: 'headline' | 'cta' | 'urgency' | 'social-proof' | 'pricing') => {
    if (!savedOfferId) {
      notification.error({
        message: 'No Offer to Optimize',
        description: 'Please generate an offer first.'
      });
      return;
    }

    const result = await optimizeOffer(savedOfferId, type);
    if (result) {
      setOptimizationModalVisible(true);
      // Handle optimization results
    }
  };

  const handleAnalyze = async (text: string, type: 'conversion' | 'psychology' | 'competition') => {
    const industry = form.getFieldValue('targetIndustry');
    const result = await analyzeOffer(text, type, industry);
    if (result) {
      setAnalysisModalVisible(true);
      // Handle analysis results
    }
  };

  const handleExport = async (format: 'json' | 'html') => {
    if (!savedOfferId) {
      notification.error({
        message: 'No Offer to Export',
        description: 'Please generate an offer first.'
      });
      return;
    }
    
    await exportOffer(savedOfferId, format);
  };

const handleHistoricalExport = async (offerId: string) => {
  try {
    // Direct API call for historical offer export
    const response = await fetch(`/api/offer-creator/${offerId}/export?format=html`);
    
    if (!response.ok) {
      throw new Error(`Export failed: ${response.status} ${response.statusText}`);
    }
    
    const contentDisposition = response.headers.get('content-disposition');
    const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
    const filename = filenameMatch?.[1] || `offer-export-${offerId}.html`;

    const blob = await response.blob();
    
    // Create download link with proper cleanup
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    try {
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      message.success('Offer exported successfully');
    } finally {
      // Cleanup always happens, even if click fails
      window.URL.revokeObjectURL(url);
      if (document.body.contains(a)) {
        document.body.removeChild(a);
      }
    }
  } catch (error) {
    console.error('Export error:', error);
    message.error(error instanceof Error ? error.message : 'Export failed');
  }
};
  // Real-time form insights
  const formValues = Form.useWatch([], form);
  const savings = formValues?.regularPrice && formValues?.offerPrice 
    ? calculateSavings(formValues.regularPrice, formValues.offerPrice)
    : null;

  const insights = useMemo(() => 
  formValues ? getOfferInsights(formValues) : null, 
  [formValues, getOfferInsights]
);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">

        <LoadingOverlay visible={isLoading} />
      <div className="text-center mb-8">
        <Title level={2} className="flex items-center justify-center">
          <ThunderboltOutlined className="mr-2" />
          AI-Powered Offer Creator
        </Title>
        <Text type="secondary" className="text-lg">
          Create irresistible offers that convert with AI-powered insights and optimization
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
              <RocketOutlined />
              Creator
            </span>
          } 
          key="creator"
        >
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={16}>
              <Collapse 
                activeKey={activePanels} 
                onChange={(keys) => setActivePanels(keys as string[])}
                bordered={false}
                className="mb-6"
              >
                <Panel 
                  header={
                    <div className="flex items-center">
                      <FileTextOutlined className="mr-2" />
                      <span className="font-medium">Offer Basics</span>
                    </div>
                  } 
                  key="1"
                  extra={<Badge status="processing" text="Required" />}
                >
                  <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    initialValues={{
                      offerType: 'discount',
                      targetIndustry: 'B2B SaaS'
                    }}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Form.Item
                        name="offerName"
                        label="Offer Name"
                        rules={[{ required: true, message: 'Please name your offer!' }]}
                        tooltip="Make it clear and compelling"
                      >
                        <Input placeholder="e.g., Summer Growth Bundle" />
                      </Form.Item>
                      <Form.Item
                        name="offerValue"
                        label="Offer Value Proposition"
                        rules={[{ required: true, message: 'What value does this provide?' }]}
                        tooltip="What problem does this solve?"
                      >
                        <Input placeholder="e.g., 3x your leads in 30 days" />
                      </Form.Item>
                  <Form.Item
  name="regularPrice"
  label="Regular Price"
  rules={[{ required: true, message: 'What is the normal price?' }]}
>
  <Input 
    prefix={<DollarOutlined />} 
    placeholder="e.g., $997" 
    onChange={handlePriceChange}
  />
</Form.Item>
<Form.Item
  name="offerPrice"
  label="Offer Price"
  rules={[{ required: true, message: 'What is the special price?' }]}
>
  <Input 
    prefix={<DollarOutlined />} 
    placeholder="e.g., $497" 
    onChange={handlePriceChange}
  />
</Form.Item>
                      <Form.Item
                        name="expiryDate"
                        label="Offer Expiry Date"
                        rules={[{ required: true, message: 'When does this offer end?' }]}
                      >
                        <Input type="date" />
                      </Form.Item>
                      <Form.Item
                        name="targetIndustry"
                        label="Target Industry"
                        rules={[{ required: true, message: 'Who is this for?' }]}
                      >
                        <Select 
                          showSearch
                          placeholder="Select industry"
                          options={industries.map(ind => ({ value: ind, label: ind }))}
                        />
                      </Form.Item>
                    </div>
                  </Form>
                </Panel>

                <Panel 
                  header={
                    <div className="flex items-center">
                      <BulbOutlined className="mr-2" />
                      <span className="font-medium">Offer Strategy</span>
                    </div>
                  } 
                  key="2"
                >
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <Text strong>Select your offer type:</Text>
                        <Text type="secondary" className="block">
                          Different approaches work better for different goals
                        </Text>
                      </div>
                      <Button 
                        icon={<TrophyOutlined />}
                        onClick={() => {
                          Modal.info({
                            title: 'Quick Templates',
                            width: 800,
                            content: (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                {templates.slice(0, 4).map((template: any) => (
                                  <Card 
                                    key={template.id}
                                    hoverable
                                    onClick={() => handleTemplateApply(template)}
                                    size="small"
                                  >
                                    <div className="text-center">
                                      <Title level={5}>{template.name}</Title>
                                      <Text type="secondary">{template.description}</Text>
                                      <div className="mt-2">
                                        <Tag color="blue">{template.offerType}</Tag>
                                        <Tag color="green">{template.industry}</Tag>
                                      </div>
                                    </div>
                                  </Card>
                                ))}
                              </div>
                            )
                          });
                        }}
                      >
                        Use Template
                      </Button>
                    </div>
                  </div>
                  
             <Form.Item
  name="offerType"
  rules={[{ required: true, message: 'Please select an offer type!' }]}
>
  <Radio.Group
    value={offerType}
    onChange={(e) => {
      const newType = e.target.value;
      setOfferType(newType);
      form.setFieldValue('offerType', newType);
    }}
  >
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {offerTypes.map((type) => (
        <Radio.Button
          key={type.value}
          value={type.value}
          className="h-auto p-0 border-0"
        >
          <Card
            className={`cursor-pointer ${offerType === type.value ? 'border-blue-500 border-2 ' : 'border-gray-300'} transition-none`}
          >
            <div className="flex items-start">
              <div className="p-2  rounded-full mr-3">
                {type.icon}
              </div>
              <div>
                <div className="font-medium">{type.label}</div>
                <div className="text-gray-500 text-sm mb-2">{type.description}</div>
                <div className="flex flex-wrap gap-2">
                  <Tag color="blue">{type.effectiveness}</Tag>
                  <Tag color="geekblue">{type.bestFor}</Tag>
                </div>
              </div>
            </div>
          </Card>
        </Radio.Button>
      ))}
    </div>
  </Radio.Group>
</Form.Item>

                  <Divider />

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {offerType === 'discount' && (
    <>
      <Form.Item
        name="discountValue"
        label="Discount Percentage"
        rules={[{ required: true, message: 'Please enter discount percentage!' }]}
        tooltip="Auto-calculated from your prices, but you can adjust"
      >
        <InputNumber 
          min={1}
          max={99}
          suffix="%"
          style={{ width: '100%' }}
          placeholder={
            formValues?.regularPrice && formValues?.offerPrice 
              ? calculateDiscountValues(formValues.regularPrice, formValues.offerPrice).percentage.toString()
              : "25"
          }
          onChange={(value) => {
            if (value && formValues?.regularPrice) {
              const regular = parseFloat(formValues.regularPrice.replace(/[$,]/g, ''));
              const discountAmount = Math.round((regular * value) / 100);
              form.setFieldValue('discountAmount', `$${discountAmount}`);
            }
          }}
        />
      </Form.Item>
      <Form.Item
        name="discountAmount"
        label="Discount Amount"
        rules={[{ required: true, message: 'Discount amount is required!' }]}
        tooltip="Auto-calculated from percentage, but you can adjust"
      >
        <Input 
          prefix={<DollarOutlined />} 
          placeholder={
            formValues?.regularPrice && formValues?.offerPrice 
              ? `$${calculateDiscountValues(formValues.regularPrice, formValues.offerPrice).amount}`
              : "e.g., $500"
          }
          onChange={(e) => {
            const amount = parseFloat(e.target.value.replace(/[$,]/g, ''));
            if (amount && formValues?.regularPrice) {
              const regular = parseFloat(formValues.regularPrice.replace(/[$,]/g, ''));
              const percentage = Math.round((amount / regular) * 100);
              form.setFieldValue('discountValue', percentage);
            }
          }}
        />
      </Form.Item>
      
      {/* Auto-calculated preview */}
      {formValues?.regularPrice && formValues?.offerPrice && (
        <div className="col-span-2">
          <Alert
            type="info"
            showIcon
            message="Auto-calculated Values"
            description={
              <div className="text-sm">
                <div>Discount: {calculateDiscountValues(formValues.regularPrice, formValues.offerPrice).percentage}% (${calculateDiscountValues(formValues.regularPrice, formValues.offerPrice).amount})</div>
                <div>You can edit these values above if needed</div>
              </div>
            }
          />
        </div>
      )}
    </>
  )}
  
  {offerType === 'bonus' && (
    <>
      <Form.Item
        name="bonusItem"
        label="Bonus Item Name"
        rules={[{ required: true, message: 'Please enter bonus item name!' }]}
        tooltip="What additional value are you including?"
      >
        <Input placeholder="e.g., Free Consulting Session" />
      </Form.Item>
      <Form.Item
        name="bonusValue"
        label="Bonus Value"
        rules={[{ required: true, message: 'Please enter bonus value!' }]}
        tooltip="What's the value of this bonus?"
      >
        <Input prefix={<DollarOutlined />} placeholder="e.g., $300" />
      </Form.Item>
      <Form.Item
        name="totalValue"
        label="Total Package Value"
        rules={[{ required: true, message: 'Please enter total value!' }]}
        tooltip="Main product + bonus value"
      >
        <Input prefix={<DollarOutlined />} placeholder="e.g., $1,297" />
      </Form.Item>
      
      {/* Auto-calculated preview for bonus */}
      {formValues?.bonusValue && formValues?.regularPrice && (
        <div className="col-span-2">
          <Alert
            type="info"
            showIcon
            message="Package Value Preview"
            description={
              <div className="text-sm">
                <div>Main Product: {formValues.regularPrice}</div>
                <div>Bonus Value: {formValues.bonusValue}</div>
                <div><strong>Total Package Value: ${
                  (parseFloat(formValues.regularPrice.replace(/[$,]/g, '')) + 
                   parseFloat((formValues.bonusValue || '0').replace(/[$,]/g, ''))).toLocaleString()
                }</strong></div>
              </div>
            }
          />
        </div>
      )}
    </>
  )}
  
  {offerType === 'trial' && (
    <>
      <Form.Item
        name="trialPeriod"
        label="Trial Period (Days)"
        rules={[{ required: true, message: 'Please enter trial period!' }]}
        tooltip="How long is the trial period?"
      >
        <InputNumber 
          min={1}
          max={365}
          placeholder="14"
          style={{ width: '100%' }}
        />
      </Form.Item>
      
      {/* Trial preview */}
      {formValues?.trialPeriod && (
        <div className="col-span-2">
          <Alert
            type="info"
            showIcon
            message="Trial Details"
            description={
              <div className="text-sm">
                <div>{formValues.trialPeriod} day trial period</div>
                <div>Perfect for building trust and demonstrating value</div>
              </div>
            }
          />
        </div>
      )}
    </>
  )}
  
  {offerType === 'guarantee' && (
    <>
      <Form.Item
        name="guaranteePeriod"
        label="Guarantee Period (Days)"
        rules={[{ required: true, message: 'Please enter guarantee period!' }]}
        tooltip="How long is the guarantee valid?"
      >
        <InputNumber 
          min={1}
          max={365}
          placeholder="30"
          style={{ width: '100%' }}
        />
      </Form.Item>
      
      {/* Guarantee preview */}
      {formValues?.guaranteePeriod && (
        <div className="col-span-2">
          <Alert
            type="success"
            showIcon
            message="Risk Reversal"
            description={
              <div className="text-sm">
                <div>{formValues.guaranteePeriod} day money-back guarantee</div>
                <div>Removes risk and builds customer confidence</div>
              </div>
            }
          />
        </div>
      )}
    </>
  )}
</div>
                </Panel>

                <Panel 
                  header={
                    <div className="flex items-center">
                      <RocketOutlined className="mr-2" />
                      <span className="font-medium">Conversion Boosters</span>
                    </div>
                  } 
                  key="3"
                >
                  <div className="flex justify-between items-center mb-4">
                    <Text strong>Advanced Options</Text>
                    <Switch
                      checkedChildren="Advanced"
                      unCheckedChildren="Basic"
                      checked={showAdvanced}
                      onChange={setShowAdvanced}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Form.Item
                      name="cta"
                      label="Call-to-Action Text"
                      tooltip="What action do you want them to take?"
                    >
                      <Input placeholder="e.g., Claim Your Spot Now" />
                    </Form.Item>
                    <Form.Item
                      name="redemptionInstructions"
                      label="Redemption Instructions"
                    >
                      <Input placeholder="How to claim the offer" />
                    </Form.Item>
                  </div>

                  <Divider />

                  <Form.Item
                    name="scarcity"
                    label="Add Scarcity?"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>

                  <Form.Item
                    noStyle
                    shouldUpdate={(prevValues, currentValues) => prevValues.scarcity !== currentValues.scarcity}
                  >
                    {({ getFieldValue }) => getFieldValue('scarcity') ? (
                      <Form.Item
                        name="scarcityReason"
                        label="Scarcity Reason"
                        rules={[{ required: true }]}
                      >
                        <Input placeholder="e.g., Only 10 spots available" />
                      </Form.Item>
                    ) : null}
                  </Form.Item>

                  <Divider />

                  <Form.Item
                    name="socialProof"
                    label="Add Social Proof?"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>

                  <Form.Item
                    noStyle
                    shouldUpdate={(prevValues, currentValues) => prevValues.socialProof !== currentValues.socialProof}
                  >
                    {({ getFieldValue }) => getFieldValue('socialProof') ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Form.Item
                          name="testimonialQuote"
                          label="Testimonial Quote"
                          rules={[{ required: true }]}
                        >
                          <TextArea rows={3} placeholder="What did your customer say?" />
                        </Form.Item>
                        <Form.Item
                          name="testimonialAuthor"
                          label="Testimonial Author"
                          rules={[{ required: true }]}
                        >
                          <Input placeholder="Customer name and title" />
                        </Form.Item>
                      </div>
                    ) : null}
                  </Form.Item>

                  {showAdvanced && (
                    <>
                      <Divider>Advanced Settings</Divider>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Form.Item
                          name="businessGoal"
                          label="Business Goal"
                        >
                          <Select placeholder="Select goal">
                            <Option value="lead-generation">Lead Generation</Option>
                            <Option value="sales">Sales</Option>
                            <Option value="retention">Retention</Option>
                            <Option value="upsell">Upsell</Option>
                            <Option value="brand-awareness">Brand Awareness</Option>
                          </Select>
                        </Form.Item>
                        
                        <Form.Item
                          name="customerSegment"
                          label="Customer Segment"
                        >
                          <Select placeholder="Select segment">
                            <Option value="new">New Customers</Option>
                            <Option value="existing">Existing Customers</Option>
                            <Option value="churned">Churned Customers</Option>
                            <Option value="high-value">High-Value Customers</Option>
                          </Select>
                        </Form.Item>
                      </div>

                      <Form.Item
                        name="seasonality"
                        label="Seasonal Context"
                      >
                        <Input placeholder="e.g., Black Friday, Back to School" />
                      </Form.Item>

                      <Form.Item
                        name="competitorAnalysis"
                        label="Competitor Analysis"
                      >
                        <TextArea 
                          rows={3} 
                          placeholder="What are competitors doing? How will you differentiate?"
                        />
                      </Form.Item>
                    </>
                  )}
                </Panel>
              </Collapse>

              <div className="text-center mt-6">
             <Button
  type="primary"
  size="large"
  htmlType="submit"
  loading={generating}
  icon={<RocketOutlined />}
  onClick={() => form.submit()}
  className="min-w-48"
  disabled={isLoading}
>
  {generating ? 'Generating AI Offer...' : 'Generate Offer'}
</Button>
              </div>
            </Col>

            <Col xs={24} lg={8}>
              {/* Live Preview Card */}
              <Card className="mb-6">
                <Title level={5} className="flex items-center">
                  <EyeOutlined className="mr-2" />
                  Live Preview
                </Title>
                
                {savings && (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg">
                      <Statistic
                        title="Your Savings"
                        value={savings.dollarAmount}
                        precision={0}
                        prefix="$"
                        suffix={`(${savings.percentage}% off)`}
                        valueStyle={{ color: '#3f8600', fontSize: '1.2em' }}
                      />
                    </div>
                    
                    {insights && (
                      <div>
                        <Title level={5}>Offer Insights</Title>
                        <Space direction="vertical" className="w-full">
                          <Tag color={insights.pricing.pricePoint === 'high-ticket' ? 'gold' : 'blue'}>
                            {insights.pricing.pricePoint.toUpperCase()} Pricing
                          </Tag>
                          
                          <Progress 
                            percent={Math.min(100, insights.pricing.discountPercentage)} 
                            status={insights.pricing.discountPercentage > 50 ? 'exception' : 'active'}
                            format={() => `${insights.pricing.discountPercentage}% Discount`}
                          />
                          
                          <div className="text-sm space-y-1">
                            <div>🗓️ Expires in {insights.urgency.daysUntilExpiry} days</div>
                            <div>🛡️ Trust factors: {[
                              insights.trust.hasSocialProof && 'Social Proof',
                              insights.trust.hasGuarantee && 'Guarantee',
                              insights.trust.hasTestimonial && 'Testimonial'
                            ].filter(Boolean).join(', ') || 'None'}</div>
                          </div>
                          
                          {insights.recommendations.length > 0 && (
                            <div>
                              <Text strong className="text-orange-600">Recommendations:</Text>
                              <ul className="mt-1 text-sm">
                                {insights.recommendations.slice(0, 3).map((rec, idx) => (
                                  <li key={idx}>• {rec}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </Space>
                      </div>
                    )}
                  </div>
                )}
                
                {!savings && (
                  <div className="text-center text-gray-400 py-8">
                    <BulbOutlined style={{ fontSize: '2em' }} />
                    <div className="mt-2">Fill in prices to see live preview</div>
                  </div>
                )}
              </Card>

              {/* Benchmarks Card */}
              {benchmarks && (
                <Card>
                  <Title level={5} className="flex items-center">
                    <TrophyOutlined className="mr-2" />
                    Industry Benchmarks
                  </Title>
                  
                  {benchmarks.industrySpecific && formValues?.targetIndustry && (
                    <div className="space-y-3">
                      <Text strong>Conversion Rates for {formValues.targetIndustry}:</Text>
                      <div className="bg-gray-50 p-3 rounded">
                        <div className="flex justify-between text-sm">
                          <span>Low</span>
                          <span>Average</span>
                          <span>High</span>
                        </div>
                        <div className="flex justify-between font-medium">
                          <span>{benchmarks.industrySpecific.conversionRate?.min}%</span>
                          <span className="text-blue-600">{benchmarks.industrySpecific.conversionRate?.average}%</span>
                          <span>{benchmarks.industrySpecific.conversionRate?.max}%</span>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              )}
            </Col>
          </Row>
        </TabPane>

        <TabPane 
          tab={
            <span>
              <FileTextOutlined />
              Results
              {generatedOffer && <Badge dot style={{ marginLeft: 8 }} />}
            </span>
          } 
          key="results"
          disabled={!generatedOffer}
        >
          {generatedOffer ? (
            <div className="space-y-6">
              {/* Action Bar */}
              <Card>
                <div className="flex justify-between items-center">
                  <Title level={4}>Your AI-Generated Offer</Title>
                  <Space>
                    <Button 
                      icon={<ExperimentOutlined />} 
                      onClick={() => setOptimizationModalVisible(true)}
                          disabled={isLoading}
                    >
                      Optimize
                    </Button>
                    <Button 
                      icon={<LineChartOutlined />} 
                      onClick={() => setAnalysisModalVisible(true)}
                        disabled={isLoading}
                    >
                      Analyze
                    </Button>
                    <Button 
                      icon={<CopyOutlined />}
                      onClick={() => {
                        if (generatedOffer?.primaryOffer?.mainCopy) {
                          navigator.clipboard.writeText(generatedOffer.primaryOffer.mainCopy);
                          message.success('Copied to clipboard!');
                        }
                      }}
                    >
                      Copy
                    </Button>
                    <Button 
                      icon={<DownloadOutlined />}
                      onClick={() => handleExport('html')}
                    >
                      Export HTML
                    </Button>
                    <Button 
                      type="primary"
                      icon={<SaveOutlined />}
                      onClick={() => handleExport('json')}
                    >
                      Save Package
                    </Button>
                  </Space>
                </div>
              </Card>

              {/* Main Offer Display */}
              <Card>
                <div className="text-center space-y-4">
                  <Title level={2} className="text-blue-600">
                    {generatedOffer.primaryOffer?.headline || 'No headline generated'}
                  </Title>
                  <Title level={3} type="secondary">
                    {generatedOffer.primaryOffer?.subheadline || 'No subheadline generated'}
                  </Title>
                  <Paragraph className="text-lg">
                    {generatedOffer.primaryOffer?.mainCopy || 'No main copy generated'}
                  </Paragraph>
                  
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <Title level={4}>Key Benefits:</Title>
                    <ul className="text-left max-w-2xl mx-auto">
                      {generatedOffer.primaryOffer.bulletPoints.map((point, index) => (
                        <li key={index} className="mb-2">✓ {point}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="flex justify-center space-x-4 mt-6">
                    <Button type="primary" size="large" className="min-w-32">
                      {generatedOffer.primaryOffer?.cta || 'Get Started'}
                    </Button>
                  </div>
                  
                  <Alert
                    message={generatedOffer.primaryOffer?.urgency || 'Limited time offer'}
                    type="warning"
                    showIcon
                    className="max-w-2xl mx-auto"
                  />
                  
                  <Text type="secondary" className="block">
                    {generatedOffer.primaryOffer?.socialProof || 'Trusted by customers worldwide'}
                  </Text>
                </div>
              </Card>

              {/* Performance Metrics */}
              <Card title="Performance Analysis">
                <Row gutter={24}>
                  <Col span={6}>
                    <Statistic
                      title="Conversion Score"
                      value={generatedOffer.analysis?.conversionPotential?.score || 0}
                      precision={0}
                      suffix="%"
                      valueStyle={{ color: '#3f8600', fontSize: '1.5em' }}
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic
                      title="Market Relevance"
                      value={generatedOffer.analysis?.marketFit?.industryRelevance || 0}
                      precision={0}
                      suffix="%"
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic
                      title="Emotional Appeal"
                      value={generatedOffer.analysis?.psychologyFactors?.emotionalAppeal || 0}
                      precision={0}
                      suffix="/100"
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic
                      title="Expected CVR"
                      value={generatedOffer.performanceMetrics?.expectedConversionRate || 'N/A'}
                    />
                  </Col>
                </Row>
              </Card>

              {/* Marketing Assets */}
              <Collapse>
                <Panel header="Email Subject Lines" key="email">
                  <List
                    dataSource={generatedOffer.primaryOffer.emailSubjectLines || []}
                    renderItem={(subject: string, index: number) => (
                      <List.Item
                        actions={[
                          <Button 
                            key="copy"
                            type="link"
                            onClick={() => {
                              navigator.clipboard.writeText(subject);
                              message.success('Subject line copied!');
                            }}
                          >
                            Copy
                          </Button>
                        ]}
                      >
                        <Text strong>#{index + 1}:</Text> {subject}
                      </List.Item>
                    )}
                  />
                </Panel>

                <Panel header="Social Media Captions" key="social">
                  <List
                    dataSource={generatedOffer.primaryOffer.socialMediaCaptions || []}
                    renderItem={(caption: string, index: number) => (
                      <List.Item
                        actions={[
                          <Button 
                            key="copy"
                            type="link"
                            onClick={() => {
                              navigator.clipboard.writeText(caption);
                              message.success('Caption copied!');
                            }}
                          >
                            Copy
                          </Button>
                        ]}
                      >
                        <div>
                          <Text strong>Variation {index + 1}:</Text>
                          <div className="mt-2 p-3 bg-gray-50 rounded">
                            {caption}
                          </div>
                        </div>
                      </List.Item>
                    )}
                  />
                </Panel>

                <Panel header="Marketing Assets" key="assets">
                  <Tabs type="card">
                    <TabPane tab="Landing Page" key="landing">
                      <div className="bg-gray-50 p-4 rounded">
                        <pre className="whitespace-pre-wrap font-sans">
                          {generatedOffer.marketingAssets?.landingPageCopy || 'No landing page copy generated'}
                        </pre>
                      </div>
                    </TabPane>

                    <TabPane tab="Email Sequence" key="sequence">
                      <List
                        dataSource={generatedOffer.marketingAssets?.emailSequence || []}
                        renderItem={(email: any) => (
                          <List.Item>
                            <Card size="small" className="w-full">
                              <div className="flex justify-between items-start mb-2">
                                <Title level={5}>Day {email?.day || 0}: {email?.subject || 'No subject'}</Title>
                                <Tag color="blue">{email?.purpose || 'General'}</Tag>
                              </div>
                              <Paragraph>{email?.content || 'No content available'}</Paragraph>
                            </Card>
                          </List.Item>
                        )}
                      />
                    </TabPane>

                    <TabPane tab="Ad Creatives" key="ads">
                      <List
                        dataSource={generatedOffer.marketingAssets?.adCreatives || []}
                        renderItem={(ad: any) => (
                          <List.Item>
                            <Card size="small" className="w-full">
                              <div className="flex justify-between items-start mb-2">
                                <Title level={5}>{ad?.platform || 'Platform'} - {ad?.format || 'Format'}</Title>
                                <Tag color="green">{ad?.cta || 'CTA'}</Tag>
                              </div>
                              <div>
                                <Text strong>Headline:</Text> {ad?.headline || 'No headline'}
                              </div>
                              <div>
                                <Text strong>Description:</Text> {ad?.description || 'No description'}
                              </div>
                            </Card>
                          </List.Item>
                        )}
                      />
                    </TabPane>
                  </Tabs>
                </Panel>

                <Panel header="Optimization Suggestions" key="optimize">
                  <List
                    dataSource={generatedOffer.analysis?.optimizationSuggestions || []}
                    renderItem={(suggestion: any) => (
                      <List.Item>
                        <Card size="small" className="w-full">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <Title level={5}>{suggestion?.area || 'Optimization Area'}</Title>
                              <Paragraph>{suggestion?.suggestion || 'No suggestion available'}</Paragraph>
                              <div className="flex space-x-4 text-sm">
                                <Text><strong>Impact:</strong> {suggestion?.expectedImpact || 'Not specified'}</Text>
                                <Text><strong>Difficulty:</strong> {suggestion?.difficulty || 'Not specified'}</Text>
                              </div>
                            </div>
                            <Button 
                              type="primary" 
                              size="small"
                              onClick={() => {
                                const optimizationType = suggestion?.area?.toLowerCase();
                                if (['headline', 'cta', 'urgency', 'social-proof', 'pricing'].includes(optimizationType)) {
                                  handleOptimize(optimizationType as 'headline' | 'cta' | 'urgency' | 'social-proof' | 'pricing');
                                }
                              }}
                            >
                              Apply
                            </Button>
                          </div>
                        </Card>
                      </List.Item>
                    )}
                  />
                </Panel>

                <Panel header="Alternative Offers" key="alternatives">
                  <List
                    dataSource={generatedOffer.variations?.alternatives || []}
                    renderItem={(alternative: any) => (
                      <List.Item>
                        <Card size="small" className="w-full">
                          <Title level={5}>{alternative?.type || 'Alternative Offer'}: {alternative?.headline || 'No headline'}</Title>
                          <Paragraph>{alternative?.description || 'No description available'}</Paragraph>
                          <div className="flex justify-between items-center mt-3">
                            <div>
                              <Text strong>Expected Performance:</Text> {alternative?.expectedPerformance || 'Not specified'}
                            </div>
                            <div>
                              <Text strong>Best for:</Text> {alternative?.useCases?.join(', ') || 'Not specified'}
                            </div>
                          </div>
                        </Card>
                      </List.Item>
                    )}
                  />
                </Panel>

                <Panel header="Upsell Opportunities" key="upsells">
                  <List
                    dataSource={generatedOffer.variations?.upsellOpportunities || []}
                    renderItem={(upsell: any) => (
                      <List.Item>
                        <Card size="small" className="w-full">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <Title level={5}>{upsell?.name || 'Upsell Opportunity'}</Title>
                              <Paragraph>{upsell?.description || 'No description available'}</Paragraph>
                              <div className="flex space-x-4 text-sm">
                                <Text><strong>Price Point:</strong> {upsell?.pricePoint || 'Not specified'}</Text>
                                <Text><strong>Timing:</strong> {upsell?.timing || 'Not specified'}</Text>
                              </div>
                            </div>
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
              <Title level={3} type="secondary">No Offer Generated Yet</Title>
              <Text type="secondary">
                Create an offer in the Creator tab to see AI-powered insights and marketing assets.
              </Text>
            </div>
          )}
        </TabPane>

        <TabPane 
          tab={
            <span>
              <HistoryOutlined />
              History
            </span>
          } 
          key="history"
        >
          <Card title="Your Saved Offers">
            <Table
              dataSource={offers}
              rowKey="id"
              columns={[
                {
                  title: 'Offer Name',
                  dataIndex: 'offerName',
                  key: 'offerName',
                  render: (text: string, record: any) => (
                    <div>
                      <Text strong>{text || 'Unnamed Offer'}</Text>
                      {record.expired && <Tag color="red" className="ml-2">Expired</Tag>}
                    </div>
                  )
                },
                {
                  title: 'Type',
                  dataIndex: 'offerType',
                  key: 'offerType',
                  render: (text: string) => text ? <Tag color="blue">{text}</Tag> : '-'
                },
                {
                  title: 'Industry',
                  dataIndex: 'targetIndustry',
                  key: 'targetIndustry',
                  render: (text: string) => text ? <Tag color="green">{text}</Tag> : '-'
                },
                {
                  title: 'Conversion Score',
                  dataIndex: 'conversionScore',
                  key: 'conversionScore',
                  render: (score: number) => score ? (
                    <Progress 
                      percent={score} 
                      size="small" 
                      status={score >= 70 ? 'success' : score >= 50 ? 'active' : 'exception'}
                    />
                  ) : '-'
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
                      <Button 
                        size="small" 
                        type="link"
                        onClick={() => {
                          getOffer(record.id).then(offer => {
                            if (offer) {
                              setGeneratedOffer(offer.offer);
                              setSavedOfferId(record.id);
                              setActiveTab('results');
                            }
                          });
                        }}
                      >
                        View
                      </Button>
                      <Button 
                        size="small" 
                        type="link"
                          onClick={() => handleHistoricalExport(record.id)}

                            disabled={isLoading}
                      >
                        Export
                      </Button>
                      <Button 
                        size="small" 
                        type="link" 
                        onClick={() => setPerformanceModalVisible(true)}
                          disabled={isLoading}
                      >
                        Performance
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

      {/* Modals */}
      <Modal
        title="Offer Analysis"
        open={analysisModalVisible}
        onCancel={() => setAnalysisModalVisible(false)}
        footer={null}
        width={800}
      >
        <div className="space-y-4">
          <Text>Analyze your offer for different aspects:</Text>
          <div className="grid grid-cols-3 gap-4">
            <Button 
              onClick={() => generatedOffer?.primaryOffer?.mainCopy && handleAnalyze(generatedOffer.primaryOffer.mainCopy, 'conversion')}
              block
            >
              Conversion Analysis
            </Button>
            <Button 
              onClick={() => generatedOffer?.primaryOffer?.mainCopy && handleAnalyze(generatedOffer.primaryOffer.mainCopy, 'psychology')}
              block
            >
              Psychology Analysis
            </Button>
            <Button 
              onClick={() => generatedOffer?.primaryOffer?.mainCopy && handleAnalyze(generatedOffer.primaryOffer.mainCopy, 'competition')}
              block
            >
              Competitive Analysis
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        title="Offer Optimization"
        open={optimizationModalVisible}
        onCancel={() => setOptimizationModalVisible(false)}
        footer={null}
        width={800}
      >
        <div className="space-y-4">
          <Text>Optimize specific elements of your offer:</Text>
          <div className="grid grid-cols-2 gap-4">
            <Button onClick={() => handleOptimize('headline')} block>
              Optimize Headline
            </Button>
            <Button onClick={() => handleOptimize('cta')} block>
              Optimize CTA
            </Button>
            <Button onClick={() => handleOptimize('urgency')} block>
              Optimize Urgency
            </Button>
            <Button onClick={() => handleOptimize('social-proof')} block>
              Optimize Social Proof
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        title="Performance Tracking"
        open={performanceModalVisible}
        onCancel={() => setPerformanceModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form layout="vertical">
          <div className="grid grid-cols-2 gap-4">
            <Form.Item label="Views" name="views">
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="Clicks" name="clicks">
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="Conversions" name="conversions">
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="Revenue" name="revenue">
              <InputNumber min={0} prefix="$" style={{ width: '100%' }} />
            </Form.Item>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item label="Start Date" name="startDate">
              <Input type="date" />
            </Form.Item>
            <Form.Item label="End Date" name="endDate">
              <Input type="date" />
            </Form.Item>
          </div>
          <Button type="primary" block>
            Update Performance
          </Button>
        </Form>
      </Modal>
    </div>
  );
}     