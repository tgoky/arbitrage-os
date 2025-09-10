// app/lead-generation/page.tsx
"use client";
import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Tabs,
  message,
  Typography,
  Space,
  Tag,
  Table,
  Input,
  Select,
  Avatar,
  Statistic,
  Row,
  Col,
  Progress,
  Empty,
  Spin
} from 'antd';
import {
  PlusOutlined,
  ThunderboltOutlined,
  TeamOutlined,
  HistoryOutlined,
  SearchOutlined,
  DownloadOutlined,
  MailOutlined,
  PhoneOutlined,
  LinkedinOutlined,
  StarOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useTheme } from '../../providers/ThemeProvider';
import { useWorkspaceContext } from '../hooks/useWorkspaceContext';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  title: string;
  company: string;
  industry: string;
  location: string;
  score: number;
  linkedinUrl?: string;
  website?: string;
  apolloId?: string;
}

interface LeadGeneration {
  id: string;
  title: string;
  leadCount: number;
  totalFound: number;
  averageScore: number;
  criteria: any;
  generatedAt: string;
  createdAt: string;
  workspace: {
    id: string;
    name: string;
  };
}

const LeadGenerationPage = () => {
  const { theme } = useTheme();
  const router = useRouter();
  const { currentWorkspace, getWorkspaceScopedEndpoint } = useWorkspaceContext();
  
  // State
  const [activeTab, setActiveTab] = useState('leads');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [generations, setGenerations] = useState<LeadGeneration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('All');
  const [selectedScore, setSelectedScore] = useState('All');
  
  // Load data on component mount
  useEffect(() => {
    if (currentWorkspace?.id) {
      loadData();
    }
  }, [currentWorkspace?.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load lead generations
      const endpoint = getWorkspaceScopedEndpoint('/api/lead-generation');
      const response = await fetch(endpoint);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setGenerations(data.data);
          
          // Extract all leads from generations
          const allLeads: Lead[] = [];
          for (const gen of data.data) {
            try {
              // Load full generation details to get leads
              const detailResponse = await fetch(`/api/lead-generation/${gen.id}`);
              if (detailResponse.ok) {
                const detailData = await detailResponse.json();
                if (detailData.success && detailData.data.leads) {
                  allLeads.push(...detailData.data.leads);
                }
              }
            } catch (error) {
              console.warn('Failed to load details for generation:', gen.id);
            }
          }
          setLeads(allLeads);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      message.error('Failed to load lead data');
    } finally {
      setLoading(false);
    }
  };

  // Filter leads based on search and filters
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = !searchTerm || 
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesIndustry = selectedIndustry === 'All' || lead.industry === selectedIndustry;
    
    const matchesScore = selectedScore === 'All' || 
      (selectedScore === 'High' && lead.score >= 80) ||
      (selectedScore === 'Medium' && lead.score >= 60 && lead.score < 80) ||
      (selectedScore === 'Low' && lead.score < 60);
    
    return matchesSearch && matchesIndustry && matchesScore;
  });

  // Get unique industries for filter
  const industries = ['All', ...Array.from(new Set(leads.map(lead => lead.industry)))];

  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return '#52c41a';
    if (score >= 60) return '#faad14';
    return '#ff4d4f';
  };

  // Lead table columns
  const leadColumns: ColumnsType<Lead> = [
    {
      title: 'Contact',
      key: 'contact',
      render: (_, record) => (
        <div className="flex items-center space-x-3">
          <Avatar 
            src={`https://i.pravatar.cc/40?u=${record.id}`}
            size={40}
          />
          <div>
            <div className="font-medium">{record.name}</div>
            <div className="text-sm text-gray-500">{record.title}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Company',
      key: 'company',
      render: (_, record) => (
        <div>
          <div className="font-medium">{record.company}</div>
          <div className="text-sm text-gray-500">{record.industry}</div>
        </div>
      ),
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: 'Contact Info',
      key: 'contactInfo',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          {record.email && (
            <div className="flex items-center text-sm">
              <MailOutlined className="mr-1" />
              <span>{record.email}</span>
            </div>
          )}
          {record.phone && (
            <div className="flex items-center text-sm">
              <PhoneOutlined className="mr-1" />
              <span>{record.phone}</span>
            </div>
          )}
          {record.linkedinUrl && (
            <div className="flex items-center text-sm">
              <LinkedinOutlined className="mr-1" />
              <span>LinkedIn</span>
            </div>
          )}
        </Space>
      ),
    },
    {
      title: 'Score',
      key: 'score',
      render: (_, record) => (
        <div className="flex items-center">
          <StarOutlined style={{ color: getScoreColor(record.score) }} className="mr-1" />
          <span style={{ color: getScoreColor(record.score), fontWeight: 'bold' }}>
            {record.score}
          </span>
        </div>
      ),
      sorter: (a, b) => a.score - b.score,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button size="small">View</Button>
          <Button size="small" type="primary">Contact</Button>
        </Space>
      ),
    },
  ];

  // Generation history columns
  const generationColumns: ColumnsType<LeadGeneration> = [
    {
      title: 'Campaign',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Leads Found',
      dataIndex: 'leadCount',
      key: 'leadCount',
      render: (count, record) => (
        <div>
          <div className="font-medium">{count} leads</div>
          <div className="text-sm text-gray-500">
            {record.totalFound} total found
          </div>
        </div>
      ),
    },
    {
      title: 'Avg Score',
      dataIndex: 'averageScore',
      key: 'averageScore',
      render: (score) => (
        <div className="flex items-center">
          <StarOutlined style={{ color: getScoreColor(score) }} className="mr-1" />
          <span style={{ color: getScoreColor(score), fontWeight: 'bold' }}>
            {Math.round(score)}
          </span>
        </div>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button size="small">View Details</Button>
          <Button size="small" icon={<DownloadOutlined />}>Export</Button>
        </Space>
      ),
    },
  ];

  // Tab items
  const tabItems = [
    {
      key: 'leads',
      label: (
        <span>
          <TeamOutlined />
          All Leads ({filteredLeads.length})
        </span>
      ),
      children: (
        <div>
          {/* Filters */}
          <Card className="mb-6">
            <Row gutter={16} align="middle">
              <Col span={8}>
                <Search
                  placeholder="Search leads..."
                  prefix={<SearchOutlined />}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  allowClear
                />
              </Col>
              <Col span={4}>
                <Select
                  value={selectedIndustry}
                  onChange={setSelectedIndustry}
                  style={{ width: '100%' }}
                >
                  {industries.map(industry => (
                    <Option key={industry} value={industry}>{industry}</Option>
                  ))}
                </Select>
              </Col>
              <Col span={4}>
                <Select
                  value={selectedScore}
                  onChange={setSelectedScore}
                  style={{ width: '100%' }}
                >
                  <Option value="All">All Scores</Option>
                  <Option value="High">High (80+)</Option>
                  <Option value="Medium">Medium (60-79)</Option>
                  <Option value="Low">Low (&lt;60)</Option>
                </Select>
              </Col>
              <Col span={8} className="text-right">
                <Space>
                  <Button icon={<DownloadOutlined />}>Export</Button>
                  <Button icon={<MailOutlined />}>Bulk Email</Button>
                </Space>
              </Col>
            </Row>
          </Card>

          {/* Leads Table */}
          {loading ? (
            <div className="text-center py-12">
              <Spin size="large" />
            </div>
          ) : filteredLeads.length > 0 ? (
            <Table
              columns={leadColumns}
              dataSource={filteredLeads}
              rowKey="id"
              pagination={{
                total: filteredLeads.length,
                pageSize: 20,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => 
                  `${range[0]}-${range[1]} of ${total} leads`,
              }}
            />
          ) : (
            <Empty 
              description="No leads found"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          )}
        </div>
      ),
    },
    {
      key: 'history',
      label: (
        <span>
          <HistoryOutlined />
          Generation History ({generations.length})
        </span>
      ),
      children: (
        <div>
          {loading ? (
            <div className="text-center py-12">
              <Spin size="large" />
            </div>
          ) : generations.length > 0 ? (
            <Table
              columns={generationColumns}
              dataSource={generations}
              rowKey="id"
              pagination={{
                total: generations.length,
                pageSize: 10,
                showSizeChanger: true,
              }}
            />
          ) : (
            <Empty 
              description="No lead generations yet"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => router.push('/lead-generation/create')}
              >
                Generate Your First Leads
              </Button>
            </Empty>
          )}
        </div>
      ),
    },
  ];

  // Calculate stats
  const totalLeads = leads.length;
  const highScoreLeads = leads.filter(lead => lead.score >= 80).length;
  const leadsWithEmail = leads.filter(lead => lead.email).length;
  const leadsWithPhone = leads.filter(lead => lead.phone).length;

  return (
    <div style={{
      backgroundColor: theme === 'dark' ? '#000000' : '#ffffff',
      padding: 24,
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <Space align="center">
            <ThunderboltOutlined className="text-xl text-blue-500" />
            <Title level={2} className="mb-0">
              Lead Generation
            </Title>
          </Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => router.push('/lead-generation/create')}
            size="large"
          >
            Generate New Leads
          </Button>
        </div>
        
        <Text type="secondary">
          Manage and view your generated leads from Apollo  database
        </Text>
      </div>

      {/* Stats Cards */}
      <Row gutter={24} className="mb-6">
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Leads"
              value={totalLeads}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="High Quality"
              value={highScoreLeads}
              suffix={`/ ${totalLeads}`}
              prefix={<StarOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
            <Progress 
              percent={totalLeads > 0 ? Math.round((highScoreLeads / totalLeads) * 100) : 0} 
              size="small" 
              showInfo={false}
              strokeColor="#52c41a"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="With Email"
              value={leadsWithEmail}
              suffix={`/ ${totalLeads}`}
              prefix={<MailOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
            <Progress 
              percent={totalLeads > 0 ? Math.round((leadsWithEmail / totalLeads) * 100) : 0} 
              size="small" 
              showInfo={false}
              strokeColor="#1890ff"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="With Phone"
              value={leadsWithPhone}
              suffix={`/ ${totalLeads}`}
              prefix={<PhoneOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
            <Progress 
              percent={totalLeads > 0 ? Math.round((leadsWithPhone / totalLeads) * 100) : 0} 
              size="small" 
              showInfo={false}
              strokeColor="#722ed1"
            />
          </Card>
        </Col>
      </Row>

      {/* Main Content */}
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          size="large"
        />
      </Card>
    </div>
  );
};

export default LeadGenerationPage;