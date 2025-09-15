"use client";

import React, { useState, useEffect } from 'react';
import { 
  MailOutlined, 
  UserOutlined, 
  SolutionOutlined, 
  ContactsOutlined, 
  LinkOutlined,
  ArrowRightOutlined,
  DownloadOutlined,
  InfoCircleOutlined,
  BulbOutlined,
  ThunderboltOutlined,
  TeamOutlined,
  WarningOutlined,
  EyeOutlined,
  SelectOutlined,
  ArrowLeftOutlined
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
  Spin,
  Alert,
  Collapse,
  Tooltip,
  Badge,
  message,
  Slider,
  Segmented,
  Switch,
  List,
  Modal,
  Table,
  notification
} from 'antd';
import { useColdEmail , } from '../hooks/useColdEmail';
import { GeneratedEmail, EmailTemplate, ColdEmailGenerationInput, ColdEmailOptimizationType } from '@/types/coldEmail';
import LoadingOverlay from './LoadingOverlay';
import { createClient } from '../../utils/supabase/client'; 

import { useParams, useRouter } from 'next/navigation';

import { useWorkspaceContext } from '../hooks/useWorkspaceContext';

const { Title, Text } = Typography;
const { Panel } = Collapse;
const { Option } = Select;
const { TextArea } = Input;

