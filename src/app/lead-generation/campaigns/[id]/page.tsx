"use client";
import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Typography,
  Space,
  Tag,
  Statistic,
  Descriptions,
  Row,
  Col,
  List,
  Avatar,
  Table,
  Spin,
  Alert,
  Divider,
  Breadcrumb
} from 'antd';
import {
  TeamOutlined,
  StarOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  DownloadOutlined,
  ArrowLeftOutlined,
  MailOutlined,
  PhoneOutlined,
  LinkedinOutlined,
  HomeOutlined
} from '@ant-design/icons';
import { useParams, useRouter } from 'next/navigation';
import { useTheme } from '../../../../providers/ThemeProvider';
import { useWorkspaceContext } from '../../../hooks/useWorkspaceContext';

const { Title, Text } = Typography;

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
}

interface Campaign {
  id: string;
  title: string;
  totalLeads: number;
  averageScore: number;
  generationTime: number;
  createdAt: string;
  criteria: any;
  leads: Lead[];
}

const CampaignDetailPage = () => {
  const { theme } = useTheme();
  const router = useRouter();
  const params = useParams();
  const { getWorkspaceScopedEndpoint } = useWorkspaceContext();
  
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const campaignId = params.id as string;

  useEffect(() => {
    if (campaignId) {
      loadCampaignDetails();
    }
  }, [campaignId]);

  const loadCampaignDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const endpoint = getWorkspaceScopedEndpoint(`/api/lead-generation/${campaignId}`);
      const response = await fetch(endpoint);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCampaign({
            id: campaignId,
            title: data.data.metadata?.title || 'Untitled Campaign',
            totalLeads: data.data.leads?.length || 0,
            averageScore: data.data.metadata?.averageScore || 0,
            generationTime: data.data.metadata?.generationTime || 0,
            createdAt: data.data.metadata?.createdAt || new Date().toISOString(),
            criteria: data.data.metadata?.criteria || {},
            leads: data.data.leads || []
          });
        } else {
          throw new Error(data.error || 'Failed to load campaign details');
        }
      } else {
        throw new Error(`Server error: ${response.status}`);
      }
    } catch (error) {
      console.error('Error loading campaign details:', error);
      setError(error instanceof Error ? error.message : 'Failed to load campaign details');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCampaign = () => {
    if (!campaign) return;

    try {
      // Convert leads to CSV format
      const csvHeaders = ['Name', 'Email', 'Phone', 'Title', 'Company', 'Industry', 'Location', 'Score', 'LinkedIn'];
      const csvRows = campaign.leads.map((lead: Lead) => [
        lead.name,
        lead.email || '',
        lead.phone || '',
        lead.title,
        lead.company,
        lead.industry,
        lead.location,
        lead.score.toString(),
        lead.linkedinUrl || ''
      ]);
      
      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(field => `"${field}"`).join(','))
      ].join('\n');
      
      // Download CSV file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${campaign.title.replace(/[^a-z0-9]/gi, '_')}_leads.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting campaign:', error);
    }
  };

  const handleViewLead = (lead: Lead) => {
    router.push(`/lead-generation/leads/${lead.id}`);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#52c41a';
    if (score >= 60) return '#faad14';
    return '#ff4d4f';
  };

const leadColumns = [
  {
    title: 'Contact',
    key: 'contact',
    render: (_: unknown, record: Lead) => (
      <div className="flex items-center space-x-3">
        <Avatar src={`https://i.pravatar.cc/40?u=${record.id}`} size={40} />
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
    render: (_: unknown, record: Lead) => (
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
    render: (_: unknown, record: Lead) => (
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
    render: (_: unknown, record: Lead) => (
      <div className="flex items-center">
        <StarOutlined style={{ color: getScoreColor(record.score) }} className="mr-1" />
        <span style={{ color: getScoreColor(record.score), fontWeight: 'bold' }}>
          {record.score}
        </span>
      </div>
    ),
  },
  {
    title: 'Actions',
    key: 'actions',
    render: (_: unknown, record: Lead) => (
      <Button size="small" onClick={() => handleViewLead(record)}>
        View Details
      </Button>
    ),
  },
];

  if (loading) {
    return (
      <div style={{ backgroundColor: theme === 'dark' ? '#000000' : '#ffffff', padding: 24, minHeight: '100vh' }}>
        <div className="text-center py-12">
          <Spin size="large" />
          <div className="mt-4">Loading campaign details...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ backgroundColor: theme === 'dark' ? '#000000' : '#ffffff', padding: 24, minHeight: '100vh' }}>
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          action={
            <Button size="small" onClick={() => router.push('/lead-generation')}>
              Back to Lead Generation
            </Button>
          }
        />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div style={{ backgroundColor: theme === 'dark' ? '#000000' : '#ffffff', padding: 24, minHeight: '100vh' }}>
        <Alert
          message="Campaign Not Found"
          description="The requested campaign could not be found."
          type="warning"
          showIcon
          action={
            <Button size="small" onClick={() => router.push('/lead-generation')}>
              Back to Lead Generation
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: theme === 'dark' ? '#000000' : '#ffffff', padding: 24, minHeight: '100vh' }}>
      {/* Breadcrumb */}
      <Breadcrumb className="mb-6">
        <Breadcrumb.Item onClick={() => router.push('/lead-generation')} className="cursor-pointer">
          <HomeOutlined /> Lead Generation
        </Breadcrumb.Item>
        <Breadcrumb.Item>Campaign Details</Breadcrumb.Item>
        <Breadcrumb.Item>{campaign.title}</Breadcrumb.Item>
      </Breadcrumb>

      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => router.push('/lead-generation')}
            className="mb-4"
          >
            Back to Campaigns
          </Button>
          <Title level={2}>{campaign.title}</Title>
          <Text type="secondary">
            Generated on {new Date(campaign.createdAt).toLocaleDateString()}
          </Text>
        </div>
        <Button 
          type="primary" 
          icon={<DownloadOutlined />}
          onClick={handleExportCampaign}
          size="large"
        >
          Export All Leads
        </Button>
      </div>

      {/* Campaign Summary */}
      <Row gutter={16} className="mb-6">
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Leads"
              value={campaign.totalLeads}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Average Score"
              value={Math.round(campaign.averageScore)}
              suffix="/100"
              prefix={<StarOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Generation Time"
              value={campaign.generationTime}
              suffix="ms"
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Created"
              value={new Date(campaign.createdAt).toLocaleDateString()}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Search Criteria */}
      <Card title="Search Criteria" className="mb-6">
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="Industries" span={2}>
            {campaign.criteria?.targetIndustry?.join(', ') || 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Job Titles" span={2}>
            {campaign.criteria?.targetRole?.join(', ') || 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Locations">
            {campaign.criteria?.location?.join(', ') || 'Any'}
          </Descriptions.Item>
          <Descriptions.Item label="Company Size">
            {campaign.criteria?.companySize?.join(', ') || 'Any'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Divider />

      {/* Leads List */}
      <Card
        title={`Leads (${campaign.leads.length})`}
        extra={
          <Text type="secondary">
            Showing all {campaign.leads.length} leads
          </Text>
        }
      >
        <Table
          columns={leadColumns}
          dataSource={campaign.leads}
          rowKey="id"
          pagination={{
            total: campaign.leads.length,
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} leads`,
          }}
        />
      </Card>
    </div>
  );
};

export default CampaignDetailPage;