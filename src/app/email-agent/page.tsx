"use client";

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Table, 
  Tag, 
  Space, 
  Modal, 
  Input, 
  Select, 
  Switch,
  Tabs,
  Statistic,
  Progress,
  notification,
  Checkbox,
  InputNumber,
  List,
  Badge,
  Spin,
  Alert,
  Tooltip,
  Empty,
} from 'antd';
import {
  MailOutlined,
  GoogleOutlined,
  SendOutlined,
  UserOutlined,
  RobotOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  ReloadOutlined,
  DeleteOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { useRouter, useSearchParams } from 'next/navigation';
import { useWorkspaceContext } from '../hooks/useWorkspaceContext';

const { Option } = Select;
const { TextArea } = Input;

interface EmailAccount {
  id: string;
  email: string;
  provider: string;
  enabled: boolean;
  daily_limit: number;
  created_at: string;
}

interface Campaign {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'paused' | 'completed' | 'draft';
  emails_sent: number;
  emails_opened: number;
  emails_replied: number;
  target_leads: string[];
  emailAccount?: {
    email: string;
  };
  created_at: string;
}

interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  company?: string;
  job_title?: string;
  status: 'new' | 'contacted' | 'replied' | 'interested' | 'not_interested' | 'converted';
  last_contacted?: string;
  last_reply?: string;
}

interface InboundEmail {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  sentiment?: string;
  ai_summary?: string;
  received_at: string;
  processed: boolean;
  requires_action: boolean;
}

interface Analytics {
  totalCampaigns: number;
  activeCampaigns: number;
  emailsSent: number;
  emailsOpened: number;
  emailsReplied: number;
  averageOpenRate: number;
  averageReplyRate: number;
  topPerformingCampaigns: Array<{
    id: string;
    name: string;
    openRate: number;
    replyRate: number;
  }>;
  sentimentDistribution: {
    interested: number;
    neutral: number;
    negative: number;
    not_interested: number;
  };
}

interface EmailAgentDashboardProps {
  workspaceId: string;
}

