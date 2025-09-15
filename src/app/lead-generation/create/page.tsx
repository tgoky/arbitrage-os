// app/lead-generation/create/page.tsx - FIXED VERSION
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
  CreditCardOutlined,
  GiftOutlined,
  LoadingOutlined,
  CheckCircleOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useTheme } from '../../../providers/ThemeProvider';
import { useWorkspaceContext } from '../../hooks/useWorkspaceContext';
import CreditsPurchaseModal from '../../../components/credits/CreditsDisplayModal';

const { Title, Text } = Typography;
const { Option } = Select;

interface FormData {
  targetIndustry: string[];
  targetRole: string[];
  companySize: string[];
  location: string[];
  keywords: string[];
  technologies: string[];
  revenueMin: number | undefined;
  revenueMax: number | undefined;
  requirements: string[];
  campaignName: string;
}


// Industry and job title options (same as before)
const industries = [
  'Technology', 'SaaS', 'Healthcare', 'Finance', 'Education', 'Manufacturing',
  'Retail', 'E-commerce', 'Real Estate', 'Hospitality', 'Transportation', 
  'Energy', 'Media', 'Telecommunications', 'Agriculture', 'Construction', 
  'Pharmaceuticals', 'Consulting', 'Marketing', 'Legal Services'
];

const jobTitles = [
  'CEO', 'CTO', 'CFO', 'CMO', 'COO', 'President', 'Founder',
  'VP of Sales', 'VP of Marketing', 'VP of Engineering', 'VP of Operations',
  'Sales Director', 'Marketing Director', 'IT Director', 'Operations Director',
  'Product Manager', 'Sales Manager', 'Marketing Manager', 'IT Manager',
  'Business Development Manager', 'Account Executive', 'Head of Sales',
  'Head of Marketing', 'Head of Engineering', 'Head of Operations'
];

const locations = [
  'United States', 'Canada', 'United Kingdom', 'Germany', 'France', 'Australia',
  'New Zealand', 'Netherlands', 'Sweden', 'Norway', 'Denmark', 'Switzerland',
  'Singapore', 'Japan', 'South Korea', 'India', 'Brazil', 'Mexico', 'Spain', 
  'Italy', 'Ireland', 'Belgium', 'Austria', 'Israel', 'United Arab Emirates'
];

const technologies = [
  'salesforce', 'hubspot', 'pipedrive', 'zoho_crm', 'microsoft_dynamics',
  'google_analytics', 'google_ads', 'facebook_ads', 'linkedin_ads',
  'mailchimp', 'constant_contact', 'sendgrid', 'stripe', 'paypal',
  'shopify', 'woocommerce', 'magento', 'wordpress', 'squarespace',
  'aws', 'google_cloud', 'microsoft_azure', 'docker', 'kubernetes'
];

interface UserCredits {
  credits: number;
  freeLeadsUsed: number;
  freeLeadsAvailable: number;
  totalPurchased: number;
}

// Search Preview Component - declare this first
const SearchPreview = ({ industries, roles, locations, companySize }: {
  industries: string[];
  roles: string[];
  locations: string[];
  companySize: string[];
}) => {
  if (!industries.length && !roles.length) {
    return (
      <Text type="secondary" className="italic">
        Select industries and job titles to see search preview
      </Text>
    );
  }

  const parts = [];

  if (roles.length) {
    const roleText = roles.length === 1 
      ? `people who are ${roles[0]}s`
      : `people who are ${roles.slice(0, -1).join(', ')} or ${roles[roles.length - 1]}s`;
    parts.push(roleText);
  }

  if (industries.length) {
    const industryText = industries.length === 1
      ? `in the ${industries[0]} industry`
      : `in ${industries.slice(0, -1).join(', ')} or ${industries[industries.length - 1]} industries`;
    parts.push(industryText);
  }

  if (locations.length) {
    const locationText = locations.length === 1
      ? `located in ${locations[0]}`
      : `located in ${locations.slice(0, -1).join(', ')} or ${locations[locations.length - 1]}`;
    parts.push(locationText);
  }

  if (companySize.length) {
    const sizeText = companySize.length === 1
      ? `at companies with ${companySize[0]} employees`
      : `at companies with ${companySize.join(' or ')} employees`;
    parts.push(sizeText);
  }

  return (
    <div>
      <Text strong>We will find: </Text>
      <Text>{parts.join(' ')}</Text>
      {parts.length > 2 && (
        <div className="mt-2">
          <Text type="warning" className="text-sm">
            Complex searches may return fewer results. Consider reducing filters if needed.
          </Text>
        </div>
      )}
    </div>
  );
};

