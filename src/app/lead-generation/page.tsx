// app/dashboard/page.tsx
"use client";

import React from 'react';
import { useList, useOne } from '@refinedev/core';
import { 
  PlusOutlined,
  PlayCircleOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ArrowRightOutlined,
  TeamOutlined,
  SettingOutlined,
  FileTextOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import { Card, Table, Tag, Button, Statistic, Grid, Typography, Space, Avatar, List } from 'antd';
import { useTheme } from '../../providers/ThemeProvider';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const DashboardPage = () => {
  const screens = useBreakpoint();
  const { data: clientsData } = useList({ resource: 'clients' });
  const { data: agentsData } = useList({ resource: 'agents' });
  const { data: workflowsData } = useList({ resource: 'workflows' });
  const { data: deliverablesData } = useList({ resource: 'deliverables' });
   const { theme } = useTheme();

  // Theme-aware style generators
  const getCardStyles = () => ({
    body: {
      backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
      padding: screens.xs ? '16px' : '24px'
    },
    header: {
      borderBottomColor: theme === 'dark' ? '#374151' : '#f0f0f0',
      backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
    }
  });

  const getContainerStyles = () => ({
    backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
    padding: screens.xs ? '16px' : '24px',
    minHeight: '100vh'
  });

   // Helper function for theme-aware colors
  const themeClass = (light: string, dark: string) => 
    theme === 'dark' ? dark : light;
  
  const clients = clientsData?.data || [];
  const agents = agentsData?.data || [];
  const workflows = workflowsData?.data || [];
  const deliverables = deliverablesData?.data || [];

  // Mock data for demonstration
  const recentActivity = [
    {
      id: 1,
      type: 'tool',
      action: 'Clarity Wizard',
      client: 'TechStart Inc',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      status: 'completed'
    },
    {
      id: 2,
      type: 'agent',
      action: 'Lead Scorer Bot',
      client: 'GrowthCo',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      status: 'running'
    },
    {
      id: 3,
      type: 'workflow',
      action: 'Weekly Report Generator',
      client: 'ScaleUp Agency',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
      status: 'completed'
    },
    {
      id: 4,
      type: 'deliverable',
      action: 'Market Analysis Report',
      client: 'InnovateCorp',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
      status: 'created'
    }
  ];

  const recentDeliverables = deliverables.slice(0, 4);

  // Combine agents and workflows for running automations
  type AutomationItem = (any & { type: 'agent' }) | (any & { type: 'workflow' });
  
  const runningAutomations: AutomationItem[] = [
    ...agents.slice(0, 2).map(agent => ({ ...agent, type: 'agent' as const })),
    ...workflows.slice(0, 1).map(workflow => ({ ...workflow, type: 'workflow' as const }))
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'running':
        return <ClockCircleOutlined style={{ color: '#1890ff' }} />;
      case 'failed':
        return <ExclamationCircleOutlined style={{ color: '#f5222d' }} />;
      default:
        return <ClockCircleOutlined style={{ color: '#d9d9d9' }} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'green';
      case 'running':
        return 'blue';
      case 'failed':
        return 'red';
      default:
        return 'default';
    }
  };

  return (
  <div style={getContainerStyles()}>
      {/* Welcome Panel */}
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
  <div>
    <Title 
      level={3} 
      style={{ 
        margin: 0,
        color: theme === 'dark' ? '#f9fafb' : '#1a1a1a'
      }}
    >
      Welcome to ArbitrageOS
    </Title>
    <Text 
      style={{ 
        color: theme === 'dark' ? '#9ca3af' : '#666666'
      }}
    >
      {clients.length} clients • {agents.length} active agents • {workflows.length} workflows
    </Text>
  </div>
  <Space>
    <Button 
      type="default"
      style={{
        backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
        color: theme === 'dark' ? '#e5e7eb' : '#1a1a1a',
        borderColor: theme === 'dark' ? '#4b5563' : '#d1d5db'
      }}
    >
      Clear Selection
    </Button>
  </Space>
</div>

      {/* Quick Start Actions */}
    <Card
        title="Quick Start Actions"
        styles={getCardStyles()}
        style={{ marginBottom: 24 }}
        extra={<Button type="link">View All</Button>}
      >
      
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: screens.lg ? 'repeat(4, 1fr)' : screens.md ? 'repeat(2, 1fr)' : '1fr',
          gap: 16
        }}>
       <Card 
  hoverable
  onClick={() => console.log('Create New Client')}
  styles={{
    body: {
      backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
      padding: '16px'
    }
  }}
  style={{ 
    textAlign: 'left',
    cursor: 'pointer',
    backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
    borderColor: theme === 'dark' ? '#374151' : '#f0f0f0'
  }}
