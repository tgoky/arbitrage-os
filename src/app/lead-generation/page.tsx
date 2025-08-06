// app/lead-generation/page.tsx
"use client";
import React, { useState } from 'react';
import {
  SearchOutlined,
  StarOutlined,
  DollarOutlined,
  FilterOutlined,
  UserOutlined,
  TeamOutlined,
  BuildOutlined,
  MailOutlined,
  PhoneOutlined,
  LinkedinOutlined,
  GlobalOutlined,
  PlusOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  CreditCardOutlined,
  BarChartOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import {
  Card,
  Input,
  Select,
  Button,
  Typography,
  Space,
  Tag,
  Divider,
  Empty,
  Row,
  Col,
  Table,
  Avatar,
  Badge,
  Tabs,
  Modal,
  Form,
  Checkbox,
  Progress,
  Image
} from 'antd';
import { useTheme } from '../../providers/ThemeProvider';
import { Lead, LeadCampaign, initialCampaigns, initialLeads } from './leads/leads';
import { getItems } from './leads/components'; // Updated import

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { Search } = Input;

const LeadGenerationDashboard = () => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<'campaigns' | 'leads' | 'credits'>('campaigns');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isCreditsModalVisible, setIsCreditsModalVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('All');
  const [selectedCompanySize, setSelectedCompanySize] = useState<string>('All');
  const [credits, setCredits] = useState(1000);
  const [campaigns, setCampaigns] = useState<LeadCampaign[]>(initialCampaigns);
  const [leads, setLeads] = useState<Lead[]>(initialLeads);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'success';
      case 'paused': return 'warning';
      case 'completed': return 'processing';
      case 'draft': return 'default';
      case 'new': return 'default';
      case 'contacted': return 'processing';
      case 'qualified': return 'success';
      case 'converted': return 'purple';
      default: return 'default';
    }
  };

  const handleStartCampaign = (campaignId: string) => {
    setCampaigns(campaigns.map(c => 
      c.id === campaignId ? { ...c, status: 'running' } : c
    ));
  };

  const handlePauseCampaign = (campaignId: string) => {
    setCampaigns(campaigns.map(c => 
      c.id === campaignId ? { ...c, status: 'paused' } : c
    ));
  };

  const handleStopCampaign = (campaignId: string) => {
    setCampaigns(campaigns.map(c => 
      c.id === campaignId ? { ...c, status: 'completed' } : c
    ));
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.industry.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'All' || lead.status === selectedStatus;
    const matchesIndustry = selectedIndustry === 'All' || lead.industry === selectedIndustry;
    const matchesCompanySize = selectedCompanySize === 'All' || lead.companySize === selectedCompanySize;
    return matchesSearch && matchesStatus && matchesIndustry && matchesCompanySize;
  });

  const items = getItems({
    campaigns,
    leads,
    handleStartCampaign,
    handlePauseCampaign,
    handleStopCampaign,
    getStatusColor,
    credits,
    setIsModalVisible,
    setIsCreditsModalVisible,
    searchTerm,
    setSearchTerm,
    selectedStatus,
    setSelectedStatus,
    selectedIndustry,
    setSelectedIndustry,
    selectedCompanySize,
    setSelectedCompanySize,
    filteredLeads,
  });

  return (
    <div style={{
      backgroundColor: theme === 'dark' ? '#000000' : '#ffffff',
      padding: 24,
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
       <div>
  <Space align="center">
    <ThunderboltOutlined className="text-xl text-purple-500" />
    <Title level={2} className="mb-0">
      Lead Generation
    </Title>
  </Space>

  <div>
    <Text type="secondary">
      Find and qualify leads for your business
    </Text>
  </div>
</div>

        <Space>
          <Badge
            count={credits.toLocaleString()}
            showZero
            color="#52c41a"
            overflowCount={999999}
            style={{ backgroundColor: '#52c41a' }}
          >
            <Button
              icon={<CreditCardOutlined />}
              onClick={() => setIsCreditsModalVisible(true)}
            >
              Credits
            </Button>
          </Badge>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsModalVisible(true)}
          >
            New Campaign
          </Button>
        </Space>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as any)}
        items={items}
      />

      {/* New Campaign Modal */}
      <Modal
        title="Create New Campaign"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={800}
      >
        <Form layout="vertical">
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="Campaign Name" required>
                <Input placeholder="e.g., SaaS Sales Campaign" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Business Profile" required>
                <Select placeholder="Select a business">
                  <Option value="1">TechFlow Solutions</Option>
                  <Option value="2">Digital Growth Co</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="Target Industry" required>
                <Input placeholder="e.g., Technology" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Target Role" required>
                <Input placeholder="e.g., VP of Sales" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="Company Size" required>
                <Select placeholder="Select size">
                  <Option value="1-10">1-10 employees</Option>
                  <Option value="10-50">10-50 employees</Option>
                  <Option value="50-200">50-200 employees</Option>
                  <Option value="200-500">200-500 employees</Option>
                  <Option value="500+">500+ employees</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Target Location" required>
                <Input placeholder="e.g., United States" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Keywords (comma-separated)">
            <Input placeholder="e.g., SaaS, sales automation, CRM" />
          </Form.Item>
          <Form.Item label="Filters">
            <Checkbox defaultChecked>Must have email</Checkbox>
            <Checkbox style={{ marginLeft: 16 }}>Must have phone</Checkbox>
            <Checkbox defaultChecked style={{ marginLeft: 16 }}>
              Must have LinkedIn
            </Checkbox>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button onClick={() => setIsModalVisible(false)}>Cancel</Button>
              <Button type="primary">Create Campaign</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Buy Credits Modal */}
      <Modal
        title="Buy Credits"
        open={isCreditsModalVisible}
        onCancel={() => setIsCreditsModalVisible(false)}
        footer={null}
      >
        <div className="space-y-6">
          <Row gutter={[16, 16]}>
            <Col span={8}>
              <Card hoverable className="text-center">
                <Title level={4}>1,000</Title>
                <Text type="secondary">Credits</Text>
                <Divider />
                <Title level={3}>$99</Title>
                <Text type="secondary">$0.099 per credit</Text>
              </Card>
            </Col>
            <Col span={8}>
              <Card hoverable className="text-center border-2 border-blue-500">
                <Tag color="blue" className="mb-2">
                  MOST POPULAR
                </Tag>
                <Title level={4}>5,000</Title>
                <Text type="secondary">Credits</Text>
                <Divider />
                <Title level={3}>$299</Title>
                <Text type="secondary">$0.059 per credit</Text>
              </Card>
            </Col>
            <Col span={8}>
              <Card hoverable className="text-center">
                <Title level={4}>15,000</Title>
                <Text type="secondary">Credits</Text>
                <Divider />
                <Title level={3}>$799</Title>
                <Text type="secondary">$0.053 per credit</Text>
              </Card>
            </Col>
          </Row>
          <Form.Item label="Custom Amount">
            <Input placeholder="Enter custom credit amount" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button onClick={() => setIsCreditsModalVisible(false)}>
                Cancel
              </Button>
              <Button type="primary" icon={<CreditCardOutlined />}>
                Purchase Credits
              </Button>
            </Space>
          </Form.Item>
        </div>
      </Modal>
    </div>
  );
};

export default LeadGenerationDashboard;