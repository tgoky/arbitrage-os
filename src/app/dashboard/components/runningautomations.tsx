// app/dashboard/components/RunningAutomations.tsx
import React from 'react';
import { Card, Table, Tag, Button, Space, Avatar, Typography } from 'antd';
import { TeamOutlined, SettingOutlined } from '@ant-design/icons';
import { useTheme } from '../../../providers/ThemeProvider';
import { AutomationItem } from './types';

const { Text } = Typography;

interface RunningAutomationsProps {
  runningAutomations: AutomationItem[];
}

const RunningAutomations: React.FC<RunningAutomationsProps> = ({ runningAutomations }) => {
  const { theme } = useTheme();

  const getCardStyles = () => ({
    body: {
      backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
      padding: '24px',
    },
    header: {
      borderBottomColor: theme === 'dark' ? '#374151' : '#f0f0f0',
      backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
    },
  });

  return (
    <Card
      title="Running Automations"
      styles={getCardStyles()}
      extra={
        <Button
          type="link"
          style={{
            color: theme === 'dark' ? '#a78bfa' : '#6d28d9',
            backgroundColor: 'transparent',
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
            render: (text, record: AutomationItem) => (
              <Space>
                <Avatar
                  icon={record.type === 'agent' ? <TeamOutlined /> : <SettingOutlined />}
                  style={{
                    backgroundColor: theme === 'dark' ? '#1f2937' : '#f5f5f5',
                    color: theme === 'dark' ? '#a78bfa' : '#999',
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
              <Tag color={type === 'agent' ? 'blue' : 'purple'}>{type}</Tag>
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
            render: (eta, record: AutomationItem) => (
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
          color: theme === 'dark' ? '#e5e7eb' : '#333',
        }}
      />
    </Card>
  );
};

export default RunningAutomations;