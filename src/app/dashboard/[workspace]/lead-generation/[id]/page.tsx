// app/lead-generation/[id]/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { 
  TeamOutlined, 
  ArrowLeftOutlined, 
  DownloadOutlined, 
  MailOutlined,
  PhoneOutlined,
  LinkedinOutlined,
  GlobalOutlined,
  EnvironmentOutlined,
  BankOutlined,
  UserOutlined,
  StarFilled,
  EyeOutlined,
  CheckCircleFilled,
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
  Modal,
  Tooltip,
  Table,
  Avatar,
  Row,
  Col,
  ConfigProvider, 
  theme as antTheme 
} from 'antd';
import { useParams, useRouter } from 'next/navigation';
import { useWorkspaceContext } from '../../../../hooks/useWorkspaceContext';

const { Title, Text } = Typography;

// --- Interfaces ---
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
    keywords?: string[]; // Fixed: Added missing property
    [key: string]: any;  // Fixed: Added index signature to allow flexible metadata
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

// --- Custom CSS for Premium Feel ---
const customStyles = `
  .ant-table-wrapper .ant-table {
    background: transparent !important;
  }
  .ant-table-wrapper .ant-table-tbody > tr > td {
    border-bottom: 1px solid rgba(255,255,255,0.05) !important;
    transition: background 0.2s ease;
  }
  .ant-table-wrapper .ant-table-tbody > tr:hover > td {
    background: rgba(255,255,255,0.03) !important;
  }
  .ant-table-wrapper .ant-table-thead > tr > th {
    background: transparent !important;
    border-bottom: 1px solid rgba(255,255,255,0.1) !important;
    color: #94a3b8 !important;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .glass-card {
    background: rgba(20, 22, 25, 0.6) !important;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255,255,255,0.08) !important;
  }
  .stat-card {
    background: linear-gradient(145deg, #141619 0%, #0B0C10 100%);
    border: 1px solid rgba(255,255,255,0.05);
  }
  /* Scrollbar styling */
  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  ::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.1);
    border-radius: 3px;
  }
`;

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
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    const style = document.createElement('style');
    style.innerHTML = customStyles;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(link);
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    if (isWorkspaceReady && currentWorkspace) {
      fetchLeadDetail();
    }
  }, [isWorkspaceReady, currentWorkspace, generationId]);

  const fetchLeadDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/lead-generation/${generationId}?workspaceId=${currentWorkspace?.id}`);
      if (!response.ok) throw new Error(`Failed to fetch lead details`);
      const data = await response.json();
      if (data.success) {
        setLeadDetail(data.data);
      } else {
        throw new Error(data.error || 'Failed to load lead details');
      }
    } catch (err) {
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

  const exportLeads = async (format: 'csv' | 'json' = 'csv') => {
    if (!leadDetail) return;
    try {
      setExportLoading(true);
      const response = await fetch(`/api/lead-generation/${generationId}/export?format=${format}`);
      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `leads-${generationId}.${format}`;
      document.body.appendChild(anchor);
      anchor.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(anchor);
      message.success(`Leads exported as ${format.toUpperCase()}!`);
    } catch (error) {
      message.error('Failed to export leads');
    } finally {
      setExportLoading(false);
    }
  };

  // --- Visual Helpers ---

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#5CC49D';
    if (score >= 60) return '#faad14';
    return '#ff4d4f';
  };

  const getSeniorityInfo = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes('chief') || t.includes('ceo') || t.includes('founder')) 
      return { badge: 'EXEC', color: '#5CC49D' }; // Mint
    if (t.includes('vp') || t.includes('director')) 
      return { badge: 'DIR', color: '#3b82f6' }; // Blue
    return null;
  };

  const contactLead = (lead: GeneratedLead) => {
    if (lead.email) {
      window.open(`mailto:${lead.email}`);
    } else if (lead.linkedinUrl) {
      window.open(lead.linkedinUrl, '_blank');
    } else {
      message.warning('No contact info available');
    }
  };

  // --- Theme Config ---
  const darkThemeConfig = {
    algorithm: antTheme.darkAlgorithm,
    token: {
      fontFamily: 'Manrope, sans-serif',
      colorPrimary: '#5CC49D',
      borderRadius: 8,
      colorTextHeading: '#ffffff',
      colorText: '#94a3b8',
      colorBgContainer: '#141619',
      colorBgElevated: '#1a1d21',
      colorBorder: 'rgba(255, 255, 255, 0.08)',
    },
    components: {
      Card: {
        headerBg: 'transparent',
        colorBgContainer: '#141619',
        borderless: true,
      },
      Button: {
        colorPrimary: '#5CC49D',
        algorithm: true,
        fontWeight: 600,
        controlHeight: 36,
        defaultBorderColor: 'rgba(255, 255, 255, 0.1)',
        defaultBg: 'rgba(255, 255, 255, 0.02)',
      },
      Table: {
        headerBg: 'transparent',
        colorBgContainer: 'transparent',
        borderColor: 'rgba(255, 255, 255, 0.05)',
      },
      Statistic: {
        contentFontSize: 24,
        titleFontSize: 13,
      },
      Descriptions: {
        itemPaddingBottom: 8,
      }
    },
  };

  if (loading || !isWorkspaceReady) {
    return (
      <ConfigProvider theme={darkThemeConfig}>
        <div style={{ backgroundColor: '#0B0C10', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Spin size="large" />
        </div>
      </ConfigProvider>
    );
  }

  if (error || !leadDetail) {
    return (
      <ConfigProvider theme={darkThemeConfig}>
        <div className="p-8 bg-[#0B0C10] min-h-screen">
          <Alert message="Error" description={error} type="error" showIcon />
          <Button icon={<ArrowLeftOutlined />} onClick={() => router.push('/lead-generation')} className="mt-4">Back</Button>
        </div>
      </ConfigProvider>
    );
  }

  const currentLead = leadDetail.leads[selectedLeadIndex];

  // --- Table Columns Definition ---
  const leadColumns = [
    {
      title: 'Name & Title',
      key: 'contact',
      render: (record: GeneratedLead) => {
        const seniority = getSeniorityInfo(record.title);
        return (
          <div className="flex items-center gap-3">
             <Avatar 
               size="small" 
               style={{ backgroundColor: getScoreColor(record.score) }}
               className="flex-shrink-0"
             >
               {record.name.charAt(0)}
             </Avatar>
             <div className="min-w-0">
                <div className="flex items-center gap-2">
                   <Text className="text-gray-200 font-medium truncate">{record.name}</Text>
                   {seniority && (
                     <Tag style={{ margin: 0, fontSize: 10, padding: '0 4px', border: 0, color: '#000', backgroundColor: seniority.color }}>
                       {seniority.badge}
                     </Tag>
                   )}
                </div>
                <div className="text-xs text-gray-500 truncate max-w-[150px]">{record.title}</div>
             </div>
          </div>
        );
      },
    },
    {
      title: 'Company',
      key: 'company',
      render: (record: GeneratedLead) => (
        <div>
          <div className="text-gray-300 text-sm truncate">{record.company}</div>
          <div className="text-xs text-gray-500">{record.industry}</div>
        </div>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 100,
      render: (record: GeneratedLead) => (
        <Space size={4}>
          <Tooltip title={record.email ? "Email Available" : "No Email"}>
             <MailOutlined style={{ color: record.email ? '#5CC49D' : '#333' }} />
          </Tooltip>
          <Tooltip title={record.linkedinUrl ? "LinkedIn Available" : "No LinkedIn"}>
             <LinkedinOutlined style={{ color: record.linkedinUrl ? '#5CC49D' : '#333' }} />
          </Tooltip>
          <Tooltip title={record.phone ? "Phone Available" : "No Phone"}>
             <PhoneOutlined style={{ color: record.phone ? '#5CC49D' : '#333' }} />
          </Tooltip>
        </Space>
      )
    },
    {
      title: 'Score',
      key: 'score',
      width: 80,
      render: (record: GeneratedLead) => (
        <span style={{ color: getScoreColor(record.score), fontWeight: 600 }}>
          {record.score}
        </span>
      ),
    },
  ];

  return (
    <ConfigProvider theme={darkThemeConfig}>
      <div style={{ backgroundColor: '#0B0C10', minHeight: '100vh', padding: '24px 32px' }}>
        
        {/* TOP NAV */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button 
              type="text" 
              icon={<ArrowLeftOutlined />} 
              onClick={() => router.push('/lead-generation')}
              className="text-gray-400 hover:text-white"
            />
            <div>
              <div className="flex items-center gap-3">
                <Title level={4} style={{ margin: 0 }}>{leadDetail.title}</Title>
                <Tag className="bg-[#5CC49D]/10 text-[#5CC49D] border-0">
                  {leadDetail.status.toUpperCase()}
                </Tag>
              </div>
              <Text className="text-gray-500 text-xs">
                Generated {new Date(leadDetail.createdAt).toLocaleDateString()} • {leadDetail.leads.length} Leads Found
              </Text>
            </div>
          </div>
          
          <Space>
            <Button icon={<EyeOutlined />} onClick={() => setPreviewModalVisible(true)}>Preview Table</Button>
            <Button 
              type="primary" 
              icon={<DownloadOutlined />} 
              loading={exportLoading} 
              onClick={() => exportLeads('csv')}
              style={{ boxShadow: '0 0 15px rgba(92, 196, 157, 0.2)' }}
            >
              Export Data
            </Button>
          </Space>
        </div>

        {/* STATS ROW */}
        <Row gutter={16} className="mb-6">
          {[
            { title: 'Total Leads', value: leadDetail.leads.length, icon: <TeamOutlined />, color: '#fff' },
            { title: 'Avg. Quality', value: `${Math.round(leadDetail.metadata?.averageScore || 0)}/100`, icon: <StarFilled />, color: '#5CC49D' },
            { title: 'Verified Emails', value: leadDetail.metadata?.qualityMetrics?.emailCount || 0, icon: <CheckCircleFilled />, color: '#5CC49D' },
            { title: 'Countries', value: leadDetail.metadata?.qualityMetrics?.countriesRepresented || 0, icon: <GlobalOutlined />, color: '#3b82f6' },
          ].map((stat, idx) => (
            <Col span={6} key={idx}>
              <div className="stat-card p-4 rounded-xl flex items-center justify-between">
                <div>
                   <div className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-1">{stat.title}</div>
                   <div className="text-2xl font-bold text-white">{stat.value}</div>
                </div>
                <div style={{ color: stat.color, opacity: 0.8, fontSize: '20px' }}>{stat.icon}</div>
              </div>
            </Col>
          ))}
        </Row>

        {/* MAIN CONTENT SPLIT */}
        <Row gutter={24} style={{ height: 'calc(100vh - 220px)' }}>
          
          {/* LEFT: LIST VIEW */}
          <Col span={9} className="h-full flex flex-col">
            <Card className="glass-card h-full flex flex-col" bodyStyle={{ padding: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div className="p-4 border-b border-white/5 flex justify-between items-center">
                 <Text strong>Lead List</Text>
                 <Text type="secondary" className="text-xs">{leadDetail.leads.length} items</Text>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <Table
                  columns={leadColumns}
                  dataSource={leadDetail.leads}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  onRow={(record, index) => ({
                    onClick: () => setSelectedLeadIndex(index || 0),
                    style: { 
                      cursor: 'pointer',
                      background: selectedLeadIndex === index ? 'rgba(92, 196, 157, 0.08)' : 'transparent',
                    },
                  })}
                />
              </div>
            </Card>
          </Col>

          {/* RIGHT: DETAIL VIEW */}
          <Col span={15} className="h-full">
            {currentLead ? (
              <Card className="glass-card h-full overflow-y-auto" bodyStyle={{ padding: '32px' }}>
                
                {/* Profile Header */}
                <div className="flex justify-between items-start mb-8">
                  <div className="flex gap-5">
                    {/* <Avatar 
                      size={80} 
                      src={`https://i.pravatar.cc/150?u=${currentLead.id}`}
                      icon={<UserOutlined />}
                      className="border-2 border-[#5CC49D]/20 bg-[#1f2937]"
                    /> */}
                    <div>
                      <Title level={3} style={{ margin: 0, marginBottom: 4 }}>{currentLead.name}</Title>
                      <Text className="text-lg text-gray-400 block mb-2">{currentLead.title}</Text>
                      <Space>
                        <Tag icon={<BankOutlined />} className="bg-white/5 border-0 text-gray-300">{currentLead.company}</Tag>
                        <Tag icon={<EnvironmentOutlined />} className="bg-white/5 border-0 text-gray-300">{currentLead.location}</Tag>
                      </Space>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex flex-col items-center justify-center bg-[#5CC49D]/10 rounded-lg p-3 w-[80px]">
                      <span className="text-2xl font-bold text-[#5CC49D]">{currentLead.score}</span>
                      <span className="text-[10px] uppercase text-[#5CC49D] font-bold tracking-wider">Score</span>
                    </div>
                  </div>
                </div>

                <Divider style={{ borderColor: 'rgba(255,255,255,0.06)' }} />

                {/* Contact Actions Grid */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                    <div className="text-xs text-gray-500 uppercase mb-2">Primary Email</div>
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-2">
                          <MailOutlined className="text-[#5CC49D]" />
                          <Text className="text-gray-200" copyable>{currentLead.email || 'Not Available'}</Text>
                       </div>
                       {currentLead.email && (
                         <Button type="primary" size="small" onClick={() => contactLead(currentLead)}>Send Email</Button>
                       )}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                    <div className="text-xs text-gray-500 uppercase mb-2">Professional Profiles</div>
                    <div className="flex gap-2">
                       {currentLead.linkedinUrl ? (
                         <Button block icon={<LinkedinOutlined />} onClick={() => window.open(currentLead.linkedinUrl, '_blank')}>LinkedIn</Button>
                       ) : <Button block disabled>No LinkedIn</Button>}
                       {currentLead.website ? (
                         <Button block icon={<GlobalOutlined />} onClick={() => window.open(currentLead.website, '_blank')}>Website</Button>
                       ) : null}
                    </div>
                  </div>
                </div>

                {/* Detailed Metadata Grid */}
                <div className="mb-6">
                   <Title level={5} className="text-gray-400 text-xs uppercase tracking-widest mb-4">Company Intelligence</Title>
                   <Row gutter={[16, 16]}>
                      <Col span={12}>
                        <div className="flex justify-between border-b border-white/5 pb-2">
                          <Text type="secondary">Industry</Text>
                          <Text className="text-gray-200">{currentLead.industry}</Text>
                        </div>
                      </Col>
                      <Col span={12}>
                        <div className="flex justify-between border-b border-white/5 pb-2">
                          <Text type="secondary">Company Size</Text>
                          <Text className="text-gray-200">{currentLead.companySize || 'Unknown'}</Text>
                        </div>
                      </Col>
                      <Col span={12}>
                         <div className="flex justify-between border-b border-white/5 pb-2">
                           <Text type="secondary">Revenue Est.</Text>
                           <Text className="text-gray-200">{currentLead.metadata?.companyRevenue || 'N/A'}</Text>
                         </div>
                      </Col>
                      <Col span={12}>
                         <div className="flex justify-between border-b border-white/5 pb-2">
                           <Text type="secondary">Employees</Text>
                           <Text className="text-gray-200">{currentLead.metadata?.employeeCount?.toLocaleString() || 'N/A'}</Text>
                         </div>
                      </Col>
                   </Row>
                </div>

                {/* Tech Stack / Additional Info */}
                {currentLead.metadata?.technologies && (
                  <div className="mt-6">
                    <Title level={5} className="text-gray-400 text-xs uppercase tracking-widest mb-3">Tech Stack & Tags</Title>
                    <Space size={[0, 8]} wrap>
                      {currentLead.metadata.technologies.map((tech, i) => (
                        <Tag key={i} className="bg-[#1a1d21] border border-white/10 text-gray-400 px-3 py-1 rounded-full">
                          {tech}
                        </Tag>
                      ))}
                      {/* Fixed: Check for keywords exists safely now due to interface update */}
                      {currentLead.metadata?.keywords && ( 
                         <Tag color="cyan">Keyword Match</Tag>
                      )}
                    </Space>
                  </div>
                )}

              </Card>
            ) : (
               <div className="h-full flex items-center justify-center text-gray-500 border border-dashed border-white/10 rounded-xl">
                 Select a lead to view details
               </div>
            )}
          </Col>
        </Row>

        {/* PREVIEW MODAL */}
        <Modal
          title="All Generated Leads"
          open={previewModalVisible}
          onCancel={() => setPreviewModalVisible(false)}
          footer={null}
          width={1000}
          centered
          className="glass-modal"
        >
          <Table
            columns={leadColumns}
            dataSource={leadDetail.leads}
            rowKey="id"
            size="small"
            pagination={{ pageSize: 10 }}
            scroll={{ y: 500 }}
          />
        </Modal>

      </div>
    </ConfigProvider>
  );
};

export default LeadGenerationDetailPage;