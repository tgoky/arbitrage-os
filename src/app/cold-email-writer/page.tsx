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
  ArrowLeftOutlined,
  CopyOutlined,
  CheckCircleOutlined,
  CalendarOutlined,
  PhoneOutlined,
  EnvironmentOutlined
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
  notification,
  ConfigProvider,
  theme
} from 'antd';
import { useColdEmail } from '../hooks/useColdEmail';
import { GeneratedEmail, EmailTemplate, ColdEmailGenerationInput, ColdEmailOptimizationType } from '@/types/coldEmail';
import LoadingOverlay from './LoadingOverlay';
import { createClient } from '../../utils/supabase/client'; 
import { useParams, useRouter } from 'next/navigation';
import { useWorkspaceContext } from '../hooks/useWorkspaceContext';
import { AutoComplete } from 'antd';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;
const { Option } = Select;
const { TextArea } = Input;

// --- DARK MODE STYLING CONSTANTS ---
const SPACE_COLOR = '#9DA2B3';
const BRAND_GREEN = '#5CC49D';
const DARK_BG = '#0f172a'; // Deep space dark background
const SURFACE_BG = '#1e293b'; // Card surface background
const SURFACE_LIGHTER = '#334155'; // Lighter surfaces
const TEXT_PRIMARY = '#f1f5f9';
const TEXT_SECONDARY = '#94a3b8';
const TEXT_TERTIARY = '#64748b';
const BORDER_COLOR = '#334155';

