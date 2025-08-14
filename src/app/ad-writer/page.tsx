// Updated AdWriter.tsx with backend integration
"use client";

import React, { useState } from 'react';
import { 
  RocketOutlined,
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
  ReloadOutlined
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
  notification
} from 'antd';
import { useAdWriter, type AdWriterInput, type GeneratedAd } from '../hooks/useAdWriter';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

const AdWriter = () => {
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [generatedAds, setGeneratedAds] = useState<GeneratedAd[]>([]);
  const [activePlatforms, setActivePlatforms] = useState<string[]>(['facebook', 'google']);
  const [activeTab, setActiveTab] = useState('1');
  const [originalFormData, setOriginalFormData] = useState<AdWriterInput | null>(null);

  const { generateAds, optimizeAd, regeneratePlatformAds, loading, error, setError } = useAdWriter();

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

  // Main function to call backend API
  const onFinish = async (values: any) => {
    try {
      // Prepare data for API
      const requestData: AdWriterInput = {
        ...values,
        activePlatforms,
      };

      // Store form data for regeneration
      setOriginalFormData(requestData);

      // Call backend API using hook
      const result = await generateAds(requestData);
      
      setGeneratedAds(result);
      setCurrentStep(3);
      
      // Show success notification
      notification.success({
        message: 'Ads Generated Successfully!',
        description: `Generated ${result.length} platform variations`,
        placement: 'topRight',
      });
      
    } catch (error: any) {
      console.error('Error generating ads:', error);
      
      notification.error({
        message: 'Generation Failed',
        description: error.message || 'Please try again later',
        placement: 'topRight',
      });
    }
  };

  // Optimize existing ad copy
  const handleOptimizeAd = async (adCopy: string, optimizationType: string) => {
    try {
      const optimizedContent = await optimizeAd(adCopy, optimizationType);
      
      // You could show the optimized content in a modal or replace the original
      notification.success({
        message: 'Ad Optimized!',
        description: 'Check the new version',
        placement: 'topRight',
      });
      
      // For now, just show in a message
      message.success('Ad optimized successfully!');
      
      return optimizedContent;
    } catch (error) {
      // Error is already handled in the hook
      return null;
    }
  };

  // Regenerate specific platform ads
  const handleRegeneratePlatform = async (platform: string) => {
    if (!originalFormData) {
      message.error('No original data found for regeneration');
      return;
    }
    
    try {
      const newAd = await regeneratePlatformAds(originalFormData, platform);
      
      // Update only the regenerated platform
      setGeneratedAds(prev => {
        const filtered = prev.filter(ad => ad.platform !== platform);
        return [...filtered, newAd];
      });
      
      message.success(`${platform} ads regenerated!`);
    } catch (error) {
      // Error is already handled in the hook
    }
  };

  const nextStep = () => {
    form.validateFields().then(() => {
      setCurrentStep(currentStep + 1);
    }).catch(() => {
      message.error('Please fill in all required fields');
    });
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    message.success('Copied to clipboard!');
  };

  const downloadAds = () => {
    const content = generatedAds.map(ad => 
      `=== ${ad.platform.toUpperCase()} ===\n\n` +
      `Headlines:\n${ad.headlines.map((h: string) => `- ${h}`).join('\n')}\n\n` +
      `Descriptions:\n${ad.descriptions.map((d: string) => `- ${d}`).join('\n')}\n\n` +
      `CTAs:\n${ad.ctas.map((c: string) => `- ${c}`).join('\n')}\n\n` +
      (ad.hooks ? `Hooks:\n${ad.hooks.map((h: string) => `- ${h}`).join('\n')}\n\n` : '') +
      (ad.visualSuggestions ? `Visual Suggestions:\n${ad.visualSuggestions.map((v: string) => `- ${v}`).join('\n')}\n\n` : '')
    ).join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ad-copy-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Card className="mb-6">
            <Title level={4} className="flex items-center mb-4">
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
                label="Business/Brand Name"
                rules={[{ required: true, message: 'Please input your business name!' }]}
              >
                <Input placeholder="Acme Solutions" />
              </Form.Item>
              
              <Form.Item
                name="personalTitle"
                label="Your Name & Title (Optional)"
              >
                <Input placeholder="Jane Doe, CEO" />
              </Form.Item>
            </div>
            
            <Form.Item
              name="valueProposition"
              label="Core Value Proposition"
              rules={[{ required: true, message: 'Please describe your value!' }]}
              tooltip="What fundamental problem do you solve?"
            >
              <TextArea 
                rows={3} 
                placeholder="We help [target audience] achieve [core benefit] through [unique approach]" 
                showCount
                maxLength={500}
              />
            </Form.Item>
            
            <Divider />
            
            <Title level={4} className="flex items-center mb-4">
              <BulbOutlined className="mr-2" />
              Offer Details
            </Title>
            
            <Form.Item
              name="offerName"
              label="Offer Name"
              rules={[{ required: true, message: 'Please name your offer!' }]}
            >
              <Input placeholder="e.g., 90-Day Business Accelerator" />
            </Form.Item>
            
            <Form.Item
              name="offerDescription"
              label="Offer Description"
              rules={[{ required: true, message: 'Please describe your offer!' }]}
            >
              <TextArea 
                rows={3} 
                placeholder="An intensive program that helps [target] achieve [result] in [timeframe]" 
                showCount
                maxLength={500}
              />
            </Form.Item>
            
            <Form.Item
              name="features"
              label="Key Features (3 max)"
              rules={[{ required: true, message: 'Please list key features!' }]}
            >
              <Select
                mode="tags"
                style={{ width: '100%' }}
                placeholder="Add features (press enter after each)"
                maxTagCount={3}
              />
            </Form.Item>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item
                name="pricing"
                label="Pricing"
                rules={[{ required: true, message: 'Please specify pricing!' }]}
              >
                <Input placeholder="e.g., $997 or $99/month" />
              </Form.Item>
              
              <Form.Item
                name="uniqueMechanism"
                label="Unique Mechanism"
                rules={[{ required: true, message: 'What makes you different?' }]}
                tooltip="Your proprietary method or unique approach"
              >
                <Input placeholder="Our proprietary [system] that [benefit]" />
              </Form.Item>
            </div>
          </Card>
        );
        
      case 1:
        return (
          <Card className="mb-6">
            <Title level={4} className="flex items-center mb-4">
              <TeamOutlined className="mr-2" />
              Target Audience
            </Title>
            
            <Form.Item
              name="idealCustomer"
              label="Ideal Customer Profile"
              rules={[{ required: true, message: 'Please describe your customer!' }]}
              tooltip="Be as specific as possible"
            >
              <TextArea 
                rows={3} 
                placeholder="e.g., Marketing managers at B2B SaaS companies with 50-200 employees..." 
                showCount
                maxLength={500}
              />
            </Form.Item>
            
            <Form.Item
              name="primaryPainPoint"
              label="Their #1 Pain Point"
              rules={[{ required: true, message: 'What problem do you solve?' }]}
            >
              <TextArea 
                rows={2} 
                placeholder="e.g., Wasting money on ads that don't convert..." 
                showCount
                maxLength={300}
              />
            </Form.Item>
            
            <Form.Item
              name="failedSolutions"
              label="What They've Tried Before"
            >
              <TextArea 
                rows={2} 
                placeholder="e.g., Hiring cheap agencies, DIY solutions..." 
              />
            </Form.Item>
            
            <Divider />
            
            <Title level={4} className="flex items-center mb-4">
              <CheckCircleOutlined className="mr-2" />
              Benefits & Outcomes
            </Title>
            
            <Form.Item
              name="coreResult"
              label="Core Transformation"
              rules={[{ required: true, message: 'What result do you deliver?' }]}
            >
              <Input placeholder="e.g., 20+ qualified leads/month" />
            </Form.Item>
            
            <Form.Item
              name="secondaryBenefits"
              label="Secondary Benefits (3 max)"
            >
              <Select
                mode="tags"
                style={{ width: '100%' }}
                placeholder="Add benefits (press enter after each)"
                maxTagCount={3}
              />
            </Form.Item>
            
            <Form.Item
              name="timeline"
              label="Timeline to Results"
            >
              <Input placeholder="e.g., See results in 30 days" />
            </Form.Item>
          </Card>
        );
        
      case 2:
        return (
          <Card className="mb-6">
            <Title level={4} className="flex items-center mb-4">
              <RocketOutlined className="mr-2" />
              Ad Strategy
            </Title>
            
            <Form.Item
              label="Select Platforms"
              required
            >
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
                        ? 'border-blue-500 border-2 shadow-lg' 
                        : 'hover:border-gray-400'
                    }`}
                  >
                    <div className="text-2xl mb-2">{platform.icon}</div>
                    <div className="font-medium">{platform.label}</div>
                    <div className="text-gray-500 text-sm">
                      {platform.description}
                    </div>
                    {activePlatforms.includes(platform.value) && (
                      <CheckCircleOutlined className="text-blue-500 mt-2" />
                    )}
                  </Card>
                ))}
              </div>
            </Form.Item>
            
            <Divider />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item
                name="adType"
                label="Campaign Objective"
                initialValue="conversion"
                rules={[{ required: true }]}
              >
                <Radio.Group>
                  <Space direction="vertical">
                    {adTypes.map(type => (
                      <Radio key={type.value} value={type.value}>
                        <div>
                          <div className="font-medium">{type.label}</div>
                          <div className="text-gray-500 text-sm">
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
                label="Brand Tone"
                initialValue="professional"
                rules={[{ required: true }]}
              >
                <Select>
                  {toneOptions.map(tone => (
                    <Option key={tone.value} value={tone.value}>
                      {tone.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </div>
            
            <Divider />
            
            <Title level={5} className="mb-2">Social Proof</Title>
            
            <Form.Item
              name="caseStudy1"
              label="Case Study #1 (Client + Results)"
              tooltip="Include specific numbers and outcomes"
            >
              <TextArea 
                rows={3} 
                placeholder="Client: Acme Co. Increased conversions by 45% in 6 weeks..." 
              />
            </Form.Item>
            
            <Form.Item
              name="credentials"
              label="Credentials/Achievements"
            >
              <TextArea 
                rows={2} 
                placeholder="e.g., 250+ clients served, 15 years experience..." 
              />
            </Form.Item>
            
            <Divider />
            
            <Title level={5} className="mb-2">Call-to-Action</Title>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item
                name="cta"
                label="Primary CTA"
                rules={[{ required: true, message: 'Specify your CTA!' }]}
              >
                <Input placeholder="e.g., Book a Free Consultation" />
              </Form.Item>
              
              <Form.Item
                name="url"
                label="Destination URL"
                rules={[
                  { required: true, message: 'Enter your URL!' },
                  { type: 'url', message: 'Please enter a valid URL!' }
                ]}
              >
                <Input placeholder="https://example.com/offer" />
              </Form.Item>
              
              <Form.Item
                name="urgency"
                label="Urgency/Scarcity (Optional)"
              >
                <Input placeholder="e.g., Only 5 spots left!" />
              </Form.Item>
              
              <Form.Item
                name="leadMagnet"
                label="Lead Magnet (If Applicable)"
              >
                <Input placeholder="e.g., Free Strategy Guide" />
              </Form.Item>
            </div>
          </Card>
        );
        
      case 3:
        return (
          <div className="space-y-6">
            <Card>
              <div className="flex justify-between items-center mb-4">
                <Title level={4}>Your AI-Generated Ad Copy</Title>
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
                  >
                    Copy All
                  </Button>
                  <Button 
                    type="primary" 
                    icon={<DownloadOutlined />}
                    onClick={downloadAds}
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
              
              <Tabs 
                activeKey={activeTab}
                onChange={setActiveTab}
                type="card"
              >
                {generatedAds.map((ad, index) => (
                  <TabPane 
                    key={String(index + 1)} 
                    tab={
                      <span className="flex items-center">
                        {platforms.find(p => p.value === ad.platform)?.icon}
                        <span className="ml-1 capitalize">{ad.platform}</span>
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
                        >
                          Regenerate {ad.platform}
                        </Button>
                      </div>
                      
                      {ad.hooks && ad.hooks.length > 0 && (
                        <div>
                          <Title level={5} className="mb-2">Hooks</Title>
                          <div className="space-y-2">
                            {ad.hooks.map((hook: string, i: number) => (
                              <Card key={i} hoverable className="cursor-pointer">
                                <div className="flex justify-between items-center">
                                  <Text>{hook}</Text>
                                  <Button 
                                    type="text" 
                                    icon={<CopyOutlined />} 
                                    onClick={() => copyToClipboard(hook)}
                                  />
                                </div>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div>
                        <Title level={5} className="mb-2">Headlines</Title>
                        <div className="space-y-2">
                          {ad.headlines.map((headline: string, i: number) => (
                            <Card key={i} hoverable className="cursor-pointer">
                              <div className="flex justify-between items-center">
                                <Text>{headline}</Text>
                                <Space>
                                  <Tooltip title="Optimize for emotion">
                                    <Button 
                                      type="text" 
                                      size="small"
                                      onClick={() => handleOptimizeAd(headline, 'emotional')}
                                    >
                                      ✨
                                    </Button>
                                  </Tooltip>
                                  <Button 
                                    type="text" 
                                    icon={<CopyOutlined />} 
                                    onClick={() => copyToClipboard(headline)}
                                  />
                                </Space>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <Title level={5} className="mb-2">Descriptions</Title>
                        <div className="space-y-2">
                          {ad.descriptions.map((desc: string, i: number) => (
                            <Card key={i} hoverable className="cursor-pointer">
                              <div className="flex justify-between items-start">
                                <Text className="flex-1">{desc}</Text>
                                <Button 
                                  type="text" 
                                  icon={<CopyOutlined />} 
                                  onClick={() => copyToClipboard(desc)}
                                />
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <Title level={5} className="mb-2">Call-to-Actions</Title>
                        <div className="space-y-2">
                          {ad.ctas.map((cta: string, i: number) => (
                            <Card key={i} hoverable className="cursor-pointer">
                              <div className="flex justify-between items-center">
                                <Text>{cta}</Text>
                                <Button 
                                  type="text" 
                                  icon={<CopyOutlined />} 
                                  onClick={() => copyToClipboard(cta)}
                                />
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                      
                      {ad.visualSuggestions && ad.visualSuggestions.length > 0 && (
                        <div>
                          <Title level={5} className="mb-2">Visual Suggestions</Title>
                          <div className="space-y-2">
                            {ad.visualSuggestions.map((suggestion: string, i: number) => (
                              <Card key={i} className="bg-gray-50">
                                <Text>{suggestion}</Text>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </TabPane>
                ))}
              </Tabs>
            </Card>
            
            <Card>
              <Title level={4} className="mb-4">Optimization Recommendations</Title>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <Title level={5} className="flex items-center">
                    <ThunderboltOutlined className="mr-2" />
                    Performance Boosters
                  </Title>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Add numbers to headlines (e.g., Increase Conversions by 47%)</li>
                    <li>Include power words like Proven, Guaranteed, Instant</li>
                    <li>Test emoji vs no-emoji versions</li>
                    <li>Use customer language from reviews/testimonials</li>
                  </ul>
                </Card>
                
                <Card>
                  <Title level={5} className="flex items-center">
                    <StarOutlined className="mr-2" />
                    Creative Enhancements
                  </Title>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Add customer testimonials to ad copy</li>
                    <li>Include a surprising statistic or fact</li>
                    <li>Create a sense of exclusivity</li>
                    <li>Use pattern interrupts in your hooks</li>
                  </ul>
                </Card>
              </div>
            </Card>
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
          <RocketOutlined className="mr-2" />
          AI Ad Writer
        </Title>
        <Text type="secondary" className="text-lg">
          Generate high-converting ad copy tailored to your business and audience
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
      >
        {renderStepContent()}
        
        <div className="flex justify-between mt-8">
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
          
          {currentStep === 2 && (
            <Button 
              type="primary" 
              loading={loading}
              onClick={() => {
                if (activePlatforms.length === 0) {
                  message.error('Please select at least one platform!');
                  return;
                }
                form.submit();
              }}
              icon={<ArrowRightOutlined />}
              className="ml-auto"
            >
              Generate Ad Copy
            </Button>
          )}
          
          {currentStep === 3 && (
            <Button 
              type="primary"
              onClick={() => {
                setCurrentStep(0);
                setGeneratedAds([]);
                setOriginalFormData(null);
                form.resetFields();
              }}
            >
              Create New Campaign
            </Button>
          )}
        </div>
      </Form>
    </div>
  );
};

export default AdWriter;