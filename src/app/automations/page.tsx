"use client";

import React from 'react';
import { Card, Table, TableProps, Tag, Button, Space, Avatar } from 'antd';
import { TeamOutlined, SettingOutlined } from '@ant-design/icons';
import { useTheme } from '../../providers/ThemeProvider';

// Define the interface for automation items
interface Automation {
  id: string | number;
  name: string;
  type: 'agent' | 'workflow';
  description?: string;
  assignedClient?: string;
  status?: string;
  eta?: string;
}

// Remove the separate component and make this the default page component
export default function AutomationsPage() {
  const { theme } = useTheme(); // Use theme from ThemeProvider

  // Mock data - replace with actual data fetching
  const runningAutomations: Automation[] = [
    {
      id: 1,
      name: 'Customer Onboarding',
      type: 'workflow',
      description: 'Automated client setup process',
      assignedClient: 'Auto Corp',
      status: 'running',
      eta: '2 min',
    },
    {
      id: 2,
      name: 'Support Agent',
      type: 'agent',
      description: '24/7 customer support',
      assignedClient: 'Globex Inc',
      status: 'running',
    },
    // Add more mock data as needed
  ];

  return (
    <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-zinc-900' : 'bg-white'}`}>
      <Card
        title={<span className={theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}>Running Automations</span>}
        extra={
          <Button
            type="link"
            className={theme === 'dark' ? 'text-indigo-300 hover:text-indigo-200' : 'text-indigo-600 hover:text-indigo-500'}
          >
            View All
          </Button>
        }
        styles={{
          body: {
            backgroundColor: theme === 'dark' ? '#18181b' : '#ffffff',
            padding: '16px',
          },
          header: {
            backgroundColor: theme === 'dark' ? '#18181b' : '#ffffff',
            borderBottomColor: theme === 'dark' ? '#27272a' : '#e5e7eb',
          },
        }}
        className={`border ${theme === 'dark' ? 'border-zinc-700 bg-zinc-900' : 'border-gray-200 bg-white'}`}
      >
        <Table
          columns={[
            {
              title: 'Name',
              dataIndex: 'name',
              render: (text: string, record: Automation) => (
                <Space>
                  <Avatar
                    icon={record.type === 'agent' ? <TeamOutlined /> : <SettingOutlined />}
                    className={theme === 'dark' ? 'bg-gray-800 text-indigo-300' : 'bg-gray-100 text-gray-500'}
                  />
                  <div>
                    <span className={`font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>
                      {text}
                    </span>
                    <br />
                    <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
                      {record.description || 'Workflow'}
                    </span>
                  </div>
                </Space>
              ),
            },
            {
              title: 'Type',
              dataIndex: 'type',
              render: (type: 'agent' | 'workflow') => (
                <Tag color={type === 'agent' ? 'blue' : 'purple'}>{type}</Tag>
              ),
            },
            {
              title: 'Client',
              dataIndex: 'assignedClient',
              render: (client?: string) => (
                <span className={theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}>
                  {client || 'No client'}
                </span>
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
              render: (eta: string | undefined, record: Automation) => (
                <span className={theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}>
                  {eta || (record.type === 'workflow' ? '2 min' : '')}
                </span>
              ),
            },
            {
              title: 'Actions',
              render: () => (
                <Space>
                  <Button
                    type="link"
                    size="small"
                    className={theme === 'dark' ? 'text-indigo-300 hover:text-indigo-200' : 'text-indigo-600 hover:text-indigo-500'}
                  >
                    Pause
                  </Button>
                  <Button
                    type="link"
                    size="small"
                    danger
                    className={theme === 'dark' ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-500'}
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
          className={theme === 'dark' ? 'bg-zinc-900 text-gray-200' : 'bg-white text-gray-700'}
        />
      </Card>
    </div>
  );
}