// Complexity Warning Component
const ComplexityWarning = ({ formInstance }: { formInstance: any }) => {
  const values = formInstance.getFieldsValue();
  const totalFilters = (values.targetIndustry?.length || 0) + 
                      (values.targetRole?.length || 0) + 
                      (values.location?.length || 0) + 
                      (values.companySize?.length || 0);
  
  if (totalFilters <= 6) return null;
  
  return (
    <Alert
      message="Complex Search Detected"
      description={
        <div>
          You have {totalFilters} active filters. This may significantly reduce your results.
          <br />
          <strong>Suggestions:</strong>
          <ul className="mt-2 mb-0">
            <li>Start with 1-2 industries and 1-2 job titles</li>
            <li>Add more filters only if needed</li>
            <li>Use keywords instead of many industry selections</li>
          </ul>
        </div>
      }
      type="warning"
      showIcon
      className="mb-4"
    />
  );
};

// Quick Presets Component
const QuickPresets = ({ formInstance, setFormData }: { 
  formInstance: any; 
  setFormData: React.Dispatch<React.SetStateAction<any>>; 
}) => {
  const presets = [
    {
      name: 'Tech Executives',
      data: {
        targetIndustry: ['Technology'],
        targetRole: ['CEO', 'CTO'],
        location: ['United States']
      }
    },
    {
      name: 'Healthcare Leaders', 
      data: {
        targetIndustry: ['Healthcare'],
        targetRole: ['CEO', 'Medical Director'],
        location: ['United States']
      }
    },
    {
      name: 'SaaS Founders',
      data: {
        targetIndustry: ['SaaS'],
        targetRole: ['Founder', 'CEO'],
        companySize: ['1-10', '11-50']
      }
    }
  ];
  
  return (
    <Card title="Quick Start Presets" className="mb-4">
      <Space wrap>
        {presets.map(preset => (
          <Button
            key={preset.name}
            onClick={() => {
              formInstance.setFieldsValue(preset.data);
              setFormData((prev: any) => ({ ...prev, ...preset.data }));
              message.success(`Applied ${preset.name} preset`);
            }}
            size="small"
            type="dashed"
          >
            {preset.name}
          </Button>
        ))}
      </Space>
      <Text type="secondary" className="block mt-2 text-xs">
        Click to apply preset, then customize as needed
      </Text>
    </Card>
  );
};