const ColdEmailWriter = () => {
  const [form] = Form.useForm();
  const [emailMethod, setEmailMethod] = useState('direct');
  const [generatedEmails, setGeneratedEmails] = useState<GeneratedEmail[]>([]);
  const [activePanels, setActivePanels] = useState<string[]>(['1', '2', '3', '4', '5']);
  const [isTemplateModalVisible, setIsTemplateModalVisible] = useState(false);
   const { currentWorkspace, isWorkspaceReady } = useWorkspaceContext();
   const [viewLoading, setViewLoading] = useState<string | null>(null);


   const [activeTab, setActiveTab] = useState('compose');
const [savedEmails, setSavedEmails] = useState<any[]>([]);
const [savedEmailsLoading, setSavedEmailsLoading] = useState(false);

const [emailPreviewModal, setEmailPreviewModal] = useState<{
  visible: boolean;
  email: any;
}>({ visible: false, email: null });

    //  const params = useParams();
     const router = useRouter();
  
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
 const [optimizedEmails, setOptimizedEmails] = useState<{[key: string]: GeneratedEmail}>({});

  const {
    generateEmails,
    optimizeEmail,
    getTemplates,
    createTemplate,
    loading,
    error,
    setError,
    getEmailGeneration, deleteEmailGeneration,   getEmailGenerations,
  } = useColdEmail();
 const [optimizationLoading, setOptimizationLoading] = useState<{[key: string]: boolean}>({});
  const [templatesLoading, setTemplatesLoading] = useState(false);

  useEffect(() => {
  if (activeTab === 'saved' && currentWorkspace) {
    fetchSavedEmails();
  }
}, [activeTab, currentWorkspace]);

  // ✅ Debug: Monitor state changes and auto-scroll to results
  useEffect(() => {
    console.log('📊 Generated emails state updated:', generatedEmails);
    console.log('📊 State length:', generatedEmails.length);
    if (generatedEmails.length > 0) {
      console.log('📊 First email in state:', generatedEmails[0]);
      
      // ✅ Auto-scroll to results when emails are generated
      setTimeout(() => {
        const resultsElement = document.getElementById('email-results');
        if (resultsElement) {
          resultsElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        }
      }, 100);
    }
  }, [generatedEmails]);

  useEffect(() => {
  const generateFollowUps = form.getFieldValue('generateFollowUps');
  if (!generateFollowUps) {
    form.setFieldValue('followUpCount', 0);
  }
}, [form.getFieldValue('generateFollowUps')]);

// In ColdEmailWriter component
useEffect(() => {
  const supabase = createClient();
  
  // Refresh session on component mount
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (!session) {
      console.warn('No active session found');
    }
  });

  

  // Listen for auth state changes
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'TOKEN_REFRESHED') {
      console.log('Token refreshed successfully');
    }
  });

  return () => subscription.unsubscribe();
}, []);


  // ADD WORKSPACE VALIDATION (same as other components)
  if (!isWorkspaceReady) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 text-center">
        <Spin size="large" tip="Loading workspace..." />
        <p className="mt-4"></p>
      </div>
    );
  }

  if (!currentWorkspace) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Alert
          message="Workspace Required"
          description="The cold email writer must be accessed from within a workspace. Please navigate to a workspace first."
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

  const emailMethods = [
    {
      value: 'interview',
      label: 'Interview Method',
      description: 'Position yourself as interviewer to build authority',
      icon: <SolutionOutlined />,
      effectiveness: 'High (42% response rate)',
      bestFor: 'Building initial relationships'
    },
    {
      value: 'podcast',
      label: 'Podcast Method',
      description: 'Leverage podcast guesting for credibility',
      icon: <ContactsOutlined />,
      effectiveness: 'Medium (32% response rate)',
      bestFor: 'Establishing thought leadership'
    },
    {
      value: 'direct',
      label: 'Direct Method',
      description: 'Straightforward value proposition',
      icon: <ThunderboltOutlined />,
      effectiveness: 'Highest (48% response rate)',
      bestFor: 'Clear offers with measurable results'
    },
    {
      value: 'masterclass',
      label: 'Masterclass Method',
      description: 'Offer exclusive educational content',
      icon: <BulbOutlined />,
      effectiveness: 'High (38% response rate)',
      bestFor: 'Lead generation with high intent'
    },
    {
      value: 'referral',
      label: 'Referral Method',
      description: 'Leverage warm introductions for trust',
      icon: <TeamOutlined />,
      effectiveness: 'High (45% response rate)',
      bestFor: 'Warm leads with mutual connections'
    },
    {
      value: 'problem',
      label: 'Problem-Solution Method',
      description: 'Address specific pain points with solutions',
      icon: <WarningOutlined />,
      effectiveness: 'High (40% response rate)',
      bestFor: 'Targeted problem-solving'
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

  const roles = [
    'CEO',
    'Marketing Manager',
    'Head of Sales',
    'CTO',
    'Operations Manager',
    'HR Director',
    'Product Manager'
  ];

  const painPoints = [
    'Low Conversion Rates',
    'High Customer Acquisition Costs',
    'Inefficient Processes',
    'Low Engagement',
    'High Churn Rates',
    'Poor ROI on Marketing'
  ];

  const fetchSavedEmails = async () => {
  setSavedEmailsLoading(true);
  try {
    const emails = await getEmailGenerations(currentWorkspace?.id);
    setSavedEmails(emails);
  } catch (error) {
    console.error('Failed to fetch saved emails:', error);
    notification.error({
      message: 'Failed to Load Saved Emails',
      description: 'Please try again later',
      placement: 'topRight',
    });
  } finally {
    setSavedEmailsLoading(false);
  }
};

const handleViewSavedEmail = async (generationId: string) => {
  setViewLoading(generationId); // Set loading state for this specific email
  try {
    const generation = await getEmailGeneration(generationId);
    if (generation) {
      console.log('🔍 Full generation object:', generation);
      console.log('🔍 Generation metadata:', generation.metadata);
      console.log('🔍 Generation emails structure:', generation.emails);
      console.log('🔍 Generation emails.emails:', generation.emails?.emails);
      
      setEmailPreviewModal({
        visible: true,
        email: generation
      });
    }
  } catch (error) {
    notification.error({
      message: 'Failed to Load Email',
      description: 'Please try again later',
      placement: 'topRight',
    });
  } finally {
    setViewLoading(null); // Clear loading state
  }
};


const handleDeleteSavedEmail = async (generationId: string) => {
  try {
    await deleteEmailGeneration(generationId);
    notification.success({
      message: 'Email Deleted',
      description: 'Saved email has been deleted',
      placement: 'topRight',
    });
    fetchSavedEmails(); // Refresh the list
  } catch (error) {
    notification.error({
      message: 'Failed to Delete Email',
      description: 'Please try again later',
      placement: 'topRight',
    });
  }
};

const onFinish = async (values: any) => {
  try {
    console.log('🔍 Raw form values:', values);

    // ✅ UNIVERSAL DATA CLEANING - handles ALL fields
    const cleanFormData = (data: any) => {
      const cleaned: any = {};
      
      Object.entries(data).forEach(([key, value]) => {
        // Skip empty/invalid values
        if (value === null || value === undefined || value === '') {
          return; // Don't include empty fields
        }
        
        // Handle arrays (like targetPainPoints, targetGoals, tags)
        if (Array.isArray(value)) {
          if (value.length > 0) {
            cleaned[key] = value.filter(item => item && item.trim && item.trim() !== '');
          }
          return;
        }
        
        // Handle strings
        if (typeof value === 'string') {
          const trimmed = value.trim();
          if (trimmed === '') return; // Skip empty strings
          
          // Validate emails specifically
          if (key.toLowerCase().includes('email')) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (emailRegex.test(trimmed)) {
              cleaned[key] = trimmed;
            }
            // Skip invalid emails silently
            return;
          }
          
          // Validate URLs
          if (key.toLowerCase().includes('website') || key.toLowerCase().includes('linkedin')) {
            try {
              new URL(trimmed);
              cleaned[key] = trimmed;
            } catch {
              // Skip invalid URLs
            }
            return;
          }
          
          cleaned[key] = trimmed;
          return;
        }
        
        // Handle booleans and numbers
        if (typeof value === 'boolean' || typeof value === 'number') {
          cleaned[key] = value;
          return;
        }
        
        // For other types, include as-is if truthy
        if (value) {
          cleaned[key] = value;
        }
      });
      
      return cleaned;
    };

    const cleanedValues = cleanFormData(values);
    console.log('🧹 Cleaned form data:', cleanedValues);

    // ✅ Build request with only valid, cleaned data
    const requestData: ColdEmailGenerationInput = {
      // Required fields (with fallbacks)
      firstName: cleanedValues.firstName || '',
      lastName: cleanedValues.lastName || '',
      email: cleanedValues.email || '',
      jobTitle: cleanedValues.jobTitle || '',
      companyName: cleanedValues.companyName || '',
      workEmail: cleanedValues.workEmail || '',
      method: emailMethod,
      tone: cleanedValues.tone || 'professional',
      targetIndustry: cleanedValues.targetIndustry || '',
      targetRole: cleanedValues.targetRole || '',
      valueProposition: cleanedValues.valueProposition || '',
      
      // Optional fields (only include if present and valid)
      ...(cleanedValues.companyWebsite && { companyWebsite: cleanedValues.companyWebsite }),
      ...(cleanedValues.emailLength && { emailLength: cleanedValues.emailLength }),
      ...(cleanedValues.quality && { quality: cleanedValues.quality }),
      ...(cleanedValues.creativity && { creativity: cleanedValues.creativity }),
      ...(cleanedValues.variations && { variations: cleanedValues.variations }),
      ...(cleanedValues.generateFollowUps !== undefined && { generateFollowUps: cleanedValues.generateFollowUps }),
      ...(cleanedValues.followUpCount && { followUpCount: cleanedValues.followUpCount }),
      ...(cleanedValues.saveAsTemplate !== undefined && { saveAsTemplate: cleanedValues.saveAsTemplate }),
      
      // Target details (optional)
      ...(cleanedValues.targetFirstName && { targetFirstName: cleanedValues.targetFirstName }),
      ...(cleanedValues.targetCompany && { targetCompany: cleanedValues.targetCompany }),
      ...(cleanedValues.targetCompanySize && { targetCompanySize: cleanedValues.targetCompanySize }),
      ...(cleanedValues.targetPainPoints && { targetPainPoints: cleanedValues.targetPainPoints }),
      ...(cleanedValues.targetGoals && { targetGoals: cleanedValues.targetGoals }),
      ...(cleanedValues.uniqueDifferentiator && { uniqueDifferentiator: cleanedValues.uniqueDifferentiator }),
      ...(cleanedValues.socialProof && { socialProof: cleanedValues.socialProof }),
      
      // Advanced options (only if valid)
      ...(cleanedValues.phone && { phone: cleanedValues.phone }),
      ...(cleanedValues.linkedIn && { linkedIn: cleanedValues.linkedIn }),
      ...(cleanedValues.companyAddress && { companyAddress: cleanedValues.companyAddress }),
      ...(cleanedValues.callToAction && { callToAction: cleanedValues.callToAction }),
      ...(cleanedValues.meetingType && { meetingType: cleanedValues.meetingType }),
      ...(cleanedValues.urgencyFactor && { urgencyFactor: cleanedValues.urgencyFactor }),
      ...(cleanedValues.subjectLineStyle && { subjectLineStyle: cleanedValues.subjectLineStyle }),
      ...(cleanedValues.personalizedElement && { personalizedElement: cleanedValues.personalizedElement }),
      
      // Referrer info (only if complete)
      ...(cleanedValues.referrerFirstName && cleanedValues.referrerLastName && {
        referrerFirstName: cleanedValues.referrerFirstName,
        referrerLastName: cleanedValues.referrerLastName,
        ...(cleanedValues.referrerJobTitle && { referrerJobTitle: cleanedValues.referrerJobTitle }),
        ...(cleanedValues.referrerEmail && { referrerEmail: cleanedValues.referrerEmail }),
        ...(cleanedValues.referrerRelationship && { referrerRelationship: cleanedValues.referrerRelationship })
      })
    };

    console.log('🔍 Final clean request data:', requestData);

    // Rest of your validation and API call...
    const missingFields = [];
    if (!requestData.firstName) missingFields.push('First Name');
    if (!requestData.lastName) missingFields.push('Last Name');
    if (!requestData.email) missingFields.push('Email');
    if (!requestData.jobTitle) missingFields.push('Job Title');
    if (!requestData.companyName) missingFields.push('Company Name');
    if (!requestData.workEmail) missingFields.push('Work Email');
    if (!requestData.targetIndustry) missingFields.push('Target Industry');
    if (!requestData.targetRole) missingFields.push('Target Role');
    if (!requestData.valueProposition) missingFields.push('Value Proposition');

    if (missingFields.length > 0) {
      notification.error({
        message: 'Missing Required Fields',
        description: `Please fill in: ${missingFields.join(', ')}`,
        placement: 'topRight',
        duration: 8
      });
      setActivePanels(['1', '2', '3', '4', '5']);
      return;
    }

    const result = await generateEmails(requestData);
    
    // Rest of your success handling...

// ✅ ADD THIS MISSING SUCCESS HANDLING:
console.log('✅ Generate emails returned:', result);
console.log('✅ Result type:', typeof result);
console.log('✅ Result is array:', Array.isArray(result));
console.log('✅ Result length:', Array.isArray(result) ? result.length : 'Not an array');
console.log('✅ First email:', result?.[0]);

console.log('🔍 About to set generated emails state...');
setGeneratedEmails(result);
console.log('✅ Called setGeneratedEmails');

// Show success notification
notification.success({
  message: 'Emails Generated Successfully!',
  description: `Generated ${result.length} email variations`,
  placement: 'topRight',
});

// If user wanted to save as template, create it
if (values.saveAsTemplate && result.length > 0) {
  try {
    await createTemplate({
      name: `${emailMethod} - ${values.targetIndustry} - ${new Date().toLocaleDateString()}`,
      subject: result[0].subject,
      body: result[0].body,
      category: 'outreach',
      tags: [emailMethod, values.targetIndustry, values.targetRole],
      isPublic: false
    });
    message.success('Template saved successfully!');
  } catch (templateError) {
    console.error('Failed to save template:', templateError);
  }
}
    
  } catch (error: any) {
    console.error('❌ Form submission error:', error);
    
    notification.error({
      message: 'Generation Failed',
      description: error.message || 'Please try again later',
      placement: 'topRight',
    });
  }
};

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      message.success('Email copied to clipboard!');
    } catch (error) {
      message.error('Failed to copy to clipboard');
    }
  };

  const downloadEmail = (email: GeneratedEmail) => {
    let url: string | null = null;
    let anchor: HTMLAnchorElement | null = null;
    
    try {
      const content = `Subject: ${email.subject}\n\n${email.body}\n\n${email.signature}`;
      const blob = new Blob([content], { type: 'text/plain' });
      url = URL.createObjectURL(blob);
      
      anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `cold-email-${email.metadata?.variationIndex || Date.now()}.txt`;
      anchor.style.display = 'none';
      
      document.body.appendChild(anchor);
      anchor.click();
      
      message.success('Email downloaded successfully!');
    } catch (error) {
      console.error('Download error:', error);
      message.error('Failed to download email');
    } finally {
      if (url) {
        URL.revokeObjectURL(url);
      }
      if (anchor && document.body.contains(anchor)) {
        document.body.removeChild(anchor);
      }
    }
  };

