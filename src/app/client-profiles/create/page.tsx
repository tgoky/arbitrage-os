// app/dashboard/clients/new/page.tsx
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  PlusOutlined,
  ArrowLeftOutlined,
  SaveOutlined,
  TeamOutlined,
  BarChartOutlined,
  DollarOutlined,
  UserOutlined,
  GlobalOutlined,
  RocketOutlined,
  TagOutlined
} from '@ant-design/icons';
import { 
  Card, 
  Form, 
  Input, 
  Select, 
  Button, 
  Typography, 
  Space, 
  Divider, 
  Row, 
  Col,
  Tag,
  InputNumber,
  Checkbox,
  message,
  Collapse
} from 'antd';
import { useTheme } from '../../../providers/ThemeProvider';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { Panel } = Collapse;

const serviceOptions = [
  'Content Creation',
  'Strategy Consulting',
  'Automation Setup',
  'Market Research',
  'Lead Generation',
  'Social Media Management',
  'Email Marketing',
  'Paid Advertising',
  'SEO Optimization',
  'Conversion Rate Optimization',
  'Customer Journey Mapping',
  'Brand Development',
  'Sales Process Optimization',
  'Data Analytics',
  'CRM Implementation',
  'Process Automation'
];

const productOptions = [
  'Digital Products',
  'Physical Products',
  'Software/SaaS',
  'Consulting Services',
  'Membership Programs',
  'Online Courses',
  'Coaching Programs',
  'Agency Services',
  'E-commerce Products',
  'Subscription Services'
];

const marketingChannelOptions = [
  'Social Media',
  'Email Marketing',
  'Content Marketing',
  'Paid Advertising',
  'SEO',
  'Influencer Marketing',
  'Affiliate Marketing',
  'Direct Sales',
  'Partnerships',
  'Referral Programs',
  'Trade Shows',
  'Cold Outreach',
  'Webinars',
  'Podcasts'
];