// Criteria Explanations Component
const CriteriaExplanations = () => (
  <Card title="Understanding Your Search" className="mb-4">
    <Row gutter={16}>
      <Col span={8}>
        <div className="text-center p-3 bg-blue-50 rounded">
          <Title level={5} className="text-blue-600 mb-2">Industries</Title>
          <Text className="text-sm">
            People working in ANY of these industries
          </Text>
          <div className="mt-2 text-xs text-gray-500">
            Technology OR Healthcare OR Finance
          </div>
        </div>
      </Col>
      <Col span={8}>
        <div className="text-center p-3 bg-green-50 rounded">
          <Title level={5} className="text-green-600 mb-2">Job Titles</Title>
          <Text className="text-sm">
            People with ANY of these job titles
          </Text>
          <div className="mt-2 text-xs text-gray-500">
            CEO OR CTO OR Marketing Director
          </div>
        </div>
      </Col>
      <Col span={8}>
        <div className="text-center p-3 bg-purple-50 rounded">
          <Title level={5} className="text-purple-600 mb-2">Locations</Title>
          <Text className="text-sm">
            People located in ANY of these places
          </Text>
          <div className="mt-2 text-xs text-gray-500">
            United States OR Canada OR UK
          </div>
        </div>
      </Col>
    </Row>
  </Card>
);

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
  
  // Credits state
  const [userCredits, setUserCredits] = useState<UserCredits>({
    credits: 0,
    freeLeadsUsed: 0,
    freeLeadsAvailable: 0,
    totalPurchased: 0
  });
  const [creditsLoading, setCreditsLoading] = useState(true);
  const [purchaseModalVisible, setPurchaseModalVisible] = useState(false);
  
  const [usingFreeLeads, setUsingFreeLeads] = useState(true);
  
  // Load user credits on mount
  useEffect(() => {
    loadUserCredits();
  }, []);

  const loadUserCredits = async () => {
    try {
      setCreditsLoading(true);
      const response = await fetch('/api/user/credits');
      const data = await response.json();
      
      if (data.success) {
        setUserCredits(data.data);
        setUsingFreeLeads(data.data.freeLeadsAvailable > 0);
      } else {
        message.error('Failed to load credits information');
      }
    } catch (error) {
      console.error('Failed to load credits:', error);
      message.error('Failed to load credits information');
    } finally {
      setCreditsLoading(false);
    }
  };

  // Calculate costs properly
  const calculateCosts = () => {
    const freeLeadsToUse = usingFreeLeads ? Math.min(leadCount, userCredits.freeLeadsAvailable) : 0;
    const paidLeads = leadCount - freeLeadsToUse;
    const totalCost = paidLeads * 1; // 1 credit per lead
    
    return {
      freeLeadsUsed: freeLeadsToUse,
      paidLeads,
      totalCost,
      canAfford: totalCost <= userCredits.credits
    };
  };

  const costs = calculateCosts();

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
const [formData, setFormData] = useState<FormData>({
  targetIndustry: [],
  targetRole: [],
  companySize: [],
  location: [],
  keywords: [],
  technologies: [],
  revenueMin: undefined,
  revenueMax: undefined,
  requirements: ['email'],
  campaignName: ''
});

  const handleNext = async () => {
    if (currentStep === 0) {
      try {
        const currentValues = form.getFieldsValue();
        setFormData(prev => ({ ...prev, ...currentValues }));
        
        await form.validateFields(['targetIndustry', 'targetRole']);
        
        if (!currentValues.targetIndustry || currentValues.targetIndustry.length === 0) {
          message.error('Please select at least one industry');
          return;
        }
        
        if (!currentValues.targetRole || currentValues.targetRole.length === 0) {
          message.error('Please select at least one job title');
          return;
        }
        
      } catch (errorInfo) {
        console.log('Validation failed:', errorInfo);
        message.error('Please complete all required fields before proceeding');
        return;
      }
    }
    
    if (currentStep === 1) {
      const currentValues = form.getFieldsValue();
      setFormData(prev => ({ ...prev, ...currentValues }));
      
      // Check if user can afford the generation
      if (!costs.canAfford && costs.freeLeadsUsed < leadCount) {
        message.error(`Not enough credits. You need ${costs.totalCost} credits but only have ${userCredits.credits}.`);
        return;
      }
    }
    
    setCurrentStep(currentStep + 1);
  };
 
  const handlePrev = () => {
    const currentValues = form.getFieldsValue();
    setFormData(prev => ({ ...prev, ...currentValues }));
    setCurrentStep(currentStep - 1);
    
    setTimeout(() => {
      form.setFieldsValue(formData);
    }, 0);
  };

  const handleLeadCountChange = (value: number | null) => {
    if (value !== null) {
      setLeadCount(Math.min(Math.max(value, 1), 1000));
    }
  };

  // Enhanced error handling in your React component
