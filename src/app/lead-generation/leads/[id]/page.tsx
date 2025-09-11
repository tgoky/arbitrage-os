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
  Divider,
  Avatar,
  Statistic,
  Progress,
  List,
  message,
  Spin,
  Descriptions,
  Tabs,
  Timeline,
  Input,
  Modal,
  Form,
  Select
} from 'antd';
import {
  ArrowLeftOutlined,
  MailOutlined,
  PhoneOutlined,
  LinkedinOutlined,
  GlobalOutlined,
  StarOutlined,
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  UserOutlined,

  EnvironmentOutlined,
  HistoryOutlined,
  MessageOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import { useParams, useRouter } from 'next/navigation';
import { useTheme } from '../../../../providers/ThemeProvider';
import { useWorkspaceContext } from '../../../hooks/useWorkspaceContext';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
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

const LeadDetailPage = () => {
  const { id } = useParams();
  const router = useRouter();
  const { theme } = useTheme();
  const { currentWorkspace, getWorkspaceScopedEndpoint } = useWorkspaceContext();
  
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
      
      // Load lead details
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
      message.error('Failed to load lead data');
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notes: lead.notes,
          status: lead.status
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          message.success('Lead updated successfully');
          setEditing(false);
        } else {
          message.error(data.error || 'Failed to update lead');
        }
      } else {
        message.error('Failed to update lead');
      }
    } catch (error) {
      console.error('Error updating lead:', error);
      message.error('Failed to update lead');
    }
  };

  const handleAddInteraction = async () => {
    if (!noteContent.trim()) {
      message.warning('Please enter content for the interaction');
      return;
    }
    
    try {
      const endpoint = getWorkspaceScopedEndpoint(`/api/leads/${id}/interactions`);
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: interactionType,
          content: noteContent
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          message.success('Interaction added successfully');
          setNoteContent('');
          setIsModalVisible(false);
          loadLeadData(); // Reload to get updated interactions
        } else {
          message.error(data.error || 'Failed to add interaction');
        }
      } else {
        message.error('Failed to add interaction');
      }
    } catch (error) {
      console.error('Error adding interaction:', error);
      message.error('Failed to add interaction');
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#52c41a';
    if (score >= 60) return '#faad14';
    return '#ff4d4f';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'blue';
      case 'contacted': return 'orange';
      case 'qualified': return 'green';
      case 'unqualified': return 'red';
      default: return 'default';
    }
  };

  const getInteractionIcon = (type: string) => {
    switch (type) {
      case 'email': return <MailOutlined />;
      case 'call': return <PhoneOutlined />;
      case 'meeting': return <CalendarOutlined />;
      case 'note': return <MessageOutlined />;
      default: return <MessageOutlined />;
    }
  };

  if (loading) {
    return (
      <div style={{
        backgroundColor: theme === 'dark' ? '#000000' : '#ffffff',
        padding: 24,
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div style={{
        backgroundColor: theme === 'dark' ? '#000000' : '#ffffff',
        padding: 24,
        minHeight: '100vh'
      }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => router.push('/lead-generation')}
          className="mb-4"
        >
          Back to Leads
        </Button>
        <Title level={3}>Lead not found</Title>
        <Text>The requested lead could not be found.</Text>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: theme === 'dark' ? '#000000' : '#ffffff',
      padding: 24,
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div className="mb-6">
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => router.push('/lead-generation')}
          className="mb-4"
        >
          Back to Leads
        </Button>
        
        <div className="flex justify-between items-start">
          <Space size="large" align="start">
            <Avatar 
              size={64}
              src={`https://i.pravatar.cc/64?u=${lead.id}`}
              icon={<UserOutlined />}
            />
            <div>
              <Title level={2} className="mb-1">{lead.name}</Title>
              <Text type="secondary">{lead.title} at {lead.company}</Text>
              <div className="mt-2">
                <Tag color={getStatusColor(lead.status)}>{lead.status.toUpperCase()}</Tag>
                <Tag color="default">{lead.industry}</Tag>
                <Tag icon={<EnvironmentOutlined />}>{lead.location}</Tag>
              </div>
            </div>
          </Space>
          
          <Space>
            <Button icon={<EditOutlined />} onClick={() => setEditing(!editing)}>
              {editing ? 'Cancel Edit' : 'Edit'}
            </Button>
            {editing && (
              <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveNotes}>
                Save Changes
              </Button>
            )}
          </Space>
        </div>
      </div>

      <Row gutter={24}>
        {/* Left Column - Lead Details */}
        <Col span={16}>
          <Card className="mb-6">
            <Tabs defaultActiveKey="details">
              <Tabs.TabPane tab="Details" key="details">
                <Descriptions column={2} bordered>
                  <Descriptions.Item label="Full Name" span={2}>
                    {editing ? (
                      <Input 
                        value={lead.name} 
                        onChange={(e) => setLead({...lead, name: e.target.value})}
                      />
                    ) : (
                      lead.name
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="Title">
                    {editing ? (
                      <Input 
                        value={lead.title} 
                        onChange={(e) => setLead({...lead, title: e.target.value})}
                      />
                    ) : (
                      lead.title
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="Company">
                    {editing ? (
                      <Input 
                        value={lead.company} 
                        onChange={(e) => setLead({...lead, company: e.target.value})}
                      />
                    ) : (
                      lead.company
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="Industry">
                    {editing ? (
                      <Input 
                        value={lead.industry} 
                        onChange={(e) => setLead({...lead, industry: e.target.value})}
                      />
                    ) : (
                      lead.industry
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="Location">
                    {editing ? (
                      <Input 
                        value={lead.location} 
                        onChange={(e) => setLead({...lead, location: e.target.value})}
                      />
                    ) : (
                      lead.location
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="Status">
                    {editing ? (
                      <Select
                        value={lead.status}
                        onChange={(value) => setLead({...lead, status: value})}
                        style={{ width: '100%' }}
                      >
                        <Option value="new">New</Option>
                        <Option value="contacted">Contacted</Option>
                        <Option value="qualified">Qualified</Option>
                        <Option value="unqualified">Unqualified</Option>
                      </Select>
                    ) : (
                      <Tag color={getStatusColor(lead.status)}>{lead.status.toUpperCase()}</Tag>
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="Email" span={2}>
                    {editing ? (
                      <Input 
                        value={lead.email || ''} 
                        onChange={(e) => setLead({...lead, email: e.target.value})}
                      />
                    ) : lead.email ? (
                      <a href={`mailto:${lead.email}`}>
                        <Space>
                          <MailOutlined />
                          {lead.email}
                        </Space>
                      </a>
                    ) : (
                      <Text type="secondary">Not available</Text>
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="Phone">
                    {editing ? (
                      <Input 
                        value={lead.phone || ''} 
                        onChange={(e) => setLead({...lead, phone: e.target.value})}
                      />
                    ) : lead.phone ? (
                      <a href={`tel:${lead.phone}`}>
                        <Space>
                          <PhoneOutlined />
                          {lead.phone}
                        </Space>
                      </a>
                    ) : (
                      <Text type="secondary">Not available</Text>
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="LinkedIn">
                    {lead.linkedinUrl ? (
                      <a href={lead.linkedinUrl} target="_blank" rel="noopener noreferrer">
                        <Space>
                          <LinkedinOutlined />
                          View Profile
                        </Space>
                      </a>
                    ) : (
                      <Text type="secondary">Not available</Text>
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="Website">
                    {lead.website ? (
                      <a href={lead.website} target="_blank" rel="noopener noreferrer">
                        <Space>
                          <GlobalOutlined />
                          Visit Website
                        </Space>
                      </a>
                    ) : (
                      <Text type="secondary">Not available</Text>
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="Notes" span={2}>
                    {editing ? (
                      <TextArea
                        rows={4}
                        value={lead.notes || ''}
                        onChange={(e) => setLead({...lead, notes: e.target.value})}
                        placeholder="Add notes about this lead..."
                      />
                    ) : (
                      <Paragraph>
                        {lead.notes || 'No notes added yet.'}
                      </Paragraph>
                    )}
                  </Descriptions.Item>
                </Descriptions>
              </Tabs.TabPane>

              <Tabs.TabPane tab="Interactions" key="interactions">
                <div className="mb-4">
                  <Button 
                    type="primary" 
                    onClick={() => setIsModalVisible(true)}
                  >
                    Add Interaction
                  </Button>
                </div>
                
                {interactions.length > 0 ? (
                  <Timeline>
                    {interactions.map((interaction) => (
                      <Timeline.Item
                        key={interaction.id}
                        dot={getInteractionIcon(interaction.type)}
                        color={
                          interaction.type === 'email' ? 'blue' :
                          interaction.type === 'call' ? 'green' :
                          interaction.type === 'meeting' ? 'orange' : 'gray'
                        }
                      >
                        <Card size="small">
                          <div className="flex justify-between">
                            <Text strong>{interaction.userName}</Text>
                            <Text type="secondary">
                              {new Date(interaction.date).toLocaleDateString()} at{' '}
                              {new Date(interaction.date).toLocaleTimeString()}
                            </Text>
                          </div>
                          <div className="mt-2">
                            <Tag color={
                              interaction.type === 'email' ? 'blue' :
                              interaction.type === 'call' ? 'green' :
                              interaction.type === 'meeting' ? 'orange' : 'default'
                            }>
                              {interaction.type.toUpperCase()}
                            </Tag>
                          </div>
                          <Paragraph className="mt-2">
                            {interaction.content}
                          </Paragraph>
                        </Card>
                      </Timeline.Item>
                    ))}
                  </Timeline>
                ) : (
                  <div className="text-center py-8">
                    <HistoryOutlined className="text-3xl text-gray-400 mb-4" />
                    <Text type="secondary">No interactions recorded yet.</Text>
                  </div>
                )}
              </Tabs.TabPane>
            </Tabs>
          </Card>
        </Col>

        {/* Right Column - Stats and Actions */}
        <Col span={8}>
          {/* Lead Score */}
          <Card className="mb-6">
            <div className="text-center">
              <Title level={4}>Lead Score</Title>
              <Progress
                type="circle"
                percent={lead.score}
                format={percent => (
                  <div>
                    <div style={{ 
                      color: getScoreColor(lead.score), 
                      fontSize: '24px', 
                      fontWeight: 'bold' 
                    }}>
                      {percent}
                    </div>
                    <div style={{ fontSize: '12px', marginTop: '8px' }}>
                      Score
                    </div>
                  </div>
                )}
                strokeColor={getScoreColor(lead.score)}
                size={150}
              />
              <div className="mt-4">
                <Text>
                  {lead.score >= 80 ? 'High quality lead' :
                   lead.score >= 60 ? 'Medium quality lead' :
                   'Low quality lead'}
                </Text>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card title="Quick Actions" className="mb-6">
            <Space direction="vertical" style={{ width: '100%' }}>
              {lead.email && (
                <Button 
                  block 
                  icon={<MailOutlined />}
                  onClick={() => window.open(`mailto:${lead.email}`, '_blank')}
                >
                  Send Email
                </Button>
              )}
              {lead.phone && (
                <Button 
                  block 
                  icon={<PhoneOutlined />}
                  onClick={() => window.open(`tel:${lead.phone}`, '_blank')}
                >
                  Make Call
                </Button>
              )}
              {lead.linkedinUrl && (
                <Button 
                  block 
                  icon={<LinkedinOutlined />}
                  onClick={() => window.open(lead.linkedinUrl, '_blank')}
                >
                  View LinkedIn
                </Button>
              )}
              <Button 
                block 
                icon={<MessageOutlined />}
                onClick={() => {
                  setInteractionType('note');
                  setIsModalVisible(true);
                }}
              >
                Add Note
              </Button>
            </Space>
          </Card>

          {/* Lead Metadata */}
          <Card title="Metadata">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Created">
                {new Date(lead.createdAt).toLocaleDateString()}
              </Descriptions.Item>
              <Descriptions.Item label="Last Updated">
                {new Date(lead.updatedAt).toLocaleDateString()}
              </Descriptions.Item>
              {lead.lastContacted && (
                <Descriptions.Item label="Last Contacted">
                  {new Date(lead.lastContacted).toLocaleDateString()}
                </Descriptions.Item>
              )}
              {lead.apolloId && (
                <Descriptions.Item label="Apollo ID">
                  {lead.apolloId}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>
        </Col>
      </Row>

      {/* Add Interaction Modal */}
      <Modal
        title="Add Interaction"
        open={isModalVisible}
        onOk={handleAddInteraction}
        onCancel={() => setIsModalVisible(false)}
        okText="Add Interaction"
      >
        <Form layout="vertical">
          <Form.Item label="Interaction Type">
            <Select
              value={interactionType}
              onChange={setInteractionType}
            >
              <Option value="note">Note</Option>
              <Option value="email">Email</Option>
              <Option value="call">Call</Option>
              <Option value="meeting">Meeting</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Content">
            <TextArea
              rows={4}
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder={
                interactionType === 'email' ? 'Email content...' :
                interactionType === 'call' ? 'Call summary...' :
                interactionType === 'meeting' ? 'Meeting notes...' :
                'Note content...'
              }
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default LeadDetailPage;