const ColdEmailWriter = () => {
  const [form] = Form.useForm();
  const [emailMethod, setEmailMethod] = useState('direct');
  const [generatedEmails, setGeneratedEmails] = useState<GeneratedEmail[]>([]);
  const [activePanels, setActivePanels] = useState<string[]>(['1', '2', '3', '4', '5', '6']);
  const [isTemplateModalVisible, setIsTemplateModalVisible] = useState(false);
  const { currentWorkspace, isWorkspaceReady } = useWorkspaceContext();
  const [viewLoading, setViewLoading] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState('compose');
  const [savedEmails, setSavedEmails] = useState<any[]>([]);
  const [savedEmailsLoading, setSavedEmailsLoading] = useState(false);
  const generateFollowUps = Form.useWatch('generateFollowUps', form);
  const followUpCount = Form.useWatch('followUpCount', form);

  const [emailPreviewModal, setEmailPreviewModal] = useState<{
    visible: boolean;
    email: any;
  }>({ visible: false, email: null });

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
    getEmailGeneration, 
    deleteEmailGeneration,   
    getEmailGenerations,
  } = useColdEmail();

  const [optimizationLoading, setOptimizationLoading] = useState<{[key: string]: boolean}>({});
  const [templatesLoading, setTemplatesLoading] = useState(false);

  // --- GOOGLE FONT INJECTION ---
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  useEffect(() => {
    if (activeTab === 'saved' && currentWorkspace) {
      fetchSavedEmails();
    }
  }, [activeTab, currentWorkspace]);

  useEffect(() => {
    if (generatedEmails.length > 0) {
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

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        console.warn('No active session found');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed successfully');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!isWorkspaceReady) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 text-center min-h-[50vh] flex flex-col items-center justify-center bg-gray-900">
        <Spin size="large" tip="Initializing Workspace..." />
      </div>
    );
  }

  if (!currentWorkspace) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 bg-gray-900">
        <Alert
          message="Workspace Required"
          description="The cold email writer must be accessed from within a workspace. Please navigate to a workspace first."
          type="error"
          showIcon
          action={
            <Button type="primary" href="/dashboard" style={{ background: BRAND_GREEN, color: '#000' }}>
              Go to Dashboard
            </Button>
          }
        />
      </div>
    );
  }

  // --- DATA DEFINITIONS ---
  const emailMethods = [
    {
      value: 'interview',
      label: 'Interview Method',
      description: 'Position yourself as interviewer',
      icon: <SolutionOutlined style={{ fontSize: '20px' }} />,
      effectiveness: 'High',
      bestFor: 'Building Relationships'
    },
    {
      value: 'podcast',
      label: 'Podcast Method',
      description: 'Leverage guesting for credibility',
      icon: <ContactsOutlined style={{ fontSize: '20px' }} />,
      effectiveness: 'Medium',
      bestFor: 'Thought Leadership'
    },
    {
      value: 'direct',
      label: 'Direct Method',
      description: 'Straightforward value proposition',
      icon: <ThunderboltOutlined style={{ fontSize: '20px' }} />,
      effectiveness: 'Highest',
      bestFor: 'Clear Offers'
    },
    {
      value: 'masterclass',
      label: 'Masterclass Method',
      description: 'Offer exclusive educational content',
      icon: <BulbOutlined style={{ fontSize: '20px' }} />,
      effectiveness: 'High',
      bestFor: 'Lead Generation'
    },
    {
      value: 'referral',
      label: 'Referral Method',
      description: 'Leverage warm introductions',
      icon: <TeamOutlined style={{ fontSize: '20px' }} />,
      effectiveness: 'High',
      bestFor: 'Warm Leads'
    },
    {
      value: 'problem',
      label: 'Problem-Solution',
      description: 'Address specific pain points',
      icon: <WarningOutlined style={{ fontSize: '20px' }} />,
      effectiveness: 'High',
      bestFor: 'Targeted Solving'
    }
  ];

  const industries = ['B2B SaaS', 'E-commerce', 'Healthcare', 'Finance', 'Marketing Agencies', 'Real Estate', 'Education', 'Manufacturing'];
  const roles = ['CEO', 'Marketing Manager', 'Head of Sales', 'CTO', 'Operations Manager', 'HR Director', 'Product Manager'];
  const painPoints = ['Low Conversion Rates', 'High Customer Acquisition Costs', 'Inefficient Processes', 'Low Engagement', 'High Churn Rates', 'Poor ROI on Marketing'];
  const targetGoals = ['Increase Revenue', 'Reduce Costs', 'Improve Efficiency', 'Boost Engagement', 'Scale Operations'];

  // --- FUNCTIONS ---
  const fetchSavedEmails = async () => {
    setSavedEmailsLoading(true);
    try {
      const emails = await getEmailGenerations(currentWorkspace?.id);
      setSavedEmails(emails);
    } catch (error) {
      notification.error({ message: 'Failed to Load Saved Emails' });
    } finally {
      setSavedEmailsLoading(false);
    }
  };

  const handleViewSavedEmail = async (generationId: string) => {
    setViewLoading(generationId);
    try {
      const generation = await getEmailGeneration(generationId);
      if (generation) {
        setEmailPreviewModal({ visible: true, email: generation });
      }
    } catch (error) {
      notification.error({ message: 'Failed to Load Email' });
    } finally {
      setViewLoading(null);
    }
  };

  const handleDeleteSavedEmail = async (generationId: string) => {
    try {
      await deleteEmailGeneration(generationId);
      notification.success({ message: 'Email Deleted' });
      fetchSavedEmails();
    } catch (error) {
      notification.error({ message: 'Failed to Delete Email' });
    }
  };

  // Comprehensive data cleaning function
  const cleanFormData = (data: any) => {
    const cleaned: any = {};
    
    Object.entries(data).forEach(([key, value]) => {
      // Skip empty/invalid values
      if (value === null || value === undefined || value === '') {
        return;
      }
      
      // Handle arrays
      if (Array.isArray(value)) {
        if (value.length > 0) {
          cleaned[key] = value.filter(item => item && item.trim && item.trim() !== '');
        }
        return;
      }
      
      // Handle strings
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed === '') return;
        
        // Validate emails specifically
        if (key.toLowerCase().includes('email')) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (emailRegex.test(trimmed)) {
            cleaned[key] = trimmed;
          }
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

  const onFinish = async (values: any) => {
    try {
      console.log('🔍 Raw form values:', values);

      const cleanedValues = cleanFormData(values);
      console.log('🧹 Cleaned form data:', cleanedValues);

      // Build request with only valid, cleaned data
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

      // Required field validation
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
      
      console.log('✅ Generate emails returned:', result);
      setGeneratedEmails(result);
      
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
      message.success('Copied to clipboard!');
    } catch (error) {
      message.error('Failed to copy');
    }
  };

  const downloadEmail = (email: GeneratedEmail) => {
    try {
      const content = `Subject: ${email.subject}\n\n${email.body}\n\n${email.signature}`;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `cold-email-${email.metadata?.variationIndex || Date.now()}.txt`;
      anchor.click();
      URL.revokeObjectURL(url);
      message.success('Downloaded successfully!');
    } catch (error) {
      message.error('Failed to download');
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
      
      // Parse optimized content
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
      
      // Determine if this is a main email or follow-up
      const isFollowUp = typeof emailIndex === 'string' && emailIndex.includes('-');
      let originalEmail: GeneratedEmail;
      
      if (isFollowUp) {
        const [mainIndex, followUpIndex] = (emailIndex as string).split('-').map(Number);
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
    } catch (error) {
      notification.error({ message: 'Failed to Load Templates' });
    } finally {
      setTemplatesLoading(false);
    }
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
      render: (text: string) => <span className="font-manrope font-medium text-gray-200">{text}</span>
    },
    {
      title: 'Subject',
      dataIndex: 'subject',
      key: 'subject',
      ellipsis: true,
      render: (text: string) => <span className="text-gray-300">{text}</span>
    },
    {
      title: 'Method',
      dataIndex: 'method',
      key: 'method',
      render: (method: string) => (
        <Tag style={{ 
          color: BRAND_GREEN, 
          borderColor: BRAND_GREEN, 
          background: 'transparent',
          fontFamily: 'Manrope' 
        }}>
          {emailMethods.find(m => m.value === method)?.label || method}
        </Tag>
      ),
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => <span className="text-gray-400">{new Date(date).toLocaleDateString()}</span>,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, template: EmailTemplate) => (
        <Space>
          <Button 
            icon={<EyeOutlined />} 
            size="small"
            style={{ background: SURFACE_LIGHTER, borderColor: BORDER_COLOR, color: TEXT_PRIMARY }}
            onClick={() => {
              Modal.info({
                title: <span className="font-manrope text-gray-100">{template.name}</span>,
                content: (
                  <div className="font-manrope mt-4">
                    <p className="font-bold mb-2 text-gray-300">Subject: {template.subject}</p>
                    <div className="bg-gray-800 p-3 rounded border border-gray-700">
                      <pre className="whitespace-pre-wrap font-sans text-sm text-gray-300">{template.body}</pre>
                    </div>
                  </div>
                ),
                width: 600,
                className: 'dark-modal',
                styles: {
                  content: { backgroundColor: SURFACE_BG },
                  header: { backgroundColor: SURFACE_BG, borderColor: BORDER_COLOR }
                }
              });
            }}
          >
            Preview
          </Button>
          <Button 
            icon={<CopyOutlined />}
            style={{ background: SURFACE_LIGHTER, borderColor: BORDER_COLOR, color: TEXT_PRIMARY }}
            onClick={() => copyToClipboard(`Subject: ${template.subject}\n\n${template.body}`)}
          >
            Copy
          </Button>
          <Button 
            type="primary"
            icon={<SelectOutlined />}
            onClick={() => handleApplyTemplate(template)}
            style={{ background: BRAND_GREEN, borderColor: BRAND_GREEN, color: '#000' }}
          >
            Apply
          </Button>
        </Space>
      ),
    },
  ];

  // --- RENDER ---
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
            borderColor: SURFACE_LIGHTER,
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
          },
          Card: {
            headerBg: SURFACE_BG,
            colorBgContainer: SURFACE_BG,
            colorTextHeading: TEXT_PRIMARY,
            colorBorder: BORDER_COLOR,
          },
          Collapse: {
            headerBg: SURFACE_BG,
            contentBg: SURFACE_BG,
            colorBorder: 'transparent',
          },
          Segmented: {
            itemSelectedBg: BRAND_GREEN,
            itemSelectedColor: '#000000',
            trackBg: SURFACE_LIGHTER,
            colorText: TEXT_SECONDARY,
          },
          Table: {
            headerBg: SURFACE_LIGHTER,
            headerColor: TEXT_PRIMARY,
            rowHoverBg: '#2d3748',
            colorBgContainer: SURFACE_BG,
            borderColor: BORDER_COLOR,
          },
          Slider: {
            trackBg: BRAND_GREEN,
            railBg: SURFACE_LIGHTER,
            handleColor: BRAND_GREEN,
          },
          Switch: {
            colorPrimary: BRAND_GREEN,
            colorPrimaryHover: BRAND_GREEN,
          },
          Radio: {
            buttonSolidCheckedColor: '#000',
            buttonSolidCheckedBg: BRAND_GREEN,
            colorBorder: BORDER_COLOR,
          }
        }
      }}
    >
      <div className="min-h-screen bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 py-12 font-manrope">
          <LoadingOverlay visible={loading} />
          
          {/* Navigation Header */}
          <div className="mb-10">
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={() => router.push(`/dashboard/${currentWorkspace?.slug}`)}
              className="mb-6 hover:text-white border-none shadow-none px-0"
              style={{ background: 'transparent', color: SPACE_COLOR }}
            >
              Back to Dashboard
            </Button>

            <div className="flex flex-col items-center justify-center mb-8">
              <div className="bg-gray-800/50 backdrop-blur-sm px-6 py-2 rounded-full border border-gray-700 mb-4">
                <span className="text-[15px] font-bold tracking-widest uppercase text-gray-100">
                  <span style={{ color: BRAND_GREEN }}>a</span>rb<span style={{ color: BRAND_GREEN }}>i</span>trageOS
                </span>
              </div>
              <Title level={1} style={{ marginBottom: 8, fontSize: '36px', fontWeight: 800, color: TEXT_PRIMARY }}>
                Cold Email Writer
              </Title>
              <Text className="text-lg text-gray-400 max-w-2xl text-center">
                Generate high-converting, personalized outreach campaigns tailored to your ideal prospect profile.
              </Text>
            </div>

            {/* Custom Tabs */}
            <div className="flex justify-center mb-10">
              <div className="bg-gray-800 p-1.5 rounded-xl inline-flex gap-2">
                <button
                  onClick={() => setActiveTab('compose')}
                  className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                    activeTab === 'compose' 
                      ? 'bg-gray-700 text-white shadow-sm ring-1 ring-gray-600' 
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  <MailOutlined /> Compose
                </button>
                <button
                  onClick={() => setActiveTab('saved')}
                  className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                    activeTab === 'saved' 
                      ? 'bg-gray-700 text-white shadow-sm ring-1 ring-gray-600' 
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  <SolutionOutlined /> Saved Emails
                  {savedEmails.length > 0 && (
                    <span className="bg-gray-600 text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1">
                      {savedEmails.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('templates')}
                  className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                    activeTab === 'templates' 
                      ? 'bg-gray-700 text-white shadow-sm ring-1 ring-gray-600' 
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  <ContactsOutlined /> Templates
                </button>
              </div>
            </div>
          </div>

          {/* COMPOSE TAB */}
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
                targetRole: 'CEO',
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
                  className="mb-6 rounded-lg bg-red-900/20 border-red-800"
                />
              )}

              {/* Follow-up Warning Alert */}
              {!generateFollowUps && followUpCount > 1 && (
                <Alert
                  message="Follow-up Generation Disabled"
                  description="You've selected follow-ups but haven't enabled follow-up generation. Please toggle 'Generate Follow-up Sequence' above."
                  type="warning"
                  showIcon
                  className="mb-6 bg-yellow-900/20 border-yellow-800"
                  action={
                    <Button 
                      size="small" 
                      onClick={() => form.setFieldValue('generateFollowUps', true)}
                      style={{ background: BRAND_GREEN, color: '#000' }}
                    >
                      Enable Follow-ups
                    </Button>
                  }
                />
              )}

              <div className="space-y-6">
                <Collapse 
                  activeKey={activePanels} 
                  onChange={(keys) => setActivePanels(keys as string[])}
                  expandIconPosition="end"
                  ghost
                  className="site-collapse-custom-collapse"
                >
                  {/* Panel 1: Your Info */}
                  <Panel 
                    header={
                      <div className="flex items-center py-2">
                        <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center mr-4 text-gray-400">
                          <UserOutlined style={{ fontSize: '18px' }} />
                        </div>
                        <div>
                          <div className="font-bold text-lg text-gray-100">Your Information</div>
                          <div className="text-sm text-gray-500 font-medium">Who is sending this email?</div>
                        </div>
                      </div>
                    } 
                    key="1"
                    className="mb-4 bg-gray-800 border border-gray-700 rounded-xl overflow-hidden shadow-sm"
                  >
                    <div className="p-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Form.Item name="firstName" label="First Name" rules={[{ required: true }]}>
                        <Input placeholder="e.g. John" />
                      </Form.Item>
                      <Form.Item name="lastName" label="Last Name" rules={[{ required: true }]}>
                        <Input placeholder="e.g. Doe" />
                      </Form.Item>
                      <Form.Item name="email" label="Personal Email" rules={[{ required: true }]}>
                        <Input prefix={<MailOutlined className="text-gray-500" />} placeholder="john@example.com" />
                      </Form.Item>
                      <Form.Item name="workEmail" label="Work Email" rules={[{ required: true, type: 'email' }]}>
                        <Input prefix={<MailOutlined className="text-gray-500" />} placeholder="john@company.com" />
                      </Form.Item>
                      <Form.Item name="jobTitle" label="Job Title" rules={[{ required: true }]}>
                        <Input placeholder="e.g. Growth Manager" />
                      </Form.Item>
                      <Form.Item name="companyName" label="Company Name" rules={[{ required: true }]}>
                        <Input placeholder="e.g. Acme Corp" />
                      </Form.Item>
                      <Form.Item name="companyWebsite" label="Website">
                        <Input prefix={<LinkOutlined className="text-gray-500" />} placeholder="https://..." />
                      </Form.Item>
                      <Form.Item name="companyAddress" label="Company Address">
                        <Input prefix={<EnvironmentOutlined className="text-gray-500" />} placeholder="123 Main St, City, State" />
                      </Form.Item>
                    </div>
                  </Panel>

                  {/* Panel 2: Strategy */}
                  <Panel 
                    header={
                      <div className="flex items-center py-2">
                        <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center mr-4 text-gray-400">
                          <SolutionOutlined style={{ fontSize: '18px' }} />
                        </div>
                        <div>
                          <div className="font-bold text-lg text-gray-100">Email Strategy</div>
                          <div className="text-sm text-gray-500 font-medium">Define the approach and tone</div>
                        </div>
                      </div>
                    } 
                    key="2"
                    className="mb-4 bg-gray-800 border border-gray-700 rounded-xl overflow-hidden shadow-sm"
                  >
                    <div className="p-2">
                      <Form.Item name="method" initialValue="direct" className="mb-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {emailMethods.map((method) => (
                            <div
                              key={method.value}
                              onClick={() => {
                                setEmailMethod(method.value);
                                form.setFieldValue('method', method.value);
                              }}
                              className={`
                                cursor-pointer relative p-5 rounded-xl border-2 transition-all duration-200 group hover:shadow-md hover:border-${BRAND_GREEN}
                                ${emailMethod === method.value 
                                  ? `border-[${BRAND_GREEN}] bg-[${BRAND_GREEN}]/10` 
                                  : `border-gray-700 hover:border-gray-600`}
                              `}
                            >
                              <div className="flex justify-between items-start mb-3">
                                <div className={`
                                  w-10 h-10 rounded-lg flex items-center justify-center text-xl
                                  ${emailMethod === method.value ? `text-[${BRAND_GREEN}] bg-gray-800` : 'text-gray-500 bg-gray-800'}
                                `}>
                                  {method.icon}
                                </div>
                                {emailMethod === method.value && <CheckCircleOutlined className="text-[#5CC49D]" />}
                              </div>
                              <div className="font-bold text-gray-100 mb-1">{method.label}</div>
                              <div className="text-xs text-gray-400 mb-3 leading-relaxed">{method.description}</div>
                              <div className="flex gap-2">
                                <span className="text-[10px] font-bold bg-gray-700 text-gray-300 px-2 py-1 rounded">
                                  {method.effectiveness} Resp.
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </Form.Item>

                      {/* Method-specific Tips */}
                      {emailMethod && (
                        <div className="mb-6">
                          {emailMethod === 'interview' && (
                            <Alert
                              message="Interview Method Tips"
                              description="Focus on making the interview valuable for them by offering to share insights afterward. Keep it to 15-20 minutes max."
                              type="info"
                              showIcon
                              className="bg-blue-900/20 border-blue-800"
                            />
                          )}
                          {emailMethod === 'podcast' && (
                            <Alert
                              message="Podcast Method Tips"
                              description="Have actual podcast content ready before sending. Reference specific timestamps that would be most relevant to them."
                              type="info"
                              showIcon
                              className="bg-blue-900/20 border-blue-800"
                            />
                          )}
                          {emailMethod === 'direct' && (
                            <Alert
                              message="Direct Method Tips"
                              description="Be specific about results you've achieved for similar companies. Include concrete numbers when possible."
                              type="info"
                              showIcon
                              className="bg-blue-900/20 border-blue-800"
                            />
                          )}
                          {emailMethod === 'masterclass' && (
                            <Alert
                              message="Masterclass Method Tips"
                              description="Position this as truly exclusive (limited seats). Include social proof of past participants' results."
                              type="info"
                              showIcon
                              className="bg-blue-900/20 border-blue-800"
                            />
                          )}
                          {emailMethod === 'referral' && (
                            <Alert
                              message="Referral Method Tips"
                              description="Mention the mutual connection early and explain the context of your relationship. Be specific about why the referral was made."
                              type="info"
                              showIcon
                              className="bg-blue-900/20 border-blue-800"
                            />
                          )}
                          {emailMethod === 'problem' && (
                            <Alert
                              message="Problem-Solution Method Tips"
                              description="Clearly articulate a specific pain point and position your solution as the answer. Use data to back up your claims."
                              type="info"
                              showIcon
                              className="bg-blue-900/20 border-blue-800"
                            />
                          )}
                        </div>
                      )}

                      <Divider className="border-gray-700" />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Form.Item name="tone" label="Tone of Voice" rules={[{ required: true }]}>
                          <Segmented 
                            block
                            options={[
                              { label: 'Professional', value: 'professional' },
                              { label: 'Friendly', value: 'friendly' },
                              { label: 'Casual', value: 'casual' },
                              { label: 'Formal', value: 'formal' }
                            ]}
                          />
                        </Form.Item>
                        <Form.Item name="emailLength" label="Email Length">
                          <Select>
                            <Option value="short">Concise (~100 words)</Option>
                            <Option value="medium">Standard (~150 words)</Option>
                            <Option value="long">Detailed (~250 words)</Option>
                          </Select>
                        </Form.Item>

                        <Form.Item name="quality" label="Generation Quality">
                          <Radio.Group>
                            <Radio.Button value="fast">Fast</Radio.Button>
                            <Radio.Button value="balanced">Balanced</Radio.Button>
                            <Radio.Button value="high">High Quality</Radio.Button>
                          </Radio.Group>
                        </Form.Item>

                        <Form.Item name="creativity" label="Creativity Level">
                          <Radio.Group>
                            <Radio.Button value="low">Low</Radio.Button>
                            <Radio.Button value="moderate">Moderate</Radio.Button>
                            <Radio.Button value="high">High</Radio.Button>
                          </Radio.Group>
                        </Form.Item>
                        
                        <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8 bg-gray-900 p-6 rounded-xl border border-gray-800">
                          <div>
                            <Form.Item name="generateFollowUps" valuePropName="checked" label="Follow-up Sequence" className="mb-2">
                              <Switch checkedChildren="On" unCheckedChildren="Off" />
                            </Form.Item>
                            <Text className="text-xs text-gray-500 block mb-4">Automatically generate subsequent emails</Text>
                            
                            <Form.Item name="followUpCount" label={`Number of Follow-ups (${followUpCount})`}>
                              <Slider min={1} max={5} disabled={!generateFollowUps} tooltip={{ open: false }} />
                            </Form.Item>
                          </div>
                          
                          <div>
                            <Form.Item name="variations" label="Creative Variations">
                              <Radio.Group buttonStyle="solid">
                                <Radio.Button value={1}>1</Radio.Button>
                                <Radio.Button value={3}>3</Radio.Button>
                                <Radio.Button value={5}>5</Radio.Button>
                              </Radio.Group>
                            </Form.Item>
                            <Form.Item name="saveAsTemplate" valuePropName="checked" className="mb-0">
                              <div className="flex items-center gap-2">
                                <Switch /> <span className="font-medium text-gray-300">Save successful generations as templates</span>
                              </div>
                            </Form.Item>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Panel>

                  {/* Panel 3: Target Details */}
                  <Panel 
                    header={
                      <div className="flex items-center py-2">
                        <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center mr-4 text-gray-400">
                          <ContactsOutlined style={{ fontSize: '18px' }} />
                        </div>
                        <div>
                          <div className="font-bold text-lg text-gray-100">Target Audience</div>
                          <div className="text-sm text-gray-500 font-medium">Who are you writing to?</div>
                        </div>
                      </div>
                    } 
                    key="3"
                    className="mb-4 bg-gray-800 border border-gray-700 rounded-xl overflow-hidden shadow-sm"
                  >
                    <div className="p-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <Form.Item name="targetIndustry" label="Target Industry" rules={[{ required: true }]}>
                          <AutoComplete
                            placeholder="e.g. Fintech, Healthcare..."
                            options={industries.map(ind => ({ value: ind }))}
                            filterOption={(input, option) => option!.value.toUpperCase().includes(input.toUpperCase())}
                          />
                        </Form.Item>
                        <Form.Item name="targetRole" label="Target Role" rules={[{ required: true }]}>
                          <AutoComplete
                            placeholder="e.g. CMO, Founder..."
                            options={roles.map(role => ({ value: role }))}
                            filterOption={(input, option) => option!.value.toUpperCase().includes(input.toUpperCase())}
                          />
                        </Form.Item>
                        <Form.Item name="targetCompany" label="Recipient's Company (Optional)">
                          <Input placeholder="Company name if known" />
                        </Form.Item>
                        <Form.Item name="targetCompanySize" label="Company Size">
                          <Select placeholder="Select company size">
                            <Option value="1-10">1-10 employees</Option>
                            <Option value="11-50">11-50 employees</Option>
                            <Option value="51-200">51-200 employees</Option>
                            <Option value="201-1000">201-1000 employees</Option>
                            <Option value="1000+">1000+ employees</Option>
                          </Select>
                        </Form.Item>
                      </div>

                      <Form.Item 
                        name="valueProposition" 
                        label="Core Value Proposition" 
                        rules={[{ required: true }]}
                        tooltip="What specific problem do you solve?"
                      >
                        <TextArea 
                          rows={3} 
                          placeholder="We help [Role] in [Industry] achieve [Result] by [Mechanism]..."
                          className="resize-none rounded-lg"
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
                          className="resize-none rounded-lg"
                        />
                      </Form.Item>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                        <Form.Item name="targetPainPoints" label="Pain Points (Optional)">
                          <Select 
                            mode="tags" 
                            placeholder="Select or type..."
                            options={painPoints.map(p => ({ label: p, value: p }))}
                          />
                        </Form.Item>
                        <Form.Item name="targetGoals" label="Goals (Optional)">
                          <Select 
                            mode="tags" 
                            placeholder="Add goals..."
                            options={targetGoals.map(goal => ({ value: goal, label: goal }))}
                          />
                        </Form.Item>
                        <Form.Item name="socialProof" label="Social Proof (Optional)">
                          <Input placeholder="e.g. Trusted by 50+ Agencies" />
                        </Form.Item>
                        <Form.Item name="personalizedElement" label="Personalized Element">
                          <Input placeholder="e.g. I noticed your recent blog post about..." />
                        </Form.Item>
                      </div>

                      <Collapse ghost size="small" className="mt-4 bg-gray-900 rounded-lg">
                        <Panel header={<span className="text-gray-400 font-medium text-sm">Specific Recipient Details (Optional)</span>} key="recipient">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                            <Form.Item name="targetFirstName" label="First Name"><Input placeholder="First name if known" /></Form.Item>
                            <Form.Item name="subjectLineStyle" label="Subject Line Style">
                              <Select placeholder="Select style">
                                <Option value="intriguing">Intriguing</Option>
                                <Option value="direct">Direct</Option>
                                <Option value="personal">Personalized</Option>
                                <Option value="benefit">Benefit-focused</Option>
                              </Select>
                            </Form.Item>
                          </div>
                        </Panel>
                      </Collapse>
                    </div>
                  </Panel>

                  {/* Panel 4: Call to Action */}
                  <Panel 
                    header={
                      <div className="flex items-center py-2">
                        <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center mr-4 text-gray-400">
                          <ThunderboltOutlined style={{ fontSize: '18px' }} />
                        </div>
                        <div>
                          <div className="font-bold text-lg text-gray-100">Call to Action</div>
                          <div className="text-sm text-gray-500 font-medium">Define the desired outcome</div>
                        </div>
                      </div>
                    }
                    key="4"
                    className="mb-4 bg-gray-800 border border-gray-700 rounded-xl overflow-hidden shadow-sm"
                  >
                    <div className="p-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Form.Item name="callToAction" label="Desired Next Step">
                        <Select placeholder="Select preferred action">
                          <Option value="call">Schedule a call</Option>
                          <Option value="demo">Book a demo</Option>
                          <Option value="coffee">Coffee meeting</Option>
                          <Option value="lunch">Lunch meeting</Option>
                          <Option value="reply">Just get a reply</Option>
                        </Select>
                      </Form.Item>
                      <Form.Item name="meetingType" label="Meeting Type">
                        <Select placeholder="Select meeting type">
                          <Option value="call">Phone Call</Option>
                          <Option value="demo">Demo</Option>
                          <Option value="coffee">Coffee Meeting</Option>
                          <Option value="lunch">Lunch Meeting</Option>
                        </Select>
                      </Form.Item>
                      <Form.Item name="urgencyFactor" label="Urgency Factor">
                        <Input placeholder="e.g., Limited spots available this month" />
                      </Form.Item>
                    </div>
                  </Panel>

                  {/* Panel 5: Additional Contact Info */}
                  <Panel 
                    header={
                      <div className="flex items-center py-2">
                        <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center mr-4 text-gray-400">
                          <LinkOutlined style={{ fontSize: '18px' }} />
                        </div>
                        <div>
                          <div className="font-bold text-lg text-gray-100">Additional Contact Info</div>
                          <div className="text-sm text-gray-500 font-medium">Optional contact details</div>
                        </div>
                      </div>
                    }
                    key="5"
                    className="mb-4 bg-gray-800 border border-gray-700 rounded-xl overflow-hidden shadow-sm"
                  >
                    <div className="p-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Form.Item name="phone" label="Your Phone Number">
                        <Input prefix={<PhoneOutlined className="text-gray-500" />} placeholder="+1 (555) 123-4567" />
                      </Form.Item>
                      <Form.Item name="linkedIn" label="LinkedIn URL">
                        <Input 
                          prefix={<LinkOutlined style={{color: SPACE_COLOR}} />} 
                          placeholder="https://linkedin.com/in/yourprofile" 
                        />
                      </Form.Item>
                    </div>
                  </Panel>

                  {/* Panel 6: Referral Information */}
                  <Panel 
                    header={
                      <div className="flex items-center py-2">
                        <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center mr-4 text-gray-400">
                          <TeamOutlined style={{ fontSize: '18px' }} />
                        </div>
                        <div>
                          <div className="font-bold text-lg text-gray-100">Referral Information</div>
                          <div className="text-sm text-gray-500 font-medium">For referral/forwarding angle (Optional)</div>
                        </div>
                      </div>
                    }
                    key="6"
                    className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden shadow-sm"
                  >
                    <div className="p-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Form.Item name="referrerFirstName" label="Referrer's First Name">
                        <Input placeholder="First name" />
                      </Form.Item>
                      <Form.Item name="referrerLastName" label="Referrer's Last Name">
                        <Input placeholder="Last name" />
                      </Form.Item>
                      <Form.Item name="referrerJobTitle" label="Referrer's Job Title">
                        <Input placeholder="e.g., CEO" />
                      </Form.Item>
                      <Form.Item name="referrerEmail" label="Referrer's Email Address">
                        <Input placeholder="referrer@company.com" />
                      </Form.Item>
                      <Form.Item name="referrerRelationship" label="Referrer Relationship">
                        <Input placeholder="e.g., Former colleague" />
                      </Form.Item>
                    </div>
                  </Panel>
                </Collapse>

                {/* Generate Button */}
                <div className="flex justify-center pt-8 pb-12">
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    size="large"
                    loading={loading}
                    icon={<ThunderboltOutlined />}
                    className="h-14 px-12 text-lg rounded-full shadow-lg shadow-emerald-900/20 hover:scale-105 transition-transform"
                    style={{
                      backgroundColor: BRAND_GREEN,
                      borderColor: BRAND_GREEN,
                      color: '#000000',
                    }}
                  >
                    {loading ? 'Generating Magic...' : 'Generate Emails'}
                  </Button>
                </div>
              </div>
            </Form>
          )}

          {/* RESULTS SECTION */}
          {generatedEmails.length > 0 && (
            <div id="email-results" className="mt-12 space-y-12 animate-fade-in">
              <div className="flex items-center justify-between">
                <Title level={2} className="m-0 text-gray-100">Generated Results</Title>
                <Button 
                  onClick={() => {
                    setGeneratedEmails([]);
                    setOptimizedEmails({});
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  style={{ background: SURFACE_LIGHTER, borderColor: BORDER_COLOR, color: TEXT_PRIMARY }}
                >
                  Clear Results
                </Button>
              </div>

              {generatedEmails.map((email, index) => {
                const displayEmail = optimizedEmails[index] || email;
                const isOptimizationLoading = optimizationLoading[index] || false;

                return (
                  <div key={index} className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 overflow-hidden">
                    {/* Header Toolbar */}
                    <div className="bg-gray-900 border-b border-gray-700 p-4 flex flex-wrap justify-between items-center gap-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-1 font-bold text-gray-200">
                          Option {index + 1}
                        </div>
                        {optimizedEmails[index] && (
                          <Tag color="success" icon={<CheckCircleOutlined />} className="bg-green-900/30 border-green-800">
                            Optimized: {optimizedEmails[index].metadata?.optimizationType}
                          </Tag>
                        )}
                      </div>
                      <Space>
                        <Button 
                          icon={<ThunderboltOutlined />} 
                          loading={isOptimizationLoading}
                          onClick={() => handleOptimizeEmail(
                            index, 
                            `${email.subject}\n\n${email.body}\n\n${email.signature}`, 
                            'personalization'
                          )}
                          style={{ background: SURFACE_LIGHTER, borderColor: BORDER_COLOR, color: TEXT_PRIMARY }}
                        >
                          Auto-Optimize
                        </Button>
                        {optimizedEmails[index] && (
                          <Button 
                            onClick={() => {
                              console.log(`Reverting main email ${index} to original`);
                              setOptimizedEmails((prev) => {
                                const newState = { ...prev };
                                delete newState[index];
                                return newState;
                              });
                            }}
                            style={{ background: SURFACE_LIGHTER, borderColor: BORDER_COLOR, color: TEXT_PRIMARY }}
                          >
                            Show Original
                          </Button>
                        )}
                        <Button 
                          icon={<CopyOutlined />} 
                          onClick={() => copyToClipboard(`${displayEmail.subject}\n\n${displayEmail.body}\n\n${displayEmail.signature}`)}
                          style={{ background: SURFACE_LIGHTER, borderColor: BORDER_COLOR, color: TEXT_PRIMARY }}
                        >
                          Copy
                        </Button>
                        <Button 
                          type="primary"
                          icon={<DownloadOutlined />}
                          onClick={() => downloadEmail(displayEmail)}
                          style={{ background: BRAND_GREEN, color: '#000', borderColor: BRAND_GREEN }}
                        >
                          Download
                        </Button>
                      </Space>
                    </div>

                    {/* Pro Tips Alert */}
                    <Alert
                      message="Pro Tip"
                      description={
                        <div className="text-gray-300">
                          <p>Personalize this further by:</p>
                          <ul className="list-disc pl-5 mt-2">
                            <li>Adding specific details about the recipient company</li>
                            <li>Referencing recent news about their industry</li>
                            <li>Including a personalized compliment</li>
                            <li>Mentioning mutual connections if any</li>
                          </ul>
                        </div>
                      }
                      type="info"
                      showIcon
                      className="m-4 bg-blue-900/20 border-blue-800"
                    />

                    {/* Email Content Area */}
                    <div className="p-8 bg-gray-800">
                      <div className="mb-6 pb-6 border-b border-gray-700">
                        <div className="grid grid-cols-[80px_1fr] gap-y-3 text-sm">
                          <div className="text-gray-400 font-medium">To:</div>
                          <div className="text-gray-200 font-medium">{displayEmail.metadata?.targetFirstName || 'Prospect'}</div>
                          
                          <div className="text-gray-400 font-medium">Subject:</div>
                          <div className="text-gray-100 font-bold text-lg">{displayEmail.subject}</div>
                        </div>
                      </div>

                      <div className="prose max-w-none">
                        <pre className="whitespace-pre-wrap font-mono text-gray-300 leading-relaxed text-[15px] font-normal">
                          {displayEmail.body}
                        </pre>
                        <div className="mt-8 pt-4 border-t border-dashed border-gray-700 text-gray-400 font-mono text-sm">
                          <pre className="whitespace-pre-wrap font-mono">{displayEmail.signature}</pre>
                        </div>
                      </div>
                    </div>

                    {/* Follow Ups Section */}
                    {Array.isArray(displayEmail.followUpSequence) && displayEmail.followUpSequence.length > 0 && (
                      <div className="bg-gray-900/50 p-6 border-t border-gray-700">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="h-px bg-gray-700 flex-1"></div>
                          <span className="text-gray-400 text-sm font-bold uppercase tracking-wider">Follow-up Sequence</span>
                          <div className="h-px bg-gray-700 flex-1"></div>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {displayEmail.followUpSequence.map((followUp, fIndex) => {
                            const fKey = `${index}-${fIndex}`;
                            const fDisplay = optimizedEmails[fKey] || followUp;
                            const isFollowUpOptimizationLoading = optimizationLoading[fKey] || false;

                            return (
                              <Card 
                                key={fIndex} 
                                title={
                                  <div className="flex items-center text-sm text-gray-200">
                                    <span className="bg-gray-700 text-gray-100 w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2">
                                      {fIndex + 1}
                                    </span>
                                    <span>Day {followUp.metadata?.dayInterval || (fIndex + 1) * 3}</span>
                                  </div>
                                }
                                size="small"
                                extra={
                                  <Space>
                                    <Button 
                                      size="small" 
                                      icon={<ThunderboltOutlined />}
                                      onClick={() => handleOptimizeEmail(
                                        fKey,
                                        `${followUp.subject}\n\n${followUp.body}\n\n${followUp.signature}`,
                                        'personalization'
                                      )}
                                      loading={isFollowUpOptimizationLoading}
                                      style={{ background: SURFACE_LIGHTER, borderColor: BORDER_COLOR, color: TEXT_PRIMARY }}
                                    >
                                      Optimize
                                    </Button>
                                    {optimizedEmails[fKey] && (
                                      <Button 
                                        size="small"
                                        onClick={() => {
                                          console.log(`Reverting follow-up ${fKey} to original`);
                                          setOptimizedEmails((prev) => {
                                            const newState = { ...prev };
                                            delete newState[fKey];
                                            return newState;
                                          });
                                        }}
                                        style={{ background: SURFACE_LIGHTER, borderColor: BORDER_COLOR, color: TEXT_PRIMARY }}
                                      >
                                        Show Original
                                      </Button>
                                    )}
                                    <Button 
                                      size="small" 
                                      icon={<CopyOutlined />} 
                                      onClick={() => copyToClipboard(`${fDisplay.subject}\n\n${fDisplay.body}\n\n${fDisplay.signature}`)}
                                      style={{ background: SURFACE_LIGHTER, borderColor: BORDER_COLOR, color: TEXT_PRIMARY }}
                                    />
                                  </Space>
                                }
                                className="shadow-sm border-gray-700 bg-gray-800"
                              >
                                <div className="text-xs text-gray-400 mb-2 font-bold">Subject: {fDisplay.subject}</div>
                                <pre className="whitespace-pre-wrap font-mono text-xs text-gray-400 line-clamp-6 hover:line-clamp-none transition-all cursor-pointer">
                                  {fDisplay.body}
                                </pre>
                              </Card>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* SAVED TAB */}
          {activeTab === 'saved' && (
            <div className="bg-gray-800 rounded-2xl shadow-sm border border-gray-700 p-6">
              <div className="flex justify-between items-center mb-6">
                <Title level={4} className="m-0 text-gray-100">Saved Campaigns</Title>
                <Button 
                  icon={<ArrowRightOutlined />} 
                  onClick={fetchSavedEmails} 
                  loading={savedEmailsLoading}
                  style={{ background: SURFACE_LIGHTER, borderColor: BORDER_COLOR, color: TEXT_PRIMARY }}
                >
                  Refresh List
                </Button>
              </div>
              
              {savedEmailsLoading ? (
                <div className="text-center py-12">
                  <Spin size="large" tip="Loading saved emails..." />
                </div>
              ) : savedEmails.length === 0 ? (
                <div className="text-center py-12">
                  <MailOutlined style={{ fontSize: '48px', color: '#4b5563', marginBottom: '16px' }} />
                  <Title level={4} className="text-gray-300">No Saved Emails Yet</Title>
                  <Text className="text-gray-500">
                    Generate your first email campaign to see it here
                  </Text>
                  <br />
                  <Button 
                    type="primary" 
                    onClick={() => setActiveTab('compose')}
                    className="mt-4"
                    style={{ background: BRAND_GREEN, borderColor: BRAND_GREEN, color: '#000' }}
                  >
                    Create Your First Email
                  </Button>
                </div>
              ) : (
                <Table
                  dataSource={savedEmails}
                  loading={savedEmailsLoading}
                  rowKey="id"
                  pagination={{ pageSize: 8 }}
                  columns={[
                    { 
                      title: 'Campaign', 
                      dataIndex: 'title', 
                      key: 'title', 
                      render: (t) => <span className="font-semibold text-gray-200">{t}</span> 
                    },
                    { 
                      title: 'Target', 
                      key: 't', 
                      render: (r) => (
                        <div className="text-sm">
                          <div className="text-gray-200">{r.targetCompany || r.targetFirstName || 'Unknown'}</div>
                          <div className="text-gray-400 text-xs">{r.targetRole}</div>
                        </div>
                      )
                    },
                    { 
                      title: 'Method', 
                      dataIndex: 'method', 
                      render: (m) => <Tag className="bg-gray-700 text-gray-200 border-gray-600">{m}</Tag>
                    },
                    { 
                      title: 'Emails', 
                      dataIndex: 'emailCount', 
                      key: 'emailCount',
                      render: (count) => <span className="text-gray-300">{count || 0}</span>
                    },
                    { 
                      title: 'Created', 
                      dataIndex: 'createdAt', 
                      key: 'createdAt',
                      render: (date) => <span className="text-gray-400">{new Date(date).toLocaleDateString()}</span>
                    },
                    { 
                      title: 'Actions', 
                      key: 'action', 
                      render: (r) => (
                        <Space>
                          <Button 
                            size="small" 
                            icon={viewLoading === r.id ? <Spin size="small" /> : <EyeOutlined />} 
                            onClick={() => handleViewSavedEmail(r.id)}
                            disabled={viewLoading !== null}
                            style={{ background: SURFACE_LIGHTER, borderColor: BORDER_COLOR, color: TEXT_PRIMARY }}
                          >
                            View
                          </Button>
                          <Button 
                            size="small" 
                            danger 
                            type="text"
                            onClick={() => handleDeleteSavedEmail(r.id)}
                          >
                            Delete
                          </Button>
                        </Space>
                      )
                    }
                  ]}
                />
              )}
            </div>
          )}

          {/* TEMPLATES TAB */}
          {activeTab === 'templates' && (
            <div className="bg-gray-800 rounded-2xl shadow-sm border border-gray-700 p-6">
              <div className="flex justify-between items-center mb-6">
                <Title level={4} className="m-0 text-gray-100">Email Templates</Title>
                <Button 
                  type="primary" 
                  onClick={fetchTemplates} 
                  loading={templatesLoading} 
                  style={{ background: BRAND_GREEN, borderColor: BRAND_GREEN, color: '#000' }}
                >
                  Load Templates
                </Button>
              </div>
              
              {templates.length === 0 ? (
                <div className="text-center py-12">
                  <ContactsOutlined style={{ fontSize: '48px', color: '#4b5563', marginBottom: '16px' }} />
                  <Title level={4} className="text-gray-300">No Templates Found</Title>
                  <Text className="text-gray-500">
                    Create email templates to reuse successful campaigns
                  </Text>
                </div>
              ) : (
                <Table
                  dataSource={templates}
                  columns={columns}
                  rowKey="id"
                  pagination={{ pageSize: 5 }}
                />
              )}
            </div>
          )}

          {/* PREVIEW MODAL */}
          <Modal
            open={emailPreviewModal.visible}
            onCancel={() => setEmailPreviewModal({ visible: false, email: null })}
            width={900}
            footer={null}
            title={<span className="font-manrope font-bold text-gray-100">Campaign Preview</span>}
            styles={{
              content: { backgroundColor: SURFACE_BG },
              header: { backgroundColor: SURFACE_BG, borderColor: BORDER_COLOR }
            }}
          >
            {emailPreviewModal.email && (
              <div className="pt-4">
                <div className="mb-6 grid grid-cols-3 gap-4 bg-gray-800 p-4 rounded-lg text-sm">
                  <div><span className="text-gray-400 block">Method</span> <Tag className="bg-gray-700 text-gray-200">{emailPreviewModal.email.metadata?.method}</Tag></div>
                  <div><span className="text-gray-400 block">Target</span> <span className="font-medium text-gray-200">{emailPreviewModal.email.metadata?.targetRole} @ {emailPreviewModal.email.metadata?.targetCompany}</span></div>
                  <div><span className="text-gray-400 block">Generated</span> <span className="font-medium text-gray-200">{new Date(emailPreviewModal.email.createdAt).toLocaleDateString()}</span></div>
                </div>
                
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                  {emailPreviewModal.email.emails?.map((e: any, i: number) => (
                    <div key={i} className="border border-gray-700 rounded-lg p-4 bg-gray-800">
                      <div className="flex justify-between mb-2">
                        <span className="font-bold text-gray-200">Email {i+1}: {e.subject}</span>
                        <Button size="small" type="link" onClick={() => copyToClipboard(e.body)} style={{ color: BRAND_GREEN }}>Copy Body</Button>
                      </div>
                      <pre className="whitespace-pre-wrap font-mono text-xs text-gray-400 bg-gray-900 p-3 rounded">{e.body}</pre>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 flex justify-end gap-3 border-t border-gray-700 pt-4">
                  <Button 
                    onClick={() => setEmailPreviewModal({ visible: false, email: null })}
                    style={{ background: SURFACE_LIGHTER, borderColor: BORDER_COLOR, color: TEXT_PRIMARY }}
                  >
                    Close
                  </Button>
                  <Button 
                    type="primary" 
                    style={{ background: BRAND_GREEN, color: 'black' }} 
                    onClick={() => {
                      if (emailPreviewModal.email?.emails) {
                        setGeneratedEmails(emailPreviewModal.email.emails);
                        setActiveTab('compose');
                        setEmailPreviewModal({ visible: false, email: null });
                      }
                    }}
                  >
                    Load into Editor
                  </Button>
                </div>
              </div>
            )}
          </Modal>

          {/* TEMPLATE SELECTION MODAL */}
          <Modal
            title={<span className="font-manrope font-bold text-gray-100">Select a Template</span>}
            open={isTemplateModalVisible}
            onCancel={() => setIsTemplateModalVisible(false)}
            width={800}
            footer={null}
            styles={{
              content: { backgroundColor: SURFACE_BG },
              header: { backgroundColor: SURFACE_BG, borderColor: BORDER_COLOR }
            }}
          >
            <Table 
              dataSource={templates} 
              columns={columns} 
              rowKey="id" 
              pagination={{ pageSize: 5 }} 
            />
          </Modal>
        </div>
      </div>
    </ConfigProvider>
  );
};

export default ColdEmailWriter;