"use client";

import React from 'react';
import { Tag, Button, Space, Avatar, Grid, Typography, Input } from 'antd';
import { TeamOutlined, SettingOutlined, SearchOutlined, PlayCircleOutlined, PauseCircleOutlined, StopOutlined } from '@ant-design/icons';
import { useTheme } from '../../providers/ThemeProvider';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;
const { Search } = Input;

// Define the interface for automation items
interface Automation {
  id: string | number;
  name: string;
  type: 'agent' | 'workflow';
  description?: string;
  assignedClient?: string;
  status: 'running' | 'paused' | 'stopped';
  eta?: string;
  lastActivity?: string;
}

export default function AutomationsPage() {
  const { theme } = useTheme();
  const screens = useBreakpoint();

  const getContainerStyles = () => ({
    backgroundColor: theme === 'dark' ? '#000000' : '#ffffff',
    padding: screens.xs ? '16px' : '24px',
    minHeight: '100vh'
  });

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
      lastActivity: '2 minutes ago'
    },
    {
      id: 2,
      name: 'Support Agent',
      type: 'agent',
      description: '24/7 customer support',
      assignedClient: 'Globex Inc',
      status: 'running',
      lastActivity: 'Active now'
    },
    {
      id: 3,
      name: 'Lead Qualification',
      type: 'workflow',
      description: 'Automated lead scoring and routing',
      assignedClient: 'TechStart Ltd',
      status: 'paused',
      eta: '5 min',
      lastActivity: '1 hour ago'
    },
    {
      id: 4,
      name: 'Data Sync Agent',
      type: 'agent',
      description: 'Real-time data synchronization',
      assignedClient: 'DataFlow Inc',
      status: 'stopped',
      lastActivity: '3 hours ago'
    },
  ];

  // Statistics
  const stats = [
    { title: 'Total', value: runningAutomations.length, color: '#1890ff' },
    { title: 'Running', value: runningAutomations.filter(a => a.status === 'running').length, color: '#52c41a' },
    { title: 'Paused', value: runningAutomations.filter(a => a.status === 'paused').length, color: '#faad14' },
    { title: 'Stopped', value: runningAutomations.filter(a => a.status === 'stopped').length, color: '#f5222d' },
  ];

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'running':
        return <Tag icon={<PlayCircleOutlined />} color="success">Running</Tag>;
      case 'paused':
        return <Tag icon={<PauseCircleOutlined />} color="warning">Paused</Tag>;
      case 'stopped':
        return <Tag icon={<StopOutlined />} color="error">Stopped</Tag>;
      default:
        return <Tag color="default">{status}</Tag>;
    }
  };

  return (
    <div style={getContainerStyles()}>
      {/* CSS to remove all black borders */}
      <style>{`
        .custom-table table {
          border: none !important;
          border-collapse: separate !important;
          border-spacing: 0 !important;
        }
        .custom-table th,
        .custom-table td {
          border-left: none !important;
          border-right: none !important;
          border-top: none !important;
        }
        .custom-table thead tr {
          border: none !important;
        }
        .custom-table tbody tr {
          border: none !important;
        }
      `}</style>

      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 24,
        flexDirection: screens.xs ? 'column' : 'row',
        gap: screens.xs ? 16 : 0
      }}>
        <div>
          <Title 
            level={3} 
            style={{ 
              margin: 0,
              color: theme === 'dark' ? '#f9fafb' : '#1a1a1a'
            }}
          >
            Automations
          </Title>
          <Text 
            style={{ 
              color: theme === 'dark' ? '#9ca3af' : '#666666'
            }}
          >
            Manage your automated workflows and agents
          </Text>
        </div>
        <Search
          placeholder="Search automations..."
          allowClear
          enterButton={<Button type="primary">Search</Button>}
          size="large"
          prefix={<SearchOutlined />}
          style={{ width: screens.xs ? '100%' : 400 }}
        />
      </div>

      {/* Stats Cards */}
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: screens.lg ? 'repeat(4, 1fr)' : screens.md ? 'repeat(2, 1fr)' : '1fr',
        gap: 16,
        marginBottom: 24
      }}>
        {stats.map((stat, index) => (
          <div 
            key={index}
            style={{ 
              backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
              borderLeft: `4px solid ${stat.color}`,
              borderRadius: '8px',
              padding: '16px',
              boxShadow: theme === 'dark' 
                ? '0 4px 6px -1px rgba(0, 0, 0, 0.3)' 
                : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              border: theme === 'dark' ? '1px solid #374151' : '1px solid #e5e7eb'
            }}
          >
            <Text 
              style={{ 
                color: theme === 'dark' ? '#9ca3af' : '#666666',
                fontSize: 12,
                fontWeight: 500,
                display: 'block',
                marginBottom: 4
              }}
            >
              {stat.title}
            </Text>
            <div 
              style={{ 
                color: theme === 'dark' ? '#f9fafb' : '#1a1a1a',
                fontSize: 24,
                fontWeight: 600
              }}
            >
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Automations Table */}
      <div 
        className="custom-table"
        style={{
          backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
          borderRadius: '12px',
          boxShadow: theme === 'dark' 
            ? '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)' 
            : '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          border: theme === 'dark' ? '1px solid #374151' : '1px solid #e5e7eb',
          overflow: 'hidden',
          marginBottom: 24
        }}
      >
        {/* Table Container */}
        <div style={{ overflowX: 'auto', overflowY: 'visible', maxWidth: '100%' }}>
          <table style={{ minWidth: '100%', width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
            {/* Table Header */}
            <thead>
              <tr
                style={{
                  background: theme === 'dark' 
                    ? 'linear-gradient(to right, #1f2937, #374151)' 
                    : 'linear-gradient(to right, #f9fafb, #f3f4f6)',
                  position: 'sticky',
                  top: 0,
                  zIndex: 10
                }}
              >
                <th style={{ 
                  padding: '16px 24px', 
                  textAlign: 'left', 
                  fontSize: '12px', 
                  fontWeight: 600, 
                  color: theme === 'dark' ? '#f9fafb' : '#374151',
                  textTransform: 'uppercase', 
                  letterSpacing: '0.05em',
                  whiteSpace: 'nowrap',
                  borderBottom: theme === 'dark' ? '1px solid #374151' : '1px solid #e5e7eb'
                }}>
                  Name
                </th>
                <th style={{ 
                  padding: '16px 24px', 
                  textAlign: 'left', 
                  fontSize: '12px', 
                  fontWeight: 600, 
                  color: theme === 'dark' ? '#f9fafb' : '#374151',
                  textTransform: 'uppercase', 
                  letterSpacing: '0.05em',
                  whiteSpace: 'nowrap',
                  borderBottom: theme === 'dark' ? '1px solid #374151' : '1px solid #e5e7eb'
                }}>
                  Type
                </th>
                <th style={{ 
                  padding: '16px 24px', 
                  textAlign: 'left', 
                  fontSize: '12px', 
                  fontWeight: 600, 
                  color: theme === 'dark' ? '#f9fafb' : '#374151',
                  textTransform: 'uppercase', 
                  letterSpacing: '0.05em',
                  whiteSpace: 'nowrap',
                  borderBottom: theme === 'dark' ? '1px solid #374151' : '1px solid #e5e7eb'
                }}>
                  Client
                </th>
                <th style={{ 
                  padding: '16px 24px', 
                  textAlign: 'left', 
                  fontSize: '12px', 
                  fontWeight: 600, 
                  color: theme === 'dark' ? '#f9fafb' : '#374151',
                  textTransform: 'uppercase', 
                  letterSpacing: '0.05em',
                  whiteSpace: 'nowrap',
                  borderBottom: theme === 'dark' ? '1px solid #374151' : '1px solid #e5e7eb'
                }}>
                  Status
                </th>
                <th style={{ 
                  padding: '16px 24px', 
                  textAlign: 'left', 
                  fontSize: '12px', 
                  fontWeight: 600, 
                  color: theme === 'dark' ? '#f9fafb' : '#374151',
                  textTransform: 'uppercase', 
                  letterSpacing: '0.05em',
                  whiteSpace: 'nowrap',
                  borderBottom: theme === 'dark' ? '1px solid #374151' : '1px solid #e5e7eb'
                }}>
                  Last Activity
                </th>
                <th style={{ 
                  padding: '16px 24px', 
                  textAlign: 'left', 
                  fontSize: '12px', 
                  fontWeight: 600, 
                  color: theme === 'dark' ? '#f9fafb' : '#374151',
                  textTransform: 'uppercase', 
                  letterSpacing: '0.05em',
                  whiteSpace: 'nowrap',
                  borderBottom: theme === 'dark' ? '1px solid #374151' : '1px solid #e5e7eb'
                }}>
                  Actions
                </th>
              </tr>
            </thead>
            {/* Table Body */}
            <tbody style={{ backgroundColor: theme === 'dark' ? '#111827' : '#ffffff' }}>
              {runningAutomations.map((automation, index) => (
                <tr
                  key={automation.id}
                  style={{
                    backgroundColor: index % 2 === 0 
                      ? (theme === 'dark' ? '#111827' : '#ffffff')
                      : (theme === 'dark' ? '#1f2937' : 'rgba(249, 250, 251, 0.5)'),
                    transition: 'all 0.15s ease',
                    height: '73px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = theme === 'dark' ? '#374151' : '#f0f9ff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = index % 2 === 0 
                      ? (theme === 'dark' ? '#111827' : '#ffffff')
                      : (theme === 'dark' ? '#1f2937' : 'rgba(249, 250, 251, 0.5)');
                  }}
                >
                  {/* Name Column */}
                  <td style={{ 
                    padding: '16px 24px', 
                    fontSize: '14px', 
                    color: theme === 'dark' ? '#e5e7eb' : '#1f2937',
                    verticalAlign: 'middle',
                    borderBottom: theme === 'dark' ? '1px solid #374151' : '1px solid #f3f4f6'
                  }}>
                    <Space>
                      <Avatar
                        icon={automation.type === 'agent' ? <TeamOutlined /> : <SettingOutlined />}
                        style={{
                          backgroundColor: automation.type === 'agent' 
                            ? (theme === 'dark' ? '#1e40af' : '#3b82f6')
                            : (theme === 'dark' ? '#7c3aed' : '#8b5cf6'),
                          color: '#ffffff'
                        }}
                      />
                      <div>
                        <div style={{ 
                          fontWeight: 500, 
                          color: theme === 'dark' ? '#f9fafb' : '#1f2937',
                          marginBottom: 2
                        }}>
                          {automation.name}
                        </div>
                        <div style={{ 
                          fontSize: '12px', 
                          color: theme === 'dark' ? '#9ca3af' : '#6b7280'
                        }}>
                          {automation.description}
                        </div>
                      </div>
                    </Space>
                  </td>
                  {/* Type Column */}
                  <td style={{ 
                    padding: '16px 24px', 
                    fontSize: '14px', 
                    color: theme === 'dark' ? '#e5e7eb' : '#1f2937',
                    verticalAlign: 'middle',
                    borderBottom: theme === 'dark' ? '1px solid #374151' : '1px solid #f3f4f6'
                  }}>
                    <Tag color={automation.type === 'agent' ? 'blue' : 'purple'}>
                      {automation.type}
                    </Tag>
                  </td>
                  {/* Client Column */}
                  <td style={{ 
                    padding: '16px 24px', 
                    fontSize: '14px', 
                    color: theme === 'dark' ? '#e5e7eb' : '#1f2937',
                    verticalAlign: 'middle',
                    borderBottom: theme === 'dark' ? '1px solid #374151' : '1px solid #f3f4f6'
                  }}>
                    {automation.assignedClient || 'No client'}
                  </td>
                  {/* Status Column */}
                  <td style={{ 
                    padding: '16px 24px', 
                    fontSize: '14px', 
                    color: theme === 'dark' ? '#e5e7eb' : '#1f2937',
                    verticalAlign: 'middle',
                    borderBottom: theme === 'dark' ? '1px solid #374151' : '1px solid #f3f4f6'
                  }}>
                    {getStatusTag(automation.status)}
                  </td>
                  {/* Last Activity Column */}
                  <td style={{ 
                    padding: '16px 24px', 
                    fontSize: '14px', 
                    color: theme === 'dark' ? '#e5e7eb' : '#1f2937',
                    verticalAlign: 'middle',
                    borderBottom: theme === 'dark' ? '1px solid #374151' : '1px solid #f3f4f6'
                  }}>
                    <div style={{ fontSize: '12px', color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
                      {automation.lastActivity}
                    </div>
                    {automation.eta && (
                      <div style={{ fontSize: '12px', color: theme === 'dark' ? '#60a5fa' : '#3b82f6' }}>
                        ETA: {automation.eta}
                      </div>
                    )}
                  </td>
                  {/* Actions Column */}
                  <td style={{ 
                    padding: '16px 24px', 
                    fontSize: '14px', 
                    color: theme === 'dark' ? '#e5e7eb' : '#1f2937',
                    verticalAlign: 'middle',
                    borderBottom: theme === 'dark' ? '1px solid #374151' : '1px solid #f3f4f6'
                  }}>
                    <Space>
                      <Button
                        type="link"
                        size="small"
                        style={{ 
                          color: theme === 'dark' ? '#60a5fa' : '#3b82f6',
                          padding: '0 8px'
                        }}
                      >
                        {automation.status === 'running' ? 'Pause' : 'Start'}
                      </Button>
                      <Button
                        type="link"
                        size="small"
                        danger
                        style={{ 
                          color: theme === 'dark' ? '#f87171' : '#ef4444',
                          padding: '0 8px'
                        }}
                      >
                        Stop
                      </Button>
                    </Space>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Beautiful Pagination Footer */}
        <div 
          style={{ 
            background: theme === 'dark' 
              ? 'linear-gradient(to right, #1f2937, #374151)' 
              : 'linear-gradient(to right, #f9fafb, #f3f4f6)',
            padding: '16px 24px', 
            borderTop: theme === 'dark' ? '1px solid #374151' : '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Text style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280', fontSize: '14px' }}>
            Showing {runningAutomations.length} automations
          </Text>
          <Button 
            type="primary" 
            size="small"
            style={{ 
              backgroundColor: theme === 'dark' ? '#3b82f6' : '#2563eb',
              borderColor: theme === 'dark' ? '#3b82f6' : '#2563eb'
            }}
          >
            Add Automation
          </Button>
        </div>
      </div>
    </div>
  );
}