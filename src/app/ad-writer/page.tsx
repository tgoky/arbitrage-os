// Updated AdWriter.tsx - FIXED VERSION with Manrope font and Space color
"use client";

import React, { useState, useEffect } from 'react';
import { 
  UserOutlined,
  BulbOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  StarOutlined,
  FileTextOutlined,
  ArrowRightOutlined,
  DownloadOutlined,
  CopyOutlined,
  InfoCircleOutlined,
  ThunderboltOutlined,
  ReloadOutlined,
  LeftOutlined,
  RightOutlined,
  ArrowLeftOutlined,
  HistoryOutlined
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
  Tooltip,
  Badge,
  Progress,
  Tabs,
  Popover,
  Switch,
  message,
  Modal, 
  notification,
  Row,
  Col,
  ConfigProvider,
  theme
} from 'antd';
import { useAdWriter, type AdWriterInput, type GeneratedAd, type FullScript } from '../hooks/useAdWriter';
import { LoadingAnimation, loadingMessages } from './Loading';
import LoadingOverlay from './LoadingOverlay';
import { AD_LENGTH_CONFIGS } from '@/types/adWriter';
import { SavedAdsHistory } from './savedAds'
import { useRouter } from 'next/navigation';
import { useWorkspaceContext } from '../hooks/useWorkspaceContext';
import { motion, AnimatePresence } from "framer-motion";

interface FormData {
  businessName?: string;
  personalTitle?: string;
  valueProposition?: string;
  offerName?: string;
  offerDescription?: string;
  features?: string[];
  pricing?: string;
  uniqueMechanism?: string;
  idealCustomer?: string;
  primaryPainPoint?: string;
  failedSolutions?: string;
  coreResult?: string;
  secondaryBenefits?: string[];
  timeline?: string;
  adType?: string;
  tone?: string;
  caseStudy1?: string;
  credentials?: string;
  cta?: string;
  url?: string;
  urgency?: string;
  leadMagnet?: string;
}

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

// Color constants
const SPACE_COLOR = '#9DA2B3';
const BRAND_GREEN = '#5CC49D';
const DARK_BG = '#0f172a';
const SURFACE_BG = '#000000';
const SURFACE_LIGHTER = '#334155';
const TEXT_PRIMARY = '#f1f5f9';
const TEXT_SECONDARY = '#94a3b8';
const BORDER_COLOR = '#334155';