const EmailAgentDashboard: React.FC<EmailAgentDashboardProps> = ({ workspaceId: propWorkspaceId }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // ✅ Use workspace context (same pattern as ColdEmailWriter)
  const { currentWorkspace, isWorkspaceReady } = useWorkspaceContext();
  
  // ✅ Prefer workspace context, fallback to prop
  const workspaceId = currentWorkspace?.id || propWorkspaceId;
  
  // ✅ Validate workspace ID immediately
  useEffect(() => {
    if (!isWorkspaceReady) {
      return; // Still loading
    }
    
    if (!workspaceId || workspaceId === 'undefined') {
      console.error('❌ Invalid workspace ID:', workspaceId);
      notification.error({
        message: 'Invalid Workspace',
        description: 'Workspace ID is missing. Redirecting to dashboard...',
      });
      router.push('/dashboard');
    } else {
      console.log('✅ Email Agent - Valid workspace ID:', workspaceId);
    }
  }, [workspaceId, isWorkspaceReady, router]);
  
  const [activeTab, setActiveTab] = useState('overview');
  const [emailAccounts, setEmailAccounts] = useState<EmailAccount[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [inboxItems, setInboxItems] = useState<InboundEmail[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  
  const [connectModalVisible, setConnectModalVisible] = useState(false);
  const [campaignModalVisible, setCampaignModalVisible] = useState(false);
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    description: '',
    emailAccountId: '',
    leadIds: [] as string[],
    scheduleType: 'immediate' as 'immediate' | 'scheduled' | 'drip',
    autoReply: true,
    autoFollowup: true,
    maxFollowups: 3,
    dripInterval: 3,
    emailTemplate: {
      method: 'value_proposition',
      tone: 'professional',
      valueProposition: '',
      targetIndustry: '',
      targetRole: '',
    }
  });

  // Check for OAuth callback success
useEffect(() => {
  const connected = searchParams.get('connected');
  const error = searchParams.get('error');
  const workspaceIdFromQuery = searchParams.get('workspaceId');
  
  if (connected === 'true') {
    notification.success({
      message: 'Email Connected',
      description: 'Your Gmail account has been successfully connected!',
    });
    
    // Remove query params (clean URL)
    const cleanUrl = workspaceIdFromQuery 
      ? `/email-agent?workspaceId=${workspaceIdFromQuery}`
      : '/email-agent';
    router.replace(cleanUrl);
    
    // Reload dashboard data
    loadDashboardData();
  }

  if (error) {
    notification.error({
      message: 'Connection Failed',
      description: getErrorMessage(error),
    });
    
    // Remove error query param
    const cleanUrl = workspaceIdFromQuery 
      ? `/email-agent?workspaceId=${workspaceIdFromQuery}`
      : '/email-agent';
    router.replace(cleanUrl);
  }
}, [searchParams, router]);

  useEffect(() => {
    loadDashboardData();
  }, [workspaceId]);

  const getErrorMessage = (error: string) => {
    const messages: Record<string, string> = {
      access_denied: 'You denied access to your Gmail account',
      invalid_callback: 'Invalid OAuth callback',
      unauthorized: 'You must be logged in',
      connection_failed: 'Failed to connect Gmail account',
    };
    return messages[error] || 'An unknown error occurred';
  };

  const loadDashboardData = async () => {

      if (!workspaceId || workspaceId === 'undefined') {
    console.warn('⚠️ Skipping analytics load - invalid workspace ID');
    setAnalytics(null);
    return;
  }

  
    setPageLoading(true);
    try {
      await Promise.all([
        loadEmailAccounts(),
        loadCampaigns(),
        loadLeads(),
        loadInbox(),
        loadAnalytics(),
      ]);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      notification.error({
        message: 'Load Failed',
        description: 'Failed to load dashboard data',
      });
    } finally {
      setPageLoading(false);
    }
  };

  const loadEmailAccounts = async () => {

      if (!workspaceId || workspaceId === 'undefined') {
    console.warn('⚠️ Skipping analytics load - invalid workspace ID');
    setAnalytics(null);
    return;
  }


    try {
      const res = await fetch(`/api/email-agent/accounts?workspaceId=${workspaceId}`);
      const data = await res.json();
      
      if (data.success) {
        // ✅ FIXED: Correct path is data.data.accounts
        setEmailAccounts(data.data?.accounts || []);
      } else {
        console.error('Failed to load accounts:', data.error);
        setEmailAccounts([]);
      }
    } catch (error) {
      console.error('Failed to load email accounts:', error);
      setEmailAccounts([]);
    }
  };



 const loadCampaigns = async () => {

    if (!workspaceId || workspaceId === 'undefined') {
    console.warn('⚠️ Skipping analytics load - invalid workspace ID');
    setAnalytics(null);
    return;
  }

    try {
      const res = await fetch(`/api/email-agent/campaigns?workspaceId=${workspaceId}`);
      const data = await res.json();
      
      if (data.success) {
        // ✅ FIXED: Correct path is data.data (array directly)
        setCampaigns(data.data || []);
      } else {
        console.error('Failed to load campaigns:', data.error);
        setCampaigns([]);
      }
    } catch (error) {
      console.error('Failed to load campaigns:', error);
      setCampaigns([]);
    }
  };


 
    const loadLeads = async () => {

        if (!workspaceId || workspaceId === 'undefined') {
    console.warn('⚠️ Skipping analytics load - invalid workspace ID');
    setAnalytics(null);
    return;
  }


    try {
      const res = await fetch(`/api/email-agent/leads?workspaceId=${workspaceId}`);
      const data = await res.json();
      
      if (data.success) {
        // ✅ FIXED: Correct path is data.data.leads
        setLeads(data.data?.leads || []);
      } else {
        console.error('Failed to load leads:', data.error);
        setLeads([]);
      }
    } catch (error) {
      console.error('Failed to load leads:', error);
      setLeads([]);
    }
  };


  const loadInbox = async () => {

      if (!workspaceId || workspaceId === 'undefined') {
    console.warn('⚠️ Skipping analytics load - invalid workspace ID');
    setAnalytics(null);
    return;
  }


    try {
      const res = await fetch(`/api/email-agent/inbox?workspaceId=${workspaceId}`);
      const data = await res.json();
      
      if (data.success) {
        // ✅ FIXED: Correct path is data.data.emails
        setInboxItems(data.data?.emails || []);
      } else {
        console.error('Failed to load inbox:', data.error);
        setInboxItems([]);
      }
    } catch (error) {
      console.error('Failed to load inbox:', error);
      setInboxItems([]);
    }
  };


   const loadAnalytics = async () => {

      if (!workspaceId || workspaceId === 'undefined') {
    console.warn('⚠️ Skipping analytics load - invalid workspace ID');
    setAnalytics(null);
    return;
  }

    try {
      const res = await fetch(`/api/email-agent/analytics?workspaceId=${workspaceId}`);
      const data = await res.json();
      
      if (data.success) {
        // ✅ FIXED: Correct path is data.data
        setAnalytics(data.data || null);
      } else {
        console.error('Failed to load analytics:', data.error);
        setAnalytics(null);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
      setAnalytics(null);
    }
  };
  

  const handleConnectGmail = () => {
    // Redirect to Google OAuth
    const redirectUri = `${window.location.origin}/api/auth/google/callback`;
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent('https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly')}&` +
      `access_type=offline&` +
      `prompt=consent&` +
      `state=${workspaceId}`;
    
    window.location.href = authUrl;
  };

  const handleDisconnectAccount = async (accountId: string) => {
    Modal.confirm({
      title: 'Disconnect Email Account',
      content: 'Are you sure you want to disconnect this email account? All associated campaigns will be paused.',
      okText: 'Disconnect',
      okType: 'danger',
      onOk: async () => {
        try {
          const res = await fetch(`/api/email-agent/accounts/${accountId}`, {
            method: 'DELETE',
          });
          
          const data = await res.json();
          
          if (data.success) {
            notification.success({
              message: 'Account Disconnected',
              description: 'Email account has been disconnected',
            });
            loadEmailAccounts();
            loadCampaigns();
          } else {
            throw new Error(data.error);
          }
        } catch (error: any) {
          notification.error({
            message: 'Disconnect Failed',
            description: error.message || 'Failed to disconnect email account',
          });
        }
      }
    });
  };

  const handleCreateCampaign = async () => {
    if (!campaignForm.name || !campaignForm.emailAccountId || campaignForm.leadIds.length === 0) {
      notification.error({
        message: 'Validation Error',
        description: 'Please fill in campaign name, select an email account, and choose at least one lead',
      });
      return;
    }

    if (!campaignForm.emailTemplate.valueProposition) {
      notification.error({
        message: 'Validation Error',
        description: 'Please provide your value proposition',
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/email-agent/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          ...campaignForm,
        }),
      });

      const data = await res.json();

      if (data.success) {
        notification.success({
          message: 'Campaign Created',
          description: `Campaign "${campaignForm.name}" has been created and ${campaignForm.scheduleType === 'immediate' ? 'is now sending emails' : 'saved as draft'}`,
          duration: 5,
        });
        
        setCampaignModalVisible(false);
        resetCampaignForm();
        loadCampaigns();
        loadAnalytics();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      notification.error({
        message: 'Campaign Creation Failed',
        description: error.message || 'Failed to create campaign',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetCampaignForm = () => {
    setCampaignForm({
      name: '',
      description: '',
      emailAccountId: '',
      leadIds: [],
      scheduleType: 'immediate',
      autoReply: true,
      autoFollowup: true,
      maxFollowups: 3,
      dripInterval: 3,
      emailTemplate: {
        method: 'value_proposition',
        tone: 'professional',
        valueProposition: '',
        targetIndustry: '',
        targetRole: '',
      }
    });
  };

  const handlePauseCampaign = async (campaignId: string) => {
    try {
      const res = await fetch(`/api/email-agent/campaigns/${campaignId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pause' }),
      });

      const data = await res.json();

      if (data.success) {
        notification.success({
          message: 'Campaign Paused',
          description: 'Campaign has been paused',
        });
        loadCampaigns();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      notification.error({
        message: 'Pause Failed',
        description: error.message || 'Failed to pause campaign',
      });
    }
  };

  const handleResumeCampaign = async (campaignId: string) => {
    try {
      const res = await fetch(`/api/email-agent/campaigns/${campaignId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resume' }),
      });

      const data = await res.json();

      if (data.success) {
        notification.success({
          message: 'Campaign Resumed',
          description: 'Campaign has been resumed',
        });
        loadCampaigns();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      notification.error({
        message: 'Resume Failed',
        description: error.message || 'Failed to resume campaign',
      });
    }
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    Modal.confirm({
      title: 'Delete Campaign',
      content: 'Are you sure you want to delete this campaign? This cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          const res = await fetch(`/api/email-agent/campaigns/${campaignId}`, {
            method: 'DELETE',
          });

          const data = await res.json();

          if (data.success) {
            notification.success({
              message: 'Campaign Deleted',
              description: 'Campaign has been deleted',
            });
            loadCampaigns();
            loadAnalytics();
          } else {
            throw new Error(data.error);
          }
        } catch (error: any) {
          notification.error({
            message: 'Delete Failed',
            description: error.message || 'Failed to delete campaign',
          });
        }
      }
    });
  };

  const campaignColumns = [
    {
      title: 'Campaign Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Campaign) => (
        <div>
          <div style={{ fontWeight: 500 }}>{name}</div>
          {record.description && (
            <div style={{ fontSize: '12px', color: '#666' }}>{record.description}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors: Record<string, string> = {
          active: 'green',
          draft: 'orange',
          completed: 'blue',
          paused: 'gray'
        };
        return <Tag color={colors[status]}>{status.toUpperCase()}</Tag>;
      }
    },
    {
      title: 'Email Account',
      dataIndex: ['emailAccount', 'email'],
      key: 'email',
    },
    {
      title: 'Progress',
      key: 'progress',
      render: (record: Campaign) => (
        <div>
          <div style={{ fontSize: '12px', marginBottom: '4px' }}>
            {record.emails_sent} / {record.target_leads.length} sent
          </div>
          <Progress 
            percent={record.target_leads.length > 0 
              ? Math.round((record.emails_sent / record.target_leads.length) * 100)
              : 0
            } 
            size="small" 
            status={record.status === 'completed' ? 'success' : 'active'}
          />
        </div>
      )
    },
    {
      title: 'Opened',
      dataIndex: 'emails_opened',
      key: 'emails_opened',
      render: (opened: number, record: Campaign) => (
        <span>
          {opened} ({record.emails_sent > 0 ? Math.round((opened / record.emails_sent) * 100) : 0}%)
        </span>
      )
    },
    {
      title: 'Replied',
      dataIndex: 'emails_replied',
      key: 'emails_replied',
      render: (replied: number, record: Campaign) => (
        <div>
          <Tag color="green">{replied}</Tag>
          {record.emails_sent > 0 && (
            <div style={{ fontSize: '11px', color: '#666' }}>
              {Math.round((replied / record.emails_sent) * 100)}% rate
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: Campaign) => (
        <Space>
          <Tooltip title="View Details">
            <Button 
              icon={<EyeOutlined />} 
              size="small"
              onClick={() => router.push(`/dashboard/${workspaceId}/email-agent/campaigns/${record.id}`)}
            />
          </Tooltip>
          
          {record.status === 'active' && (
            <Tooltip title="Pause Campaign">
              <Button 
                icon={<PauseCircleOutlined />}
                size="small"
                onClick={() => handlePauseCampaign(record.id)}
              />
            </Tooltip>
          )}
          
          {record.status === 'paused' && (
            <Tooltip title="Resume Campaign">
              <Button 
                icon={<PlayCircleOutlined />}
                size="small"
                type="primary"
                onClick={() => handleResumeCampaign(record.id)}
              />
            </Tooltip>
          )}
          
          <Tooltip title="Delete Campaign">
            <Button 
              icon={<DeleteOutlined />}
              size="small"
              danger
              onClick={() => handleDeleteCampaign(record.id)}
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  const leadColumns = [
    {
      title: 'Name',
      key: 'name',
      render: (record: Lead) => (
        <div>
          <div style={{ fontWeight: 500 }}>
            {record.first_name} {record.last_name}
          </div>
          {record.job_title && (
            <div style={{ fontSize: '12px', color: '#666' }}>{record.job_title}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Company',
      dataIndex: 'company',
      key: 'company',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors: Record<string, string> = {
          new: 'blue',
          contacted: 'orange',
          replied: 'cyan',
          interested: 'green',
          not_interested: 'red',
          converted: 'purple'
        };
        return <Tag color={colors[status]}>{status.replace('_', ' ').toUpperCase()}</Tag>;
      }
    },
    {
      title: 'Last Contact',
      dataIndex: 'last_contacted',
      key: 'last_contacted',
      render: (date: string) => date ? new Date(date).toLocaleDateString() : 'Never',
    },
  ];

  const getSentimentColor = (sentiment?: string) => {
    const colors: Record<string, string> = {
      interested: 'green',
      neutral: 'blue',
      negative: 'orange',
      not_interested: 'red',
    };
    return colors[sentiment || 'neutral'] || 'default';
  };

  if (pageLoading) {
    return (
      <div style={{ padding: '100px', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px', color: '#666' }}>Loading Email Agent...</div>
      </div>
    );
  }

  // Show setup screen if no email accounts
  if (emailAccounts.length === 0) {
    return (
      <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
        <Card>
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <RobotOutlined style={{ fontSize: '64px', color: '#5CC49D', marginBottom: '24px' }} />
            <h2 style={{ fontSize: '24px', marginBottom: '12px' }}>Welcome to Email Agent</h2>
            <p style={{ color: '#666', fontSize: '16px', marginBottom: '32px', maxWidth: '500px', margin: '0 auto 32px' }}>
              Connect your Gmail account to start sending automated cold email campaigns with AI-powered follow-ups
            </p>
            
            <Button
              type="primary"
              size="large"
              icon={<GoogleOutlined />}
              onClick={handleConnectGmail}
              style={{ background: '#5CC49D', borderColor: '#5CC49D', height: '48px', padding: '0 32px', fontSize: '16px' }}
            >
              Connect Gmail Account
            </Button>

            <Alert
              message="What happens next?"
              description={
                <ul style={{ textAlign: 'left', paddingLeft: '20px' }}>
                  <li>You will authorize read and send permissions for your Gmail</li>
                  <li>Your credentials are encrypted and stored securely</li>
                  <li>You can create AI-powered email campaigns</li>
                  <li>The agent will handle replies and follow-ups automatically</li>
                </ul>
              }
              type="info"
              style={{ marginTop: '32px', textAlign: 'left' }}
            />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 600 }}>
              <RobotOutlined style={{ marginRight: '12px', color: '#5CC49D' }} />
              Email Agent
            </h1>
            <p style={{ margin: '8px 0 0 0', color: '#666' }}>
              Automated cold email campaigns with AI-powered follow-ups
            </p>
          </div>
          <Space>
            <Button 
              icon={<ReloadOutlined />}
              onClick={loadDashboardData}
              loading={loading}
            >
              Refresh
            </Button>
            <Button 
              icon={<GoogleOutlined />} 
              onClick={() => setConnectModalVisible(true)}
            >
              Connect Email
            </Button>
            <Button 
              type="primary" 
              icon={<SendOutlined />}
              onClick={() => setCampaignModalVisible(true)}
              style={{ background: '#5CC49D', borderColor: '#5CC49D' }}
              disabled={emailAccounts.length === 0}
            >
              New Campaign
            </Button>
          </Space>
        </div>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <Tabs.TabPane tab="Overview" key="overview">
          {analytics && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                <Card>
                  <Statistic
                    title="Active Campaigns"
                    value={analytics.activeCampaigns}
                    prefix={<ThunderboltOutlined />}
                  />
                </Card>
                <Card>
                  <Statistic
                    title="Emails Sent"
                    value={analytics.emailsSent}
                    prefix={<SendOutlined />}
                  />
                </Card>
                <Card>
                  <Statistic
                    title="Average Open Rate"
                    value={analytics.averageOpenRate.toFixed(1)}
                    suffix="%"
                    prefix={<EyeOutlined />}
                    valueStyle={{ color: analytics.averageOpenRate > 20 ? '#52c41a' : '#faad14' }}
                  />
                </Card>
                <Card>
                  <Statistic
                    title="Average Reply Rate"
                    value={analytics.averageReplyRate.toFixed(1)}
                    suffix="%"
                    prefix={<CheckCircleOutlined />}
                    valueStyle={{ color: analytics.averageReplyRate > 5 ? '#52c41a' : '#faad14' }}
                  />
                </Card>
              </div>

              {analytics.topPerformingCampaigns.length > 0 && (
                <Card title="Top Performing Campaigns" style={{ marginBottom: '24px' }}>
                  <List
                    dataSource={analytics.topPerformingCampaigns}
                    renderItem={(item) => (
                      <List.Item>
                        <List.Item.Meta
                          title={item.name}
                          description={
                            <Space size="large">
                              <span>Open Rate: <strong>{item.openRate.toFixed(1)}%</strong></span>
                              <span>Reply Rate: <strong style={{ color: '#52c41a' }}>{item.replyRate.toFixed(1)}%</strong></span>
                            </Space>
                          }
                        />
                      </List.Item>
                    )}
                  />
                </Card>
              )}
            </>
          )}

          <Card title="Active Campaigns" style={{ marginBottom: '24px' }}>
            <Table
              dataSource={campaigns.filter((c) => c.status === 'active')}
              columns={campaignColumns}
              rowKey="id"
              pagination={false}
              locale={{ emptyText: <Empty description="No active campaigns" /> }}
            />
          </Card>

          <Card title="Recent Inbound Emails">
            <List
              dataSource={inboxItems.slice(0, 10)}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Button size="small" key="view">View</Button>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Badge 
                        status={item.processed ? 'default' : 'success'} 
                        dot={!item.processed}
                      />
                    }
                    title={
                      <Space>
                        <span>{item.from}</span>
                        {item.sentiment && (
                          <Tag color={getSentimentColor(item.sentiment)}>
                            {item.sentiment}
                          </Tag>
                        )}
                        {item.requires_action && (
                          <Tag color="red" icon={<WarningOutlined />}>
                            Action Required
                          </Tag>
                        )}
                      </Space>
                    }
                    description={
                      <div>
                        <div><strong>Subject:</strong> {item.subject}</div>
                        {item.ai_summary ? (
                          <div style={{ marginTop: '4px', color: '#666' }}>
                            <strong>Summary:</strong> {item.ai_summary}
                          </div>
                        ) : (
                          <div style={{ marginTop: '4px', color: '#666' }}>
                            {item.body?.substring(0, 150)}...
                          </div>
                        )}
                        <div style={{ marginTop: '4px', fontSize: '11px', color: '#999' }}>
                          {new Date(item.received_at).toLocaleString()}
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
              locale={{ emptyText: <Empty description="No inbound emails" /> }}
            />
          </Card>
        </Tabs.TabPane>

        <Tabs.TabPane tab="Campaigns" key="campaigns">
          <Card>
            <Table
              dataSource={campaigns}
              columns={campaignColumns}
              rowKey="id"
              pagination={{ pageSize: 20 }}
              locale={{ emptyText: <Empty description="No campaigns yet" /> }}
            />
          </Card>
        </Tabs.TabPane>

        <Tabs.TabPane tab="Leads" key="leads">
          <Card 
            extra={
              <Space>
                <Select defaultValue="all" style={{ width: 150 }}>
                  <Option value="all">All Statuses</Option>
                  <Option value="new">New</Option>
                  <Option value="contacted">Contacted</Option>
                  <Option value="replied">Replied</Option>
                  <Option value="interested">Interested</Option>
                </Select>
                <Button icon={<ReloadOutlined />} onClick={loadLeads}>Refresh</Button>
              </Space>
            }
          >
            <Table
              dataSource={leads}
              columns={leadColumns}
              rowKey="id"
              pagination={{ pageSize: 50 }}
              locale={{ emptyText: <Empty description="No leads found" /> }}
            />
          </Card>
        </Tabs.TabPane>

        <Tabs.TabPane tab="Settings" key="settings">
          <Card title="Connected Email Accounts">
            <List
              dataSource={emailAccounts}
              renderItem={(account) => (
                <List.Item
                  actions={[
                    <Switch 
                      key="toggle"
                      defaultChecked={account.enabled} 
                      onChange={(checked) => {
                        // TODO: Add API call to toggle account
                        console.log('Toggle account:', account.id, checked);
                      }}
                    />,
                    <Button 
                      key="disconnect"
                      danger 
                      size="small"
                      onClick={() => handleDisconnectAccount(account.id)}
                    >
                      Disconnect
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={<GoogleOutlined style={{ fontSize: '24px' }} />}
                    title={account.email}
                    description={
                      <div>
                        <div>Daily Limit: {account.daily_limit} emails</div>
                        <div>Provider: {account.provider}</div>
                        <div style={{ fontSize: '11px', color: '#999' }}>
                          Connected: {new Date(account.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
            
            <Button 
              type="dashed" 
              block 
              icon={<GoogleOutlined />}
              onClick={handleConnectGmail}
              style={{ marginTop: '16px' }}
            >
              Connect Another Email Account
            </Button>
          </Card>
        </Tabs.TabPane>
      </Tabs>

      <Modal
        title="Connect Email Account"
        open={connectModalVisible}
        onCancel={() => setConnectModalVisible(false)}
        footer={null}
        width={500}
      >
        <div style={{ textAlign: 'center', padding: '24px' }}>
          <GoogleOutlined style={{ fontSize: '48px', color: '#4285f4', marginBottom: '24px' }} />
          
          <Button
            type="primary"
            size="large"
            icon={<GoogleOutlined />}
            onClick={handleConnectGmail}
            style={{ marginBottom: '16px', width: '100%' }}
          >
            Connect Gmail Account
          </Button>
          
          <Alert
            message="Secure Connection"
            description="We will securely connect to your Gmail account to send and receive emails on your behalf. Your credentials are encrypted."
            type="info"
            showIcon
          />
        </div>
      </Modal>

      <Modal
        title="Create Email Campaign"
        open={campaignModalVisible}
        onCancel={() => {
          setCampaignModalVisible(false);
          resetCampaignForm();
        }}
        onOk={handleCreateCampaign}
        okText={campaignForm.scheduleType === 'immediate' ? 'Create & Send Now' : 'Create Campaign'}
        width={700}
        confirmLoading={loading}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>
              Campaign Name *
            </label>
            <Input 
              placeholder="e.g., Q1 SaaS Outreach" 
              value={campaignForm.name}
              onChange={(e) => setCampaignForm({...campaignForm, name: e.target.value})}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>
              Description
            </label>
            <TextArea 
              rows={2} 
              placeholder="Campaign description (optional)..."
              value={campaignForm.description}
              onChange={(e) => setCampaignForm({...campaignForm, description: e.target.value})}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>
              Email Account *
            </label>
            <Select 
              placeholder="Select email account" 
              style={{ width: '100%' }}
              value={campaignForm.emailAccountId || undefined}
              onChange={(value) => setCampaignForm({...campaignForm, emailAccountId: value})}
            >
              {emailAccounts.map((account) => (
                <Option key={account.id} value={account.id}>
                  {account.email}
                </Option>
              ))}
            </Select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>
              Select Leads *
            </label>
            <Select 
              mode="multiple" 
              placeholder="Select leads to email"
              style={{ width: '100%' }}
              value={campaignForm.leadIds}
              onChange={(value) => setCampaignForm({...campaignForm, leadIds: value})}
              maxTagCount="responsive"
            >
              {leads.filter((l) => l.status === 'new' || l.status === 'contacted').map((lead) => (
                <Option key={lead.id} value={lead.id}>
                  {lead.first_name} {lead.last_name} - {lead.company || lead.email}
                </Option>
              ))}
            </Select>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              {campaignForm.leadIds.length} lead(s) selected
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>
              Value Proposition *
            </label>
            <TextArea
              rows={3}
              placeholder="Describe what you're offering and why it's valuable to the recipient..."
              value={campaignForm.emailTemplate.valueProposition}
              onChange={(e) => setCampaignForm({
                ...campaignForm,
                emailTemplate: {
                  ...campaignForm.emailTemplate,
                  valueProposition: e.target.value
                }
              })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>
                Target Industry
              </label>
              <Input
                placeholder="e.g., SaaS, E-commerce"
                value={campaignForm.emailTemplate.targetIndustry}
                onChange={(e) => setCampaignForm({
                  ...campaignForm,
                  emailTemplate: {
                    ...campaignForm.emailTemplate,
                    targetIndustry: e.target.value
                  }
                })}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>
                Target Role
              </label>
              <Input
                placeholder="e.g., CEO, Marketing Director"
                value={campaignForm.emailTemplate.targetRole}
                onChange={(e) => setCampaignForm({
                  ...campaignForm,
                  emailTemplate: {
                    ...campaignForm.emailTemplate,
                    targetRole: e.target.value
                  }
                })}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>
              Email Tone
            </label>
            <Select
              style={{ width: '100%' }}
              value={campaignForm.emailTemplate.tone}
              onChange={(value) => setCampaignForm({
                ...campaignForm,
                emailTemplate: {
                  ...campaignForm.emailTemplate,
                  tone: value
                }
              })}
            >
              <Option value="professional">Professional</Option>
              <Option value="casual">Casual & Friendly</Option>
              <Option value="formal">Formal</Option>
              <Option value="enthusiastic">Enthusiastic</Option>
            </Select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>
              Schedule Type *
            </label>
            <Select 
              style={{ width: '100%' }}
              value={campaignForm.scheduleType}
              onChange={(value) => setCampaignForm({...campaignForm, scheduleType: value})}
            >
              <Option value="immediate">
                <div>
                  <div>Send Immediately</div>
                  <div style={{ fontSize: '11px', color: '#666' }}>Start sending right away</div>
                </div>
              </Option>
              <Option value="drip">
                <div>
                  <div>Drip Campaign</div>
                  <div style={{ fontSize: '11px', color: '#666' }}>Spread emails over time</div>
                </div>
              </Option>
            </Select>
          </div>

          {campaignForm.scheduleType === 'drip' && (
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>
                Days Between Emails
              </label>
              <InputNumber 
                min={1} 
                max={30} 
                style={{ width: '100%' }}
                value={campaignForm.dripInterval}
                onChange={(value) => setCampaignForm({...campaignForm, dripInterval: value || 3})}
              />
            </div>
          )}

          <Card title="AI Agent Settings" size="small" style={{ background: '#f9f9f9' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Checkbox 
                checked={campaignForm.autoReply}
                onChange={(e) => setCampaignForm({...campaignForm, autoReply: e.target.checked})}
              >
                <span style={{ fontWeight: 500 }}>Auto-reply to interested leads</span>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  AI will automatically respond to positive replies
                </div>
              </Checkbox>

              <Checkbox
                checked={campaignForm.autoFollowup}
                onChange={(e) => setCampaignForm({...campaignForm, autoFollowup: e.target.checked})}
              >
                <span style={{ fontWeight: 500 }}>Auto-send follow-ups to non-responders</span>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  Send follow-up emails if no response received
                </div>
              </Checkbox>

              {campaignForm.autoFollowup && (
                <div style={{ marginLeft: '24px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>
                    Maximum Follow-ups
                  </label>
                  <InputNumber 
                    min={1} 
                    max={5} 
                    style={{ width: '100%' }}
                    value={campaignForm.maxFollowups}
                    onChange={(value) => setCampaignForm({...campaignForm, maxFollowups: value || 3})}
                  />
                </div>
              )}
            </div>
          </Card>

          <Alert
            message="AI-Powered Personalization"
            description="Each email will be personalized using AI based on the lead's information and your value proposition."
            type="info"
            showIcon
          />
        </div>
      </Modal>
    </div>
  );
};

export default EmailAgentDashboard;