>
  <Space>
    <Avatar 
      icon={<PlusOutlined />} 
      style={{ 
        backgroundColor: theme === 'dark' ? '#1f2937' : '#e6f7ff', 
        color: theme === 'dark' ? '#a78bfa' : '#1890ff'
      }} 
    />
    <div>
      <Text strong style={{ color: theme === 'dark' ? '#f9fafb' : '#1a1a1a' }}>
        Create New Client
      </Text>
      <br />
      <Text style={{ color: theme === 'dark' ? '#9ca3af' : '#666666' }}>
        Add a new client profile
      </Text>
    </div>
  </Space>
</Card>

          <Card 
            hoverable 
            onClick={() => console.log('Launch Tool')}
            styles={{
              body: {
                backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
                padding: '16px'
              }
            }}
            style={{ 
              textAlign: 'left',
              backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
              borderColor: theme === 'dark' ? '#374151' : '#f0f0f0'
            }}
          >
            <Space>
              <Avatar icon={<PlayCircleOutlined />} style={{ backgroundColor: '#f6ffed', color: '#52c41a' }} />
              <div>
                <Text strong style={{ color: theme === 'dark' ? '#f9fafb' : '#1a1a1a' }}>Launch Tool</Text>
                <br />
                <Text style={{ color: theme === 'dark' ? '#9ca3af' : '#666666' }}>Run content generation tools</Text>
              </div>
            </Space>
          </Card>

          <Card 
            hoverable 
            onClick={() => console.log('Run Workflow')}
            styles={{
              body: {
                backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
                padding: '16px'
              }
            }}
            style={{ 
              textAlign: 'left',
              backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
              borderColor: theme === 'dark' ? '#374151' : '#f0f0f0'
            }}
          >
            <Space>
              <Avatar icon={<SettingOutlined />} style={{ backgroundColor: '#f9f0ff', color: '#722ed1' }} />
              <div>
                <Text strong style={{ color: theme === 'dark' ? '#f9fafb' : '#1a1a1a' }}>Run Workflow</Text>
                <br />
                <Text style={{ color: theme === 'dark' ? '#9ca3af' : '#666666' }}>Execute automation workflows</Text>
              </div>
            </Space>
          </Card>

          <Card 
            hoverable 
            onClick={() => console.log('Deploy Agent')}
            styles={{
              body: {
                backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
                padding: '16px'
              }
            }}
            style={{ 
              textAlign: 'left',
              backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
              borderColor: theme === 'dark' ? '#374151' : '#f0f0f0'
            }}
          >
            <Space>
              <Avatar icon={<TeamOutlined />} style={{ backgroundColor: '#fff7e6', color: '#fa8c16' }} />
              <div>
                <Text strong style={{ color: theme === 'dark' ? '#f9fafb' : '#1a1a1a' }}>Deploy Agent</Text>
                <br />
                <Text style={{ color: theme === 'dark' ? '#9ca3af' : '#666666' }}>Deploy AI agents</Text>
              </div>
            </Space>
          </Card>
        </div>
      </Card>

      <div style={{ 
        display: 'grid',
        gridTemplateColumns: screens.lg ? 'repeat(2, 1fr)' : '1fr',
        gap: 24,
        marginBottom: 24
      }}>
        {/* Activity Feed */}
        <Card
        title="Activity Feed"
        styles={getCardStyles()}
        style={{ marginBottom: 24 }}
      >
          <List
           style={{ color: theme === 'dark' ? '#e5e7eb' : '#333' }}
            itemLayout="horizontal"
            dataSource={recentActivity}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  avatar={getStatusIcon(item.status)}
                  title={<Text strong>{item.action}</Text>}
                  description={`${item.client} • ${item.timestamp.toLocaleTimeString()}`}
                />
                <div>
                  <Tag color={getStatusColor(item.status)}>{item.status}</Tag>
                </div>
              </List.Item>
            )}
          />
        </Card>

        {/* Recent Deliverables */}
    <Card 
  title="Recent Deliverables"
  styles={{
    body: {
      backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
      padding: screens.xs ? '16px' : '24px'
    },
    header: {
      borderBottomColor: theme === 'dark' ? '#374151' : '#f0f0f0',
      backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
    }
  }}
  style={{
    backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
    borderColor: theme === 'dark' ? '#374151' : '#f0f0f0'
  }}
  extra={
    <Button 
      type="link" 
      style={{ 
        color: theme === 'dark' ? '#a78bfa' : '#6d28d9',
        backgroundColor: 'transparent' 
      }}
    >
      View All
    </Button>
  }
