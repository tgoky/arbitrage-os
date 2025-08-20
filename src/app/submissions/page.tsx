// app/dashboard/page.tsx
"use client";

import React from 'react';
import { 
  SearchOutlined,
  EllipsisOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  CloseCircleOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { 
  Card, 
  Tag, 
  Button, 
  Grid, 
  Typography, 
  Space, 
  Avatar, 
  Input,
  Dropdown,
  Menu,
  Pagination 
} from 'antd';
import { useTheme } from '../../providers/ThemeProvider';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;
const { Search } = Input;

const DashboardPage = () => {
  const screens = useBreakpoint();
  const { theme } = useTheme();

  // Theme-aware style generators
  const getCardStyles = () => ({
    body: {
      backgroundColor: theme === 'dark' ? '#000000' : '#ffffff',
      padding: '12px 16px'
    }
  });

  const getContainerStyles = () => ({
    backgroundColor: theme === 'dark' ? '#000000' : '#ffffff',
    padding: screens.xs ? '16px' : '24px',
    minHeight: '100vh'
  });

  // Mock data for submissions
  const submissionStats = [
    { title: 'Total', value: 1245, icon: <FileTextOutlined />, color: '#1890ff' },
    { title: 'Pending', value: 328, icon: <ClockCircleOutlined />, color: '#faad14' },
    { title: 'Processing', value: 156, icon: <SyncOutlined spin />, color: '#13c2c2' },
    { title: 'Completed', value: 721, icon: <CheckCircleOutlined />, color: '#52c41a' },
    { title: 'Failed', value: 40, icon: <CloseCircleOutlined />, color: '#f5222d' }
  ];

  const submissionData = [
    {
      key: '1',
      date: '2023-06-15 09:30',
      type: 'Application',
      name: 'John Smith',
      email: 'john.smith@example.com',
      status: 'completed'
    },
    {
      key: '2',
      date: '2023-06-14 14:15',
      type: 'Document',
      name: 'Sarah Johnson',
      email: 'sarah.j@example.com',
      status: 'processing'
    },
    {
      key: '3',
      date: '2023-06-14 11:20',
      type: 'Form',
      name: 'Michael Brown',
      email: 'michael.b@example.com',
      status: 'pending'
    },
    {
      key: '4',
      date: '2023-06-13 16:45',
      type: 'Application',
      name: 'Emily Davis',
      email: 'emily.d@example.com',
      status: 'completed'
    },
    {
      key: '5',
      date: '2023-06-13 10:10',
      type: 'Document',
      name: 'Robert Wilson',
      email: 'robert.w@example.com',
      status: 'failed'
    },
  ];

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'completed':
        return <Tag icon={<CheckCircleOutlined />} color="success">Completed</Tag>;
      case 'processing':
        return <Tag icon={<SyncOutlined spin />} color="processing">Processing</Tag>;
      case 'pending':
        return <Tag icon={<ClockCircleOutlined />} color="warning">Pending</Tag>;
      case 'failed':
        return <Tag icon={<CloseCircleOutlined />} color="error">Failed</Tag>;
      default:
        return <Tag color="default">{status}</Tag>;
    }
  };

  const menu = (record: any) => (
    <Menu>
      <Menu.Item key="view">View Details</Menu.Item>
      <Menu.Item key="edit">Edit</Menu.Item>
      <Menu.Item key="delete" danger>Delete</Menu.Item>
    </Menu>
  );

  return (
    <div style={getContainerStyles()}>
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
            Submissions
          </Title>
          <Text 
            style={{ 
              color: theme === 'dark' ? '#9ca3af' : '#666666'
            }}
          >
            Overview of all submissions
          </Text>
        </div>
        <Search
          placeholder="Search submissions..."
          allowClear
          enterButton={<Button type="primary">Search</Button>}
          size="large"
          prefix={<SearchOutlined />}
          style={{ width: screens.xs ? '100%' : 400 }}
        />
      </div>

      {/* Stats Cards - Minimalist */}
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: screens.lg ? 'repeat(5, 1fr)' : screens.md ? 'repeat(3, 1fr)' : '1fr',
        gap: 16,
        marginBottom: 24
      }}>
        {submissionStats.map((stat, index) => (
          <Card 
            key={index}
            styles={getCardStyles()}
            style={{ 
              borderLeft: `4px solid ${stat.color}`,
              borderRadius: '8px',
              height: '100%',
              minHeight: '80px'
            }}
            bodyStyle={{ padding: '12px 16px' }}
          >
            <Space size="small" align="center" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <Text 
                  style={{ 
                    color: theme === 'dark' ? '#9ca3af' : '#666666',
                    fontSize: 12,
                    fontWeight: 500
                  }}
                >
                  {stat.title}
                </Text>
                <div 
                  style={{ 
                    color: theme === 'dark' ? '#f9fafb' : '#1a1a1a',
                    fontSize: 18,
                    fontWeight: 600,
                    lineHeight: 1.3
                  }}
                >
                  {stat.value.toLocaleString()}
                </div>
              </div>
              <Avatar 
                icon={stat.icon} 
                size="small"
                style={{ 
                  backgroundColor: 'transparent',
                  color: stat.color,
                  fontSize: 18
                }} 
              />
            </Space>
          </Card>
        ))}
      </div>

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

      {/* Beautiful Modern Table */}
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
                  Date
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
                  Email
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
                  Actions
                </th>
              </tr>
            </thead>
            {/* Table Body */}
            <tbody style={{ backgroundColor: theme === 'dark' ? '#111827' : '#ffffff' }}>
              {submissionData.map((record, index) => (
                <tr
                  key={record.key}
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
                  <td style={{ 
                    padding: '16px 24px', 
                    fontSize: '14px', 
                    color: theme === 'dark' ? '#e5e7eb' : '#1f2937',
                    verticalAlign: 'middle',
                    borderBottom: theme === 'dark' ? '1px solid #374151' : '1px solid #f3f4f6'
                  }}>
                    {record.date}
                  </td>
                  <td style={{ 
                    padding: '16px 24px', 
                    fontSize: '14px', 
                    color: theme === 'dark' ? '#e5e7eb' : '#1f2937',
                    verticalAlign: 'middle',
                    borderBottom: theme === 'dark' ? '1px solid #374151' : '1px solid #f3f4f6'
                  }}>
                    {record.type}
                  </td>
                  <td style={{ 
                    padding: '16px 24px', 
                    fontSize: '14px', 
                    color: theme === 'dark' ? '#e5e7eb' : '#1f2937',
                    verticalAlign: 'middle',
                    borderBottom: theme === 'dark' ? '1px solid #374151' : '1px solid #f3f4f6'
                  }}>
                    {record.name}
                  </td>
                  <td style={{ 
                    padding: '16px 24px', 
                    fontSize: '14px', 
                    color: theme === 'dark' ? '#e5e7eb' : '#1f2937',
                    verticalAlign: 'middle',
                    borderBottom: theme === 'dark' ? '1px solid #374151' : '1px solid #f3f4f6'
                  }}>
                    {record.email}
                  </td>
                  <td style={{ 
                    padding: '16px 24px', 
                    fontSize: '14px', 
                    color: theme === 'dark' ? '#e5e7eb' : '#1f2937',
                    verticalAlign: 'middle',
                    borderBottom: theme === 'dark' ? '1px solid #374151' : '1px solid #f3f4f6'
                  }}>
                    {getStatusTag(record.status)}
                  </td>
                  <td style={{ 
                    padding: '16px 24px', 
                    fontSize: '14px', 
                    color: theme === 'dark' ? '#e5e7eb' : '#1f2937',
                    verticalAlign: 'middle',
                    borderBottom: theme === 'dark' ? '1px solid #374151' : '1px solid #f3f4f6'
                  }}>
                    <Dropdown overlay={menu(record)} trigger={['click']}>
                      <Button type="text" icon={<EllipsisOutlined />} />
                    </Dropdown>
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
            borderTop: theme === 'dark' ? '1px solid #374151' : '1px solid #e5e7eb'
          }}
        >
          <div style={{ 
            display: 'flex', 
            justifyContent: 'flex-end'
          }}>
            <Pagination 
              total={85} 
              showSizeChanger 
              showQuickJumper
              showTotal={(total, range) => 
                <span style={{ color: theme === 'dark' ? '#e5e7eb' : '#6b7280' }}>
                  {range[0]}-{range[1]} of {total} items
                </span>
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;