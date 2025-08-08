"use client";

import React, { useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  RocketOutlined,
  UserOutlined,
  TeamOutlined,
  BulbOutlined,
  ThunderboltOutlined,
  FundOutlined,
  PieChartOutlined,
  BarChartOutlined,
  AreaChartOutlined,
  FileTextOutlined,
  CrownOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  DownloadOutlined,
  ShareAltOutlined,
  EditOutlined,
  StarOutlined,
  
} from '@ant-design/icons';
import {
  Button,
  Card,
  Form,
  Input,
  Select,
  Typography,
  Divider,
  Space,
  Tag,
  Alert,
  Collapse,
  Tabs,
  Timeline,
  Progress,
  Avatar,
  Badge,
  Popover,
  Switch,
  message,
  Radio,
  InputNumber,
  List
} from 'antd';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { Panel } = Collapse;
const { TabPane } = Tabs;

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const GrowthPlanCreator = () => {
  const [form] = Form.useForm();
  const [planGenerated, setPlanGenerated] = useState(false);
  const [activeTab, setActiveTab] = useState('strategy');
  const [timeframe, setTimeframe] = useState('6m');
  const [currentStage, setCurrentStage] = useState(0);
  const [showSimulation, setShowSimulation] = useState(false);

  // Mock data for visualizations
  const growthData = [
    { name: 'Month 1', leads: 100, revenue: 5000, customers: 5 },
    { name: 'Month 2', leads: 180, revenue: 12000, customers: 12 },
    { name: 'Month 3', leads: 300, revenue: 25000, customers: 25 },
    { name: 'Month 4', leads: 500, revenue: 45000, customers: 45 },
    { name: 'Month 5', leads: 750, revenue: 70000, customers: 70 },
    { name: 'Month 6', leads: 1100, revenue: 100000, customers: 100 }
  ];

  const channelData = [
    { name: 'Organic', value: 35 },
    { name: 'Paid Ads', value: 25 },
    { name: 'Email', value: 20 },
    { name: 'Referrals', value: 15 },
    { name: 'Partnerships', value: 5 }
  ];

  const kpiData = [
    { name: 'CAC', current: 150, target: 80 },
    { name: 'LTV', current: 800, target: 2500 },
    { name: 'CR', current: 2.5, target: 5 },
    { name: 'Retention', current: 60, target: 85 }
  ];

  const strategyStages = [
    {
      title: 'Foundation',
      tasks: ['Audit current systems', 'Define core metrics', 'Build conversion infrastructure'],
      duration: '1-2 weeks'
    },
    {
      title: 'Traffic Growth',
      tasks: ['Launch SEO campaign', 'Test 3 ad channels', 'Build referral program'],
      duration: '1-3 months'
    },
    {
      title: 'Conversion Optimization',
      tasks: ['A/B test landing pages', 'Implement email sequences', 'Refine sales process'],
      duration: '1-2 months'
    },
    {
      title: 'Scaling',
      tasks: ['Double ad spend', 'Expand to new channels', 'Hire support team'],
      duration: '3-6 months'
    }
  ];

  const onFinish = (values: any) => {
    // Simulate AI processing
    setTimeout(() => {
      setPlanGenerated(true);
      message.success('Growth plan generated successfully!');
    }, 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <Title level={2} className="flex items-center justify-center">
          <RocketOutlined className="mr-2 text-purple-600" />
          <span className=" bg-clip-text ">
            AI Growth Plan Creator
          </span>
        </Title>
        <Text type="secondary" className="text-lg">
          Build your customized, data-driven growth roadmap
        </Text>
      </div>

      {!planGenerated ? (
        <Card className="mb-6">
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Title level={4} className="flex items-center mb-4">
                  <UserOutlined className="mr-2" />
                  Your Information
                </Title>
                
                <Form.Item
                  name="email"
                  label="Email"
                  rules={[{ required: true }]}
                  initialValue="jake@marinmedia.me"
                >
                  <Input prefix={<UserOutlined />} />
                </Form.Item>
                
                <Form.Item
                  name="name"
                  label="Your Name"
                  rules={[{ required: true }]}
                  initialValue="Jake"
                >
                  <Input />
                </Form.Item>
                
                <Form.Item
                  name="company"
                  label="Company"
                  rules={[{ required: true }]}
                  initialValue="Growth Partner Inc."
                >
                  <Input />
                </Form.Item>
              </div>
              
              <div>
                <Title level={4} className="flex items-center mb-4">
                  <TeamOutlined className="mr-2" />
                  Client/Prospect Information
                </Title>
                
                <Form.Item
                  name="clientCompany"
                  label="Company Name"
                  rules={[{ required: true }]}
                  initialValue="Acme Corp"
                >
                  <Input />
                </Form.Item>
                
                <Form.Item
                  name="industry"
                  label="Industry"
                  rules={[{ required: true }]}
                  initialValue="SaaS"
                >
                  <Input />
                </Form.Item>
                
                <Form.Item
                  name="contactName"
                  label="Contact Name"
                  rules={[{ required: true }]}
                  initialValue="Jane Smith"
                >
                  <Input />
                </Form.Item>
                
                <Form.Item
                  name="contactRole"
                  label="Contact Role"
                  rules={[{ required: true }]}
                  initialValue="CEO"
                >
                  <Input />
                </Form.Item>
              </div>
            </div>
            
            <Divider />
            
            <Title level={4} className="flex items-center mb-4">
              <BulbOutlined className="mr-2" />
              Discovery & Expertise
            </Title>
            
            <Form.Item
              name="transcript"
              label="Discovery Call Transcript"
              tooltip="Paste the transcript for AI-powered insights"
            >
              <TextArea rows={6} placeholder="Paste the conversation from your discovery call..." />
            </Form.Item>
            
            <Form.Item
              name="expertise"
              label="Your Core Skills/Services"
              rules={[{ required: true }]}
            >
              <Select
                mode="tags"
                style={{ width: '100%' }}
                placeholder="e.g., SEO, PPC, Cold Email, Sales Funnels"
              />
            </Form.Item>
            
            <Form.Item
              name="experience"
              label="Your Experience & Achievements"
              rules={[{ required: true }]}
            >
              <TextArea rows={3} placeholder="Describe your relevant experience, years in business, notable results..." />
            </Form.Item>
            
            <Divider />
            
            <Title level={4} className="flex items-center mb-4">
              <TrophyOutlined className="mr-2" />
              Case Studies (Optional)
            </Title>
            
            <Form.List name="caseStudies">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                      <Form.Item
                        {...restField}
                        name={[name, 'client']}
                        label="Client"
                      >
                        <Input placeholder="Client Name" />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, 'result']}
                        label="Result"
                      >
                        <Input placeholder="e.g., Increased revenue by 150%" />
                      </Form.Item>
                      <Button onClick={() => remove(name)}>Remove</Button>
                    </Space>
                  ))}
                  <Form.Item>
                    <Button type="dashed" onClick={() => add()} block icon={<StarOutlined />}>
                      Add Case Study
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
            
            <div className="text-center mt-8">
              <Button 
                type="primary" 
                size="large" 
                htmlType="submit"
                icon={<ThunderboltOutlined />}
                className="min-w-48"
              >
                Generate Growth Plan
              </Button>
            </div>
          </Form>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Header with client info */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <div>
                <Title level={3} className="mb-1">Growth Plan for</Title>
                <Title level={2} className="mt-0">{form.getFieldValue('clientCompany')}</Title>
                <div className="flex items-center space-x-4">
                  <Tag icon={<ClockCircleOutlined />} color="blue">
                    {timeframe === '3m' ? '3-Month Plan' : '6-Month Plan'}
                  </Tag>
                  <Tag icon={<FundOutlined />} color="green">
                    {form.getFieldValue('industry')} Industry
                  </Tag>
                </div>
              </div>
              <div className="mt-4 md:mt-0">
                <Space>
                  <Button icon={<DownloadOutlined />}>Export PDF</Button>
                  <Button icon={<ShareAltOutlined />}>Share</Button>
                  <Button icon={<EditOutlined />}>Edit Plan</Button>
                </Space>
              </div>
            </div>
          </Card>
          
          {/* Timeframe selector */}
          <div className="text-center">
            <Radio.Group 
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              buttonStyle="solid"
            >
              <Radio.Button value="3m">3-Month Plan</Radio.Button>
              <Radio.Button value="6m">6-Month Plan</Radio.Button>
              <Radio.Button value="12m">12-Month Plan</Radio.Button>
            </Radio.Group>
          </div>
          
          {/* Interactive tabs */}
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            type="card"
            size="large"
            items={[
              {
                key: 'strategy',
                label: (
                  <span>
                    <FundOutlined />
                    Strategy
                  </span>
                )
              },
              {
                key: 'metrics',
                label: (
                  <span>
                    <BarChartOutlined />
                    Metrics
                  </span>
                )
              },
              {
                key: 'channels',
                label: (
                  <span>
                    <PieChartOutlined />
                    Channels
                  </span>
                )
              },
              {
                key: 'timeline',
                label: (
                  <span>
                    <AreaChartOutlined />
                    Timeline
                  </span>
                )
              }
            ]}
          />
          
          {/* Strategy tab */}
          {activeTab === 'strategy' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <Title level={4} className="flex items-center mb-4">
                  <ThunderboltOutlined className="mr-2" />
                  Growth Projection
                </Title>
                
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={growthData}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stackId="1"
                        stroke="#8884d8"
                        fill="#8884d8"
                      />
                      <Area
                        type="monotone"
                        dataKey="leads"
                        stackId="2"
                        stroke="#82ca9d"
                        fill="#82ca9d"
                      />
                      <Area
                        type="monotone"
                        dataKey="customers"
                        stackId="3"
                        stroke="#ffc658"
                        fill="#ffc658"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="mt-6">
                  <Title level={5}>Growth Levers</Title>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    {[
                      { title: 'Acquisition', value: '35%', color: '#0088FE' },
                      { title: 'Activation', value: '25%', color: '#00C49F' },
                      { title: 'Retention', value: '40%', color: '#FFBB28' }
                    ].map((item, index) => (
                      <Card key={index} bordered={false}>
                        <div className="flex items-center">
                          <div
                            className="w-4 h-4 rounded-full mr-2"
                            style={{ backgroundColor: item.color }}
                          />
                          <Text strong>{item.title}</Text>
                        </div>
                        <Title level={3} className="mt-2 mb-0">
                          {item.value}
                        </Title>
                        <Text type="secondary">Potential Impact</Text>
                      </Card>
                    ))}
                  </div>
                </div>
              </Card>
              
              <Card>
                <Title level={4} className="flex items-center mb-4">
                  <CrownOutlined className="mr-2" />
                  Strategic Focus Areas
                </Title>
                
                <Timeline mode="left">
                  {strategyStages.map((stage, index) => (
                    <Timeline.Item
                      key={index}
                      label={
                        <Tag color={index === currentStage ? 'blue' : 'default'}>
                          {stage.duration}
                        </Tag>
                      }
                      dot={
                        <div
                          onClick={() => setCurrentStage(index)}
                          className="cursor-pointer"
                        >
                          {index === currentStage ? (
                            <CheckCircleOutlined style={{ fontSize: '16px', color: '#52c41a' }} />
                          ) : (
                            <div className="w-4 h-4 rounded-full bg-gray-300" />
                          )}
                        </div>
                      }
                    >
                      <Title level={5} className="mt-0">
                        {stage.title}
                      </Title>
                      <ul className="list-disc pl-5">
                        {stage.tasks.map((task, i) => (
                          <li key={i}>{task}</li>
                        ))}
                      </ul>
                    </Timeline.Item>
                  ))}
                </Timeline>
                
                <div className="mt-6">
                  <Title level={5}>Current Stage Progress</Title>
                  <Progress
                    percent={currentStage * 25 + 15}
                    status="active"
                    strokeColor={{
                      '0%': '#108ee9',
                      '100%': '#87d068'
                    }}
                  />
                </div>
              </Card>
            </div>
          )}
          
          {/* Metrics tab */}
          {activeTab === 'metrics' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <Title level={4} className="flex items-center mb-4">
                  <BarChartOutlined className="mr-2" />
                  KPI Targets
                </Title>
                
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={kpiData}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="current" fill="#8884d8" name="Current" />
                      <Bar dataKey="target" fill="#82ca9d" name="Target" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
              
              <Card>
                <Title level={4} className="flex items-center mb-4">
                  <StarOutlined className="mr-2" />
                  Performance Simulation
                </Title>
                
                <div className="flex justify-between items-center mb-4">
                  <Text>Show Revenue Simulation</Text>
                  <Switch
                    checked={showSimulation}
                    onChange={setShowSimulation}
                  />
                </div>
                
                {showSimulation ? (
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={growthData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="revenue"
                          stroke="#8884d8"
                          activeDot={{ r: 8 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-72 flex items-center justify-center bg-gray-50 rounded-lg">
                    <Text type="secondary">Enable simulation to view projections</Text>
                  </div>
                )}
                
                <div className="mt-4 grid grid-cols-3 gap-4">
                  <div>
                    <Text strong>Current MRR</Text>
                    <Title level={4}>$5,000</Title>
                  </div>
                  <div>
                    <Text strong>Projected MRR</Text>
                    <Title level={4}>$45,000</Title>
                  </div>
                  <div>
                    <Text strong>Growth Rate</Text>
                    <Title level={4}>800%</Title>
                  </div>
                </div>
              </Card>
            </div>
          )}
          
          {/* Channels tab */}
          {activeTab === 'channels' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <Title level={4} className="flex items-center mb-4">
                  <PieChartOutlined className="mr-2" />
                  Channel Mix
                </Title>
                
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={channelData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {channelData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>
              
              <Card>
                <Title level={4} className="flex items-center mb-4">
                  <SyncOutlined className="mr-2" />
                  Channel Testing Roadmap
                </Title>
                
                <List
                  itemLayout="horizontal"
                  dataSource={[
                    { channel: 'Google Ads', status: 'active', budget: '$2k/mo' },
                    { channel: 'LinkedIn Ads', status: 'planned', budget: '$1.5k/mo' },
                    { channel: 'Content Marketing', status: 'active', budget: '$3k/mo' },
                    { channel: 'Email Outreach', status: 'testing', budget: '$500/mo' },
                    { channel: 'Referral Program', status: 'planned', budget: '$1k/mo' }
                  ]}
                  renderItem={(item) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={
                          <Avatar
                            style={{
                              backgroundColor:
                                item.status === 'active'
                                  ? '#52c41a'
                                  : item.status === 'testing'
                                  ? '#faad14'
                                  : '#f0f0f0',
                              color:
                                item.status === 'planned' ? '#8c8c8c' : '#fff'
                            }}
                          >
                            {item.status === 'active' ? (
                              <CheckCircleOutlined />
                            ) : item.status === 'testing' ? (
                              <SyncOutlined spin />
                            ) : (
                              <ClockCircleOutlined />
                            )}
                          </Avatar>
                        }
                        title={<a>{item.channel}</a>}
                        description={
                          <>
                            <Text type="secondary">{item.budget}</Text>
                            <Tag
                              color={
                                item.status === 'active'
                                  ? 'green'
                                  : item.status === 'testing'
                                  ? 'orange'
                                  : 'default'
                              }
                              className="ml-2"
                            >
                              {item.status}
                            </Tag>
                          </>
                        }
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </div>
          )}
          
          {/* Timeline tab */}
          {activeTab === 'timeline' && (
            <Card>
              <Title level={4} className="flex items-center mb-4">
                <AreaChartOutlined className="mr-2" />
                Implementation Timeline
              </Title>
              
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={growthData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                    <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="leads" fill="#8884d8" />
                    <Bar yAxisId="right" dataKey="customers" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { month: 'Month 1', focus: 'Foundation Setup' },
                  { month: 'Month 2', focus: 'Traffic Growth' },
                  { month: 'Month 3', focus: 'Conversion Optimization' },
                  { month: 'Month 4+', focus: 'Scaling' }
                ].map((item, index) => (
                  <Card key={index} hoverable>
                    <Text strong className="block">
                      {item.month}
                    </Text>
                    <Text type="secondary">{item.focus}</Text>
                    <Progress
                      percent={(index + 1) * 25}
                      showInfo={false}
                      strokeColor={COLORS[index % COLORS.length]}
                    />
                  </Card>
                ))}
              </div>
            </Card>
          )}
          
          <div className="text-center">
            <Button type="primary" size="large" icon={<DownloadOutlined />}>
              Download Full Growth Plan
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GrowthPlanCreator;