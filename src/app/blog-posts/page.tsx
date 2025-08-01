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

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const DashboardPage = () => {
  const screens = useBreakpoint();
  const { data: clientsData } = useList({ resource: 'clients' });
  const { data: agentsData } = useList({ resource: 'agents' });
  const { data: workflowsData } = useList({ resource: 'workflows' });
  const { data: deliverablesData } = useList({ resource: 'deliverables' });
  
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
    <div style={{ padding: screens.xs ? '16px' : '24px' }}>
      {/* Welcome Panel */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={3} style={{ margin: 0 }}>Welcome to ArbitrageOS</Title>
            <Text type="secondary">
              {clients.length} clients • {agents.length} active agents • {workflows.length} workflows
            </Text>
          </div>
          <Space>
            <Button type="default">Clear Selection</Button>
          </Space>
        </div>
      </Card>

      {/* Quick Start Actions */}
      <Card 
        title="Quick Start Actions" 
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
            style={{ textAlign: 'left' }}
          >
            <Space>
              <Avatar icon={<PlusOutlined />} style={{ backgroundColor: '#e6f7ff', color: '#1890ff' }} />
              <div>
                <Text strong>Create New Client</Text>
                <br />
                <Text type="secondary">Add a new client profile</Text>
              </div>
            </Space>
          </Card>

          <Card 
            hoverable 
            onClick={() => console.log('Launch Tool')}
            style={{ textAlign: 'left' }}
          >
            <Space>
              <Avatar icon={<PlayCircleOutlined />} style={{ backgroundColor: '#f6ffed', color: '#52c41a' }} />
              <div>
                <Text strong>Launch Tool</Text>
                <br />
                <Text type="secondary">Run content generation tools</Text>
              </div>
            </Space>
          </Card>

          <Card 
            hoverable 
            onClick={() => console.log('Run Workflow')}
            style={{ textAlign: 'left' }}
          >
            <Space>
              <Avatar icon={<SettingOutlined />} style={{ backgroundColor: '#f9f0ff', color: '#722ed1' }} />
              <div>
                <Text strong>Run Workflow</Text>
                <br />
                <Text type="secondary">Execute automation workflows</Text>
              </div>
            </Space>
          </Card>

          <Card 
            hoverable 
            onClick={() => console.log('Deploy Agent')}
            style={{ textAlign: 'left' }}
          >
            <Space>
              <Avatar icon={<TeamOutlined />} style={{ backgroundColor: '#fff7e6', color: '#fa8c16' }} />
              <div>
                <Text strong>Deploy Agent</Text>
                <br />
                <Text type="secondary">Deploy AI agents</Text>
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
          extra={<Button type="link">View All</Button>}
        >
          <List
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
          extra={<Button type="link">View All</Button>}
        >
          {recentDeliverables.length > 0 ? (
            <List
              itemLayout="horizontal"
              dataSource={recentDeliverables}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Button type="link" key="copy">Copy</Button>,
                    <Button type="link" key="export">Export</Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={<FileTextOutlined />}
                    title={<Text strong>{item.title}</Text>}
                    description={item.clientId}
                  />
                </List.Item>
              )}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <FileTextOutlined style={{ fontSize: 48, color: '#bfbfbf', marginBottom: 16 }} />
              <Text type="secondary">No deliverables yet</Text>
              <br />
              <Button type="link" onClick={() => console.log('Create deliverable')}>
                Create your first deliverable
              </Button>
            </div>
          )}
        </Card>
      </div>

      {/* Running Automations */}
      <Card 
        title="Running Automations"
        extra={<Button type="link">View All</Button>}
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
                    style={{ backgroundColor: '#f5f5f5', color: '#999' }} 
                  />
                  <div>
                    <Text strong>{text}</Text>
                    <br />
                    <Text type="secondary">{record.description || 'Workflow'}</Text>
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
              render: (client) => client || 'No client',
            },
            {
              title: 'Status',
              dataIndex: 'status',
              render: () => <Tag color="green">Running</Tag>,
            },
            {
              title: 'ETA',
              dataIndex: 'eta',
              render: (eta, record) => eta || (record.type === 'workflow' ? '2 min' : ''),
            },
            {
              title: 'Actions',
              render: () => (
                <Space>
                  <Button type="link" size="small">Pause</Button>
                  <Button type="link" size="small" danger>Stop</Button>
                </Space>
              ),
            },
          ]}
          dataSource={runningAutomations}
          pagination={false}
          rowKey="id"
        />
      </Card>

      {/* Stats Overview */}
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: screens.lg ? 'repeat(4, 1fr)' : screens.md ? 'repeat(2, 1fr)' : '1fr',
        gap: 24
      }}>
        <Card>
          <Statistic
            title="Total Clients"
            value={clients.length}
            prefix={<TeamOutlined style={{ color: '#1890ff' }} />}
          />
        </Card>

        <Card>
          <Statistic
            title="Active Agents"
            value={agents.length}
            prefix={<SettingOutlined style={{ color: '#52c41a' }} />}
          />
        </Card>

        <Card>
          <Statistic
            title="Workflows"
            value={workflows.length}
            prefix={<BarChartOutlined style={{ color: '#722ed1' }} />}
          />
        </Card>

        <Card>
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