>
  {recentDeliverables.length > 0 ? (
    <List
      itemLayout="horizontal"
      dataSource={recentDeliverables}
      style={{ 
        backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
        borderColor: theme === 'dark' ? '#374151' : '#f0f0f0'
      }}
      renderItem={(item) => (
        <List.Item
          style={{ 
            borderBottomColor: theme === 'dark' ? '#374151' : '#f0f0f0',
            padding: '12px 0',
            backgroundColor: theme === 'dark' ? '#111827' : '#ffffff'
          }}
          actions={[
            <Button 
              type="link" 
              key="copy"
              style={{ 
                color: theme === 'dark' ? '#a78bfa' : '#6d28d9',
                padding: '0 8px'
              }}
            >
              Copy
            </Button>,
            <Button 
              type="link" 
              key="export"
              style={{ 
                color: theme === 'dark' ? '#a78bfa' : '#6d28d9',
                padding: '0 8px'
              }}
            >
              Export
            </Button>
          ]}
        >
          <List.Item.Meta
            avatar={
              <FileTextOutlined 
                style={{ 
                  color: theme === 'dark' ? '#a78bfa' : '#6d28d9',
                  fontSize: 20,
                  backgroundColor: theme === 'dark' ? '#1f2937' : '#f9fafb',
                  padding: 8,
                  borderRadius: 4
                }} 
              />
            }
            title={
              <Text 
                strong 
                style={{ 
                  color: theme === 'dark' ? '#f9fafb' : '#1a1a1a',
                  marginBottom: 4
                }}
              >
                {item.title}
              </Text>
            }
            description={
              <Text 
                style={{ 
                  color: theme === 'dark' ? '#9ca3af' : '#666666',
                  fontSize: 14
                }}
              >
                {item.clientId}
              </Text>
            }
          />
        </List.Item>
      )}
    />
  ) : (
    <div style={{ 
      textAlign: 'center', 
      padding: '32px 0',
      backgroundColor: theme === 'dark' ? '#111827' : '#ffffff'
    }}>
      <FileTextOutlined 
        style={{ 
          fontSize: 48, 
          color: theme === 'dark' ? '#4b5563' : '#d1d5db',
          marginBottom: 16 
        }} 
      />
      <Text 
        style={{ 
          color: theme === 'dark' ? '#9ca3af' : '#666666',
          display: 'block',
          marginBottom: 8
        }}
      >
        No deliverables yet
      </Text>
      <Button 
        type="link" 
        onClick={() => console.log('Create deliverable')}
        style={{ 
          color: theme === 'dark' ? '#a78bfa' : '#6d28d9',
          padding: '0 8px'
        }}
      >
        Create your first deliverable
      </Button>
    </div>
  )}
