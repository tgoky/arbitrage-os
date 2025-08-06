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
  Table, 
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

  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      sorter: (a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (text: string, record: any) => (
        <Dropdown overlay={menu(record)} trigger={['click']}>
          <Button type="text" icon={<EllipsisOutlined />} />
        </Dropdown>
      ),
    },
  ];

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

      {/* Submissions Table */}
      <Card
        styles={getCardStyles()}
        style={{ 
          marginBottom: 24,
          borderRadius: '8px'
        }}
      >
        <Table
          columns={columns}
          dataSource={submissionData}
          rowSelection={{
            type: 'checkbox',
          }}
          pagination={false}
          scroll={{ x: true }}
          style={{ 
            backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
          }}
        />
        <div style={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          marginTop: 16
        }}>
          <Pagination 
            total={85} 
            showSizeChanger 
            showQuickJumper
            showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} items`}
          />
        </div>
      </Card>
    </div>
  );
};

export default DashboardPage;