// FullScriptDisplay component
const FullScriptDisplay: React.FC<{
  fullScripts: Array<{framework: string; script: string}>;
  platform: string;
  onCopy: (text: string) => void;
}> = ({ fullScripts, platform, onCopy }) => {
  const [currentScriptIndex, setCurrentScriptIndex] = useState(0);

  if (!fullScripts || fullScripts.length === 0) {
    return (
      <Alert
        message="No full scripts available"
        description="Script sections are still being generated."
        type="info"
      />
    );
  }

  const currentScript = fullScripts[currentScriptIndex];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Title level={5} className="mb-2">
          Ad Scripts ({currentScriptIndex + 1} of {fullScripts.length})
        </Title>
        <Space>
          <Button
            icon={<LeftOutlined />}
            onClick={() => setCurrentScriptIndex(Math.max(0, currentScriptIndex - 1))}
            disabled={currentScriptIndex === 0}
            size="small"
          />
          <Button
            icon={<RightOutlined />}
            onClick={() => setCurrentScriptIndex(Math.min(fullScripts.length - 1, currentScriptIndex + 1))}
            disabled={currentScriptIndex === fullScripts.length - 1}
            size="small"
          />
        </Space>
      </div>

      <Card style={{ border: "2px solid green" }}>
        <div className="flex justify-between items-start mb-3">
          <Tag color="blue">{currentScript.framework}</Tag>
          <Button
            type="text"
            icon={<CopyOutlined />}
            onClick={() => onCopy(currentScript.script)}
          >
            Copy Script
          </Button>
        </div>
        <pre className="whitespace-pre-wrap text-sm leading-relaxed font-medium">
          {currentScript.script}
        </pre>
      </Card>

      {fullScripts.length > 1 && (
        <div className="flex justify-center space-x-2">
          {fullScripts.map((_, index) => (
            <Button
              key={index}
              size="small"
              type={currentScriptIndex === index ? "primary" : "default"}
              onClick={() => setCurrentScriptIndex(index)}
              className="w-8 h-8"
            >
              {index + 1}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};

const AdWriter = () => {
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [generatedAds, setGeneratedAds] = useState<GeneratedAd[]>([]);
  const [activePlatforms, setActivePlatforms] = useState<string[]>([]);
  const [activeMainTab, setActiveMainTab] = useState('create');
  const [activePlatformTab, setActivePlatformTab] = useState('1');
  const [originalFormData, setOriginalFormData] = useState<AdWriterInput | null>(null);
  const [regeneratingPlatforms, setRegeneratingPlatforms] = useState<Set<string>>(new Set());
  const [generatingAds, setGeneratingAds] = useState(false);
  const router = useRouter();
  const { currentWorkspace, isWorkspaceReady } = useWorkspaceContext();

  const [formData, setFormData] = useState<FormData>({});

  const { generateAds, optimizeAd, regeneratePlatformAds, loading, error, setError } = useAdWriter();

  const isLoading = loading || regeneratingPlatforms.size > 0;

  // Load Manrope font
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  // Platform configurations
  const platforms = [
    {
      value: 'facebook',
      label: 'Facebook/Instagram',
      icon: <span className="text-blue-600">FB</span>,
      description: 'Best for awareness & engagement'
    },
    {
      value: 'google',
      label: 'Google Ads',
      icon: <span className="text-green-600">GOOG</span>,
      description: 'Best for high-intent searches'
    },
    {
      value: 'linkedin',
      label: 'LinkedIn',
      icon: <span className="text-blue-500">IN</span>,
      description: 'Best for B2B & professionals'
    },
    {
      value: 'tiktok',
      label: 'TikTok',
      icon: <span className="text-black">TT</span>,
      description: 'Best for viral content & Gen Z'
    }
  ];

  const adTypes = [
    {
      value: 'awareness',
      label: 'Brand Awareness',
      description: 'Increase visibility and recognition'
    },
    {
      value: 'conversion',
      label: 'Conversions',
      description: 'Drive purchases or signups'
    },
    {
      value: 'lead',
      label: 'Lead Generation',
      description: 'Capture contact information'
    },
    {
      value: 'traffic',
      label: 'Website Traffic',
      description: 'Get more visitors to your site'
    }
  ];

  const toneOptions = [
    { label: 'Professional', value: 'professional' },
    { label: 'Friendly', value: 'friendly' },
    { label: 'Urgent', value: 'urgent' },
    { label: 'Humorous', value: 'humorous' },
    { label: 'Inspirational', value: 'inspirational' }
  ];

  const steps = [
    'Business & Offer',
    'Target Audience',
    'Ad Strategy',
    'Generate Ads'
  ];

  const saveCurrentStepData = () => {
    const currentValues = form.getFieldsValue();
    setFormData(prev => ({ ...prev, ...currentValues }));
  };

  const onFinish = async (values: any) => {
    try {
      setGeneratingAds(true);
      saveCurrentStepData();
      
      const allData = { ...formData, ...form.getFieldsValue() };
      
      const requestData: AdWriterInput = {
        businessName: allData.businessName || '',
        personalTitle: allData.personalTitle || '',
        valueProposition: allData.valueProposition || '',
        offerName: allData.offerName || '',
        offerDescription: allData.offerDescription || '',
        features: allData.features || [],
        pricing: allData.pricing || '',
        uniqueMechanism: allData.uniqueMechanism || '',
        idealCustomer: allData.idealCustomer || '',
        primaryPainPoint: allData.primaryPainPoint || '',
        failedSolutions: allData.failedSolutions || '',
        coreResult: allData.coreResult || '',
        secondaryBenefits: allData.secondaryBenefits || [],
        timeline: allData.timeline || '',
        activePlatforms: activePlatforms,
        adType: allData.adType || 'conversion',
        tone: allData.tone || 'professional',
        adLength: allData.adLength || 'medium',
        caseStudy1: allData.caseStudy1 || '',
        credentials: allData.credentials || '',
        cta: allData.cta || '',
        url: allData.url || '',
        urgency: allData.urgency || '',
        leadMagnet: allData.leadMagnet || ''
      };

      const requiredFields = [
        'businessName', 'valueProposition', 'offerName', 'offerDescription', 
        'pricing', 'uniqueMechanism', 'idealCustomer', 'primaryPainPoint', 
        'coreResult', 'cta', 'url'
      ];

      const missingFields = requiredFields.filter(field => !requestData[field as keyof AdWriterInput]);
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      setOriginalFormData(requestData);
      const result = await generateAds(requestData);
      setGeneratedAds(result);
      setCurrentStep(3);
      setActiveMainTab('create');
      
      notification.success({
        message: (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Ads Generated Successfully!
          </motion.div>
        ),
        description: `Generated ${result.length} platform variations`,
        placement: 'topRight',
        duration: 3,
      });
      
    } catch (error: any) {
      console.error('Error generating ads:', error);
      notification.error({
        message: (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            Generation Failed
          </motion.div>
        ),
        description: error.message || 'Please try again later',
        placement: 'topRight',
        duration: 4,
      });
    } finally {
      setGeneratingAds(false);
    }
  };

  const handleOptimizeAd = async (adCopy: string, optimizationType: string) => {
    try {
      const optimizedContent = await optimizeAd(adCopy, optimizationType);
      
      if (!optimizedContent) {
        throw new Error('No optimized content returned');
      }
      
      Modal.info({
        title: `Optimized for ${optimizationType}`,
        content: (
          <div>
            <Text strong>Original:</Text>
            <div className="bg-gray-50 p-2 rounded mb-2">{adCopy}</div>
            <Text strong>Optimized:</Text>
            <div className="bg-blue-50 p-2 rounded">{optimizedContent}</div>
            <div className="mt-2">
              <Button 
                onClick={() => copyToClipboard(optimizedContent)}
                icon={<CopyOutlined />}
              >
                Copy Optimized Version
              </Button>
            </div>
          </div>
        ),
        width: 600,
      });
      
      return optimizedContent;
    } catch (error) {
      console.error('Optimization error:', error);
      notification.error({
        message: 'Optimization Failed',
        description: error instanceof Error ? error.message : 'Please try again later',
        placement: 'topRight',
      });
      return null;
    }
  };

  const handleBack = () => {
    router.push(`/dashboard/${currentWorkspace?.slug}`);
  };

  const handleRegeneratePlatform = async (platform: string) => {
    if (!originalFormData) {
      message.error('No original data found for regeneration');
      return;
    }
    
    setRegeneratingPlatforms(prev => new Set(prev).add(platform));
    
    try {
      const newAd = await regeneratePlatformAds(originalFormData, platform);
      
      setGeneratedAds(prev => {
        const filtered = prev.filter(ad => ad.platform !== platform);
        
        if (!newAd.headlines || !newAd.descriptions || !newAd.ctas) {
          throw new Error('Invalid ad structure returned');
        }
        
        return [...filtered, newAd];
      });
      
      message.success(`${platform.charAt(0).toUpperCase() + platform.slice(1)} ads regenerated!`);
    } catch (error) {
      console.error('Regeneration error:', error);
      notification.error({
        message: 'Regeneration Failed',
        description: `Failed to regenerate ${platform} ads. Please try again.`,
        placement: 'topRight',
      });
    } finally {
      setRegeneratingPlatforms(prev => {
        const newSet = new Set(prev);
        newSet.delete(platform);
        return newSet;
      });
    }
  };

  const nextStep = async () => {
    let isValid = false;
    
    saveCurrentStepData();
    
    switch (currentStep) {
      case 0:
        isValid = await form.validateFields(['businessName', 'valueProposition', 'offerName', 'offerDescription', 'pricing', 'uniqueMechanism', 'adLength'])
          .then(() => true)
          .catch((errorInfo) => {
            const firstError = errorInfo.errorFields[0];
            if (firstError) {
              message.error(`Please fill in: ${firstError.name[0]}`);
            }
            return false;
          });
        break;
      case 1:
        isValid = await form.validateFields(['idealCustomer', 'primaryPainPoint', 'coreResult'])
          .then(() => true)
          .catch(() => false);
        break;
      case 2:
        isValid = await form.validateFields(['adType', 'tone', 'cta', 'url'])
          .then(() => true)
          .catch(() => false);
        break;
    }
    
    if (isValid) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    saveCurrentStepData();
    setCurrentStep(currentStep - 1);
  };

  const copyToClipboard = async (text: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          document.execCommand('copy');
        } finally {
          document.body.removeChild(textArea);
        }
      }
      message.success('Copied to clipboard!');
    } catch (error) {
      console.error('Copy failed:', error);
      message.error('Failed to copy to clipboard');
    }
  };

  const downloadAds = () => {
    let url: string | null = null;
    let anchor: HTMLAnchorElement | null = null;
    
    try {
      const content = generatedAds.map(ad => 
        `=== ${ad.platform.toUpperCase()} ===\n\n` +
        `Headlines:\n${ad.headlines.map((h: string) => `- ${h}`).join('\n')}\n\n` +
        `Descriptions:\n${ad.descriptions.map((d: string) => `- ${d}`).join('\n')}\n\n` +
        `CTAs:\n${ad.ctas.map((c: string) => `- ${c}`).join('\n')}\n\n` +
        (ad.hooks ? `Hooks:\n${ad.hooks.map((h: string) => `- ${h}`).join('\n')}\n\n` : '') +
        (ad.visualSuggestions ? `Visual Suggestions:\n${ad.visualSuggestions.map((v: string) => `- ${v}`).join('\n')}\n\n` : '')
      ).join('\n');

      const blob = new Blob([content], { type: 'text/plain' });
      url = URL.createObjectURL(blob);
      
      anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `ad-copy-${Date.now()}.txt`;
      anchor.style.display = 'none';
      
      document.body.appendChild(anchor);
      anchor.click();
      
      message.success('Ads downloaded successfully!');
    } catch (error) {
      console.error('Download error:', error);
      message.error('Failed to download ads');
    } finally {
      if (url) {
        URL.revokeObjectURL(url);
      }
      if (anchor && document.body.contains(anchor)) {
        document.body.removeChild(anchor);
      }
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Card className="mb-6" style={{ background: SURFACE_BG, borderColor: BORDER_COLOR }}>
            <Title level={4} className="flex items-center mb-4" style={{ color: TEXT_PRIMARY }}>
              <UserOutlined className="mr-2" />
              Business Information
            </Title>

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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item
                name="businessName"
                label={<span style={{ color: TEXT_SECONDARY }}>Business/Brand Name</span>}
                rules={[{ required: true, message: 'Please input your business name!' }]}
              >
                <Input 
                  placeholder="Acme Solutions" 
                  className="hover:border-[#5CC49D] focus:border-[#5CC49D]"
                />
              </Form.Item>
              
              <Form.Item
                name="personalTitle"
                label={<span style={{ color: TEXT_SECONDARY }}>Your Name & Title (Optional)</span>}
              >
                <Input 
                  placeholder="Jane Doe, CEO" 
                  className="hover:border-[#5CC49D] focus:border-[#5CC49D]"
                />
              </Form.Item>
            </div>
            
            <Form.Item
              name="valueProposition"
              label={<span style={{ color: TEXT_SECONDARY }}>Core Value Proposition</span>}
              rules={[{ required: true, message: 'Please describe your value!' }]}
              tooltip="What fundamental problem do you solve?"
            >
              <TextArea 
                rows={3} 
                placeholder="We help [target audience] achieve [core benefit] through [unique approach]" 
                showCount
                maxLength={500}
                className="hover:border-[#5CC49D] focus:border-[#5CC49D]"
              />
            </Form.Item>

            <Form.Item
              name="adLength"
              label={<span style={{ color: TEXT_SECONDARY }}>Ad Length</span>}
              initialValue="medium"
              rules={[{ required: true, message: 'Please select ad length!' }]}
              tooltip="Choose the appropriate length for your campaign goals"
            >
              <Radio.Group className="custom-radio-group">
                <Space direction="vertical">
                  {Object.entries(AD_LENGTH_CONFIGS).map(([key, config]) => (
                    <Radio key={key} value={key} className="custom-radio">
                      <div>
                        <div className="font-medium" style={{ color: TEXT_PRIMARY }}>{config.label}</div>
                        <div className="text-sm" style={{ color: TEXT_SECONDARY }}>
                          {config.description}
                        </div>
                        <div className="text-xs" style={{ color: SPACE_COLOR }}>
                          Best for: {config.bestFor}
                        </div>
                      </div>
                    </Radio>
                  ))}
                </Space>
              </Radio.Group>
            </Form.Item>
            
            <Divider style={{ borderColor: BORDER_COLOR }} />
            
            <Title level={4} className="flex items-center mb-4" style={{ color: TEXT_PRIMARY }}>
              <BulbOutlined className="mr-2" />
              Offer Details
            </Title>
            
            <Form.Item
              name="offerName"
              label={<span style={{ color: TEXT_SECONDARY }}>Offer Name</span>}
              rules={[{ required: true, message: 'Please name your offer!' }]}
            >
              <Input 
                placeholder="e.g., 90-Day Business Accelerator" 
                className="hover:border-[#5CC49D] focus:border-[#5CC49D]"
              />
            </Form.Item>
            
            <Form.Item
              name="offerDescription"
              label={<span style={{ color: TEXT_SECONDARY }}>Offer Description</span>}
              rules={[{ required: true, message: 'Please describe your offer!' }]}
            >
              <TextArea 
                rows={3} 
                placeholder="An intensive program that helps [target] achieve [result] in [timeframe]" 
                showCount
                maxLength={500}
                className="hover:border-[#5CC49D] focus:border-[#5CC49D]"
              />
            </Form.Item>
            
            <Form.Item
              name="features"
              label={<span style={{ color: TEXT_SECONDARY }}>Key Features (3 max)</span>}
              rules={[{ required: true, message: 'Please list key features!' }]}
            >
              <Select
                mode="tags"
                style={{ width: '100%' }}
                placeholder="Add features (press enter after each)"
                maxTagCount={3}
                className="hover:border-[#5CC49D] focus:border-[#5CC49D]"
              />
            </Form.Item>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item
                name="pricing"
                label={<span style={{ color: TEXT_SECONDARY }}>Pricing</span>}
                rules={[{ required: true, message: 'Please specify pricing!' }]}
              >
                <Input 
                  placeholder="e.g., $997 or $99/month" 
                  className="hover:border-[#5CC49D] focus:border-[#5CC49D]"
                />
              </Form.Item>
              
              <Form.Item
                name="uniqueMechanism"
                label={<span style={{ color: TEXT_SECONDARY }}>Unique Mechanism</span>}
                rules={[{ required: true, message: 'What makes you different?' }]}
                tooltip="Your proprietary method or unique approach"
              >
                <Input 
                  placeholder="Our proprietary [system] that [benefit]" 
                  className="hover:border-[#5CC49D] focus:border-[#5CC49D]"
                />
              </Form.Item>
            </div>
          </Card>
        );
        
      case 1:
        return (
          <Card className="mb-6" style={{ background: SURFACE_BG, borderColor: BORDER_COLOR }}>
            <Title level={4} className="flex items-center mb-4" style={{ color: TEXT_PRIMARY }}>
              <TeamOutlined className="mr-2" />
              Target Audience
            </Title>
            
            <Form.Item
              name="idealCustomer"
              label={<span style={{ color: TEXT_SECONDARY }}>Ideal Customer Profile</span>}
              rules={[{ required: true, message: 'Please describe your customer!' }]}
              tooltip="Be as specific as possible"
            >
              <TextArea 
                rows={3} 
                placeholder="e.g., Marketing managers at B2B SaaS companies with 50-200 employees..." 
                showCount
                maxLength={500}
                className="hover:border-[#5CC49D] focus:border-[#5CC49D]"
              />
            </Form.Item>
            
            <Form.Item
              name="primaryPainPoint"
              label={<span style={{ color: TEXT_SECONDARY }}>Their #1 Pain Point</span>}
              rules={[{ required: true, message: 'What problem do you solve?' }]}
            >
              <TextArea 
                rows={2} 
                placeholder="e.g., Wasting money on ads that don't convert..." 
                showCount
                maxLength={300}
                className="hover:border-[#5CC49D] focus:border-[#5CC49D]"
              />
            </Form.Item>
            
            <Form.Item
              name="failedSolutions"
              label={<span style={{ color: TEXT_SECONDARY }}>What They&apos;ve Tried Before</span>}
            >
              <TextArea 
                rows={2} 
                placeholder="e.g., Hiring cheap agencies, DIY solutions..." 
                className="hover:border-[#5CC49D] focus:border-[#5CC49D]"
              />
            </Form.Item>
            
            <Divider style={{ borderColor: BORDER_COLOR }} />
            
            <Title level={4} className="flex items-center mb-4" style={{ color: TEXT_PRIMARY }}>
              <CheckCircleOutlined className="mr-2" />
              Benefits & Outcomes
            </Title>
            
            <Form.Item
              name="coreResult"
              label={<span style={{ color: TEXT_SECONDARY }}>Core Transformation</span>}
              rules={[{ required: true, message: 'What result do you deliver?' }]}
            >
              <Input 
                placeholder="e.g., 20+ qualified leads/month" 
                className="hover:border-[#5CC49D] focus:border-[#5CC49D]"
              />
            </Form.Item>
            
            <Form.Item
              name="secondaryBenefits"
              label={<span style={{ color: TEXT_SECONDARY }}>Secondary Benefits (3 max)</span>}
            >
              <Select
                mode="tags"
                style={{ width: '100%' }}
                placeholder="Add benefits (press enter after each)"
                maxTagCount={3}
                className="hover:border-[#5CC49D] focus:border-[#5CC49D]"
              />
            </Form.Item>
            
            <Form.Item
              name="timeline"
              label={<span style={{ color: TEXT_SECONDARY }}>Timeline to Results</span>}
            >
              <Input 
                placeholder="e.g., See results in 30 days" 
                className="hover:border-[#5CC49D] focus:border-[#5CC49D]"
              />
            </Form.Item>
          </Card>
        );
        
      case 2:
        return (
          <Card className="mb-6" style={{ background: SURFACE_BG, borderColor: BORDER_COLOR }}>
            <Title level={4} className="flex items-center mb-4" style={{ color: TEXT_PRIMARY }}>
              Ad Strategy
            </Title>
            
            <Form.Item
              label={<span style={{ color: TEXT_SECONDARY }}>Select Platforms (Optional)</span>}
            >
              <Text type="secondary" className="block mb-3" style={{ color: SPACE_COLOR }}>
                Choose specific platforms to optimize for, or leave blank for general ad scripts
              </Text>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {platforms.map(platform => (
                  <Card
                    key={platform.value}
                    hoverable
                    onClick={() => {
                      if (activePlatforms.includes(platform.value)) {
                        setActivePlatforms(activePlatforms.filter(p => p !== platform.value));
                      } else {
                        setActivePlatforms([...activePlatforms, platform.value]);
                      }
                    }}
                    className={`cursor-pointer text-center transition-all ${
                      activePlatforms.includes(platform.value) 
                        ? 'border-[#5CC49D] border-2 shadow-lg' 
                        : 'hover:border-[#5CC49D]'
                    }`}
                    style={{ 
                      background: SURFACE_LIGHTER,
                      borderColor: activePlatforms.includes(platform.value) ? '#5CC49D' : BORDER_COLOR
                    }}
                  >
                    <div className="text-2xl mb-2">{platform.icon}</div>
                    <div className="font-medium" style={{ color: TEXT_PRIMARY }}>{platform.label}</div>
                    <div className="text-sm" style={{ color: TEXT_SECONDARY }}>
                      {platform.description}
                    </div>
                    {activePlatforms.includes(platform.value) && (
                      <CheckCircleOutlined className="text-[#5CC49D] mt-2" />
                    )}
                  </Card>
                ))}
              </div>
            </Form.Item>
            
            <Divider style={{ borderColor: BORDER_COLOR }} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item
                name="adType"
                label={<span style={{ color: TEXT_SECONDARY }}>Campaign Objective</span>}
                initialValue="conversion"
                rules={[{ required: true }]}
              >
                <Radio.Group className="custom-radio-group">
                  <Space direction="vertical">
                    {adTypes.map(type => (
                      <Radio key={type.value} value={type.value} className="custom-radio">
                        <div>
                          <div className="font-medium" style={{ color: TEXT_PRIMARY }}>{type.label}</div>
                          <div className="text-sm" style={{ color: TEXT_SECONDARY }}>
                            {type.description}
                          </div>
                        </div>
                      </Radio>
                    ))}
                  </Space>
                </Radio.Group>
              </Form.Item>
              
              <Form.Item
                name="tone"
                label={<span style={{ color: TEXT_SECONDARY }}>Brand Tone</span>}
                initialValue="professional"
                rules={[{ required: true }]}
              >
                <Select className="hover:border-[#5CC49D] focus:border-[#5CC49D]">
                  {toneOptions.map(tone => (
                    <Option key={tone.value} value={tone.value}>
                      {tone.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </div>
            
            <Divider style={{ borderColor: BORDER_COLOR }} />
            
            <Title level={5} className="mb-2" style={{ color: TEXT_PRIMARY }}>Social Proof</Title>
            
            <Form.Item
              name="caseStudy1"
              label={<span style={{ color: TEXT_SECONDARY }}>Case Study #1 (Client + Results)</span>}
              tooltip="Include specific numbers and outcomes"
            >
              <TextArea 
                rows={3} 
                placeholder="Client: Acme Co. Increased conversions by 45% in 6 weeks..." 
                className="hover:border-[#5CC49D] focus:border-[#5CC49D]"
              />
            </Form.Item>
            
            <Form.Item
              name="credentials"
              label={<span style={{ color: TEXT_SECONDARY }}>Credentials/Achievements</span>}
            >
              <TextArea 
                rows={2} 
                placeholder="e.g., 250+ clients served, 15 years experience..." 
                className="hover:border-[#5CC49D] focus:border-[#5CC49D]"
              />
            </Form.Item>
            
            <Divider style={{ borderColor: BORDER_COLOR }} />
            
            <Title level={5} className="mb-2" style={{ color: TEXT_PRIMARY }}>Call-to-Action</Title>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item
                name="cta"
                label={<span style={{ color: TEXT_SECONDARY }}>Primary CTA</span>}
                rules={[{ required: true, message: 'Specify your CTA!' }]}
              >
                <Input 
                  placeholder="e.g., Book a Free Consultation" 
                  className="hover:border-[#5CC49D] focus:border-[#5CC49D]"
                />
              </Form.Item>
              
              <Form.Item
                name="url"
                label={<span style={{ color: TEXT_SECONDARY }}>Destination URL</span>}
                rules={[
                  { required: true, message: 'Enter your URL!' },
                  { type: 'url', message: 'Please enter a valid URL!' }
                ]}
              >
                <Input 
                  placeholder="https://example.com/offer" 
                  className="hover:border-[#5CC49D] focus:border-[#5CC49D]"
                />
              </Form.Item>
              
              <Form.Item
                name="urgency"
                label={<span style={{ color: TEXT_SECONDARY }}>Urgency/Scarcity (Optional)</span>}
              >
                <Input 
                  placeholder="e.g., Only 5 spots left!" 
                  className="hover:border-[#5CC49D] focus:border-[#5CC49D]"
                />
              </Form.Item>
              
              <Form.Item
                name="leadMagnet"
                label={<span style={{ color: TEXT_SECONDARY }}>Lead Magnet (If Applicable)</span>}
              >
                <Input 
                  placeholder="e.g., Free Strategy Guide" 
                  className="hover:border-[#5CC49D] focus:border-[#5CC49D]"
                />
              </Form.Item>
            </div>
          </Card>
        );
        
      case 3:
        return (
          <div className="space-y-6">
            <Card style={{ background: SURFACE_BG, borderColor: BORDER_COLOR }}>
              <div className="flex justify-between items-center mb-4">
                <Title level={4} style={{ color: TEXT_PRIMARY }}>Your AI-Generated Ad Copy</Title>
                <Space>
                  <Button 
                    icon={<CopyOutlined />}
                    onClick={() => {
                      const allText = generatedAds.map(ad => 
                        `=== ${ad.platform.toUpperCase()} ===\n\n` +
                        `Headlines:\n${ad.headlines.map((h: string) => `- ${h}`).join('\n')}\n\n` +
                        `Descriptions:\n${ad.descriptions.map((d: string) => `- ${d}`).join('\n')}\n\n` +
                        `CTAs:\n${ad.ctas.map((c: string) => `- ${c}`).join('\n')}`
                      ).join('\n\n');
                      copyToClipboard(allText);
                    }}
                    style={{ background: SURFACE_LIGHTER, borderColor: BORDER_COLOR, color: TEXT_PRIMARY }}
                  >
                    Copy All
                  </Button>
                  <Button 
                    type="primary" 
                    icon={<DownloadOutlined />}
                    onClick={downloadAds}
                    style={{ background: BRAND_GREEN, borderColor: BRAND_GREEN, color: '#000' }}
                  >
                    Download
                  </Button>
                </Space>
              </div>
              
              <Alert
                message="Pro Tip"
                description="For best results, A/B test different versions of these ads and monitor which performs best for your audience."
                type="info"
                showIcon
                className="mb-4"
              />
              
              {generatedAds.length > 0 ? (
                <Tabs 
                  activeKey={activePlatformTab}
                  onChange={setActivePlatformTab}
                  type="card"
                >
                  {generatedAds.map((ad, index) => (
                    <TabPane 
                      key={String(index + 1)} 
                      tab={
                        <span className="flex items-center">
                          {platforms.find(p => p.value === ad.platform)?.icon}
                          <span className="ml-1 capitalize" style={{ color: TEXT_PRIMARY }}>{ad.platform}</span>
                        </span>
                      }
                    >
                      <div className="space-y-6">
                        <div className="flex justify-end mb-2">
                          <Button
                            icon={<ReloadOutlined />}
                            onClick={() => handleRegeneratePlatform(ad.platform)}
                            size="small"
                            loading={loading}
                            style={{ background: SURFACE_LIGHTER, borderColor: BORDER_COLOR, color: TEXT_PRIMARY }}
                          >
                            Regenerate {ad.platform}
                          </Button>
                        </div>

                        {ad.fullScripts && ad.fullScripts.length > 0 && (
                          <FullScriptDisplay 
                            fullScripts={ad.fullScripts}
                            platform={ad.platform}
                            onCopy={copyToClipboard}
                          />
                        )}
                        
                        {ad.hooks && ad.hooks.length > 0 && (
                          <div>
                            <Title level={5} className="mb-2" style={{ color: TEXT_PRIMARY }}>🎯 Hooks</Title>
                            <div className="space-y-2">
                              {ad.hooks.map((hook: string, i: number) => (
                                <Card 
                                  key={i} 
                                  hoverable 
                                  className="cursor-pointer"
                                  style={{ background: SURFACE_LIGHTER, borderColor: BORDER_COLOR }}
                                >
                                  <div className="flex justify-between items-center">
                                    <Text style={{ color: TEXT_PRIMARY }}>{hook}</Text>
                                    <Button 
                                      type="text" 
                                      icon={<CopyOutlined />} 
                                      onClick={() => copyToClipboard(hook)}
                                      style={{ color: SPACE_COLOR }}
                                    />
                                  </div>
                                </Card>
                              ))}
                            </div>
                          </div>
                        )}

                        {ad.fixes && ad.fixes.length > 0 && (
                          <div>
                            <Title level={5} className="mb-2" style={{ color: TEXT_PRIMARY }}>🔧 Fix Sections</Title>
                            <div className="space-y-2">
                              {ad.fixes.map((fix: string, i: number) => (
                                <Card 
                                  key={i} 
                                  hoverable 
                                  className="cursor-pointer"
                                  style={{ background: SURFACE_LIGHTER, borderColor: BORDER_COLOR }}
                                >
                                  <div className="flex justify-between items-start">
                                    <Text className="flex-1" style={{ color: TEXT_PRIMARY }}>{fix}</Text>
                                    <Button 
                                      type="text" 
                                      icon={<CopyOutlined />} 
                                      onClick={() => copyToClipboard(fix)}
                                      style={{ color: SPACE_COLOR }}
                                    />
                                  </div>
                                </Card>
                              ))}
                            </div>
                          </div>
                        )}

                        {ad.results && ad.results.length > 0 && (
                          <div>
                            <Title level={5} className="mb-2" style={{ color: TEXT_PRIMARY }}>🎯 Results</Title>
                            <div className="space-y-2">
                              {ad.results.map((result: string, i: number) => (
                                <Card 
                                  key={i} 
                                  hoverable 
                                  className="cursor-pointer"
                                  style={{ background: SURFACE_LIGHTER, borderColor: BORDER_COLOR }}
                                >
                                  <div className="flex justify-between items-start">
                                    <Text className="flex-1" style={{ color: TEXT_PRIMARY }}>{result}</Text>
                                    <Button 
                                      type="text" 
                                      icon={<CopyOutlined />} 
                                      onClick={() => copyToClipboard(result)}
                                      style={{ color: SPACE_COLOR }}
                                    />
                                  </div>
                                </Card>
                              ))}
                            </div>
                          </div>
                        )}

                        {ad.proofs && ad.proofs.length > 0 && (
                          <div>
                            <Title level={5} className="mb-2" style={{ color: TEXT_PRIMARY }}>✅ Proof</Title>
                            <div className="space-y-2">
                              {ad.proofs.map((proof: string, i: number) => (
                                <Card 
                                  key={i} 
                                  hoverable 
                                  className="cursor-pointer"
                                  style={{ background: SURFACE_LIGHTER, borderColor: BORDER_COLOR }}
                                >
                                  <div className="flex justify-between items-start">
                                    <Text className="flex-1" style={{ color: TEXT_PRIMARY }}>{proof}</Text>
                                    <Button 
                                      type="text" 
                                      icon={<CopyOutlined />} 
                                      onClick={() => copyToClipboard(proof)}
                                      style={{ color: SPACE_COLOR }}
                                    />
                                  </div>
                                </Card>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div>
                          <Title level={5} className="mb-2" style={{ color: TEXT_PRIMARY }}>📝 Headlines</Title>
                          <div className="space-y-2">
                            {ad.headlines.map((headline: string, i: number) => (
                              <Card 
                                key={i} 
                                hoverable 
                                className="cursor-pointer"
                                style={{ background: SURFACE_LIGHTER, borderColor: BORDER_COLOR }}
                              >
                                <div className="flex justify-between items-center">
                                  <Text style={{ color: TEXT_PRIMARY }}>{headline}</Text>
                                  <Space>
                                    <Tooltip title="Optimize for emotion">
                                      <Button 
                                        type="text" 
                                        size="small"
                                        onClick={() => handleOptimizeAd(headline, 'emotional')}
                                        style={{ color: SPACE_COLOR }}
                                      >
                                        ✨
                                      </Button>
                                    </Tooltip>
                                    <Button 
                                      type="text" 
                                      icon={<CopyOutlined />} 
                                      onClick={() => copyToClipboard(headline)}
                                      style={{ color: SPACE_COLOR }}
                                    />
                                  </Space>
                                </div>
                              </Card>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <Title level={5} className="mb-2" style={{ color: TEXT_PRIMARY }}>📢 Call-to-Actions</Title>
                          <div className="space-y-2">
                            {ad.ctas.map((cta: string, i: number) => (
                              <Card 
                                key={i} 
                                hoverable 
                                className="cursor-pointer"
                                style={{ background: SURFACE_LIGHTER, borderColor: BORDER_COLOR }}
                              >
                                <div className="flex justify-between items-center">
                                  <Text style={{ color: TEXT_PRIMARY }}>{cta}</Text>
                                  <Button 
                                    type="text" 
                                    icon={<CopyOutlined />} 
                                    onClick={() => copyToClipboard(cta)}
                                    style={{ color: SPACE_COLOR }}
                                  />
                                </div>
                              </Card>
                            ))}
                          </div>
                        </div>
                        
                        {ad.visualSuggestions && ad.visualSuggestions.length > 0 && (
                          <div>
                            <Title level={5} className="mb-2" style={{ color: TEXT_PRIMARY }}>Visual Suggestions</Title>
                            <div className="space-y-2">
                              {ad.visualSuggestions.map((suggestion: string, i: number) => (
                                <Card key={i} style={{ background: SURFACE_LIGHTER, borderColor: BORDER_COLOR }}>
                                  <Text style={{ color: TEXT_PRIMARY }}>{suggestion}</Text>
                                </Card>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </TabPane>
                  ))}
                </Tabs>
              ) : (
                <Alert
                  message="No ads generated yet"
                  description="Click 'Generate Ad Copy' to create your first ads."
                  type="info"
                  showIcon
                />
              )}
            </Card>
            
            <Card style={{ background: SURFACE_BG, borderColor: BORDER_COLOR }}>
              <Title level={4} className="mb-4" style={{ color: TEXT_PRIMARY }}>Optimization Recommendations</Title>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card style={{ background: SURFACE_LIGHTER, borderColor: BORDER_COLOR }}>
                  <Title level={5} className="flex items-center" style={{ color: TEXT_PRIMARY }}>
                    <ThunderboltOutlined className="mr-2" />
                    Performance Boosters
                  </Title>
                  <ul className="list-disc pl-5 space-y-2">
                    <li style={{ color: TEXT_SECONDARY }}>Add numbers to headlines (e.g., Increase Conversions by 47%)</li>
                    <li style={{ color: TEXT_SECONDARY }}>Include power words like Proven, Guaranteed, Instant</li>
                    <li style={{ color: TEXT_SECONDARY }}>Test emoji vs no-emoji versions</li>
                    <li style={{ color: TEXT_SECONDARY }}>Use customer language from reviews/testimonials</li>
                  </ul>
                </Card>
                
                <Card style={{ background: SURFACE_LIGHTER, borderColor: BORDER_COLOR }}>
                  <Title level={5} className="flex items-center" style={{ color: TEXT_PRIMARY }}>
                    <StarOutlined className="mr-2" />
                    Creative Enhancements
                  </Title>
                  <ul className="list-disc pl-5 space-y-2">
                    <li style={{ color: TEXT_SECONDARY }}>Add customer testimonials to ad copy</li>
                    <li style={{ color: TEXT_SECONDARY }}>Include a surprising statistic or fact</li>
                    <li style={{ color: TEXT_SECONDARY }}>Create a sense of exclusivity</li>
                    <li style={{ color: TEXT_SECONDARY }}>Use pattern interrupts in your hooks</li>
                  </ul>
                </Card>
              </div>
            </Card>
            
            <Modal
              open={generatingAds}
              footer={null}
              closable={false}
              centered
              width={400}
              style={{ 
                background: 'transparent',
                boxShadow: 'none'
              }}
              maskStyle={{
                backdropFilter: 'blur(5px)',
                backgroundColor: 'rgba(0,0,0,0.1)'
              }}
            >
              <LoadingAnimation />
            </Modal>
            
            <Text style={{ color: SPACE_COLOR }} className="block text-center mt-4">
              * This content is AI-generated. Please always check for compliance with relevant advertising guidelines and regulations.
            </Text>
          </div>
        );
        
      default:
        return null;
    }
  };

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
            // borderColor: SURFACE_LIGHTER,
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
            hoverBorderColor: BRAND_GREEN,
          },
          Card: {
            headerBg: SURFACE_BG,
            colorBgContainer: SURFACE_BG,
            colorTextHeading: TEXT_PRIMARY,
            colorBorder: BORDER_COLOR,
          },
          Tabs: {
            itemSelectedColor: BRAND_GREEN,
            itemHoverColor: BRAND_GREEN,
            inkBarColor: BRAND_GREEN,
          },
          Radio: {
            buttonSolidCheckedColor: '#000',
            buttonSolidCheckedBg: BRAND_GREEN,
            colorBorder: BORDER_COLOR,
            colorPrimary: BRAND_GREEN,
            colorPrimaryHover: BRAND_GREEN,
          },
          Progress: {
            defaultColor: BRAND_GREEN,
            colorSuccess: BRAND_GREEN,
            remainingColor: SURFACE_LIGHTER,
          }
        }
      }}
    >
      <div className="min-h-screen bg-black font-manrope">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <LoadingOverlay visible={loading} />
          
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={handleBack}
            className="mb-4 hover:text-white border-none shadow-none px-0"
            style={{ background: 'transparent', color: SPACE_COLOR }}
          >
            Back to Dashboard
          </Button>

          <div className="text-center mb-8">
                <Title level={1} className="m-0 mb-2" style={{ color: TEXT_PRIMARY }}>Ad Writer</Title>
            <Text style={{ color: SPACE_COLOR }} className="text-lg">
              Generate high-converting ad copy tailored to your business and audience
            </Text>
          </div>

          {/* Main Tabs for Create vs History */}
          <Card style={{ background: SURFACE_BG, borderColor: BORDER_COLOR }}>
            <Tabs 
              activeKey={activeMainTab} 
              onChange={setActiveMainTab}
              type="card"
              items={[
                {
                  key: 'create',
                  label: (
                    <span className="flex items-center" style={{ color: SPACE_COLOR }}>
                      <BulbOutlined className="mr-2" />
                      Create New Ads
                    </span>
                  ),
                  children: (
                    <div>
                      {/* Progress Steps */}
                      <div className="mb-8">
                        <Progress 
                          percent={(currentStep / (steps.length - 1)) * 100} 
                          showInfo={false} 
                        />
                        <div className="flex justify-between mt-2">
                          {steps.map((step, index) => (
                            <div 
                              key={index} 
                              className={`text-sm ${currentStep >= index ? 'font-medium text-[#5CC49D]' : 'text-gray-400'}`}
                              style={{ fontFamily: 'Manrope, sans-serif' }}
                            >
                              {step}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Form Content */}
                      <Form
                        form={form}
                        layout="vertical"
                        onFinish={onFinish}
                        onValuesChange={(changedValues, allValues) => {
                          setFormData(prev => ({ ...prev, ...allValues }));
                        }}
                      >
                        {renderStepContent()}
                        
                        <div className="flex justify-between mt-8">
                          {currentStep > 0 && currentStep < 3 && (
                            <Button 
                              onClick={prevStep}
                              style={{ background: SURFACE_LIGHTER, borderColor: BORDER_COLOR, color: TEXT_PRIMARY }}
                            >
                              Back
                            </Button>
                          )}
                          
                          {currentStep < 2 && (
                            <Button 
                              type="primary" 
                              onClick={nextStep}
                              className="ml-auto"
                              style={{
                                backgroundColor: BRAND_GREEN,
                                borderColor: BRAND_GREEN,
                                color: '#000000',
                                fontWeight: '500'
                              }}
                            >
                              Continue
                            </Button>
                          )}
                          
                          {currentStep === 2 && (
                            <Button 
                              type="primary" 
                              loading={loading}
                              onClick={() => {
                                form.submit();
                              }}
                              icon={<ArrowRightOutlined />}
                              className="ml-auto"
                              style={{
                                backgroundColor: BRAND_GREEN,
                                borderColor: BRAND_GREEN,
                                color: '#000000',
                                fontWeight: '500'
                              }}
                            >
                              Generate Ad Copy
                            </Button>
                          )}
                          
                          {currentStep === 3 && (
                            <div className="flex justify-between w-full">
                              <Button 
                                onClick={() => {
                                  setCurrentStep(2);
                                }}
                                style={{ background: SURFACE_LIGHTER, borderColor: BORDER_COLOR, color: TEXT_PRIMARY }}
                              >
                                Back to Strategy
                              </Button>
                              <Button 
                                type="primary"
                                disabled={isLoading} 
                                onClick={() => {
                                  setCurrentStep(0);
                                  setGeneratedAds([]);
                                  setOriginalFormData(null);
                                  setFormData({});
                                  form.resetFields();
                                }}
                                style={{
                                  backgroundColor: BRAND_GREEN,
                                  borderColor: BRAND_GREEN,
                                  color: '#000000',
                                  fontWeight: '500'
                                }}
                              >
                                Create New Campaign
                              </Button>
                            </div>
                          )}
                        </div>
                      </Form>
                    </div>
                  )
                },
                {
                  key: 'history',
                  label: (
                    <span className="flex items-center" style={{ color: SPACE_COLOR }}>
                      <HistoryOutlined className="mr-2" />
                      Saved Ads History
                    </span>
                  ),
                  children: <SavedAdsHistory />
                }
              ]}
            />
          </Card>
        </div>

        {/* Custom CSS for radio buttons and hover effects */}
        <style jsx global>{`
          .custom-radio-group .ant-radio-wrapper:hover .ant-radio-inner {
            border-color: #5CC49D;
          }
          
          .custom-radio-group .ant-radio-checked .ant-radio-inner {
            border-color: #5CC49D;
            background-color: #5CC49D;
          }
          
          .custom-radio-group .ant-radio-checked .ant-radio-inner::after {
            background-color: #000;
          }
          
          .ant-input:hover, .ant-input:focus {
            border-color: #5CC49D !important;
            box-shadow: 0 0 0 2px rgba(92, 196, 157, 0.1) !important;
          }
          
          .ant-input-affix-wrapper:hover, .ant-input-affix-wrapper-focused {
            border-color: #5CC49D !important;
            box-shadow: 0 0 0 2px rgba(92, 196, 157, 0.1) !important;
          }
          
          .ant-select-selector:hover, .ant-select-focused .ant-select-selector {
            border-color: #5CC49D !important;
            box-shadow: 0 0 0 2px rgba(92, 196, 157, 0.1) !important;
          }
          
          .ant-select-item-option-active:not(.ant-select-item-option-disabled) {
            background-color: rgba(92, 196, 157, 0.1) !important;
          }
          
          .ant-select-item-option-selected:not(.ant-select-item-option-disabled) {
            background-color: rgba(92, 196, 157, 0.2) !important;
            color: #5CC49D !important;
          }
          
          .ant-radio-button-wrapper:hover {
            color: #5CC49D !important;
            border-color: #5CC49D !important;
          }
          
          .ant-radio-button-wrapper-checked:not(.ant-radio-button-wrapper-disabled) {
            color: #000 !important;
            background: #5CC49D !important;
            border-color: #5CC49D !important;
          }
          
          .ant-btn:hover, .ant-btn:focus {
            border-color: #5CC49D !important;
            color: #5CC49D !important;
          }
          
          .ant-btn-primary:hover, .ant-btn-primary:focus {
            background: #4cb08d !important;
            border-color: #4cb08d !important;
            color: #000 !important;
          }
          
          .ant-tabs-tab:hover {
            color: #5CC49D !important;
          }
          
          .ant-tabs-tab.ant-tabs-tab-active .ant-tabs-tab-btn {
            color: #5CC49D !important;
          }
          
          .ant-card-hoverable:hover {
            border-color: #5CC49D !important;
          }
          
          .ant-form-item-label > label {
            color: ${TEXT_SECONDARY} !important;
          }
          
          .ant-form-item-extra {
            color: ${SPACE_COLOR} !important;
          }
          
          .ant-alert-info {
            background-color: rgba(92, 196, 157, 0.1) !important;
            border-color: rgba(92, 196, 157, 0.3) !important;
          }
          
          .ant-message-notice-content {
            background-color: ${SURFACE_BG} !important;
            border-color: ${BORDER_COLOR} !important;
          }
        `}</style>
      </div>
    </ConfigProvider>
  );
};

export default AdWriter;