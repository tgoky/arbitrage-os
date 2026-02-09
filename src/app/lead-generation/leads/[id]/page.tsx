// app/lead-generation/leads/[id]/page.tsx
"use client";
import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Typography,
  Space,
  Tag,
  Row,
  Col,
  Avatar,
  Progress,
  message,
  Spin,
  Tabs,
  Timeline,
  Input,
  Modal,
  Form,
  Select,
  Divider,
  ConfigProvider,
  theme as antTheme
} from 'antd';
import {
  ArrowLeftOutlined,
  MailOutlined,
  PhoneOutlined,
  LinkedinOutlined,
  GlobalOutlined,
  EditOutlined,
  SaveOutlined,
  UserOutlined,
  EnvironmentOutlined,
  HistoryOutlined,
  MessageOutlined,
  CalendarOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  ClockCircleFilled,
  PlusOutlined
} from '@ant-design/icons';
import { useParams, useRouter } from 'next/navigation';
import { useTheme } from '../../../../providers/ThemeProvider';
import { useWorkspaceContext } from '../../../hooks/useWorkspaceContext';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// --- Interfaces ---
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
  notes?: string;
  status: 'new' | 'contacted' | 'qualified' | 'unqualified';
  lastContacted?: string;
  createdAt: string;
  updatedAt: string;
}

interface Interaction {
  id: string;
  type: 'email' | 'call' | 'meeting' | 'note';
  content: string;
  date: string;
  userId: string;
  userName: string;
}

// --- Custom Styles for Minimalist Scrollbar & Glass Effects ---
const customGlobalStyles = `
  body {
    background-color: #0B0C10;
  }
  .ant-card {
    box-shadow: 0 4px 20px rgba(0,0,0,0.2) !important;
  }
  .ant-tabs-nav::before {
    border-bottom: 1px solid rgba(255,255,255,0.06) !important;
  }
  /* Custom Scrollbar for TextAreas */
  textarea::-webkit-scrollbar {
    width: 6px;
  }
  textarea::-webkit-scrollbar-thumb {
    background-color: rgba(255,255,255,0.1);
    border-radius: 4px;
  }
  .premium-input:hover, .premium-input:focus {
    background: rgba(255,255,255,0.08) !important;
  }
`;

