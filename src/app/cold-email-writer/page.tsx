"use client";

// app/cold-email-writer/page.tsx
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
  ThunderboltOutlined
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
  Badge
} from 'antd';

const { Title, Text } = Typography;
const { Panel } = Collapse;
const { Option } = Select;
const { TextArea } = Input;

const ColdEmailWriter = () => {
  const [form] = Form.useForm();
  const [emailMethod, setEmailMethod] = useState('direct');
  const [generatedEmail, setGeneratedEmail] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activePanels, setActivePanels] = useState<string[]>(['1', '2', '3', '4']);

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

  const onFinish = (values: any) => {
    setIsGenerating(true);
    
    // Simulate AI generation
    setTimeout(() => {
      const email = generateEmailScript(values, emailMethod);
      setGeneratedEmail(email);
      setIsGenerating(false);
    }, 1500);
  };

  const generateEmailScript = (data: any, method: string) => {
    let email = '';
    
    const subjectLines: Record<string, string> = {
      interview: `Quick question about ${data.targetIndustry}`,
      podcast: `An idea for your ${data.targetIndustry} audience`,
      direct: `How we helped similar ${data.targetRole}s in ${data.targetIndustry}`,
      masterclass: `Exclusive ${data.targetIndustry} insights you might find valuable`
    };

    email += `Subject: ${subjectLines[method]}\n\n`;
    email += `Hi ${data.targetFirstName || 'there'},\n\n`;

    switch(method) {
      case 'interview':
        email += `I'm ${data.firstName} from ${data.companyName}, and I've been researching how ${data.targetIndustry} companies are handling [specific challenge].\n\n`;
        email += `I'd love to get your perspective as a ${data.targetRole} - would you be open to a quick 15-minute interview? I'm happy to share my findings afterward which might help with [specific pain point].\n\n`;
        break;
      case 'podcast':
        email += `I recently hosted a podcast episode about [topic relevant to target industry] and thought you might find it valuable given your role as a ${data.targetRole} at [their company].\n\n`;
        email += `We discussed [specific insight] that's helping similar ${data.targetIndustry} companies [achieve result]. Would you like me to send you the link?\n\n`;
        break;
      case 'direct':
        email += `I noticed ${data.companyName} helps ${data.targetIndustry} companies with [value proposition]. We've helped [similar company] achieve [specific result].\n\n`;
        email += `Would you be open to a quick call to explore if we could do the same for you? I'm available [time options].\n\n`;
        break;
      case 'masterclass':
        email += `I'm putting together an exclusive masterclass on [topic] specifically for ${data.targetIndustry} ${data.targetRole}s like yourself.\n\n`;
        email += `Early participants are seeing [specific result]. Would you like me to save you a spot?\n\n`;
        break;
    }

    email += `Best regards,\n`;
    email += `${data.firstName} ${data.lastName}\n`;
    email += `${data.jobTitle}, ${data.companyName}\n`;
    email += `${data.workEmail} | ${data.phone || ''}\n`;
    email += `${data.companyAddress || ''}\n`;
    email += `${data.linkedIn ? `LinkedIn: ${data.linkedIn}` : ''}`;

    return email;
  };

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
                  className={`cursor-pointer ${emailMethod === method.value ? 'border-blue-500 border-2' : ''}`}
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
          >
            <TextArea 
              rows={3} 
              placeholder="e.g., We help [target role] in [industry] achieve [specific outcome] by [your unique approach]"
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
                <Option value="reply">Just get a reply</Option>
                <Option value="meeting">Set up meeting</Option>
              </Select>
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
          </div>
        </Panel>
      </Collapse>

      <div className="text-center mt-6">
        <Button 
          type="primary" 
          size="large" 
          htmlType="submit"
          loading={isGenerating}
          icon={<ArrowRightOutlined />}
          onClick={() => form.submit()}
          className="min-w-48"
        >
          {isGenerating ? 'Generating...' : 'Generate Email'}
        </Button>
      </div>

      {generatedEmail && (
        <div className="mt-8">
          <Card>
            <div className="flex justify-between items-center mb-4">
              <Title level={4}>Your Custom Cold Email</Title>
              <Space>
                <Button 
                  icon={<DownloadOutlined />}
                  onClick={() => {
                    const blob = new Blob([generatedEmail], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'cold-email-script.txt';
                    a.click();
                  }}
                >
                  Download
                </Button>
                <Button 
                  type="primary" 
                  onClick={() => navigator.clipboard.writeText(generatedEmail)}
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
                  </ul>
                </div>
              } 
              type="info" 
              showIcon 
              className="mb-4"
            />
            
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <pre className="whitespace-pre-wrap font-sans text-gray-800">{generatedEmail}</pre>
            </div>
            
            <Divider />
            
            <Title level={5} className="mb-2">Follow-Up Sequence Recommendations</Title>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <Title level={5} className="flex items-center">
                  <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2">1</span>
                  First Follow-Up
                </Title>
                <Text className="block mb-2">Send 3-4 days later</Text>
                <Text type="secondary">Just circling back on this - would love to get your thoughts</Text>
              </Card>
              <Card>
                <Title level={5} className="flex items-center">
                  <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2">2</span>
                  Second Follow-Up
                </Title>
                <Text className="block mb-2">Send 7 days after first</Text>
                <Text type="secondary">I noticed [recent company news] - this relates to what we discussed about [topic]</Text>
              </Card>
              <Card>
                <Title level={5} className="flex items-center">
                  <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2">3</span>
                  Breakup Email
                </Title>
                <Text className="block mb-2">Send 14 days after second</Text>
                <Text type="secondary">I will assume this isnt a priority now - will circle back in time</Text>
              </Card>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ColdEmailWriter;