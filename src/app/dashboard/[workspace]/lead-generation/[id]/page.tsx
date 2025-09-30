// app/lead-generation/[id]/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { 
  TeamOutlined, 
  ArrowLeftOutlined, 
  DownloadOutlined, 
  CopyOutlined,
  MailOutlined,
  PhoneOutlined,
  LinkedinOutlined,
  GlobalOutlined,
  EnvironmentOutlined,
  BankOutlined,
  UserOutlined,
  StarOutlined,
  CalendarOutlined,
  TagOutlined,
  ThunderboltOutlined,
  BarChartOutlined,
  EyeOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { 
  Button, 
  Card, 
  Typography, 
  Divider, 
  Space, 
  Tag, 
  Alert, 
  Spin, 
  message,
  Badge,
  Descriptions,
  Collapse,
  List,
  Modal,
  Tooltip,
  Table,
  Avatar,
  Progress,
  Row,
  Col,
  Statistic
} from 'antd';
import { useParams, useRouter } from 'next/navigation';
import { useWorkspaceContext } from '../../../../hooks/useWorkspaceContext';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

interface GeneratedLead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  title: string;
  company: string;
  industry: string;
  companySize?: string;
  location: string;
  linkedinUrl?: string;
  website?: string;
  score: number;
  apolloId?: string;
  metadata?: {
    companyRevenue?: string;
    technologies?: string[];
    employeeCount?: number;
    founded?: string;
    departments?: string[];
    seniority?: string;
    emailStatus?: string;
    countryCode?: string;
    timezone?: string;
    currency?: string;
    sourceIndustry?: string;
    searchStrategy?: string;
  };
}

interface LeadGenerationDetail {
  id: string;
  title: string;
  leads: GeneratedLead[];
  criteria: any;
  createdAt: string;
  updatedAt: string;
  workspaceId: string;
  status: 'completed' | 'processing' | 'failed';
  metadata?: {
    leadCount: number;
    totalFound: number;
    averageScore: number;
    generationTime: number;
    searchStrategy?: string;
    globalCoverage?: {
      countries: string[];
      regions: string[];
      totalLocations: number;
      isGlobal?: boolean;
    };
    qualityMetrics?: {
      emailCount: number;
      phoneCount: number;
      linkedinCount: number;
      avgEmployeeCount: number;
      countriesRepresented: number;
    };
  };
}

const LeadGenerationDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const { currentWorkspace, isWorkspaceReady } = useWorkspaceContext();
  const [loading, setLoading] = useState(true);
  const [leadDetail, setLeadDetail] = useState<LeadGenerationDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedLeadIndex, setSelectedLeadIndex] = useState(0);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  const generationId = params.id as string;

  useEffect(() => {
    if (isWorkspaceReady && currentWorkspace) {
      fetchLeadDetail();
    }
  }, [isWorkspaceReady, currentWorkspace, generationId]);

  const fetchLeadDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/lead-generation/${generationId}?workspaceId=${currentWorkspace?.id}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch lead details: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setLeadDetail(data.data);
      } else {
        throw new Error(data.error || 'Failed to load lead details');
      }
    } catch (err) {
      console.error('Error fetching lead detail:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      message.error('Failed to load lead details');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      message.success('Copied to clipboard!');
    } catch (error) {
      message.error('Failed to copy to clipboard');
    }
  };

  const copyLeadInfo = (lead: GeneratedLead) => {
    const info = `
Name: ${lead.name}
Title: ${lead.title}
Company: ${lead.company}
Industry: ${lead.industry}
Location: ${lead.location}
Email: ${lead.email || 'Not available'}
Phone: ${lead.phone || 'Not available'}
LinkedIn: ${lead.linkedinUrl || 'Not available'}
Website: ${lead.website || 'Not available'}
Score: ${lead.score}/100
    `.trim();
    
    copyToClipboard(info);
  };

  const exportLeads = async (format: 'csv' | 'json' = 'csv') => {
    if (!leadDetail) return;
    
    try {
      setExportLoading(true);
      
      const response = await fetch(`/api/lead-generation/${generationId}/export?format=${format}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `leads-${generationId}-${new Date().toISOString().split('T')[0]}.${format}`;
      anchor.style.display = 'none';
      
      document.body.appendChild(anchor);
      anchor.click();
      
      URL.revokeObjectURL(url);
      document.body.removeChild(anchor);
      
      message.success(`Leads exported successfully as ${format.toUpperCase()}!`);
    } catch (error) {
      console.error('Export error:', error);
      message.error('Failed to export leads');
    } finally {
      setExportLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#52c41a';
    if (score >= 60) return '#faad14';
    return '#ff4d4f';
  };

  const getSeniorityInfo = (title: string, metadata?: any) => {
    const titleLower = title.toLowerCase();
    const seniority = metadata?.seniority?.toLowerCase() || '';
    
    if (titleLower.includes('ceo') || titleLower.includes('chief executive')) {
      return { level: 'c-level', badge: 'CEO', color: '#722ed1' };
    }
    if (titleLower.includes('cto') || titleLower.includes('chief technology')) {
      return { level: 'c-level', badge: 'CTO', color: '#722ed1' };
    }
    if (titleLower.includes('cfo') || titleLower.includes('chief financial')) {
      return { level: 'c-level', badge: 'CFO', color: '#722ed1' };
    }
    if (titleLower.includes('coo') || titleLower.includes('chief operating')) {
      return { level: 'c-level', badge: 'COO', color: '#722ed1' };
    }
    if (titleLower.includes('chief') && titleLower.includes('officer')) {
      return { level: 'c-level', badge: 'C-Level', color: '#722ed1' };
    }
    
    if (titleLower.includes('founder') || titleLower.includes('co-founder')) {
      return { level: 'founder', badge: 'Founder', color: '#fa541c' };
    }
    
    if (titleLower.includes('vp ') || titleLower.includes('vice president')) {
      return { level: 'vp', badge: 'VP', color: '#1890ff' };
    }
    if (titleLower.includes('director') && !titleLower.includes('associate')) {
      return { level: 'director', badge: 'Director', color: '#52c41a' };
    }
    
    if (titleLower.includes('president') && !titleLower.includes('vice')) {
      return { level: 'president', badge: 'President', color: '#fa541c' };
    }
    
    if (seniority.includes('senior') || seniority.includes('lead')) {
      return { level: 'senior', badge: 'Senior', color: '#faad14' };
    }
    
    return null;
  };

  const handleBack = () => {
    router.back();
  };

  const contactLead = (lead: GeneratedLead) => {
    if (lead.email) {
      const subject = encodeURIComponent(`Introduction from ${currentWorkspace?.name || 'Our Company'}`);
      const body = encodeURIComponent(`Hi ${lead.name.split(' ')[0]},\n\nI hope this email finds you well. I came across your profile and was impressed by your work at ${lead.company}.\n\nI'd love to connect and discuss how we might be able to help ${lead.company} with [your value proposition].\n\nBest regards,\n[Your Name]`);
      
      window.open(`mailto:${lead.email}?subject=${subject}&body=${body}`);
      message.success(`Opening email to ${lead.name}`);
    } else if (lead.linkedinUrl) {
      window.open(lead.linkedinUrl, '_blank');
      message.success(`Opening LinkedIn profile for ${lead.name}`);
    } else {
      message.warning('No contact information available for this lead');
    }
  };

  if (!isWorkspaceReady) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 text-center">
        <Spin size="large" tip="Loading workspace..." />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 text-center">
        <Spin size="large" tip="Loading lead details..." />
      </div>
    );
  }

  if (error || !leadDetail) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Alert
          message="Error Loading Lead Generation"
          description={error || "Could not find the requested lead generation"}
          type="error"
          showIcon
          action={
            <Button type="primary" onClick={fetchLeadDetail}>
              Try Again
            </Button>
          }
        />
        <div className="mt-4 text-center">
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => router.push('/lead-generation')}
          >
            Back to Lead Generation
          </Button>
        </div>
      </div>
    );
  }

  const currentLead = leadDetail.leads[selectedLeadIndex];

  // Lead table columns for the list view
  const leadColumns = [
    {
      title: 'Contact',
      key: 'contact',
      width: 250,
      render: (record: GeneratedLead) => {
        const seniorityInfo = getSeniorityInfo(record.title, record.metadata);
        
        return (
          <div className="flex items-center space-x-3">
            <Avatar 
              src={`https://i.pravatar.cc/32?u=${record.id}`}
              size={32}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <span className="font-medium text-sm truncate">{record.name}</span>
                {seniorityInfo && (
                  <span 
                    className="px-2 py-0.5 text-xs font-medium text-white rounded-full"
                    style={{ backgroundColor: seniorityInfo.color }}
                  >
                    {seniorityInfo.badge}
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500 truncate">{record.title}</div>
            </div>
          </div>
        );
      },
    },
    {
      title: 'Company',
      key: 'company',
      width: 200,
      render: (record: GeneratedLead) => (
        <div>
          <div className="font-medium text-sm truncate">{record.company}</div>
          <div className="text-xs text-gray-500 truncate">{record.industry}</div>
          {record.companySize && 
           !record.companySize.toLowerCase().includes('unknown') && 
           record.companySize !== 'Unknown' && (
            <Tag className="mt-1 text-xs">
              {record.companySize}
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      width: 150,
    },
    {
      title: 'Contact Info',
      key: 'contactInfo',
      width: 200,
      render: (record: GeneratedLead) => (
        <div className="space-y-1">
          {record.email && (
            <div className="flex items-center text-xs">
              <MailOutlined className="mr-1 text-green-500 flex-shrink-0" />
              <span className="truncate" title={record.email}>{record.email}</span>
            </div>
          )}
          {record.phone && (
            <div className="flex items-center text-xs">
              <PhoneOutlined className="mr-1 text-blue-500 flex-shrink-0" />
              <span className="truncate" title={record.phone}>{record.phone}</span>
            </div>
          )}
          {record.linkedinUrl && (
            <div className="flex items-center text-xs">
              <LinkedinOutlined className="mr-1 text-purple-500 flex-shrink-0" />
              <span className="truncate" title={record.linkedinUrl}>
                {record.linkedinUrl.replace('https://', '').replace('www.', '')}
              </span>
            </div>
          )}
          {!record.email && !record.phone && !record.linkedinUrl && (
            <span className="text-xs text-gray-400">No contact info</span>
          )}
        </div>
      ),
    },
    {
      title: 'Score',
      key: 'score',
      width: 80,
      align: 'center' as const,
      render: (record: GeneratedLead) => (
        <div className="flex items-center justify-center">
          <div 
            className="flex items-center justify-center w-12 h-6 rounded text-xs font-bold text-white"
            style={{ backgroundColor: getScoreColor(record.score) }}
          >
            {record.score}
          </div>
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 140,
      render: (record: GeneratedLead) => (
        <Space size="small">
          <Button 
            size="small"
            type="text"
            onClick={() => {
              const index = leadDetail.leads.findIndex(lead => lead.id === record.id);
              setSelectedLeadIndex(index);
            }}
          >
            View
          </Button>
          <Button 
            size="small" 
            type="primary"
            onClick={() => contactLead(record)}
          >
            Contact
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={handleBack}
        >
          Back to Leads
        </Button>
        
        <Space>
          <Button 
            icon={<DownloadOutlined />}
            loading={exportLoading}
            onClick={() => exportLeads('csv')}
          >
            Export CSV
          </Button>
          <Button 
            type="primary" 
            icon={<EyeOutlined />}
            onClick={() => setPreviewModalVisible(true)}
          >
            Quick Preview
          </Button>
        </Space>
      </div>

      <div className="text-center mb-8">
        <Title level={2} className="flex items-center justify-center">
          <TeamOutlined className="mr-2" />
          Lead Generation Details
        </Title>
        <Text type="secondary">
          Generated on {new Date(leadDetail.createdAt).toLocaleDateString()}
        </Text>
      </div>

      {/* Generation Stats */}
      <Row gutter={24} className="mb-6">
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Leads"
              value={leadDetail.leads.length}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Average Score"
              value={leadDetail.metadata?.averageScore ? Math.round(leadDetail.metadata.averageScore) : 0}
              suffix="/100"
              prefix={<StarOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="With Email"
              value={leadDetail.metadata?.qualityMetrics?.emailCount || 0}
              suffix={`/${leadDetail.leads.length}`}
              prefix={<MailOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Countries"
              value={leadDetail.metadata?.qualityMetrics?.countriesRepresented || 0}
              prefix={<GlobalOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Generation Info */}
      <Card className="mb-6">
        <Descriptions title="Generation Information" bordered column={1}>
          <Descriptions.Item label="Campaign Title">
            {leadDetail.title}
          </Descriptions.Item>
          <Descriptions.Item label="Created">
            <Space>
              <CalendarOutlined />
              {new Date(leadDetail.createdAt).toLocaleString()}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <Badge 
              status={leadDetail.status === 'completed' ? 'success' : 'processing'} 
              text={leadDetail.status.toUpperCase()}
            />
          </Descriptions.Item>
          <Descriptions.Item label="Search Strategy">
            <Tag color="blue" icon={<ThunderboltOutlined />}>
              {leadDetail.metadata?.searchStrategy || 'Global Precision Search'}
            </Tag>
          </Descriptions.Item>
          {leadDetail.metadata?.globalCoverage && (
            <Descriptions.Item label="Global Coverage">
              <Space direction="vertical" size="small">
                <div>
                  <GlobalOutlined className="mr-2" />
                  {leadDetail.metadata.globalCoverage.countries.length} countries
                </div>
                <div>
                  <EnvironmentOutlined className="mr-2" />
                  {leadDetail.metadata.globalCoverage.regions.length} regions
                </div>
                {leadDetail.metadata.globalCoverage.isGlobal && (
                  <Tag color="green">Global Search</Tag>
                )}
              </Space>
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      {/* Search Criteria */}
      {leadDetail.criteria && (
        <Card title="Search Criteria" className="mb-6">
          <Descriptions bordered column={2}>
            <Descriptions.Item label="Target Industries" span={2}>
              {leadDetail.criteria.targetIndustry?.map((industry: string) => (
                <Tag key={industry} color="blue">{industry}</Tag>
              ))}
            </Descriptions.Item>
            <Descriptions.Item label="Target Roles" span={2}>
              {leadDetail.criteria.targetRole?.map((role: string) => (
                <Tag key={role} color="green">{role}</Tag>
              ))}
            </Descriptions.Item>
            {leadDetail.criteria.country?.length > 0 && (
              <Descriptions.Item label="Countries">
                {leadDetail.criteria.country.map((country: string) => (
                  <Tag key={country}>{country}</Tag>
                ))}
              </Descriptions.Item>
            )}
            {leadDetail.criteria.companySize?.length > 0 && (
              <Descriptions.Item label="Company Sizes">
                {leadDetail.criteria.companySize.map((size: string) => (
                  <Tag key={size}>{size}</Tag>
                ))}
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>
      )}

      {/* Leads List and Detail */}
      <Card 
        title={
          <Space>
            <TeamOutlined />
            <span>Generated Leads</span>
            <Tag>{leadDetail.leads.length} leads</Tag>
          </Space>
        }
        className="mb-6"
        extra={
          <Text type="secondary">
            Select a lead to view details
          </Text>
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Leads List */}
          <div className="lg:col-span-1">
            <div className="mb-4">
              <Table
                columns={leadColumns}
                dataSource={leadDetail.leads}
                rowKey="id"
                size="small"
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                }}
                onRow={(record) => ({
                  onClick: () => {
                    const index = leadDetail.leads.findIndex(lead => lead.id === record.id);
                    setSelectedLeadIndex(index);
                  },
                  style: { 
                    cursor: 'pointer',
                   
                  },
                })}
                scroll={{ y: 400 }}
              />
            </div>
          </div>

          {/* Lead Detail */}
          <div className="lg:col-span-2">
            {currentLead && (
              <Card 
                title="Lead Details" 
                extra={
                  <Space>
                    <Tooltip title="Copy lead info">
                      <Button 
                        icon={<CopyOutlined />} 
                        onClick={() => copyLeadInfo(currentLead)}
                      />
                    </Tooltip>
                    <Button 
                      type="primary"
                      onClick={() => contactLead(currentLead)}
                    >
                      Contact
                    </Button>
                  </Space>
                }
              >
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div>
                    <Title level={4}>{currentLead.name}</Title>
                    <Space direction="vertical" size="small">
                      <div className="flex items-center">
                        <UserOutlined className="mr-2 text-gray-400" />
                        <Text strong>{currentLead.title}</Text>
                      </div>
                      <div className="flex items-center">
                        <BankOutlined className="mr-2 text-gray-400" />
                        <Text>{currentLead.company} • {currentLead.industry}</Text>
                      </div>
                      <div className="flex items-center">
                        <EnvironmentOutlined className="mr-2 text-gray-400" />
                        <Text>{currentLead.location}</Text>
                      </div>
                    </Space>
                  </div>

                  <Divider />

                  {/* Contact Information */}
                  <div>
                    <Title level={5}>Contact Information</Title>
                    <Row gutter={16}>
                      <Col span={12}>
                        <div className="space-y-2">
                          {currentLead.email && (
                            <div className="flex items-center">
                              <MailOutlined className="mr-2 text-green-500" />
                              <Text copyable>{currentLead.email}</Text>
                            </div>
                          )}
                          {currentLead.phone && (
                            <div className="flex items-center">
                              <PhoneOutlined className="mr-2 text-blue-500" />
                              <Text copyable>{currentLead.phone}</Text>
                            </div>
                          )}
                        </div>
                      </Col>
                      <Col span={12}>
                        <div className="space-y-2">
                          {currentLead.linkedinUrl && (
                            <div className="flex items-center">
                              <LinkedinOutlined className="mr-2 text-purple-500" />
                              <a href={currentLead.linkedinUrl} target="_blank" rel="noopener noreferrer">
                                LinkedIn Profile
                              </a>
                            </div>
                          )}
                          {currentLead.website && (
                            <div className="flex items-center">
                              <GlobalOutlined className="mr-2 text-orange-500" />
                              <a href={currentLead.website} target="_blank" rel="noopener noreferrer">
                                Company Website
                              </a>
                            </div>
                          )}
                        </div>
                      </Col>
                    </Row>
                  </div>

                  <Divider />

                  {/* Lead Score & Metadata */}
                  <div>
                    <Title level={5}>Lead Quality</Title>
                    <Row gutter={16}>
                      <Col span={8}>
                        <div className="text-center">
                          <div 
                            className="mx-auto w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg"
                            style={{ backgroundColor: getScoreColor(currentLead.score) }}
                          >
                            {currentLead.score}
                          </div>
                          <Text className="block mt-2">Quality Score</Text>
                        </div>
                      </Col>
                      <Col span={16}>
                        <div className="space-y-2">
                          {currentLead.metadata?.seniority && (
                            <div className="flex justify-between">
                              <Text>Seniority:</Text>
                              <Text strong>{currentLead.metadata.seniority}</Text>
                            </div>
                          )}
                          {currentLead.companySize && currentLead.companySize !== 'Unknown' && (
                            <div className="flex justify-between">
                              <Text>Company Size:</Text>
                              <Text strong>{currentLead.companySize}</Text>
                            </div>
                          )}
                          {currentLead.metadata?.companyRevenue && (
                            <div className="flex justify-between">
                              <Text>Company Revenue:</Text>
                              <Text strong>{currentLead.metadata.companyRevenue}</Text>
                            </div>
                          )}
                          {currentLead.metadata?.employeeCount && (
                            <div className="flex justify-between">
                              <Text>Employee Count:</Text>
                              <Text strong>{currentLead.metadata.employeeCount.toLocaleString()}</Text>
                            </div>
                          )}
                        </div>
                      </Col>
                    </Row>
                  </div>

                  {/* Additional Metadata */}
                  {currentLead.metadata && (
                    <Collapse className="mt-4">
                      <Panel header="Additional Information" key="1">
                        <Descriptions column={1} size="small">
                          {currentLead.metadata.countryCode && (
                            <Descriptions.Item label="Country Code">
                              {currentLead.metadata.countryCode}
                            </Descriptions.Item>
                          )}
                          {currentLead.metadata.timezone && (
                            <Descriptions.Item label="Timezone">
                              {currentLead.metadata.timezone}
                            </Descriptions.Item>
                          )}
                          {currentLead.metadata.currency && (
                            <Descriptions.Item label="Currency">
                              {currentLead.metadata.currency}
                            </Descriptions.Item>
                          )}
                          {currentLead.metadata.sourceIndustry && (
                            <Descriptions.Item label="Source Industry">
                              {currentLead.metadata.sourceIndustry}
                            </Descriptions.Item>
                          )}
                          {currentLead.metadata.technologies && currentLead.metadata.technologies.length > 0 && (
                            <Descriptions.Item label="Technologies">
                              <Space wrap>
                                {currentLead.metadata.technologies.map((tech: string, index: number) => (
                                  <Tag key={index} color="blue">{tech}</Tag>
                                ))}
                              </Space>
                            </Descriptions.Item>
                          )}
                        </Descriptions>
                      </Panel>
                    </Collapse>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      </Card>

      {/* Preview Modal */}
      <Modal
        title="Leads Preview"
        open={previewModalVisible}
        onCancel={() => setPreviewModalVisible(false)}
        footer={[
          <Button key="back" onClick={() => setPreviewModalVisible(false)}>
            Close
          </Button>,
          <Button 
            key="export" 
            icon={<DownloadOutlined />}
            loading={exportLoading}
            onClick={() => exportLeads('csv')}
          >
            Export All
          </Button>
        ]}
        width={1000}
      >
        <Table
          columns={leadColumns}
          dataSource={leadDetail.leads.slice(0, 10)}
          rowKey="id"
          size="small"
          pagination={false}
          scroll={{ y: 400 }}
        />
        {leadDetail.leads.length > 10 && (
          <div className="text-center mt-4">
            <Text type="secondary">
              Showing first 10 of {leadDetail.leads.length} leads
            </Text>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default LeadGenerationDetailPage;