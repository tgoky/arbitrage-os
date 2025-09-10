// app/lead-generation/create/page.tsx
"use client";
import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Select,
  Button,
  Card,
  Row,
  Col,
  Typography,
  Space,
  Divider,
  message,
  Steps,
  InputNumber,
  Alert,
  Statistic,
  Tag,
  Checkbox,
  Radio,
  Tooltip,
  Progress
} from 'antd';
import {
  ArrowLeftOutlined,
  ThunderboltOutlined,
  InfoCircleOutlined,
  GlobalOutlined,
  CreditCardOutlined,
  GiftOutlined,
  LoadingOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useTheme } from '../../../providers/ThemeProvider';
import { useWorkspaceContext } from '../../hooks/useWorkspaceContext';

const { Title, Text } = Typography;
const { Option } = Select;

// Updated industries list
const industries = [
  'Technology', 'SaaS', 'Healthcare', 'Finance', 'Education', 'Manufacturing',
  'Retail', 'E-commerce', 'Real Estate', 'Hospitality', 'Transportation', 
  'Energy', 'Media', 'Telecommunications', 'Agriculture', 'Construction', 
  'Pharmaceuticals', 'Consulting', 'Marketing', 'Legal Services'
];

// Updated job titles for better targeting
const jobTitles = [
  'CEO', 'CTO', 'CFO', 'CMO', 'COO', 'President', 'Founder',
  'VP of Sales', 'VP of Marketing', 'VP of Engineering', 'VP of Operations',
  'Sales Director', 'Marketing Director', 'IT Director', 'Operations Director',
  'Product Manager', 'Sales Manager', 'Marketing Manager', 'IT Manager',
  'Business Development Manager', 'Account Executive', 'Head of Sales',
  'Head of Marketing', 'Head of Engineering', 'Head of Operations'
];

// Updated locations list
const locations = [
  'United States', 'Canada', 'United Kingdom', 'Germany', 'France', 'Australia',
  'New Zealand', 'Netherlands', 'Sweden', 'Norway', 'Denmark', 'Switzerland',
  'Singapore', 'Japan', 'South Korea', 'India', 'Brazil', 'Mexico', 'Spain', 
  'Italy', 'Ireland', 'Belgium', 'Austria', 'Israel', 'United Arab Emirates'
];

// Technologies list for advanced targeting
const technologies = [
  'salesforce', 'hubspot', 'pipedrive', 'zoho_crm', 'microsoft_dynamics',
  'google_analytics', 'google_ads', 'facebook_ads', 'linkedin_ads',
  'mailchimp', 'constant_contact', 'sendgrid', 'stripe', 'paypal',
  'shopify', 'woocommerce', 'magento', 'wordpress', 'squarespace',
  'aws', 'google_cloud', 'microsoft_azure', 'docker', 'kubernetes'
];

interface LeadGenerationCriteria {
  targetIndustry: string[];
  targetRole: string[];
  companySize: string[];
  location: string[];
  keywords?: string[];
  technologies?: string[];
  revenueRange?: {
    min?: number;
    max?: number;
  };
  leadCount: number;
  requirements?: string[];
}