const generateLeads = async (values: any) => {
  if (!currentWorkspace?.id) {
    message.error('No workspace selected');
    return;
  }

  console.log('🔍 Starting lead generation with values:', values);

  // Validation checks...
  if (!values.targetIndustry || !Array.isArray(values.targetIndustry) || values.targetIndustry.length === 0) {
    message.error('Please select at least one target industry');
    setCurrentStep(0);
    return;
  }

  if (!values.targetRole || !Array.isArray(values.targetRole) || values.targetRole.length === 0) {
    message.error('Please select at least one target role');
    setCurrentStep(0);
    return;
  }

  // Final cost check
  const finalCosts = calculateCosts();
  if (!finalCosts.canAfford && finalCosts.freeLeadsUsed < leadCount) {
    message.error(`Insufficient credits. Need ${finalCosts.totalCost} credits, have ${userCredits.credits}.`);
    setPurchaseModalVisible(true);
    return;
  }

  setIsGenerating(true);
  setGenerationProgress(10);

  try {
    const criteria = {
      targetIndustry: values.targetIndustry,
      targetRole: values.targetRole,
      companySize: values.companySize || [],
      location: values.location || [],
      keywords: values.keywords || [],
      technologies: values.technologies || [],
      revenueRange: (values.revenueMin || values.revenueMax) ? {
        min: values.revenueMin ? parseInt(values.revenueMin.toString()) : undefined,
        max: values.revenueMax ? parseInt(values.revenueMax.toString()) : undefined
      } : undefined,
      leadCount,
      requirements: values.requirements || []
    };

    console.log('📋 Final criteria object:', criteria);
    setGenerationProgress(30);

    const endpoint = getWorkspaceScopedEndpoint('/api/lead-generation');
    const requestBody = {
      workspaceId: currentWorkspace.id,
      criteria,
      campaignName: values.campaignName || `Lead Generation - ${new Date().toLocaleDateString()}`
    };

    console.log('📤 Request body:', requestBody);
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    setGenerationProgress(70);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ API Error Response:', errorData);
      
      // Enhanced error handling based on error codes
      if (response.status === 402) {
        message.error('Insufficient credits. Please purchase more credits.');
        setPurchaseModalVisible(true);
        return;
      }
      
      if (response.status === 429) {
        message.error('Rate limit exceeded. Please wait before trying again.');
        return;
      }
      
      if (response.status === 422 || response.status === 400) {
        // Apollo API validation errors
        if (errorData.error?.includes('validation')) {
          message.error('Search criteria too complex. Try fewer industries or locations.');
        } else {
          message.error('Invalid search parameters. Please adjust your criteria.');
        }
        setCurrentStep(0); // Go back to criteria step
        return;
      }
      
      if (response.status === 401) {
        message.error('Authentication failed. Please refresh and try again.');
        return;
      }
      
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }

    const data = await response.json();
    console.log('📋 Success response:', data);
    
    if (data.success) {
      if (data.data.leads.length === 0) {
        // No leads found - provide helpful guidance
        message.warning({
          content: (
            <div>
              <div>No leads found with your current criteria.</div>
              <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.8 }}>
                Try: broader locations, fewer industries, or different job titles
              </div>
            </div>
          ),
          duration: 6
        });
        setCurrentStep(0); // Go back to adjust criteria
        return;
      }
      
      setGeneratedLeads(data.data.leads);
      setGenerationProgress(100);
      setGenerationComplete(true);
      
      // Enhanced success message with details
      const leadsCount = data.data.leads.length;
      const avgScore = data.data.leads.reduce((sum: number, lead: any) => sum + lead.score, 0) / leadsCount;
      
      message.success({
        content: (
          <div>
            <div>Successfully generated {leadsCount} leads!</div>
            <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.8 }}>
              Average quality score: {avgScore.toFixed(0)}/100
            </div>
          </div>
        ),
        duration: 4
      });
      
      // Update credits after successful generation
      await loadUserCredits();
    } else {
      throw new Error(data.error || 'Lead generation failed');
    }

  } catch (error) {
    console.error('💥 Lead generation error:', error);
    
    if (error instanceof Error) {
      // Specific error handling
      if (error.message.includes('rate limit')) {
        message.error('Too many requests. Please wait a few minutes before trying again.');
      } else if (error.message.includes('authentication')) {
        message.error('Authentication failed. Please refresh the page and sign in again.');
      } else if (error.message.includes('Insufficient credits')) {
        setPurchaseModalVisible(true);
      } else if (error.message.includes('No leads found')) {
        message.warning({
          content: (
            <div>
              <div>No leads found matching your criteria.</div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>
                Try adjusting your search parameters for better results.
              </div>
            </div>
          ),
          duration: 5
        });
        setCurrentStep(0);
      } else {
        // Generic error with helpful suggestion
        message.error({
          content: (
            <div>
              <div>{error.message}</div>
              <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.8 }}>
                If this persists, try simpler search criteria
              </div>
            </div>
          ),
          duration: 6
        });
      }
    } else {
      message.error('Failed to generate leads. Please try again with different criteria.');
    }
    
    setGenerationProgress(0);
  } finally {
    setIsGenerating(false);
  }
};

  const onFinish = async (values: any) => {
    console.log('📝 Form onFinish values:', values);
    
    if (!values.targetIndustry || values.targetIndustry.length === 0) {
      message.error('Please select at least one target industry');
      return;
    }
    
    if (!values.targetRole || values.targetRole.length === 0) {
      message.error('Please select at least one target role');
      return;
    }
    
    await generateLeads(values);
  };

  const navigateToLeads = () => {
    router.push('/lead-generation');
  };

  const handlePurchaseComplete = (newBalance: number) => {
    setUserCredits(prev => ({
      ...prev,
      credits: newBalance
    }));
    loadUserCredits(); // Refresh full credits data
  };

  // Step 1: Target Criteria (same as before)
// Complete Step One Content - place this inside your CampaignCreatePage component