</Card>
</div>
     {/* Running Automations */}
<Card
  title="Running Automations"
  styles={getCardStyles()}
  extra={
    <Button 
      type="link" 
      style={{ 
        color: theme === 'dark' ? '#a78bfa' : '#6d28d9',
        backgroundColor: 'transparent'
      }}
    >
      View All
    </Button>
  }
  style={{ marginBottom: 24 }}
>
  <Table
    columns={[
      {
        title: 'Name',
        dataIndex: 'name',
        render: (text, record) => (
          <Space>
            <Avatar 
              icon={record.type === 'agent' ? <TeamOutlined /> : <SettingOutlined />} 
              style={{ 
                backgroundColor: theme === 'dark' ? '#1f2937' : '#f5f5f5',
                color: theme === 'dark' ? '#a78bfa' : '#999'
              }} 
            />
            <div>
              <Text strong style={{ color: theme === 'dark' ? '#f9fafb' : '#1a1a1a' }}>
                {text}
              </Text>
              <br />
              <Text style={{ color: theme === 'dark' ? '#9ca3af' : '#666666' }}>
                {record.description || 'Workflow'}
              </Text>
            </div>
          </Space>
        ),
      },
      {
        title: 'Type',
        dataIndex: 'type',
        render: (type) => (
          <Tag color={type === 'agent' ? 'blue' : 'purple'}>
            {type}
          </Tag>
        ),
      },
      {
        title: 'Client',
        dataIndex: 'assignedClient',
        render: (client) => (
          <Text style={{ color: theme === 'dark' ? '#e5e7eb' : '#333' }}>
            {client || 'No client'}
          </Text>
        ),
      },
      {
        title: 'Status',
        dataIndex: 'status',
        render: () => <Tag color="green">Running</Tag>,
      },
      {
        title: 'ETA',
        dataIndex: 'eta',
        render: (eta, record) => (
          <Text style={{ color: theme === 'dark' ? '#e5e7eb' : '#333' }}>
            {eta || (record.type === 'workflow' ? '2 min' : '')}
          </Text>
        ),
      },
      {
        title: 'Actions',
        render: () => (
          <Space>
            <Button 
              type="link" 
              size="small"
              style={{ color: theme === 'dark' ? '#a78bfa' : '#6d28d9' }}
            >
              Pause
            </Button>
            <Button 
              type="link" 
              size="small" 
              danger
              style={{ color: theme === 'dark' ? '#f87171' : '#dc2626' }}
            >
              Stop
            </Button>
          </Space>
        ),
      },
    ]}
    dataSource={runningAutomations}
    pagination={false}
    rowKey="id"
    style={{ 
      backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
      color: theme === 'dark' ? '#e5e7eb' : '#333'
    }}
  />
</Card>
      {/* Stats Overview */}
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: screens.lg ? 'repeat(4, 1fr)' : screens.md ? 'repeat(2, 1fr)' : '1fr',
        gap: 24
      }}>
          <Card
        styles={getCardStyles()}
      >
          <Statistic
            title="Total Clients"
            value={clients.length}
            prefix={<TeamOutlined style={{ color: '#1890ff' }} />}
          />
        </Card>

       <Card
        styles={getCardStyles()}
      >
          <Statistic
            title="Active Agents"
            value={agents.length}
            prefix={<SettingOutlined style={{ color: '#52c41a' }} />}
          />
        </Card>

            <Card
        styles={getCardStyles()}
      >
          <Statistic
            title="Workflows"
            value={workflows.length}
            prefix={<BarChartOutlined style={{ color: '#722ed1' }} />}
          />
        </Card>

        <Card
        styles={getCardStyles()}
      >
          <Statistic
            title="Deliverables"
            value={deliverables.length}
            prefix={<FileTextOutlined style={{ color: '#fa8c16' }} />}
          />
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;