const CampaignCreatePage = () => {
  const { theme } = useTheme();
  const router = useRouter();
  const { currentWorkspace, getWorkspaceScopedEndpoint } = useWorkspaceContext();
  const [form] = Form.useForm();
  
  // Form state
  const [currentStep, setCurrentStep] = useState(0);
  const [leadCount, setLeadCount] = useState(10);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generatedLeads, setGeneratedLeads] = useState<any[]>([]);
  const [generationComplete, setGenerationComplete] = useState(false);
  const [isAdvancedVisible, setIsAdvancedVisible] = useState(false);
  
  // Mock credit data - replace with actual user data
  const [userCredits] = useState(1000);
  const [freeLeadsUsed] = useState(2);
  const FREE_LEADS_LIMIT = 5;
  const COST_PER_LEAD = 1; // Apollo API calls cost
  
  const availableFreeLeads = Math.max(0, FREE_LEADS_LIMIT - freeLeadsUsed);
  const hasFreeLeads = availableFreeLeads > 0;
  const [usingFreeLeads, setUsingFreeLeads] = useState(hasFreeLeads);
  
  // Calculate estimated cost
  const estimatedCost = usingFreeLeads && hasFreeLeads
    ? Math.max(0, leadCount - availableFreeLeads) * COST_PER_LEAD
    : leadCount * COST_PER_LEAD;

  const steps = [
    {
      title: 'Target Criteria',
      content: 'Define your target audience',
    },
    {
      title: 'Lead Settings',
      content: 'Configure lead generation settings',
    },
    {
      title: 'Generate Leads',
      content: 'Generate and review your leads',
    }
  ];

  const handleNext = () => {
    if (currentStep === 1) {
      // Validate credits before proceeding to generation
      if (estimatedCost > userCredits && !(usingFreeLeads && hasFreeLeads)) {
        message.error('Not enough credits for this lead generation');
        return;
      }
    }
    setCurrentStep(currentStep + 1);
  };

  const handlePrev = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleLeadCountChange = (value: number | null) => {
    if (value !== null) {
      setLeadCount(Math.min(Math.max(value, 1), 1000));
    }
  };

  const generateLeads = async (values: any) => {
    if (!currentWorkspace?.id) {
      message.error('No workspace selected');
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(10);

    try {
      const criteria: LeadGenerationCriteria = {
        targetIndustry: values.targetIndustry,
        targetRole: values.targetRole,
        companySize: values.companySize || [],
        location: values.location || [],
        keywords: values.keywords || [],
        technologies: values.technologies || [],
        revenueRange: values.revenueMin || values.revenueMax ? {
          min: values.revenueMin ? parseInt(values.revenueMin) : undefined,
          max: values.revenueMax ? parseInt(values.revenueMax) : undefined
        } : undefined,
        leadCount,
        requirements: values.requirements || []
      };

      setGenerationProgress(30);

      const endpoint = getWorkspaceScopedEndpoint('/api/lead-generation');
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspaceId: currentWorkspace.id,
          criteria,
          campaignName: values.campaignName || `Lead Generation - ${new Date().toLocaleDateString()}`
        })
      });

      setGenerationProgress(70);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate leads');
      }

      const data = await response.json();
      
      if (data.success) {
        setGeneratedLeads(data.data.leads);
        setGenerationProgress(100);
        setGenerationComplete(true);
        message.success(`Successfully generated ${data.data.leads.length} leads!`);
      } else {
        throw new Error(data.error || 'Lead generation failed');
      }

    } catch (error) {
      console.error('Lead generation error:', error);
      message.error(error instanceof Error ? error.message : 'Failed to generate leads');
    } finally {
      setIsGenerating(false);
    }
  };

  const onFinish = async (values: any) => {
    await generateLeads(values);
  };

  const navigateToLeads = () => {
    router.push('/lead-generation');
  };

  // Step 1: Target Criteria
  const stepOneContent = (
    <div className="space-y-6">
      <Text>Define your target audience criteria. The more specific you are, the better quality leads you will generate.</Text>
      
      <Title level={5}>Core Targeting</Title>
      <Row gutter={24}>
        <Col span={12}>
          <Form.Item
            name="targetIndustry"
            label="Target Industries"
            rules={[{ required: true, message: 'Please select at least one industry' }]}
          >
            <Select 
              placeholder="Select industries" 
              mode="multiple"
              showSearch
              maxTagCount={3}
              optionFilterProp="children"
            >
              {industries.map(industry => (
                <Option key={industry} value={industry}>{industry}</Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="targetRole"
            label="Target Job Titles"
            rules={[{ required: true, message: 'Please select at least one job title' }]}
          >
            <Select 
              placeholder="Select job titles" 
              mode="multiple"
              showSearch
              maxTagCount={3}
              optionFilterProp="children"
            >
              {jobTitles.map(title => (
                <Option key={title} value={title}>{title}</Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>
      
      <Row gutter={24}>
        <Col span={12}>
          <Form.Item
            name="companySize"
            label="Company Size"
          >
            <Select placeholder="Select company sizes" mode="multiple">
              <Option value="1-10">1-10 employees</Option>
              <Option value="10-50">10-50 employees</Option>
              <Option value="50-200">50-200 employees</Option>
              <Option value="200-500">200-500 employees</Option>
              <Option value="500-1000">500-1000 employees</Option>
              <Option value="1000+">1000+ employees</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="location"
            label="Geographic Locations"
          >
            <Select 
              placeholder="Select locations" 
              mode="multiple"
              showSearch
              maxTagCount={3}
            >
              {locations.map(location => (
                <Option key={location} value={location}>{location}</Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>
      
      <Form.Item
        name="keywords"
        label={
          <span>
            Keywords <Tooltip title="Keywords related to your target companies or services">
              <InfoCircleOutlined />
            </Tooltip>
          </span>
        }
      >
        <Select
          mode="tags"
          placeholder="e.g., SaaS, automation, digital transformation"
          tokenSeparators={[',']}
        />
      </Form.Item>
      
      <div className="flex justify-between items-center">
        <Title level={5}>Advanced Targeting</Title>
        <Button 
          type="link" 
          onClick={() => setIsAdvancedVisible(!isAdvancedVisible)}
        >
          {isAdvancedVisible ? 'Hide' : 'Show'} Advanced Options
        </Button>
      </div>
      
      {isAdvancedVisible && (
        <>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="revenueMin"
                label="Minimum Annual Revenue"
              >
                <InputNumber
                  placeholder="e.g., 1000000"
                  formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value!.replace(/\$\s?|(,*)/g, '')}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="revenueMax"
                label="Maximum Annual Revenue"
              >
                <InputNumber
                  placeholder="e.g., 50000000"
                  formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value!.replace(/\$\s?|(,*)/g, '')}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            name="technologies"
            label="Technologies Used"
          >
            <Select
              mode="multiple"
              placeholder="Select technologies"
              showSearch
              maxTagCount={3}
            >
              {technologies.map(tech => (
                <Option key={tech} value={tech}>
                  {tech.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </>
      )}
    </div>
  );

  // Step 2: Lead Settings
  const stepTwoContent = (
    <div className="space-y-6">
      <Title level={4}>Lead Generation Settings</Title>
      <Text>Configure how many leads you want to generate and your requirements.</Text>
      
      <Row gutter={24}>
        <Col span={12}>
          <Card>
            <Form.Item
              label="Number of Leads"
              help="Between 1 and 1000 leads"
            >
              <InputNumber
                min={1}
                max={1000}
                value={leadCount}
                onChange={handleLeadCountChange}
                style={{ width: '100%' }}
              />
            </Form.Item>
            
            {hasFreeLeads && (
              <Form.Item name="useFreeLeads" valuePropName="checked">
                <Checkbox 
                  checked={usingFreeLeads}
                  onChange={(e) => setUsingFreeLeads(e.target.checked)}
                >
                  Use my free leads first ({availableFreeLeads} available)
                </Checkbox>
              </Form.Item>
            )}
          </Card>
        </Col>
        
        <Col span={12}>
          <Card title="Cost Breakdown">
            <div className="space-y-3">
              <div className="flex justify-between">
                <Text>Lead count:</Text>
                <Text strong>{leadCount}</Text>
              </div>
              
              {usingFreeLeads && hasFreeLeads && (
                <>
                  <div className="flex justify-between">
                    <Text>Free leads used:</Text>
                    <Text>{Math.min(leadCount, availableFreeLeads)}</Text>
                  </div>
                  <div className="flex justify-between">
                    <Text>Paid leads:</Text>
                    <Text>{Math.max(0, leadCount - availableFreeLeads)}</Text>
                  </div>
                </>
              )}
              
              <Divider className="my-2" />
              <div className="flex justify-between">
                <Text strong>Total cost:</Text>
                <Text strong>{estimatedCost} credits</Text>
              </div>
              
              <div className="flex justify-between">
                <Text>Available credits:</Text>
                <Text className={userCredits < estimatedCost ? 'text-red-500' : 'text-green-500'}>
                  {userCredits}
                </Text>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {userCredits < estimatedCost && !usingFreeLeads && (
        <Alert
          message="Insufficient Credits"
          description={`You need ${estimatedCost} credits but only have ${userCredits}. Please purchase more credits or use your free leads.`}
          type="warning"
          showIcon
        />
      )}

      <Card title="Contact Requirements">
        <Form.Item name="requirements">
          <Checkbox.Group className="space-y-2">
            <Row>
              <Col span={8}>
                <Checkbox value="email">Must have email address</Checkbox>
              </Col>
              <Col span={8}>
                <Checkbox value="phone">Must have phone number</Checkbox>
              </Col>
              <Col span={8}>
                <Checkbox value="linkedin">Must have LinkedIn profile</Checkbox>
              </Col>
            </Row>
          </Checkbox.Group>
        </Form.Item>
      </Card>

      <Form.Item
        name="campaignName"
        label="Campaign Name (Optional)"
      >
        <Input placeholder="e.g., Q4 SaaS Outreach" />
      </Form.Item>
    </div>
  );

  // Step 3: Generate Leads
  const stepThreeContent = (
    <div className="space-y-6">
      {!isGenerating && !generationComplete && (
        <div className="text-center">
          <Title level={4}>Ready to Generate Leads</Title>
          <Text>Click the button below to start generating your leads based on the criteria you have set.</Text>
          
          <Card className="mt-6" style={{ maxWidth: 400, margin: '24px auto' }}>
            <Statistic
              title="Leads to Generate"
              value={leadCount}
              prefix={<ThunderboltOutlined />}
            />
            <div className="mt-4">
              <Text strong>Estimated Cost: {estimatedCost} credits</Text>
            </div>
          </Card>
        </div>
      )}

      {isGenerating && (
        <div className="text-center">
          <LoadingOutlined className="text-4xl text-blue-500 mb-4" />
          <Title level={4}>Generating Your Leads...</Title>
          <Text>This may take a few moments while we search through millions of profiles.</Text>
          
          <div className="mt-6">
            <Progress 
              percent={generationProgress} 
              status="active"
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }}
            />
          </div>
        </div>
      )}

      {generationComplete && generatedLeads.length > 0 && (
        <div>
          <div className="text-center mb-6">
            <CheckCircleOutlined className="text-4xl text-green-500 mb-4" />
            <Title level={4}>Leads Generated Successfully!</Title>
            <Text>Found {generatedLeads.length} high-quality leads matching your criteria.</Text>
          </div>

          <Card title="Generated Leads Preview" className="mb-6">
            <div className="space-y-4">
              {generatedLeads.slice(0, 5).map((lead, index) => (
                <div key={index} className="border-b pb-3 last:border-b-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <Text strong>{lead.name}</Text>
                      <div className="text-sm text-gray-500">
                        {lead.title} at {lead.company}
                      </div>
                      <div className="text-sm text-gray-400">
                        {lead.location} • Score: {lead.score}/100
                      </div>
                    </div>
                    <div className="text-right">
                      {lead.email && <Tag color="green">Email</Tag>}
                      {lead.phone && <Tag color="blue">Phone</Tag>}
                      {lead.linkedinUrl && <Tag color="purple">LinkedIn</Tag>}
                    </div>
                  </div>
                </div>
              ))}
              
              {generatedLeads.length > 5 && (
                <div className="text-center pt-3">
                  <Text type="secondary">
                    And {generatedLeads.length - 5} more leads...
                  </Text>
                </div>
              )}
            </div>
          </Card>

          <div className="text-center">
            <Space size="large">
              <Button size="large" onClick={() => router.back()}>
                Generate More Leads
              </Button>
              <Button 
                type="primary" 
                size="large" 
                onClick={navigateToLeads}
              >
                View All Leads
              </Button>
            </Space>
          </div>
        </div>
      )}
    </div>
  );

  const stepContents = [stepOneContent, stepTwoContent, stepThreeContent];

  return (
    <div style={{
      backgroundColor: theme === 'dark' ? '#000000' : '#ffffff',
      padding: 24,
      minHeight: '100vh'
    }}>
      <div className="mb-6">
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => router.back()}
          className="mb-4"
        >
          Back
        </Button>
        
        <div className="flex justify-between items-center">
          <Space align="center">
            <ThunderboltOutlined className="text-xl text-blue-500" />
            <Title level={2} className="mb-0">
              Generate Leads
            </Title>
          </Space>
          <div className="flex items-center gap-2">
            <CreditCardOutlined className="text-blue-500" />
            <Text strong>{userCredits.toLocaleString()} credits</Text>
            {hasFreeLeads && (
              <Tag color="green">
                <GiftOutlined /> {availableFreeLeads} free leads
              </Tag>
            )}
          </div>
        </div>
        
        <Text type="secondary">
          Generate high-quality leads using Apollo database of millions of professionals
        </Text>
      </div>

      <Steps current={currentStep} className="mb-8">
        {steps.map(item => (
          <Steps.Step key={item.title} title={item.title} />
        ))}
      </Steps>

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            requirements: ['email'],
            useFreeLeads: hasFreeLeads
          }}
        >
          {stepContents[currentStep]}
          
          <Divider />
          
          <div className="flex justify-between">
            <div>
              {currentStep > 0 && !isGenerating && (
                <Button onClick={handlePrev}>
                  Previous
                </Button>
              )}
            </div>
            
            <div>
              {currentStep < steps.length - 1 && (
                <Button type="primary" onClick={handleNext}>
                  Next
                </Button>
              )}
              
              {currentStep === steps.length - 1 && !generationComplete && (
                <Button 
                  type="primary" 
                  htmlType="submit"
                  loading={isGenerating}
                  disabled={userCredits < estimatedCost && !(usingFreeLeads && hasFreeLeads)}
                >
                  {isGenerating ? 'Generating...' : 'Generate Leads'}
                </Button>
              )}
            </div>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default CampaignCreatePage;
  