const handleOptimizeEmail = async (
  emailIndex: string | number, 
  emailContent: string, 
  optimizationType: ColdEmailOptimizationType
) => {
  setOptimizationLoading(prev => ({ ...prev, [emailIndex]: true }));
  
  try {
    const optimizedContent = await optimizeEmail(emailContent, optimizationType);
    
    const lines = optimizedContent.split('\n');
    let subject = '';
    let body = '';
    let signature = '';
    let currentSection = '';
    
    for (const line of lines) {
      if (line.startsWith('Subject:')) {
        subject = line.replace('Subject:', '').trim();
      } else if (line.includes('Best regards') || line.includes('Sincerely')) {
        currentSection = 'signature';
        signature += line + '\n';
      } else if (currentSection === 'signature') {
        signature += line + '\n';
      } else if (line.trim()) {
        body += line + '\n';
      }
    }
    
    // Determine if this is a main email or follow-up based on the index type
    const isFollowUp = typeof emailIndex === 'string' && emailIndex.includes('-');
    let originalEmail: GeneratedEmail;
    
    if (isFollowUp) {
      const [mainIndex, followUpIndex] = emailIndex.split('-').map(Number);
      originalEmail = generatedEmails[mainIndex].followUpSequence![followUpIndex];
    } else {
      originalEmail = generatedEmails[Number(emailIndex)];
    }
    
    const optimizedEmail: GeneratedEmail = {
      ...originalEmail,
      subject: subject || originalEmail.subject,
      body: body.trim() || optimizedContent,
      signature: signature.trim() || originalEmail.signature,
      metadata: {
        ...originalEmail.metadata,
        targetIndustry: originalEmail.metadata?.targetIndustry || '',
        targetRole: originalEmail.metadata?.targetRole || '',
        generatedAt: originalEmail.metadata?.generatedAt || new Date().toISOString(),
        optimizationType,
        optimizedAt: new Date().toISOString()
      }
    };
    
    setOptimizedEmails(prev => ({
      ...prev,
      [emailIndex]: optimizedEmail
    }));
    
    notification.success({
      message: 'Email Optimized!',
      description: `Optimized for ${optimizationType}`,
      placement: 'topRight',
    });
    
    return optimizedEmail;
  } catch (error) {
    console.error('Optimization error:', error);
    notification.error({
      message: 'Optimization Failed',
      description: 'Please try again later',
      placement: 'topRight',
    });
    return null;
  } finally {
    setOptimizationLoading(prev => ({ ...prev, [emailIndex]: false }));
  }
};
  const fetchTemplates = async () => {
    try {
      setTemplatesLoading(true);
      const fetchedTemplates = await getTemplates({ includePublic: true });
      setTemplates(fetchedTemplates);
      setIsTemplateModalVisible(true);
      message.success(`Loaded ${fetchedTemplates.length} templates`);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
      notification.error({
        message: 'Failed to Load Templates',
        description: 'Please try again later',
        placement: 'topRight',
      });
    } finally {
      setTemplatesLoading(false);
    }
  };

   const handleBack = () => {
    router.push(`/dashboard/${currentWorkspace?.slug}`);
  };

  const handleApplyTemplate = (template: EmailTemplate) => {
    setEmailMethod(template.method);
    form.setFieldsValue({
      method: template.method,
      targetIndustry: template.metadata?.targetIndustry,
      targetRole: template.metadata?.targetRole,
    });
    
    const appliedEmail: GeneratedEmail = {
      subject: template.subject,
      body: template.body,
      signature: '',
      method: template.method,
      metadata: {
        targetIndustry: template.metadata?.targetIndustry || '',
        targetRole: template.metadata?.targetRole || '',
        generatedAt: new Date().toISOString(),
        appliedFromTemplate: template.id
      }
    };
    
    setGeneratedEmails([appliedEmail]);
    setIsTemplateModalVisible(false);
    message.success(`Applied template: ${template.name}`);
  };

  const columns = [
    {
      title: 'Template Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Subject',
      dataIndex: 'subject',
      key: 'subject',
    },
    {
      title: 'Method',
      dataIndex: 'method',
      key: 'method',
      render: (method: string) => (
        <Tag color="blue">
          {emailMethods.find(m => m.value === method)?.label || method}
        </Tag>
      ),
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, template: EmailTemplate) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            onClick={() => {
              Modal.info({
                title: `Preview: ${template.name}`,
                content: (
                  <div>
                    <p><strong>Subject:</strong> {template.subject}</p>
                    <Divider />
                    <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                      {template.body}
                    </pre>
                  </div>
                ),
                width: 600,
              });
            }}
          >
            Preview
          </Button>
          <Button
            icon={<SelectOutlined />}
            onClick={() => copyToClipboard(`Subject: ${template.subject}\n\n${template.body}`)}
          >
            Copy
          </Button>
          <Button
            type="primary"
            icon={<SelectOutlined />}
            onClick={() => handleApplyTemplate(template)}
          >
            Apply
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
           <LoadingOverlay visible={loading} />
            <Button 
  icon={<ArrowLeftOutlined />} 
  onClick={handleBack}
// negative margin top
>
  Back
</Button>
<div className="text-center mb-8">

  <Title level={2} className="flex items-center justify-center">
    <MailOutlined className="mr-2" />
    <span style={{ color: '#5CC49D' }}>a</span>rb
    <span style={{ color: '#5CC49D' }}>i</span>trageOS Cold Email Writer
  </Title>
  <Text type="secondary" className="text-lg">
    Generate high-converting cold emails tailored to your ideal prospects
  </Text>
</div>

{/* Tab Navigation */}
<div className="mb-6">
  <div className="flex justify-center">
    <Space size="large">
      <Button
        type={activeTab === 'compose' ? 'primary' : 'default'}
        icon={<MailOutlined />}
        onClick={() => setActiveTab('compose')}
        size="large"
      >
        Compose New Email
      </Button>
      <Badge count={savedEmails.length} showZero>
        <Button
          type={activeTab === 'saved' ? 'primary' : 'default'}
          icon={<SolutionOutlined />}
          onClick={() => setActiveTab('saved')}
          size="large"
        >
          Saved Emails
        </Button>
      </Badge>
      <Button
        type={activeTab === 'templates' ? 'primary' : 'default'}
        icon={<ContactsOutlined />}
        onClick={() => setActiveTab('templates')}
        size="large"
      >
        Templates
      </Button>
    </Space>
  </div>
</div>

{/* Tab Content */}
{activeTab === 'compose' && (
  <Form
    form={form}
    layout="vertical"
    onFinish={onFinish}
    initialValues={{
      tone: 'professional',
      emailLength: 'medium',
      quality: 'balanced',
      creativity: 'moderate',
      targetIndustry: 'B2B SaaS',
      targetRole: 'CEO',
      valueProposition: '',
      variations: 1,
      generateFollowUps: false,
      followUpCount: 3,
      saveAsTemplate: false,
      callToAction: 'call'
    }}
  >
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

    <Collapse 
      activeKey={activePanels} 
      onChange={(keys) => setActivePanels(keys as string[])}
      bordered={false}
      className="mb-6"
    >
      <Panel 
        header={
          <div className="flex items-center">
            <UserOutlined className="mr-2" />
            <span className="font-medium">Your Information</span>
          </div>
        } 
        key="1"
        extra={<Badge status="processing" text="Required" />}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Form.Item
            name="firstName"
            label="Your First Name"
            rules={[{ required: true, message: 'Please input your name!' }]}
            tooltip="This personalizes your email signature"
          >
            <Input prefix={<UserOutlined />} placeholder="Your First Name" />
          </Form.Item>
          <Form.Item
            name="lastName"
            label="Your Last Name"
            rules={[{ required: true, message: 'Please input your last name!' }]}
          >
            <Input placeholder="Your Last Name" />
          </Form.Item>
          <Form.Item
            name="email"
            label="Your Email"
            rules={[{ required: true, message: 'Please input your email!' }]}
          >
            <Input prefix={<MailOutlined />} placeholder="your email here" />
          </Form.Item>
          <Form.Item
            name="jobTitle"
            label="Your Job Title"
            rules={[{ required: true, message: 'Please input your job title!' }]}
          >
            <Input placeholder="e.g., Growth Marketer" />
          </Form.Item>
          <Form.Item
            name="companyName"
            label="Your Company's Name"
            rules={[{ required: true, message: 'Please input your company name!' }]}
          >
            <Input placeholder="Your company" />
          </Form.Item>
          <Form.Item
            name="workEmail"
            label="Your Work Email Address"
            rules={[{ 
              required: true, 
              message: 'Please input your work email!',
              type: 'email'
            }]}
          >
            <Input placeholder="you@company.com" />
          </Form.Item>
          <Form.Item
            name="companyWebsite"
            label="Company Website"
            rules={[{ type: 'url', message: 'Please enter a valid URL' }]}
          >
            <Input prefix={<LinkOutlined />} placeholder="https://yourcompany.com" />
          </Form.Item>
        </div>
      </Panel>

      <Panel 
        header={
          <div className="flex items-center">
            <SolutionOutlined className="mr-2" />
            <span className="font-medium">Email Strategy</span>
          </div>
        } 
        key="2"
      >
        <div className="mb-4">
          <Text strong>Select your outreach method:</Text>
          <Text type="secondary" className="block mb-4">
            Different approaches work better for different goals
          </Text>
        </div>
        
        <Form.Item
          name="method"
          initialValue="direct"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {emailMethods.map((method) => (
              <Card
                key={method.value}
                onClick={() => {
                  setEmailMethod(method.value);
                  form.setFieldValue('method', method.value);
                }}
                className={`cursor-pointer ${emailMethod === method.value ? 'border-blue-500 border-2 ' : 'border-gray-300'} transition-none`}
              >
                <div className="flex items-start">
                  <div className="p-2  rounded-full mr-3">
                    {method.icon}
                  </div>
                  <div>
                    <div className="font-medium">{method.label}</div>
                    <div className="text-gray-500 text-sm mb-2">{method.description}</div>
                    <div className="flex flex-wrap gap-2">
                      <Tag color="blue">{method.effectiveness}</Tag>
                      <Tag color="geekblue">{method.bestFor}</Tag>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Form.Item>
        <Divider />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Form.Item
            name="tone"
            label="Email Tone"
            rules={[{ required: true, message: 'Please select email tone!' }]}
          >
            <Segmented 
              options={[
                { label: 'Professional', value: 'professional' },
                { label: 'Friendly', value: 'friendly' },
                { label: 'Casual', value: 'casual' },
                { label: 'Formal', value: 'formal' }
              ]}
            />
          </Form.Item>

          <Form.Item
            name="emailLength"
            label="Email Length"
          >
            <Select>
              <Option value="short">Short (~100 words)</Option>
              <Option value="medium">Medium (~150-200 words)</Option>
              <Option value="long">Long (~250-300 words)</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="quality"
            label="Generation Quality"
          >
            <Radio.Group>
              <Radio value="fast">Fast</Radio>
              <Radio value="balanced">Balanced</Radio>
              <Radio value="high">High Quality</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            name="creativity"
            label="Creativity Level"
          >
            <Radio.Group>
              <Radio value="low">Low</Radio>
              <Radio value="moderate">Moderate</Radio>
              <Radio value="high">High</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            name="variations"
            label="Number of Variations"
          >
            <Slider min={1} max={5} marks={{ 1: '1', 3: '3', 5: '5' }} />
          </Form.Item>

          <Form.Item
            name="generateFollowUps"
            valuePropName="checked"
            label="Generate Follow-up Sequence"
          >
            <Switch checkedChildren="Generate Follow-ups" unCheckedChildren="No Follow-ups" />
          </Form.Item>

          <Form.Item
            name="followUpCount"
            label="Number of Follow-ups"
          >
            <Slider min={1} max={5} marks={{ 1: '1', 3: '3', 5: '5' }} />
          </Form.Item>

          <Form.Item
            name="saveAsTemplate"
            valuePropName="checked"
            label="Save as Template"
          >
            <Switch checkedChildren="Save Template" unCheckedChildren="Don't Save" />
          </Form.Item>
        </div>

        <Divider />

        <div>
          <Text strong>Method Tips:</Text>
          <div className="mt-2">
            {emailMethod === 'interview' && (
              <Alert
                message="Interview Method Tips"
                description="Focus on making the interview valuable for them by offering to share insights afterward. Keep it to 15-20 minutes max."
                type="info"
                showIcon
              />
            )}
            {emailMethod === 'podcast' && (
              <Alert
                message="Podcast Method Tips"
                description="Have actual podcast content ready before sending. Reference specific timestamps that would be most relevant to them."
                type="info"
                showIcon
              />
            )}
            {emailMethod === 'direct' && (
              <Alert
                message="Direct Method Tips"
                description="Be specific about results you've achieved for similar companies. Include concrete numbers when possible."
                type="info"
                showIcon
              />
            )}
            {emailMethod === 'masterclass' && (
              <Alert
                message="Masterclass Method Tips"
                description="Position this as truly exclusive (limited seats). Include social proof of past participants' results."
                type="info"
                showIcon
              />
            )}
            {emailMethod === 'referral' && (
              <Alert
                message="Referral Method Tips"
                description="Mention the mutual connection early and explain the context of your relationship. Be specific about why the referral was made."
                type="info"
                showIcon
              />
            )}
            {emailMethod === 'problem' && (
              <Alert
                message="Problem-Solution Method Tips"
                description="Clearly articulate a specific pain point and position your solution as the answer. Use data to back up your claims."
                type="info"
                showIcon
              />
            )}
          </div>
        </div>
      </Panel>

      <Panel 
        header={
          <div className="flex items-center">
            <ContactsOutlined className="mr-2" />
            <span className="font-medium">Target Details</span>
          </div>
        } 
        key="3"
        extra={<Badge status="processing" text="Required" />}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Form.Item
            name="targetIndustry"
            label={
              <span>
                Target Industry{' '}
                <Tooltip title="The industry your prospect works in">
                  <InfoCircleOutlined />
                </Tooltip>
              </span>
            }
            rules={[{ required: true, message: 'Please select an industry!' }]}
          >
            <Select 
              showSearch
              placeholder="e.g., B2B SaaS, E-commerce Brands, Healthcare"
              options={industries.map(ind => ({ value: ind, label: ind }))}
            />
          </Form.Item>
          <Form.Item
            name="targetRole"
            label={
              <span>
                Target Role{' '}
                <Tooltip title="The job title of the person you're emailing">
                  <InfoCircleOutlined />
                </Tooltip>
              </span>
            }
            rules={[{ required: true, message: 'Please select a role!' }]}
          >
            <Select 
              showSearch
              placeholder="e.g., Marketing Manager, CEO, Head of Sales"
              options={roles.map(role => ({ value: role, label: role }))}
            />
          </Form.Item>
          <Form.Item
            name="targetFirstName"
            label="Recipient's First Name (optional)"
            tooltip="Personalized emails get 26% higher open rates"
          >
            <Input placeholder="First name if known" />
          </Form.Item>
          <Form.Item
            name="targetCompany"
            label="Recipient's Company (optional)"
          >
            <Input placeholder="Company name if known" />
          </Form.Item>
          <Form.Item
            name="targetCompanySize"
            label="Target Company Size"
          >
            <Select placeholder="Select company size">
              <Option value="1-10">1-10 employees</Option>
              <Option value="11-50">11-50 employees</Option>
              <Option value="51-200">51-200 employees</Option>
              <Option value="201-1000">201-1000 employees</Option>
              <Option value="1000+">1000+ employees</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="targetPainPoints"
            label="Target Pain Points"
          >
            <Select 
              mode="tags" 
              placeholder="Add pain points..."
              options={painPoints.map(point => ({ value: point, label: point }))}
            />
          </Form.Item>
          <Form.Item
            name="targetGoals"
            label="Target Goals"
          >
            <Select 
              mode="tags" 
              placeholder="Add goals..."
              options={[
                'Increase Revenue',
                'Reduce Costs',
                'Improve Efficiency',
                'Boost Engagement',
                'Scale Operations'
              ].map(goal => ({ value: goal, label: goal }))}
            />
          </Form.Item>
        </div>

        <Divider />

        <Form.Item
          name="valueProposition"
          label={
            <span>
              Your Value Proposition{' '}
              <Tooltip title="What specific benefit do you offer this type of prospect?">
                <InfoCircleOutlined />
              </Tooltip>
            </span>
          }
          rules={[{ required: true, message: 'Please input your value proposition!' }]}
        >
          <TextArea 
            rows={3} 
            placeholder="e.g., We help [target role] in [industry] achieve [specific outcome] by [your unique approach]"
          />
        </Form.Item>

        <Form.Item
          name="uniqueDifferentiator"
          label="Unique Differentiator"
          tooltip="What makes your offering stand out?"
        >
          <TextArea 
            rows={2} 
            placeholder="e.g., Our proprietary AI technology delivers 3x faster results"
          />
        </Form.Item>

        <Form.Item
          name="socialProof"
          label="Social Proof"
          tooltip="Add credibility with results or testimonials"
        >
          <TextArea 
            rows={2} 
            placeholder="e.g., Helped 50+ SaaS companies increase conversion rates by 30%"
          />
        </Form.Item>
      </Panel>

      <Panel 
        header={
          <div className="flex items-center">
            <LinkOutlined className="mr-2" />
            <span className="font-medium">Advanced Options</span>
          </div>
        } 
        key="4"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Form.Item
            name="phone"
            label="Your Phone Number"
          >
            <Input placeholder="+1 (555) 123-4567" />
          </Form.Item>
          <Form.Item
            name="linkedIn"
            label="LinkedIn URL"
          >
            <Input 
              prefix={<LinkOutlined />} 
              placeholder="https://linkedin.com/in/yourprofile" 
            />
          </Form.Item>
          <Form.Item
            name="companyAddress"
            label="Your Company Address"
            tooltip="Including an address can increase trust"
          >
            <Input placeholder="123 Main St, City, State" />
          </Form.Item>
          <Form.Item
            name="callToAction"
            label="Desired Next Step"
          >
            <Select placeholder="Select preferred action">
              <Option value="call">Schedule a call</Option>
              <Option value="demo">Book a demo</Option>
              <Option value="coffee">Coffee meeting</Option>
              <Option value="lunch">Lunch meeting</Option>
              <Option value="reply">Just get a reply</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="meetingType"
            label="Meeting Type"
          >
            <Select placeholder="Select meeting type">
              <Option value="call">Phone Call</Option>
              <Option value="demo">Demo</Option>
              <Option value="coffee">Coffee Meeting</Option>
              <Option value="lunch">Lunch Meeting</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="urgencyFactor"
            label="Urgency Factor"
          >
            <Input placeholder="e.g., Limited spots available this month" />
          </Form.Item>
          <Form.Item
            name="subjectLineStyle"
            label="Subject Line Style"
          >
            <Select placeholder="Select style">
              <Option value="intriguing">Intriguing</Option>
              <Option value="direct">Direct</Option>
              <Option value="personal">Personalized</Option>
              <Option value="benefit">Benefit-focused</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="personalizedElement"
            label="Personalization Element"
            tooltip="Add specific details about the recipient"
          >
            <TextArea 
              rows={2} 
              placeholder="e.g., I noticed your recent blog post about X"
            />
          </Form.Item>
        </div>

        <Divider />

        <Title level={5} className="mb-2">Referral Information (Optional)</Title>
        <Text type="secondary" className="block mb-4">
          Only needed if using referral/forwarding angle
        </Text>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Form.Item
            name="referrerFirstName"
            label="Referrer's First Name"
          >
            <Input placeholder="First name" />
          </Form.Item>
          <Form.Item
            name="referrerLastName"
            label="Referrer's Last Name"
          >
            <Input placeholder="Last name" />
          </Form.Item>
          <Form.Item
            name="referrerJobTitle"
            label="Referrer's Job Title"
          >
            <Input placeholder="e.g., CEO" />
          </Form.Item>
          <Form.Item
            name="referrerEmail"
            label="Referrer's Email Address"
          >
            <Input placeholder="referrer@company.com" />
          </Form.Item>
          <Form.Item
            name="referrerRelationship"
            label="Referrer Relationship"
          >
            <Input placeholder="e.g., Former colleague" />
          </Form.Item>
        </div>
      </Panel>

      <Panel 
        header={
          <div className="flex items-center">
            <SolutionOutlined className="mr-2" />
            <span className="font-medium">Templates</span>
          </div>
        } 
        key="5"
      >
        <Button
          type="primary"
          onClick={fetchTemplates}
          loading={templatesLoading}
        >
          Load Saved Templates
        </Button>
      </Panel>
    </Collapse>

    <div className="text-center mt-6">
      <Button 
        type="primary" 
        size="large" 
        htmlType="submit"
        loading={loading}
        icon={<ArrowRightOutlined />}
        className="min-w-48"
        disabled={loading}
      >
        {loading ? 'Generating AI Email...' : 'Generate AI Email'}
      </Button>
    </div>
  </Form>
)}

{activeTab === 'saved' && (
  <div>
    <div className="flex justify-between items-center mb-4">
      <Title level={3}>Saved Emails</Title>
      <Button 
        icon={<ArrowRightOutlined />} 
        onClick={fetchSavedEmails}
        loading={savedEmailsLoading}
      >
        Refresh
      </Button>
    </div>
    
    {savedEmailsLoading ? (
      <div className="text-center py-8">
        <Spin size="large" tip="Loading saved emails..." />
      </div>
    ) : savedEmails.length === 0 ? (
      <div className="text-center py-12">
        <MailOutlined style={{ fontSize: '48px', color: '#ccc', marginBottom: '16px' }} />
        <Title level={4} type="secondary">No Saved Emails Yet</Title>
        <Text type="secondary">
          Generate your first email campaign to see it here
        </Text>
        <br />
        <Button 
          type="primary" 
          onClick={() => setActiveTab('compose')}
          className="mt-4"
        >
          Create Your First Email
        </Button>
      </div>
    ) : (
      <Table
        dataSource={savedEmails}
        rowKey="id"
        pagination={{ pageSize: 10 }}
          className="no-vertical-borders" 
        columns={[
          {
            title: 'Campaign',
            dataIndex: 'title',
            key: 'title',
          },
          {
            title: 'Target',
            key: 'target',
            render: (record: any) => (
              <div>
                <div>{record.targetCompany || record.targetFirstName || 'Unknown'}</div>
                <Text type="secondary">{record.targetRole}</Text>
              </div>
            ),
          },
          {
            title: 'Method',
            dataIndex: 'method',
            key: 'method',
            render: (method: string) => <Tag color="blue">{method}</Tag>,
          },
          {
            title: 'Emails',
            dataIndex: 'emailCount',
            key: 'emailCount',
          },
          {
            title: 'Created',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date: string) => new Date(date).toLocaleDateString(),
          },
         {
  title: 'Actions',
  key: 'actions',
  render: (record: any) => (
    <Space>
      <Button
        icon={viewLoading === record.id ? <Spin /> : <EyeOutlined />}
        onClick={() => handleViewSavedEmail(record.id)}
        disabled={viewLoading !== null} // Disable all view buttons when any is loading
      >
        View
      </Button>
      <Button
        icon={<DownloadOutlined />}
        onClick={() => {
          // Add download functionality if needed
        }}
      >
        Download
      </Button>
      <Button
        danger
        onClick={() => handleDeleteSavedEmail(record.id)}
      >
        Delete
      </Button>
    </Space>
  ),
}
        ]}
      />
    )}
  </div>
)}

{activeTab === 'templates' && (
  <div>
    <div className="flex justify-between items-center mb-4">
      <Title level={3}>Email Templates</Title>
      <Button
        type="primary"
        onClick={fetchTemplates}
        loading={templatesLoading}
      >
        Load Templates
      </Button>
    </div>
    
    {templates.length === 0 ? (
      <div className="text-center py-12">
        <ContactsOutlined style={{ fontSize: '48px', color: '#ccc', marginBottom: '16px' }} />
        <Title level={4} type="secondary">No Templates Found</Title>
        <Text type="secondary">
          Create email templates to reuse successful campaigns
        </Text>
      </div>
    ) : (
      <Table
        dataSource={templates}
          className="no-vertical-borders" 
        columns={columns}
        rowKey="id"
        pagination={{ pageSize: 5 }}
      />
    )}
  </div>
)}

      <Modal
        title="Saved Templates"
        open={isTemplateModalVisible}
        onCancel={() => setIsTemplateModalVisible(false)}
        footer={null}
        width={800}
      >
        <Table
          dataSource={templates}
            className="no-vertical-borders" 
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 5 }}
        />
      </Modal>
   {generatedEmails.length > 0 && (
  <div id="email-results" className="mt-8">
    {generatedEmails.map((email, index) => {
      console.log(`🔍 Rendering main email ${index + 1}:`, email);
      console.log(`🔍 Main email follow-up sequence:`, email.followUpSequence);

      const displayEmail = optimizedEmails[index] || email;
      const isOptimizationLoading = optimizationLoading[index] || false;

      return (
        <Card key={index} className="mb-4">
          <div className="flex justify-between items-center mb-4">
            <Title level={4}>
              Generated Email {index + 1}
              {optimizedEmails[index] && (
                <Tag color="green" className="ml-2">
                  Optimized for {optimizedEmails[index].metadata?.optimizationType}
                </Tag>
              )}
            </Title>
            <Space>
              <Button
                onClick={() => {
                  console.log(`Optimizing main email ${index} for personalization`);
                  handleOptimizeEmail(
                    index,
                    `${email.subject}\n\n${email.body}\n\n${email.signature}`,
                    'personalization'
                  );
                }}
                loading={isOptimizationLoading}
                disabled={loading}
              >
                Optimize Personalization
              </Button>
              {/* <Button
                onClick={() => {
                  console.log(`Optimizing main email ${index} for value`);
                  handleOptimizeEmail(
                    index,
                    `${email.subject}\n\n${email.body}\n\n${email.signature}`,
                    'value'
                  );
                }}
                loading={isOptimizationLoading}
                disabled={loading}
              >
                Optimize Value
              </Button> */}
              <Button
                icon={<DownloadOutlined />}
                onClick={() => {
                  console.log(`Downloading main email ${index}`);
                  downloadEmail(displayEmail);
                }}
                disabled={loading}
              >
                Download
              </Button>
              <Button
                type="primary"
                onClick={() => {
                  console.log(`Copying main email ${index} to clipboard`);
                  copyToClipboard(`${displayEmail.subject}\n\n${displayEmail.body}\n\n${displayEmail.signature}`);
                }}
                disabled={loading}
              >
                Copy to Clipboard
              </Button>
            </Space>
          </div>

          {optimizedEmails[index] && (
            <Alert
              message="Email Optimized"
              description={`This email has been optimized for ${optimizedEmails[index].metadata?.optimizationType}. Showing the optimized version below.`}
              type="success"
              showIcon
              className="mb-4"
              action={
                <Button
                  size="small"
                  onClick={() => {
                    console.log(`Reverting main email ${index} to original`);
                    setOptimizedEmails((prev) => {
                      const newState = { ...prev };
                      delete newState[index];
                      return newState;
                    });
                  }}
                >
                  Show Original
                </Button>
              }
            />
          )}

          <Alert
            message="Pro Tip"
            description={
              <div>
                <p>Personalize this further by:</p>
                <ul className="list-disc pl-5">
                  <li>Adding specific details about the recipient company</li>
                  <li>Referencing recent news about their industry</li>
                  <li>Including a personalized compliment</li>
                  <li>Mentioning mutual connections if any</li>
                </ul>
              </div>
            }
            type="info"
            showIcon
            className="mb-4"
          />

          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <pre className="whitespace-pre-wrap font-sans text-gray-800 leading-relaxed">
              Subject: {displayEmail.subject}
              {'\n\n'}
              {displayEmail.body}
              {'\n\n'}
              {displayEmail.signature}
            </pre>
          </div>

          {Array.isArray(displayEmail.followUpSequence) && displayEmail.followUpSequence.length > 0 ? (
            <>
              <Divider />
              <Title level={5} className="mb-2">
                Follow-Up Sequence
              </Title>
              <List
                grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 3 }}
                dataSource={displayEmail.followUpSequence}
                renderItem={(followUp: GeneratedEmail, followUpIndex: number) => {
                  console.log(`🔍 Rendering follow-up ${index}-${followUpIndex}:`, followUp);
                  const followUpKey = `${index}-${followUpIndex}`;
                  const followUpDisplay = optimizedEmails[followUpKey] || followUp;
                  const isFollowUpOptimizationLoading = optimizationLoading[followUpKey] || false;

                  return (
                    <List.Item>
                      <Card>
                        <div className="flex justify-between items-center mb-4">
                          <Title level={5} className="flex items-center">
                            <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2">
                              {followUp.metadata?.sequenceNumber || followUpIndex + 1}
                            </span>
                            Follow-Up (Day {followUp.metadata?.dayInterval || followUpIndex + 1})
                          </Title>
                          <Space wrap>
                            <Button
                              onClick={() => {
                                console.log(`Optimizing follow-up ${followUpKey} for personalization`);
                                handleOptimizeEmail(
                                  followUpKey,
                                  `${followUp.subject}\n\n${followUp.body}\n\n${followUp.signature}`,
                                  'personalization'
                                );
                              }}
                              loading={isFollowUpOptimizationLoading}
                              disabled={loading}
                            >
                              Optimize Personalization
                            </Button>
                            {/* <Button
                              onClick={() => {
                                console.log(`Optimizing follow-up ${followUpKey} for value`);
                                handleOptimizeEmail(
                                  followUpKey,
                                  `${followUp.subject}\n\n${followUp.body}\n\n${followUp.signature}`,
                                  'value'
                                );
                              }}
                              loading={isFollowUpOptimizationLoading}
                              disabled={loading}
                            >
                              Optimize Value
                            </Button> */}
                            <Button
                              icon={<DownloadOutlined />}
                              onClick={() => {
                                console.log(`Downloading follow-up ${followUpKey}`);
                                downloadEmail(followUpDisplay);
                              }}
                              disabled={loading}
                            >
                              Download
                            </Button>
                            <Button
                              type="primary"
                              onClick={() => {
                                console.log(`Copying follow-up ${followUpKey} to clipboard`);
                                copyToClipboard(`${followUpDisplay.subject}\n\n${followUpDisplay.body}\n\n${followUpDisplay.signature}`);
                              }}
                              disabled={loading}
                            >
                              Copy to Clipboard
                            </Button>
                          </Space>
                        </div>
                        {optimizedEmails[followUpKey] && (
                          <Alert
                            message="Follow-Up Optimized"
                            description={`This follow-up email has been optimized for ${optimizedEmails[followUpKey].metadata?.optimizationType}. Showing the optimized version below.`}
                            type="success"
                            showIcon
                            className="mb-4"
                            action={
                              <Button
                                size="small"
                                onClick={() => {
                                  console.log(`Reverting follow-up ${followUpKey} to original`);
                                  setOptimizedEmails((prev) => {
                                    const newState = { ...prev };
                                    delete newState[followUpKey];
                                    return newState;
                                  });
                                }}
                              >
                                Show Original
                              </Button>
                            }
                          />
                        )}
                        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                          <pre className="whitespace-pre-wrap font-sans text-gray-800 leading-relaxed">
                            Subject: {followUpDisplay.subject}
                            {'\n\n'}
                            {followUpDisplay.body}
                            {'\n\n'}
                            {followUpDisplay.signature}
                          </pre>
                        </div>
                      </Card>
                    </List.Item>
                  );
                }}
              />
            </>
          ) : (
            <Alert
              message="No Follow-Ups Generated"
              description="No follow-up emails were generated. Ensure 'Generate Follow-up Sequence' is enabled and try again."
              type="warning"
              showIcon
              className="mt-4"
            />
          )}
        </Card>
      );
    })}
  </div>
)}
{/* Email Preview Modal */}
{/* Email Preview Modal */}
<Modal
  title={
    <div className="flex items-center">
      <MailOutlined className="mr-2" />
      <span>Email Preview - {emailPreviewModal.email?.title}</span>
    </div>
  }
  open={emailPreviewModal.visible}
  onCancel={() => setEmailPreviewModal({ visible: false, email: null })}
  width={1000}
 footer={[
  <Button key="copy" 
    onClick={() => {
      if (emailPreviewModal.email?.emails?.[0]) {
        const email = emailPreviewModal.email.emails[0];
        copyToClipboard(`Subject: ${email.subject}\n\n${email.body}\n\n${email.signature}`);
      }
    }}
  >
    Copy First Email
  </Button>,
  <Button key="load" type="primary" 
    onClick={() => {
      if (emailPreviewModal.email?.emails) {
        setGeneratedEmails(emailPreviewModal.email.emails);
        setActiveTab('compose');
        setEmailPreviewModal({ visible: false, email: null });
        notification.success({
          message: 'Emails Loaded',
          description: 'Saved emails have been loaded into the compose tab',
          placement: 'topRight',
        });
      }
    }}
  >
    Load in Composer
  </Button>,
  <Button key="close" onClick={() => setEmailPreviewModal({ visible: false, email: null })}>
    Close
  </Button>
]}
>
  {emailPreviewModal.email && (
    <div className="space-y-6">
      {/* Email Metadata */}
      <div className="p-4 rounded-lg border">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <Text strong>Method:</Text> <Tag color="blue">{emailPreviewModal.email.metadata?.method || 'Unknown'}</Tag>
          </div>
          <div>
            <Text strong>Target:</Text> {emailPreviewModal.email.metadata?.targetCompany || emailPreviewModal.email.metadata?.targetFirstName || 'Unknown'}
          </div>
          <div>
            <Text strong>Industry:</Text> {emailPreviewModal.email.metadata?.targetIndustry || 'Not specified'}
          </div>
          <div>
            <Text strong>Role:</Text> {emailPreviewModal.email.metadata?.targetRole || 'Not specified'}
          </div>
          <div>
            <Text strong>Created:</Text> {new Date(emailPreviewModal.email.createdAt).toLocaleDateString()}
          </div>
          <div>
            <Text strong>Emails:</Text> {emailPreviewModal.email.metadata?.emailCount || emailPreviewModal.email.emails?.emails?.length || 0}
          </div>
        </div>
      </div>

      {/* Email Preview */}
{emailPreviewModal.email.emails?.map((email: any, index: number) => (
        <div key={index} className="border border-gray-900 rounded-lg overflow-hidden">
          {/* Email Header */}
          <div className=" px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <Text strong className="text-lg">Email {index + 1}</Text>
              <Space>
                <Button 
                  size="small" 
                  icon={<DownloadOutlined />}
                  onClick={() => downloadEmail(email)}
                >
                  Download
                </Button>
                <Button 
                  size="small" 
                  type="primary"
                  onClick={() => copyToClipboard(`Subject: ${email.subject}\n\n${email.body}\n\n${email.signature}`)}
                >
                  Copy
                </Button>
              </Space>
            </div>
            
            {/* Email Header Info */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center">
                <Text strong className="w-16">From:</Text>
                <Text>{emailPreviewModal.email.metadata?.senderName || 'Sender'} &lt;{emailPreviewModal.email.metadata?.workEmail || 'sender@company.com'}&gt;</Text>
              </div>
              <div className="flex items-center">
                <Text strong className="w-16">To:</Text>
                <Text>{emailPreviewModal.email.metadata?.targetFirstName || 'Prospect'} &lt;prospect@{(emailPreviewModal.email.metadata?.targetCompany || 'company').toLowerCase().replace(/\s+/g, '')}.com&gt;</Text>
              </div>
              <div className="flex items-center">
                <Text strong className="w-16">Subject:</Text>
                <Text className="font-medium">{email.subject}</Text>
              </div>
            </div>
          </div>

          {/* Email Body */}
          <div className=" px-6 py-6">
            <div className="prose max-w-none">
              <pre className="whitespace-pre-wrap font-sans  leading-relaxed text-base">
                {email.body}
              </pre>
              
              <Divider className="my-4" />
              
              <div className="text-gray-600">
                <pre className="whitespace-pre-wrap font-sans text-sm">
                  {email.signature}
                </pre>
              </div>
            </div>
          </div>

          {/* Follow-up Sequence */}
          {email.followUpSequence && email.followUpSequence.length > 0 && (
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <Text strong className="text-sm text-gray-600 mb-3 block">
                Follow-up Sequence ({email.followUpSequence.length} emails)
              </Text>
              <div className="space-y-4">
                {email.followUpSequence.map((followUp: any, followUpIndex: number) => (
                  <div key={followUpIndex} className="bg-white p-4 rounded border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <span className="bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">
                          {followUpIndex + 1}
                        </span>
                        <Text strong className="text-sm">
                          Follow-up {followUpIndex + 1}
                        </Text>
                        <Tag color="orange" className="ml-2">
                          Day {followUp.metadata?.dayInterval || (followUpIndex + 1) * 3}
                        </Tag>
                      </div>
                      <Button 
                        size="small" 
                        type="link"
                        onClick={() => copyToClipboard(`Subject: ${followUp.subject}\n\n${followUp.body}\n\n${followUp.signature}`)}
                      >
                        Copy
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-sm">
                        <Text strong>Subject:</Text> <Text className="ml-1">{followUp.subject}</Text>
                      </div>
                      
                      <div className="bg-gray-50 p-3 rounded">
                        <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700">
                          {followUp.body}
                        </pre>
                        <Divider className="my-2" />
                        <pre className="whitespace-pre-wrap font-sans text-xs text-gray-600">
                          {followUp.signature}
                        </pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )}
</Modal>
    </div>
  );
};

export default ColdEmailWriter;