const LeadDetailPage = () => {
  const { id } = useParams();
  const router = useRouter();
  const { theme } = useTheme(); // Keeping hook even if not used directly for styling to maintain logic
  const { currentWorkspace, getWorkspaceScopedEndpoint } = useWorkspaceContext();
  
  // --- GOOGLE FONT INJECTION ---
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    const style = document.createElement('style');
    style.innerHTML = customGlobalStyles;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(link);
      document.head.removeChild(style);
    };
  }, []);

  // State
  const [lead, setLead] = useState<Lead | null>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [interactionType, setInteractionType] = useState<'email' | 'call' | 'meeting' | 'note'>('note');

  // Load lead data
  useEffect(() => {
    if (currentWorkspace?.id && id) {
      loadLeadData();
    }
  }, [currentWorkspace?.id, id]);

  const loadLeadData = async () => {
    try {
      setLoading(true);
      const endpoint = getWorkspaceScopedEndpoint(`/api/leads/${id}`);
      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setLead(data.data.lead);
          setInteractions(data.data.interactions || []);
        } else {
          message.error(data.error || 'Failed to load lead details');
        }
      } else {
        message.error('Failed to load lead details');
      }
    } catch (error) {
      console.error('Error loading lead data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!lead) return;
    try {
      const endpoint = getWorkspaceScopedEndpoint(`/api/leads/${id}`);
      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: lead.notes, status: lead.status })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          message.success('Lead updated successfully');
          setEditing(false);
        }
      }
    } catch (error) {
      message.error('Failed to update lead');
    }
  };

  const handleAddInteraction = async () => {
    if (!noteContent.trim()) {
      message.warning('Please enter content');
      return;
    }
    try {
      const endpoint = getWorkspaceScopedEndpoint(`/api/leads/${id}/interactions`);
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: interactionType, content: noteContent })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          message.success('Interaction added');
          setNoteContent('');
          setIsModalVisible(false);
          loadLeadData();
        }
      }
    } catch (error) {
      message.error('Failed to add interaction');
    }
  };

  // --- Visual Helpers ---

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'new': return { color: '#3b82f6', icon: <PlusOutlined />, label: 'New Lead' };
      case 'contacted': return { color: '#f59e0b', icon: <ClockCircleFilled />, label: 'Contacted' };
      case 'qualified': return { color: '#5CC49D', icon: <CheckCircleFilled />, label: 'Qualified' };
      case 'unqualified': return { color: '#ef4444', icon: <CloseCircleFilled />, label: 'Unqualified' };
      default: return { color: '#9ca3af', icon: <UserOutlined />, label: status };
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#5CC49D'; // High
    if (score >= 50) return '#f59e0b'; // Medium
    return '#ef4444'; // Low
  };

  const getInteractionIcon = (type: string) => {
    const style = { fontSize: '16px' };
    switch (type) {
      case 'email': return <MailOutlined style={style} />;
      case 'call': return <PhoneOutlined style={style} />;
      case 'meeting': return <CalendarOutlined style={style} />;
      default: return <MessageOutlined style={style} />;
    }
  };

  // --- Theme Config ---
  const darkThemeConfig = {
    algorithm: antTheme.darkAlgorithm,
    token: {
      fontFamily: 'Manrope, sans-serif',
      colorPrimary: '#5CC49D', // The requested Green
      borderRadius: 12,
      colorTextHeading: '#ffffff',
      colorText: '#94a3b8', // Slate 400
      colorTextSecondary: '#64748b', // Slate 500
      colorBgContainer: '#141619', // Slightly lighter than bg
      colorBgElevated: '#1a1d21',
      colorBorder: 'rgba(255, 255, 255, 0.06)', // Very subtle border
      fontSize: 14,
    },
    components: {
      Card: {
        headerBg: 'transparent',
        colorBgContainer: '#141619',
        borderRadiusLG: 16,
      },
      Button: {
        colorPrimary: '#5CC49D',
        algorithm: true,
        fontWeight: 600,
        controlHeight: 40,
        defaultBorderColor: 'rgba(255, 255, 255, 0.1)',
        defaultBg: 'rgba(255, 255, 255, 0.02)',
      },
      Tabs: {
        itemColor: '#64748b',
        itemSelectedColor: '#5CC49D',
        itemHoverColor: '#5CC49D',
        inkBarColor: '#5CC49D',
        titleFontSize: 15,
      },
      Input: {
        colorBgContainer: 'rgba(0, 0, 0, 0.2)',
        activeBorderColor: '#5CC49D',
        hoverBorderColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 8,
      },
      Select: {
        colorBgContainer: 'rgba(0, 0, 0, 0.2)',
        selectorBg: 'rgba(0, 0, 0, 0.2)',
        optionSelectedBg: 'rgba(92, 196, 157, 0.15)',
      },
      Tag: {
        borderRadius: 100, // Pill shape
      },
      Timeline: {
        tailColor: 'rgba(255, 255, 255, 0.06)',
      }
    },
  } as const;

  if (loading) {
    return (
      <ConfigProvider theme={darkThemeConfig}>
        <div className="flex justify-center items-center min-h-screen bg-[#0B0C10]">
          <Spin size="large" tip="Loading Lead..." />
        </div>
      </ConfigProvider>
    );
  }

  if (!lead) return null;

  const statusConfig = getStatusConfig(lead.status);

  return (
    <ConfigProvider theme={darkThemeConfig}>
      <div style={{ backgroundColor: '#0B0C10', minHeight: '100vh', padding: '32px 40px' }}>
        
        {/* Navigation Bar */}
        <div className="flex justify-between items-center mb-8">
          <Button 
            type="text"
            icon={<ArrowLeftOutlined />} 
            onClick={() => router.push('/lead-generation')}
            className="hover:bg-white/5"
          >
            Back to Leads
          </Button>
          
          <Space>
            <Button 
              ghost 
              icon={<EditOutlined />} 
              onClick={() => setEditing(!editing)}
              style={{ borderColor: editing ? '#5CC49D' : undefined, color: editing ? '#5CC49D' : undefined }}
            >
              {editing ? 'Cancel Edit' : 'Edit Lead'}
            </Button>
            {editing && (
              <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveNotes}>
                Save Changes
              </Button>
            )}
          </Space>
        </div>

        <Row gutter={32}>
          {/* LEFT COLUMN: Main Info */}
          <Col xs={24} lg={16}>
            
            {/* Lead Header Card */}
            <Card className="mb-6 border border-white/5" bordered={false}>
              <div className="flex items-start gap-6">
                <div className="relative">
                  {/* <Avatar 
                    size={80} 
                    src={`https://i.pravatar.cc/150?u=${lead.id}`}
                    icon={<UserOutlined />}
                    className="border-2 border-[#5CC49D]/20"
                    style={{ backgroundColor: '#1f2937' }}
                  /> */}
                  <div className="absolute -bottom-2 -right-2">
                     {/* Status Badge overlaid on Avatar */}
                     <Tag 
                        color={statusConfig.color} 
                        style={{ margin: 0, padding: '2px 8px', border: '2px solid #141619' }}
                      >
                       {statusConfig.icon}
                     </Tag>
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      {editing ? (
                        <Input 
                          value={lead.name} 
                          onChange={(e) => setLead({...lead, name: e.target.value})} 
                          className="text-2xl font-bold mb-2 w-full premium-input"
                        />
                      ) : (
                        <Title level={2} style={{ margin: 0, marginBottom: 4, fontWeight: 700 }}>
                          {lead.name}
                        </Title>
                      )}
                      
                      <div className="flex items-center gap-2 text-gray-400 mb-4">
                        {editing ? (
                          <Space>
                            <Input value={lead.title} onChange={(e) => setLead({...lead, title: e.target.value})} placeholder="Title" />
                            <span className="text-gray-600">at</span>
                            <Input value={lead.company} onChange={(e) => setLead({...lead, company: e.target.value})} placeholder="Company" />
                          </Space>
                        ) : (
                          <Text className="text-lg text-gray-400">
                            {lead.title} <span className="text-gray-600 mx-1">at</span> <span className="text-white">{lead.company}</span>
                          </Text>
                        )}
                      </div>

                      <Space size={[0, 8]} wrap>
                        {editing ? (
                          <Input value={lead.location} prefix={<EnvironmentOutlined />} onChange={(e) => setLead({...lead, location: e.target.value})} />
                        ) : (
                          <Tag icon={<EnvironmentOutlined />} className="bg-white/5 border-transparent text-gray-300 px-3 py-1">
                            {lead.location}
                          </Tag>
                        )}
                        <Tag className="bg-white/5 border-transparent text-gray-300 px-3 py-1">
                          {lead.industry}
                        </Tag>
                      </Space>
                    </div>
                    
                    {/* Compact Contact Links */}
                    {!editing && (
                      <Space>
                        {lead.linkedinUrl && (
                          <Button 
                            type="text" 
                            shape="circle" 
                            icon={<LinkedinOutlined style={{ fontSize: 20 }} />} 
                            onClick={() => window.open(lead.linkedinUrl, '_blank')}
                            className="text-gray-400 hover:text-[#5CC49D] hover:bg-[#5CC49D]/10"
                          />
                        )}
                        {lead.website && (
                          <Button 
                            type="text" 
                            shape="circle" 
                            icon={<GlobalOutlined style={{ fontSize: 20 }} />} 
                            onClick={() => window.open(lead.website, '_blank')}
                            className="text-gray-400 hover:text-[#5CC49D] hover:bg-[#5CC49D]/10"
                          />
                        )}
                      </Space>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* Tabs Section */}
            <Card bordered={false} bodyStyle={{ padding: '0 24px 24px' }} className="border border-white/5">
              <Tabs defaultActiveKey="details" className="premium-tabs">
                <Tabs.TabPane tab="Information" key="details">
                  <div className="py-6">
                    <Row gutter={[48, 24]}>
                      <Col span={24}>
                        <Title level={5} style={{ color: '#5CC49D', marginBottom: 16, fontSize: 12, textTransform: 'uppercase', letterSpacing: '1px' }}>
                          Contact Information
                        </Title>
                      </Col>
                      
                      {/* Custom Data Grid */}
                      <Col span={12}>
                        <div className="mb-1 text-xs text-gray-500 font-medium uppercase tracking-wide">Email Address</div>
                        {editing ? (
                          <Input value={lead.email} onChange={(e) => setLead({...lead, email: e.target.value})} />
                        ) : (
                          <div className="text-base text-gray-200 hover:text-[#5CC49D] transition-colors cursor-pointer flex items-center gap-2">
                             <MailOutlined className="text-[#5CC49D]" />
                             {lead.email || 'N/A'}
                          </div>
                        )}
                      </Col>

                      <Col span={12}>
                        <div className="mb-1 text-xs text-gray-500 font-medium uppercase tracking-wide">Phone Number</div>
                        {editing ? (
                          <Input value={lead.phone} onChange={(e) => setLead({...lead, phone: e.target.value})} />
                        ) : (
                          <div className="text-base text-gray-200 hover:text-[#5CC49D] transition-colors cursor-pointer flex items-center gap-2">
                             <PhoneOutlined className="text-[#5CC49D]" />
                             {lead.phone || 'N/A'}
                          </div>
                        )}
                      </Col>
                    </Row>

                    <Divider style={{ borderColor: 'rgba(255,255,255,0.06)', margin: '32px 0' }} />

                    <Row>
                      <Col span={24}>
                        <Title level={5} style={{ color: '#5CC49D', marginBottom: 16, fontSize: 12, textTransform: 'uppercase', letterSpacing: '1px' }}>
                          Notes & Context
                        </Title>
                        {editing ? (
                          <TextArea
                            rows={6}
                            value={lead.notes || ''}
                            onChange={(e) => setLead({...lead, notes: e.target.value})}
                            placeholder="Add notes about this lead..."
                            className="bg-black/20 border-white/10"
                          />
                        ) : (
                          <div className="bg-black/20 p-6 rounded-lg border border-white/5">
                            <Paragraph style={{ margin: 0, color: '#94a3b8', lineHeight: '1.8' }}>
                              {lead.notes || 'No notes added yet.'}
                            </Paragraph>
                          </div>
                        )}
                      </Col>
                    </Row>
                  </div>
                </Tabs.TabPane>

                <Tabs.TabPane tab={`Interactions (${interactions.length})`} key="interactions">
                  <div className="py-6">
                    <div className="flex justify-end mb-6">
                       <Button 
                        type="dashed" 
                        icon={<PlusOutlined />} 
                        onClick={() => setIsModalVisible(true)}
                      >
                        Log Activity
                      </Button>
                    </div>

                    {interactions.length > 0 ? (
                      <Timeline className="ml-2">
                        {interactions.map((interaction) => (
                          <Timeline.Item
                            key={interaction.id}
                            dot={
                              <div className="p-2 rounded-full bg-[#141619] border border-white/10">
                                {getInteractionIcon(interaction.type)}
                              </div>
                            }
                            color="#5CC49D"
                          >
                            <div className="ml-4 mb-8">
                              <div className="flex items-center gap-3 mb-2">
                                <Tag className="m-0 border-0 bg-[#5CC49D]/10 text-[#5CC49D] font-semibold text-xs px-2 py-0.5 uppercase">
                                  {interaction.type}
                                </Tag>
                                <Text type="secondary" className="text-xs">
                                  {new Date(interaction.date).toLocaleDateString()} • {new Date(interaction.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </Text>
                              </div>
                              <div className="bg-[#1a1d21] p-4 rounded-lg border border-white/5">
                                <Paragraph className="m-0 text-gray-300">
                                  {interaction.content}
                                </Paragraph>
                                <div className="mt-2 text-xs text-gray-600">
                                  Logged by {interaction.userName}
                                </div>
                              </div>
                            </div>
                          </Timeline.Item>
                        ))}
                      </Timeline>
                    ) : (
                      <div className="text-center py-12 bg-white/5 rounded-xl border border-dashed border-white/10">
                        <HistoryOutlined className="text-4xl text-gray-600 mb-4" />
                        <Text className="block text-gray-500">No interaction history found.</Text>
                      </div>
                    )}
                  </div>
                </Tabs.TabPane>
              </Tabs>
            </Card>
          </Col>

          {/* RIGHT COLUMN: Stats & Actions */}
          <Col xs={24} lg={8}>
            
            {/* Score Card */}
            <Card className="mb-6 border border-white/5" bordered={false}>
              <div className="flex flex-col items-center py-4">
                <div className="relative mb-4">
                  <Progress
                    type="circle"
                    percent={lead.score}
                    strokeColor={{ '0%': '#141619', '100%': getScoreColor(lead.score) }}
                    trailColor="rgba(255,255,255,0.05)"
                    strokeWidth={8}
                    width={160}
                    format={() => null} // Hide default text to customize center
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold text-white tracking-tight">{lead.score}</span>
                    <span className="text-xs text-gray-500 uppercase tracking-widest mt-1">Score</span>
                  </div>
                </div>
                
                <div className="text-center">
                  <Tag 
                    style={{ 
                      backgroundColor: `${getScoreColor(lead.score)}15`, 
                      color: getScoreColor(lead.score),
                      border: `1px solid ${getScoreColor(lead.score)}30`,
                      padding: '4px 12px'
                    }}
                  >
                     {lead.score >= 80 ? 'High Potential' : lead.score >= 50 ? 'Medium Potential' : 'Needs Nurturing'}
                  </Tag>
                </div>
              </div>
            </Card>

            {/* Actions Panel */}
            <Card title="Quick Actions" className="mb-6 border border-white/5" bordered={false}>
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  block 
                  className="h-auto py-3 flex flex-col items-center justify-center gap-1 hover:border-[#5CC49D] group"
                  onClick={() => window.open(`mailto:${lead.email}`, '_blank')}
                  disabled={!lead.email}
                >
                  <MailOutlined className="text-lg group-hover:text-[#5CC49D] transition-colors" />
                  <span className="text-xs">Email</span>
                </Button>
                
                <Button 
                  block 
                  className="h-auto py-3 flex flex-col items-center justify-center gap-1 hover:border-[#5CC49D] group"
                  onClick={() => window.open(`tel:${lead.phone}`, '_blank')}
                  disabled={!lead.phone}
                >
                  <PhoneOutlined className="text-lg group-hover:text-[#5CC49D] transition-colors" />
                  <span className="text-xs">Call</span>
                </Button>

                <Button 
                  block 
                  className="h-auto py-3 flex flex-col items-center justify-center gap-1 hover:border-[#5CC49D] group"
                  onClick={() => window.open(lead.linkedinUrl, '_blank')}
                  disabled={!lead.linkedinUrl}
                >
                  <LinkedinOutlined className="text-lg group-hover:text-[#5CC49D] transition-colors" />
                  <span className="text-xs">LinkedIn</span>
                </Button>

                <Button 
                  block 
                  type="primary"
                  ghost
                  className="h-auto py-3 flex flex-col items-center justify-center gap-1 border-[#5CC49D] text-[#5CC49D] bg-[#5CC49D]/5"
                  onClick={() => {
                    setInteractionType('note');
                    setIsModalVisible(true);
                  }}
                >
                  <MessageOutlined className="text-lg" />
                  <span className="text-xs">Add Note</span>
                </Button>
              </div>
            </Card>

            {/* Metadata (Glass style) */}
            <Card className="bg-transparent border border-white/5" bordered={false}>
              <Space direction="vertical" size="middle" className="w-full">
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Lead ID</span>
                    <span className="text-gray-300 font-mono text-xs bg-white/5 px-2 py-1 rounded">
                      {lead.apolloId || lead.id.substring(0,8)}
                    </span>
                 </div>
                 <Divider style={{ margin: '4px 0', borderColor: 'rgba(255,255,255,0.05)' }} />
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Created</span>
                    <span className="text-gray-300">{new Date(lead.createdAt).toLocaleDateString()}</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Updated</span>
                    <span className="text-gray-300">{new Date(lead.updatedAt).toLocaleDateString()}</span>
                 </div>
                 {lead.lastContacted && (
                   <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Last Contact</span>
                      <span className="text-[#5CC49D]">{new Date(lead.lastContacted).toLocaleDateString()}</span>
                   </div>
                 )}
              </Space>
            </Card>
          </Col>
        </Row>

        {/* Modal - Dark Mode Optimized */}
        <Modal
          title={<span className="text-white">Log Interaction</span>}
          open={isModalVisible}
          onOk={handleAddInteraction}
          onCancel={() => setIsModalVisible(false)}
          okText="Save Log"
          centered
          width={500}
        >
          <Form layout="vertical" className="mt-6">
            <Form.Item label={<span className="text-gray-400">Interaction Type</span>}>
              <Select
                value={interactionType}
                onChange={setInteractionType}
                size="large"
              >
                <Option value="note">Note</Option>
                <Option value="email">Email</Option>
                <Option value="call">Call</Option>
                <Option value="meeting">Meeting</Option>
              </Select>
            </Form.Item>
            <Form.Item label={<span className="text-gray-400">Content</span>}>
              <TextArea
                rows={6}
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Enter details..."
                className="bg-black/20"
              />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </ConfigProvider>
  );
};

export default LeadDetailPage;