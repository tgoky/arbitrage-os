"use client";

import React, { useState } from 'react';
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
  SelectOutlined
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
  message,
  Slider,
  Segmented,
  Switch,
  List,
  Modal,
  Table,
  notification
} from 'antd';
import { useColdEmail } from '../hooks/useColdEmail';
import { GeneratedEmail, EmailTemplate, ColdEmailGenerationInput } from '@/types/coldEmail';

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
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);

  const {
    generateEmails,
    optimizeEmail,
    getTemplates,
    createTemplate,
    loading,
    error,
    setError
  } = useColdEmail();

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

  const onFinish = async (values: any) => {
    try {
      // Prepare data for API using the hook
      const requestData: ColdEmailGenerationInput = {
        ...values,
        method: emailMethod,
        variations: values.variations || 1,
        generateFollowUps: values.generateFollowUps || false,
        followUpCount: values.followUpCount || 3,
        saveAsTemplate: values.saveAsTemplate || false
      };

      // Call backend API using hook
      const result = await generateEmails(requestData);
      
      setGeneratedEmails(result);
      
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
      console.error('Error generating email:', error);
      
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
    try {
      const content = `Subject: ${email.subject}\n\n${email.body}\n\n${email.signature}`;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cold-email-${email.metadata?.variationIndex || 0}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      message.success('Email downloaded successfully!');
    } catch (error) {
      message.error('Failed to download email');
    }
  };

  const handleOptimizeEmail = async (emailContent: string, optimizationType: string) => {
    try {
      const optimizedContent = await optimizeEmail(
        emailContent, 
        optimizationType as any
      );
      
      notification.success({
        message: 'Email Optimized!',
        description: 'Check the new optimized version',
        placement: 'topRight',
      });
      
      // Here you could update the email in place or show in a modal
      // For now, just show success message
      message.success('Email optimized successfully!');
      
      return optimizedContent;
    } catch (error) {
      // Error is already handled in the hook
      return emailContent;
    }
  };

  const fetchTemplates = async () => {
    try {
      const fetchedTemplates = await getTemplates({ includePublic: true });
      setTemplates(fetchedTemplates);
      setIsTemplateModalVisible(true);
      message.success(`Loaded ${fetchedTemplates.length} templates`);
    } catch (error) {
      // Error is already handled in the hook
    }
  };

  const handleApplyTemplate = (template: EmailTemplate) => {
    setEmailMethod(template.method);
    form.setFieldsValue({
      method: template.method,
      targetIndustry: template.metadata?.targetIndustry,
      targetRole: template.metadata?.targetRole,
    });
    
    setGeneratedEmails([{
      subject: template.subject,
      body: template.body,
      signature: '',
      method: template.method,
      metadata: {
        targetIndustry: template.metadata?.targetIndustry || '',
        targetRole: template.metadata?.targetRole || '',
        generatedAt: template.createdAt,
      }
    }]);
    
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
            onClick={() => copyToClipboard(`Subject: ${template.subject}\n\n${template.body}`)}
          >
            Preview
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
      <div className="text-center mb-8">
        <Title level={2} className="flex items-center justify-center">
          <MailOutlined className="mr-2" />
          AI Cold Email Writer
        </Title>
        <Text type="secondary" className="text-lg">
          Generate high-converting cold emails tailored to your ideal prospects
        </Text>
      </div>

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
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item
                name="firstName"
                label="Your First Name"
                rules={[{ required: true, message: 'Please input your name!' }]}
                tooltip="This personalizes your email signature"
              >
                <Input prefix={<UserOutlined />} placeholder="Jake" />
              </Form.Item>
              <Form.Item
                name="lastName"
                label="Your Last Name"
                rules={[{ required: true, message: 'Please input your last name!' }]}
              >
                <Input placeholder="Smith" />
              </Form.Item>
              <Form.Item
                name="email"
                label="Your Email"
                rules={[{ required: true, message: 'Please input your email!' }]}
              >
                <Input prefix={<MailOutlined />} placeholder="jake@marinmedia.me" />
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
                <Input placeholder="Marin Media" />
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
          </Form>
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
                  hoverable
                  onClick={() => setEmailMethod(method.value)}
                  className={`cursor-pointer transition-all ${emailMethod === method.value ? 'border-blue-500 border-2 shadow-md' : 'hover:shadow-sm'}`}
                >
                  <div className="flex items-start">
                    <div className="p-2 bg-blue-50 rounded-full mr-3">
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
              initialValue="professional"
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
              initialValue="medium"
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
              initialValue="balanced"
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
              initialValue="moderate"
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
              initialValue={1}
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
              initialValue={3}
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
              initialValue="call"
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
            loading={loading}
          >
            Load Saved Templates
          </Button>
        </Panel>
      </Collapse>

      <Modal
        title="Saved Templates"
        open={isTemplateModalVisible}
        onCancel={() => setIsTemplateModalVisible(false)}
        footer={null}
        width={800}
      >
        <Table
          dataSource={templates}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 5 }}
        />
      </Modal>

      <div className="text-center mt-6">
        <Button 
          type="primary" 
          size="large" 
          htmlType="submit"
          loading={loading}
          icon={<ArrowRightOutlined />}
          onClick={() => form.submit()}
          className="min-w-48"
        >
          {loading ? 'Generating AI Email...' : 'Generate AI Email'}
        </Button>
      </div>

      {generatedEmails.length > 0 && (
        <div className="mt-8">
          {generatedEmails.map((email, index) => (
            <Card key={index} className="mb-4">
              <div className="flex justify-between items-center mb-4">
                <Title level={4}>Generated Email {index + 1}</Title>
                <Space>
                  <Button 
                    onClick={() => handleOptimizeEmail(`${email.subject}\n\n${email.body}\n\n${email.signature}`, 'personalization')}
                  >
                    Optimize Personalization
                  </Button>
                  <Button 
                    onClick={() => handleOptimizeEmail(`${email.subject}\n\n${email.body}\n\n${email.signature}`, 'value')}
                  >
                    Optimize Value
                  </Button>
                  <Button 
                    icon={<DownloadOutlined />}
                    onClick={() => downloadEmail(email)}
                  >
                    Download
                  </Button>
                  <Button 
                    type="primary" 
                    onClick={() => copyToClipboard(`${email.subject}\n\n${email.body}\n\n${email.signature}`)}
                  >
                    Copy to Clipboard
                  </Button>
                </Space>
              </div>
              
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
                  Subject: {email.subject}
                  {'\n\n'}
                  {email.body}
                  {'\n\n'}
                  {email.signature}
                </pre>
              </div>
              
              {email.followUpSequence && (
                <>
                  <Divider />
                  <Title level={5} className="mb-2">Follow-Up Sequence</Title>
                  <List
                    grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 3 }}
                    dataSource={email.followUpSequence}
                    renderItem={(followUp: GeneratedEmail) => (
                      <List.Item>
                        <Card>
                          <Title level={5} className="flex items-center">
                            <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2">{followUp.metadata?.sequenceNumber}</span>
                            Follow-Up (Day {followUp.metadata?.dayInterval})
                          </Title>
                          <pre className="whitespace-pre-wrap font-sans text-gray-800 leading-relaxed">
                            Subject: {followUp.subject}
                            {'\n\n'}
                            {followUp.body}
                            {'\n\n'}
                            {followUp.signature}
                          </pre>
                        </Card>
                      </List.Item>
                    )}
                  />
                </>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ColdEmailWriter;