const stepOneContent = (
  <div className="space-y-6">
    {/* How Search Works Alert */}
    <Alert
      message="How Search Works"
      description={
        <div className="space-y-2">
          <div><strong>Industries:</strong> Finds people from ANY of the selected industries </div>
          <div><strong>Job Titles:</strong> Finds people with ANY of the selected titles</div>
          <div><strong>Locations:</strong> Finds people from ANY of the selected locations</div>
          <div className="text-sm text-gray-600 mt-2">
            Tip: Start with 1-3 selections per category for best results
          </div>
        </div>
      }
      type="info"
      showIcon
      className="mb-4"
    />

    {/* Criteria Explanations */}
    {/* <Card title="Understanding Your Search" className="mb-4">
      <Row gutter={16}>
        <Col span={8}>
          <div className="text-center p-3 rounded">
            <Title level={5} className="text-blue-600 mb-2">Industries</Title>
            <Text className="text-sm">
              People working in ANY of these industries
            </Text>
            <div className="mt-2 text-xs text-gray-500">
              Technology OR Healthcare OR Finance
            </div>
          </div>
        </Col>
        <Col span={8}>
          <div className="text-center p-3  rounded">
            <Title level={5} className="text-green-600 mb-2">Job Titles</Title>
            <Text className="text-sm">
              People with ANY of these job titles
            </Text>
            <div className="mt-2 text-xs text-gray-500">
              CEO OR CTO OR Marketing Director
            </div>
          </div>
        </Col>
        <Col span={8}>
          <div className="text-center p-3  rounded">
            <Title level={5} className="text-purple-600 mb-2">Locations</Title>
            <Text className="text-sm">
              People located in ANY of these places
            </Text>
            <div className="mt-2 text-xs text-gray-500">
              United States OR Canada OR UK
            </div>
          </div>
        </Col>
      </Row>
    </Card>
     */}
    {/* Quick Presets */}
    <Card title="Quick Start Presets" className="mb-4">
      <Space wrap>
        <Button
          onClick={() => {
            const presetData = {
              targetIndustry: ['Technology'],
              targetRole: ['CEO', 'CTO'],
              location: ['United States']
            };
            form.setFieldsValue(presetData);
            setFormData(prev => ({ ...prev, ...presetData }));
            message.success('Applied Tech Executives preset');
          }}
          size="small"
          type="dashed"
        >
          Tech Executives
        </Button>
        <Button
          onClick={() => {
            const presetData = {
              targetIndustry: ['Healthcare'],
              targetRole: ['CEO', 'Medical Director'],
              location: ['United States']
            };
            form.setFieldsValue(presetData);
            setFormData(prev => ({ ...prev, ...presetData }));
            message.success('Applied Healthcare Leaders preset');
          }}
          size="small"
          type="dashed"
        >
          Healthcare Leaders
        </Button>
        <Button
          onClick={() => {
            const presetData = {
              targetIndustry: ['SaaS'],
              targetRole: ['Founder', 'CEO'],
              companySize: ['1-10', '11-50']
            };
            form.setFieldsValue(presetData);
            setFormData(prev => ({ ...prev, ...presetData }));
            message.success('Applied SaaS Founders preset');
          }}
          size="small"
          type="dashed"
        >
          SaaS Founders
        </Button>
      </Space>
      <Text type="secondary" className="block mt-2 text-xs">
        Click to apply preset, then customize as needed
      </Text>
    </Card>
    
    {/* Complexity Warning */}
    {(() => {
      const values = form.getFieldsValue();
      const totalFilters = (values.targetIndustry?.length || 0) + 
                          (values.targetRole?.length || 0) + 
                          (values.location?.length || 0) + 
                          (values.companySize?.length || 0);
      
      if (totalFilters > 6) {
        return (
          <Alert
            message="Complex Search Detected"
            description={
              <div>
                You have {totalFilters} active filters. This may significantly reduce your results.
                <br />
                <strong>Suggestions:</strong>
                <ul className="mt-2 mb-0">
                  <li>Start with 1-2 industries and 1-2 job titles</li>
                  <li>Add more filters only if needed</li>
                  <li>Use keywords instead of many industry selections</li>
                </ul>
              </div>
            }
            type="warning"
            showIcon
            className="mb-4"
          />
        );
      }
      return null;
    })()}

    <Title level={5}>Core Targeting</Title>
    
    <Row gutter={24}>
      <Col span={12}>
        <Form.Item
          name="targetIndustry"
          label={
            <span>
              Target Industries 
              <Tooltip title="Select industries where your prospects work. We'll find people from ANY of these industries.">
                <InfoCircleOutlined className="ml-1" />
              </Tooltip>
            </span>
          }
          rules={[
            { required: true, message: 'Please select at least one industry' },
            { 
              type: 'array', 
              min: 1, 
              max: 5, 
              message: 'Select 1-5 industries for best results' 
            }
          ]}
          extra="Recommended: 1-3 industries"
        >
          <Select 
            placeholder="e.g., Technology, Healthcare" 
            mode="multiple"
            showSearch
            maxTagCount={3}
            optionFilterProp="children"
            allowClear
            onChange={() => {
              // Trigger re-render to update preview and warnings
              setTimeout(() => {
                setFormData(prev => ({ ...prev, ...form.getFieldsValue() }));
              }, 0);
            }}
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
          label={
            <span>
              Target Job Titles
              <Tooltip title="Select job titles to target. We'll find people with ANY of these titles.">
                <InfoCircleOutlined className="ml-1" />
              </Tooltip>
            </span>
          }
          rules={[
            { required: true, message: 'Please select at least one job title' },
            { 
              type: 'array', 
              min: 1, 
              max: 5, 
              message: 'Select 1-5 job titles for best results' 
            }
          ]}
          extra="Recommended: 1-3 job titles"
        >
          <Select 
            placeholder="e.g., CEO, Marketing Director" 
            mode="multiple"
            showSearch
            maxTagCount={3}
            optionFilterProp="children"
            allowClear
            onChange={() => {
              // Trigger re-render to update preview and warnings
              setTimeout(() => {
                setFormData(prev => ({ ...prev, ...form.getFieldsValue() }));
              }, 0);
            }}
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
          extra="Optional: Leave blank to include all company sizes"
        >
          <Select 
            placeholder="Select company sizes" 
            mode="multiple" 
            allowClear
            maxTagCount={2}
            onChange={() => {
              setTimeout(() => {
                setFormData(prev => ({ ...prev, ...form.getFieldsValue() }));
              }, 0);
            }}
          >
            <Option value="1-10">1-10 employees</Option>
            <Option value="11-50">11-50 employees</Option>
            <Option value="51-200">51-200 employees</Option>
            <Option value="201-500">201-500 employees</Option>
            <Option value="501-1000">501-1000 employees</Option>
            <Option value="1000+">1000+ employees</Option>
          </Select>
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item 
          name="location" 
          label="Geographic Locations"
          extra="Optional: Leave blank to search globally"
        >
          <Select 
            placeholder="e.g., United States, United Kingdom" 
            mode="multiple"
            showSearch
            maxTagCount={2}
            allowClear
            onChange={() => {
              setTimeout(() => {
                setFormData(prev => ({ ...prev, ...form.getFieldsValue() }));
              }, 0);
            }}
          >
            {locations.map(location => (
              <Option key={location} value={location}>{location}</Option>
            ))}
          </Select>
        </Form.Item>
      </Col>
    </Row>

    {/* Search Preview */}
    <Card title="Search Preview" >
      {(() => {
        const values = form.getFieldsValue();
        const industries = values.targetIndustry || [];
        const roles = values.targetRole || [];
        const locations = values.location || [];
        const companySize = values.companySize || [];

        if (!industries.length && !roles.length) {
          return (
            <Text type="secondary" className="italic">
              Select industries and job titles to see search preview
            </Text>
          );
        }

        const parts = [];

        if (roles.length) {
          const roleText = roles.length === 1 
            ? `people who are ${roles[0]}s`
            : `people who are ${roles.slice(0, -1).join(', ')} or ${roles[roles.length - 1]}s`;
          parts.push(roleText);
        }

        if (industries.length) {
          const industryText = industries.length === 1
            ? `in the ${industries[0]} industry`
            : `in ${industries.slice(0, -1).join(', ')} or ${industries[industries.length - 1]} industries`;
          parts.push(industryText);
        }

        if (locations.length) {
          const locationText = locations.length === 1
            ? `located in ${locations[0]}`
            : `located in ${locations.slice(0, -1).join(', ')} or ${locations[locations.length - 1]}`;
          parts.push(locationText);
        }

        if (companySize.length) {
          const sizeText = companySize.length === 1
            ? `at companies with ${companySize[0]} employees`
            : `at companies with ${companySize.join(' or ')} employees`;
          parts.push(sizeText);
        }

        return (
          <div>
            <Text strong>We will find: </Text>
            <Text>{parts.join(' ')}</Text>
            {parts.length > 2 && (
              <div className="mt-2">
                <Text type="warning" className="text-sm">
                  Complex searches may return fewer results. Consider reducing filters if needed.
                </Text>
              </div>
            )}
          </div>
        );
      })()}
    </Card>
    
    <Form.Item
      name="keywords"
      label={
        <span>
          Additional Keywords 
          <Tooltip title="Optional keywords to further refine your search">
            <InfoCircleOutlined className="ml-1" />
          </Tooltip>
        </span>
      }
      extra="Optional: Add specific terms like 'SaaS', 'fintech', 'AI'"
    >
      <Select
        mode="tags"
        placeholder="e.g., SaaS, automation, fintech"
        tokenSeparators={[',']}
        allowClear
        maxTagCount={3}
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
      <Alert
        message="Advanced Options"
        description="These filters further narrow your search. Use sparingly - too many filters can reduce results significantly."
        type="warning"
        showIcon
        className="mb-4"
      />
    )}
    
    {isAdvancedVisible && (
      <>
        <Row gutter={24}>
          <Col span={12}>
            <Form.Item 
              name="revenueMin" 
              label="Minimum Annual Revenue"
              extra="Optional: Filter by company revenue"
            >
              <InputNumber<number>
                placeholder="e.g., 1000000"
                formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => {
                  if (!value) return 0;
                  const cleaned = value.replace(/\$\s?|(,*)/g, '');
                  const num = parseFloat(cleaned);
                  return isNaN(num) ? 0 : num;
                }}
                style={{ width: '100%' }}
                min={0}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item 
              name="revenueMax" 
              label="Maximum Annual Revenue"
              extra="Optional: Set upper revenue limit"
            >
              <InputNumber<number>
                placeholder="e.g., 50000000"
                formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => {
                  if (!value) return 0;
                  const cleaned = value.replace(/\$\s?|(,*)/g, '');
                  const num = parseFloat(cleaned);
                  return isNaN(num) ? 0 : num;
                }}
                style={{ width: '100%' }}
                min={0}
              />
            </Form.Item>
          </Col>
        </Row>
        
        <Form.Item 
          name="technologies" 
          label="Technologies Used"
          extra="Optional: Find companies using specific technologies"
        >
          <Select
            mode="multiple"
            placeholder="Select technologies"
            showSearch
            maxTagCount={3}
            allowClear
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

  // Step 2: Lead Settings with Enhanced Credits Display
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
            
            {userCredits.freeLeadsAvailable > 0 && (
              <Form.Item>
                <Checkbox 
                  checked={usingFreeLeads}
                  onChange={(e) => setUsingFreeLeads(e.target.checked)}
                >
                  Use my free leads first ({userCredits.freeLeadsAvailable} remaining)
                </Checkbox>
              </Form.Item>
            )}
          </Card>
        </Col>
        
        <Col span={12}>
          <Card title="Cost Breakdown" loading={creditsLoading}>
            <div className="space-y-3">
              <div className="flex justify-between">
                <Text>Lead count:</Text>
                <Text strong>{leadCount}</Text>
              </div>
              
              {costs.freeLeadsUsed > 0 && (
                <>
                  <div className="flex justify-between">
                    <Text>Free leads used:</Text>
                    <Text className="text-green-600">{costs.freeLeadsUsed}</Text>
                  </div>
                  <div className="flex justify-between">
                    <Text>Paid leads needed:</Text>
                    <Text>{costs.paidLeads}</Text>
                  </div>
                </>
              )}
              
              <Divider className="my-2" />
              <div className="flex justify-between">
                <Text strong>Credits needed:</Text>
                <Text strong className={costs.totalCost > 0 ? 'text-blue-600' : 'text-green-600'}>
                  {costs.totalCost}
                  {costs.totalCost === 0 && costs.freeLeadsUsed > 0 && (
                    <span className="text-green-600"> (Free!)</span>
                  )}
                </Text>
              </div>
              
              <div className="flex justify-between">
                <Text>Your credits:</Text>
                <Text className={costs.canAfford ? 'text-green-500' : 'text-red-500'}>
                  {userCredits.credits}
                </Text>
              </div>
              
              {userCredits.freeLeadsAvailable > 0 && (
                <div className="flex justify-between">
                  <Text>Free leads remaining after:</Text>
                  <Text className="text-green-500">
                    {userCredits.freeLeadsAvailable - costs.freeLeadsUsed}
                  </Text>
                </div>
              )}
              
              {costs.totalCost === 0 && costs.freeLeadsUsed > 0 && (
                <div className="text-center mt-3 p-2 bg-green-50 rounded">
                  <Text className="text-green-700 font-medium">
                    🎉 This generation is completely FREE!
                  </Text>
                </div>
              )}
            </div>
            
            {!costs.canAfford && costs.paidLeads > 0 && (
              <Button
                type="primary"
                size="small"
                block
                className="mt-3"
                onClick={() => setPurchaseModalVisible(true)}
                icon={<PlusOutlined />}
              >
                Buy {costs.totalCost} Credits
              </Button>
            )}
          </Card>
        </Col>
      </Row>

      {!costs.canAfford && costs.paidLeads > 0 && (
        <Alert
          message="Need More Credits"
          description={
            <div>
              You need {costs.totalCost} credits for {costs.paidLeads} paid leads, but only have {userCredits.credits} credits.
              {costs.freeLeadsUsed > 0 && (
                <span> The first {costs.freeLeadsUsed} leads will be free.</span>
              )}
              {userCredits.freeLeadsAvailable === 0 && (
                <span> You have already used your 5 free leads.</span>
              )}
              <Button 
                type="link" 
                size="small" 
                className="p-0 ml-2"
                onClick={() => setPurchaseModalVisible(true)}
              >
                Purchase credits
              </Button>
            </div>
          }
          type="warning"
          showIcon
        />
      )}
      
      {userCredits.freeLeadsAvailable === 0 && userCredits.credits === 0 && (
        <Alert
          message="No Credits Available"
          description={
            <div>
              You have used all 5 free leads and have no credits remaining. Purchase credits to generate more leads.
              <Button 
                type="link" 
                size="small" 
                className="p-0 ml-2"
                onClick={() => setPurchaseModalVisible(true)}
              >
                Buy credits now
              </Button>
            </div>
          }
          type="error"
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

      <Form.Item name="campaignName" label="Campaign Name (Optional)">
        <Input placeholder="e.g., Q4 SaaS Outreach" />
      </Form.Item>
    </div>
  );

  // Step 3: Generate Leads (same as before)
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
            <div className="mt-4 space-y-2">
              {costs.freeLeadsUsed > 0 && (
                <div>
                  <Text className="text-green-600">Free leads: {costs.freeLeadsUsed}</Text>
                </div>
              )}
              {costs.paidLeads > 0 && (
                <div>
                  <Text>Credits needed: {costs.totalCost}</Text>
                </div>
              )}
              <Text strong>
                {costs.totalCost === 0 ? 'Free generation!' : `Total cost: ${costs.totalCost} credits`}
              </Text>
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
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="flex items-center gap-2">
                <CreditCardOutlined className="text-blue-500" />
                <Text strong>{userCredits.credits.toLocaleString()} credits</Text>
              </div>
              {userCredits.freeLeadsAvailable > 0 && (
                <div className="flex items-center gap-2 mt-1">
                  <GiftOutlined className="text-green-500" />
                  <Text className="text-green-600 text-sm">
                    {userCredits.freeLeadsAvailable} free leads
                  </Text>
                </div>
              )}
            </div>
            <Button
              type="primary"
              ghost
              icon={<PlusOutlined />}
              onClick={() => setPurchaseModalVisible(true)}
            >
              Buy Credits
            </Button>
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
          initialValues={formData}
          onFinish={onFinish}
        >
          <div style={{ display: currentStep === 0 ? 'block' : 'none' }}>
            {stepOneContent}
          </div>

          <div style={{ display: currentStep === 1 ? 'block' : 'none' }}>
            {stepTwoContent}
          </div>

          <div style={{ display: currentStep === 2 ? 'block' : 'none' }}>
            {stepThreeContent}
          </div>
          
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
                  onClick={async () => {
                    try {
                      const currentStepValues = form.getFieldsValue();
                      const finalValues = { ...formData, ...currentStepValues };
                      
                      if (!finalValues.targetIndustry || finalValues.targetIndustry.length === 0) {
                        message.error('Please select at least one target industry');
                        setCurrentStep(0);
                        return;
                      }
                      
                      if (!finalValues.targetRole || finalValues.targetRole.length === 0) {
                        message.error('Please select at least one target role');
                        setCurrentStep(0);
                        return;
                      }
                      
                      await generateLeads(finalValues);
                    } catch (error) {
                      console.log('Error:', error);
                      message.error('Please complete all required fields');
                      setCurrentStep(0);
                    }
                  }}
                  loading={isGenerating}
                  disabled={!costs.canAfford && costs.paidLeads > 0}
                >
                  {isGenerating ? 'Generating...' : 'Generate Leads'}
                </Button>
              )}
            </div>
          </div>
        </Form>
      </Card>

      <CreditsPurchaseModal
        visible={purchaseModalVisible}
        onClose={() => setPurchaseModalVisible(false)}
        onPurchaseComplete={handlePurchaseComplete}
        currentCredits={userCredits.credits}
        requiredCredits={costs.totalCost}
      />
    </div>
  );
};

export default CampaignCreatePage;