const NewClientPage = () => {
  const router = useRouter();
  const { theme } = useTheme();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedMarketingChannels, setSelectedMarketingChannels] = useState<string[]>([]);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      // Here you would typically make an API call to create the client
      console.log('Client data:', values);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      message.success('Client created successfully!');
      router.push('/dashboard');
    } catch (error) {
      message.error('Failed to create client. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const themeClass = (light: string, dark: string) => 
    theme === 'dark' ? dark : light;

  const cardStyle = {
    backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
    borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
    borderRadius: 8,
  };

  const checkboxGroupStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '8px',
    width: '100%'
  };

  const checkboxStyle = {
    margin: '4px 0',
    padding: '8px 12px',
    borderRadius: '6px',
    backgroundColor: theme === 'dark' ? '#374151' : '#f9fafb',
    border: `1px solid ${theme === 'dark' ? '#4b5563' : '#e5e7eb'}`,
    transition: 'all 0.2s ease'
  };

  return (
    <div style={{ 
      backgroundColor: theme === 'dark' ? '#000000' : '#ffffff',
      minHeight: '100vh',
      padding: '24px'
    }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Button 
          icon={<ArrowLeftOutlined />}
          onClick={() => router.back()}
          style={{ 
            marginBottom: 16,
            color: theme === 'dark' ? '#e5e7eb' : '#1a1a1a',
            borderColor: theme === 'dark' ? '#4b5563' : '#d1d5db'
          }}
        >
          Back to Dashboard
        </Button>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title 
              level={2} 
              style={{ 
                margin: 0,
                color: theme === 'dark' ? '#f9fafb' : '#1a1a1a'
              }}
            >
              Create New Client
            </Title>
            <Text 
              style={{ 
                color: theme === 'dark' ? '#9ca3af' : '#6b7280'
              }}
            >
              Add a new client profile to your workspace
            </Text>
          </div>
        </div>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          stage: 'Idea',
          tags: []
        }}
      >
        <Row gutter={[24, 24]}>
          {/* Left Column - Core Information */}
          <Col xs={24} lg={12}>
            {/* Core Information Card */}
            <Card
              title={
                <span style={{ color: theme === 'dark' ? '#f9fafb' : '#1a1a1a' }}>
                  <TeamOutlined style={{ marginRight: 8 }} />
                  Core Information
                </span>
              }
              style={cardStyle}
            >
              <Form.Item
                name="name"
                label="Business Name"
                rules={[{ required: true, message: 'Please enter business name' }]}
              >
                <Input 
                  placeholder="Enter business name" 
                  size="large"
                />
              </Form.Item>

              <Form.Item
                name="stage"
                label="Business Stage"
                rules={[{ required: true, message: 'Please select stage' }]}
              >
                <Select size="large">
                  <Option value="Idea">Idea</Option>
                  <Option value="Prelaunch">Prelaunch</Option>
                  <Option value="Active">Active</Option>
                  <Option value="Scaling">Scaling</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="industry"
                label="Industry"
              >
                <Input 
                  placeholder="e.g., SaaS, E-commerce, Consulting"
                  size="large"
                />
              </Form.Item>

              <Form.Item
                name="targetAudience"
                label="Target Audience"
              >
                <Input 
                  placeholder="e.g., Small business owners, 25-45"
                  size="large"
                />
              </Form.Item>
            </Card>

            {/* Business Information Card */}
            <Card
              title={
                <span style={{ color: theme === 'dark' ? '#f9fafb' : '#1a1a1a' }}>
                  <BarChartOutlined style={{ marginRight: 8 }} />
                  Business Information
                </span>
              }
              style={{ ...cardStyle, marginTop: 24 }}
            >
              <Form.Item
                name="offerSummary"
                label="Offer Summary"
              >
                <TextArea 
                  rows={3}
                  placeholder="Brief description of your main offer or service"
                />
              </Form.Item>

              <Form.Item
                name="businessModel"
                label="Business Model"
              >
                <Input 
                  placeholder="e.g., B2B SaaS, D2C, Marketplace"
                />
              </Form.Item>

              <Form.Item
                name="revenueModel"
                label="Revenue Model"
              >
                <Input 
                  placeholder="e.g., Subscription, One-time, Commission"
                />
              </Form.Item>

              <Form.Item
                name="competitiveAdvantage"
                label="Competitive Advantage"
              >
                <TextArea 
                  rows={2}
                  placeholder="What makes you different from competitors?"
                />
              </Form.Item>
            </Card>

            {/* Financial Information Card */}
            <Card
              title={
                <span style={{ color: theme === 'dark' ? '#f9fafb' : '#1a1a1a' }}>
                  <DollarOutlined style={{ marginRight: 8 }} />
                  Financial Information
                </span>
              }
              style={{ ...cardStyle, marginTop: 24 }}
            >
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item
                    name="monthlyRevenue"
                    label="Monthly Revenue"
                  >
                    <Input 
                      placeholder="$0.00"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="profitMargin"
                    label="Profit Margin"
                  >
                    <Input 
                      placeholder="0%"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item
                    name="customerLifetimeValue"
                    label="Customer LTV"
                  >
                    <Input 
                      placeholder="$0.00"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="customerAcquisitionCost"
                    label="Customer CAC"
                  >
                    <Input 
                      placeholder="$0.00"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Col>

          {/* Right Column - Additional Information */}
          <Col xs={24} lg={12}>
            {/* Market Information Card */}
            <Card
              title={
                <span style={{ color: theme === 'dark' ? '#f9fafb' : '#1a1a1a' }}>
                  <GlobalOutlined style={{ marginRight: 8 }} />
                  Market Information
                </span>
              }
              style={cardStyle}
            >
              <Form.Item
                name="marketSize"
                label="Market Size"
              >
                <Input 
                  placeholder="e.g., $10B market, 1M potential customers"
                />
              </Form.Item>

              <Form.Item
                name="targetMarket"
                label="Target Market"
              >
                <Input 
                  placeholder="e.g., Small businesses in the US"
                />
              </Form.Item>

              <Form.Item
                name="geographicFocus"
                label="Geographic Focus"
              >
                <Input 
                  placeholder="e.g., North America, Global, Local"
                />
              </Form.Item>
            </Card>

            {/* Services & Products Card */}
            <Card
              title={
                <span style={{ color: theme === 'dark' ? '#f9fafb' : '#1a1a1a' }}>
                  <RocketOutlined style={{ marginRight: 8 }} />
                  Services & Products
                </span>
              }
              style={{ ...cardStyle, marginTop: 24 }}
            >
              <Form.Item
                name="services"
                label="Services Provided"
              >
                <Checkbox.Group
                  value={selectedServices}
                  onChange={setSelectedServices}
                  style={checkboxGroupStyle}
                >
                  {serviceOptions.map(service => (
                    <Checkbox 
                      key={service} 
                      value={service}
                      style={checkboxStyle}
                    >
                      {service}
                    </Checkbox>
                  ))}
                </Checkbox.Group>
              </Form.Item>

              <Divider />

              <Form.Item
                name="products"
                label="Product Types"
              >
                <Checkbox.Group
                  value={selectedProducts}
                  onChange={setSelectedProducts}
                  style={checkboxGroupStyle}
                >
                  {productOptions.map(product => (
                    <Checkbox 
                      key={product} 
                      value={product}
                      style={checkboxStyle}
                    >
                      {product}
                    </Checkbox>
                  ))}
                </Checkbox.Group>
              </Form.Item>
            </Card>

            {/* Marketing & Sales Card */}
<Collapse
  defaultActiveKey={['1']} // Set to ['1'] to make it open by default, or [] to make it collapsed by default
  style={{ ...cardStyle, marginTop: 24 }}
  expandIconPosition="right"
>
  <Panel
    header={
      <span style={{ color: theme === 'dark' ? '#f9fafb' : '#1a1a1a' }}>
        <UserOutlined style={{ marginRight: 8 }} />
        Marketing & Sales
      </span>
    }
    key="1"
    style={{ backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff' }}
  >
    <Form.Item
      name="marketingChannels"
      label="Marketing Channels"
    >
      <Checkbox.Group
        value={selectedMarketingChannels}
        onChange={setSelectedMarketingChannels}
        style={checkboxGroupStyle}
      >
        {marketingChannelOptions.map(channel => (
          <Checkbox 
            key={channel} 
            value={channel}
            style={checkboxStyle}
          >
            {channel}
          </Checkbox>
        ))}
      </Checkbox.Group>
    </Form.Item>

    <Form.Item
      name="conversionRate"
      label="Conversion Rate"
      style={{ marginTop: 16 }}
    >
      <Input 
        placeholder="e.g., 2.5%, 5%"
      />
    </Form.Item>
  </Panel>
</Collapse>
          </Col>
        </Row>

        {/* Action Buttons */}
        <Card style={{ ...cardStyle, marginTop: 24 }}>
          <Space>
            <Button 
              onClick={() => router.back()}
              size="large"
            >
              Cancel
            </Button>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              icon={<SaveOutlined />}
              size="large"
            >
              Create Client
            </Button>
          </Space>
        </Card>
      </Form>
    </div>
  );
};

export default NewClientPage;