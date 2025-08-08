// app/offer-creator/page.tsx
import React, { useState } from 'react';
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
  BulbOutlined
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
  InputNumber
} from 'antd';

const { Title, Text } = Typography;
const { Panel } = Collapse;
const { Option } = Select;
const { TextArea } = Input;

const OfferCreator = () => {
  const [form] = Form.useForm();
  const [generatedOffer, setGeneratedOffer] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [offerType, setOfferType] = useState('discount');
  const [activePanels, setActivePanels] = useState<string[]>(['1', '2', '3']);

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

  const onFinish = (values: any) => {
    setIsGenerating(true);
    
    // Simulate AI generation
    setTimeout(() => {
      const offer = generateOfferScript(values, offerType);
      setGeneratedOffer(offer);
      setIsGenerating(false);
    }, 1500);
  };

  const generateOfferScript = (data: any, type: string) => {
    let offer = '';
    
    const headlines: Record<string, string> = {
      discount: `Limited-Time ${data.discountValue}% OFF - ${data.offerName}`,
      bonus: `Get ${data.bonusItem} FREE With Your ${data.offerName}`,
      trial: `Try ${data.offerName} Risk-Free for ${data.trialPeriod} Days`,
      guarantee: `${data.guaranteePeriod}-Day 100% Satisfaction Guarantee on ${data.offerName}`
    };

    offer += `# ${headlines[type]}\n\n`;
    offer += `**Primary Offer:** ${data.offerName}\n\n`;
    offer += `**Offer Value:** ${data.offerValue}\n\n`;

    switch(type) {
      case 'discount':
        offer += `For a limited time only, get ${data.discountValue}% off ${data.offerName}. This special discount saves you ${data.discountAmount} and is only available until ${data.expiryDate}.\n\n`;
        offer += `👉 ${data.cta || 'Claim Your Discount Now'}\n\n`;
        break;
      case 'bonus':
        offer += `When you purchase ${data.offerName} today, you'll also receive ${data.bonusItem} (valued at ${data.bonusValue}) absolutely FREE. That's ${data.totalValue} worth of value for just ${data.offerPrice}.\n\n`;
        offer += `👉 ${data.cta || 'Get Your Free Bonus Now'}\n\n`;
        break;
      case 'trial':
        offer += `Experience ${data.offerName} completely risk-free for ${data.trialPeriod} days. No commitment, no credit card required. After your trial, continue for just ${data.offerPrice}/month.\n\n`;
        offer += `👉 ${data.cta || 'Start Your Free Trial'}\n\n`;
        break;
      case 'guarantee':
        offer += `We're so confident you'll love ${data.offerName} that we're offering an iron-clad ${data.guaranteePeriod}-day 100% satisfaction guarantee. If you're not completely satisfied, we'll refund every penny, no questions asked.\n\n`;
        offer += `👉 ${data.cta || 'Try Risk-Free Today'}\n\n`;
        break;
    }

    if (data.scarcity) {
      offer += `🚨 **Limited Availability:** ${data.scarcityReason}\n\n`;
    }

    if (data.socialProof) {
      offer += `## What Our Customers Say:\n"${data.testimonialQuote}" - ${data.testimonialAuthor}\n\n`;
    }

    offer += `## Offer Details:\n`;
    offer += `- Regular Price: ${data.regularPrice}\n`;
    offer += `- Offer Price: ${data.offerPrice}\n`;
    if (type === 'discount') {
      offer += `- You Save: ${data.discountAmount} (${data.discountValue}%)\n`;
    }
    if (type === 'bonus') {
      offer += `- Bonus Value: ${data.bonusValue}\n`;
      offer += `- Total Value: ${data.totalValue}\n`;
    }
    offer += `- Expires: ${data.expiryDate}\n\n`;

    offer += `**How to Redeem:** ${data.redemptionInstructions || 'Click the button below to claim your offer'}\n\n`;

    return offer;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <Title level={2} className="flex items-center justify-center">
          <ThunderboltOutlined className="mr-2" />
          AI-Powered Offer Creator
        </Title>
        <Text type="secondary" className="text-lg">
          Craft irresistible offers that convert with proven frameworks
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
                <Input prefix={<DollarOutlined />} placeholder="e.g., $997" />
              </Form.Item>
              <Form.Item
                name="offerPrice"
                label="Offer Price"
                rules={[{ required: true, message: 'What is the special price?' }]}
              >
                <Input prefix={<DollarOutlined />} placeholder="e.g., $497" />
              </Form.Item>
              <Form.Item
                name="expiryDate"
                label="Offer Expiry Date"
                rules={[{ required: true, message: 'When does this offer end?' }]}
              >
                <Input placeholder="e.g., August 31, 2023" />
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
            <Text strong>Select your offer type:</Text>
            <Text type="secondary" className="block mb-4">
              Different approaches work better for different goals
            </Text>
          </div>
          
          <Form.Item
            name="offerType"
            initialValue="discount"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {offerTypes.map((type) => (
                <Card
                  key={type.value}
                  hoverable
                  onClick={() => setOfferType(type.value)}
                  className={`cursor-pointer ${offerType === type.value ? 'border-blue-500 border-2' : ''}`}
                >
                  <div className="flex items-start">
                    <div className="p-2 bg-blue-50 rounded-full mr-3">
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
              ))}
            </div>
          </Form.Item>

          <Divider />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {offerType === 'discount' && (
              <>
                <Form.Item
                  name="discountValue"
                  label="Discount Percentage"
                  rules={[{ required: true }]}
                >
                  <InputNumber 
                    min={1}
                    max={100}
                    formatter={value => `${value}%`}
                    parser={value => value!.replace('%', '')}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
                <Form.Item
                  name="discountAmount"
                  label="Discount Amount"
                  rules={[{ required: true }]}
                >
                  <Input prefix={<DollarOutlined />} placeholder="e.g., $500" />
                </Form.Item>
              </>
            )}
            
            {offerType === 'bonus' && (
              <>
                <Form.Item
                  name="bonusItem"
                  label="Bonus Item Name"
                  rules={[{ required: true }]}
                >
                  <Input placeholder="e.g., Free Consulting Session" />
                </Form.Item>
                <Form.Item
                  name="bonusValue"
                  label="Bonus Value"
                  rules={[{ required: true }]}
                >
                  <Input prefix={<DollarOutlined />} placeholder="e.g., $300" />
                </Form.Item>
                <Form.Item
                  name="totalValue"
                  label="Total Package Value"
                  rules={[{ required: true }]}
                >
                  <Input prefix={<DollarOutlined />} placeholder="e.g., $1,297" />
                </Form.Item>
              </>
            )}
            
            {offerType === 'trial' && (
              <Form.Item
                name="trialPeriod"
                label="Trial Period (Days)"
                rules={[{ required: true }]}
              >
                <InputNumber 
                  min={1}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            )}
            
            {offerType === 'guarantee' && (
              <Form.Item
                name="guaranteePeriod"
                label="Guarantee Period (Days)"
                rules={[{ required: true }]}
              >
                <InputNumber 
                  min={1}
                  style={{ width: '100%' }}
                />
              </Form.Item>
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
        </Panel>
      </Collapse>

      <div className="text-center mt-6">
        <Button 
          type="primary" 
          size="large" 
          htmlType="submit"
          loading={isGenerating}
          icon={<RocketOutlined />}
          onClick={() => form.submit()}
          className="min-w-48"
        >
          {isGenerating ? 'Generating...' : 'Generate Offer'}
        </Button>
      </div>

      {generatedOffer && (
        <div className="mt-8">
          <Card>
            <div className="flex justify-between items-center mb-4">
              <Title level={4}>Your High-Converting Offer</Title>
              <Space>
                <Button 
                  icon={<DownloadOutlined />}
                  onClick={() => {
                    const blob = new Blob([generatedOffer], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'irresistible-offer.txt';
                    a.click();
                  }}
                >
                  Download
                </Button>
                <Button 
                  type="primary" 
                  icon={<CopyOutlined />}
                  onClick={() => navigator.clipboard.writeText(generatedOffer)}
                >
                  Copy to Clipboard
                </Button>
              </Space>
            </div>
            
            <Alert 
              message="Pro Tips" 
              description={
                <div>
                  <p>Boost conversions further by:</p>
                  <ul className="list-disc pl-5">
                    <li>Adding a countdown timer for urgency</li>
                    <li>Including before/after results</li>
                    <li>Showing how many people have already claimed</li>
                    <li>Adding a bonus for fast action takers</li>
                  </ul>
                </div>
              } 
              type="info" 
              showIcon 
              className="mb-4"
            />
            
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <pre className="whitespace-pre-wrap font-sans text-gray-800">{generatedOffer}</pre>
            </div>
            
            <Divider />
            
            <Title level={5} className="mb-2">Recommended Upsell/Cross-sell Opportunities</Title>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <Title level={5} className="flex items-center">
                  <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2">1</span>
                  Fast Action Bonus
                </Title>
                <Text className="block mb-2">For first 24 hours only</Text>
                <Text type="secondary">Add an extra bonus for people who act quickly to boost urgency</Text>
              </Card>
              <Card>
                <Title level={5} className="flex items-center">
                  <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2">2</span>
                  Premium Upsell
                </Title>
                <Text className="block mb-2">After initial purchase</Text>
                <Text type="secondary">Offer a higher-ticket version with more features/services</Text>
              </Card>
              <Card>
                <Title level={5} className="flex items-center">
                  <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2">3</span>
                  Complementary Product
                </Title>
                <Text className="block mb-2">During checkout</Text>
                <Text type="secondary">"Customers who bought this also purchased..."</Text>
              </Card>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default OfferCreator;