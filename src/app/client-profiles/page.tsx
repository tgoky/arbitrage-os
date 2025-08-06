// app/dashboard/page.tsx
"use client";

import React from 'react';
import { useList, useOne } from '@refinedev/core';
import { 
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  TeamOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { Card, Table, Tag, Button, Grid, Typography, Space, Avatar, List, Input, Select, Empty } from 'antd';
import { useTheme } from '../../providers/ThemeProvider';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;
const { Option } = Select;

const DashboardPage = () => {
  const screens = useBreakpoint();
  const { data: clientsData } = useList({ resource: 'clients' });
  const { theme } = useTheme();

  const clients = clientsData?.data || [];

  // Theme-aware style generators
  const getCardStyles = () => ({
    body: {
      backgroundColor: theme === 'dark' ? '#111111' : '#ffffff',
      padding: screens.xs ? '16px' : '24px'
    },
    header: {
      borderBottomColor: theme === 'dark' ? '#374151' : '#f0f0f0',
      backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
    }
  });

  const getContainerStyles = () => ({
    backgroundColor: theme === 'dark' ? '#000000' : '#ffffff',
    padding: screens.xs ? '16px' : '24px',
    minHeight: '100vh'
  });

  const themeClass = (light: string, dark: string) => 
    theme === 'dark' ? dark : light;

  return (
    <div style={getContainerStyles()}>
      {/* Client Profile Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 24
      }}>
        <div>
          <Title 
            level={3} 
            style={{ 
              margin: 0,
              color: theme === 'dark' ? '#f9fafb' : '#1a1a1a'
            }}
          >
            Client Profiles
          </Title>
          <Text 
            style={{ 
              color: theme === 'dark' ? '#9ca3af' : '#666666'
            }}
          >
            Manage all your client information and deliverables
          </Text>
        </div>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          style={{
            backgroundColor: theme === 'dark' ? '#6d28d9' : '#6d28d9',
            borderColor: theme === 'dark' ? '#7c3aed' : '#6d28d9'
          }}
        >
          Create New Client
        </Button>
      </div>

      {/* Search and Filter Bar */}
      <Card
        styles={getCardStyles()}
        style={{ 
          marginBottom: 24,
          borderColor: theme === 'dark' ? '#191c1f' : '#f0f0f0'
        }}
        bodyStyle={{ padding: '16px 24px' }}
      >
        <div style={{ 
          display: 'flex', 
          gap: 16,
          flexDirection: screens.xs ? 'column' : 'row'
        }}>
          <Input
            placeholder="Search clients..."
            prefix={<SearchOutlined style={{ color: theme === 'dark' ? '#9ca3af' : '#d1d5db' }} />}
            style={{ 
              flex: 1,
              backgroundColor: theme === 'dark' ? '#060e18' : '#ffffff',
              borderColor: theme === 'dark' ? '#374151' : '#d1d5db'
            }}
          />
          <Select
            placeholder="Filter by stage"
            suffixIcon={<FilterOutlined style={{ color: theme === 'dark' ? '#9ca3af' : '#d1d5db' }} />}
            style={{ 
              width: screens.xs ? '100%' : 200,
              backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
              borderColor: theme === 'dark' ? '#374151' : '#d1d5db'
            }}
          >
            <Option value="all">All Stages</Option>
            <Option value="idea">Idea</Option>
            <Option value="prelaunch">Prelaunch</Option>
            <Option value="active">Active</Option>
            <Option value="scaling">Scaling</Option>
          </Select>
        </div>
      </Card>

      {/* Clients List */}
      <Card
        title={`Clients (${clients.length})`}
        styles={getCardStyles()}
        style={{ 
          borderColor: theme === 'dark' ? '#000000' : '#f0f0f0'
        }}
      >
        {clients.length > 0 ? (
          <List
            itemLayout="vertical"
            dataSource={clients}
            renderItem={(client) => (
           <List.Item
  style={{
    padding: '16px 0',
    borderBottomColor: theme === 'dark' ? '#374151' : '#f0f0f0'
  }}
  actions={[
    <Button 
      key="view" 
      type="text" 
      icon={<EyeOutlined />} 
      style={{ color: theme === 'dark' ? '#a78bfa' : '#6d28d9' }}
    />,
    <Button 
      key="edit" 
      type="text" 
      icon={<EditOutlined />} 
      style={{ color: theme === 'dark' ? '#a78bfa' : '#6d28d9' }}
    />,
    <Button 
      key="delete" 
      type="text" 
      icon={<DeleteOutlined />} 
      style={{ color: theme === 'dark' ? '#f87171' : '#dc2626' }}
    />
  ]}
>
                <List.Item.Meta
                  avatar={
                    <Avatar 
                      style={{ 
                        backgroundColor: theme === 'dark' ? '#4c1d95' : '#ede9fe',
                        color: theme === 'dark' ? '#a78bfa' : '#6d28d9'
                      }}
                      icon={<TeamOutlined />}
                    />
                  }
                  title={
                    <Text 
                      strong 
                      style={{ 
                        color: theme === 'dark' ? '#f9fafb' : '#1a1a1a',
                        fontSize: 16
                      }}
                    >
                      {client.name}
                    </Text>
                  }
                  description={
                    <Space size={16}>
                      <Text style={{ color: theme === 'dark' ? '#9ca3af' : '#666666' }}>
                        {client.industry || 'No industry specified'}
                      </Text>
                      <Tag 
                        color={
                          client.stage === 'idea' ? 'default' :
                          client.stage === 'prelaunch' ? 'orange' :
                          client.stage === 'active' ? 'green' :
                          'blue'
                        }
                      >
                        {client.stage}
                      </Tag>
                    </Space>
                  }
                />
                <div style={{ marginTop: 8 }}>
                  <Text style={{ color: theme === 'dark' ? '#9ca3af' : '#666666' }}>
                    {client.offerSummary || 'No description available'}
                  </Text>
                </div>
              </List.Item>
            )}
          />
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <Text style={{ color: theme === 'dark' ? '#9ca3af' : '#666666' }}>
                No clients found
              </Text>
            }
          >
            <Text style={{ 
              color: theme === 'dark' ? '#9ca3af' : '#666666',
              marginBottom: 16
            }}>
              Get started by creating your first client profile.
            </Text>
           
          </Empty>
        )}
      </Card>
    </div>
  );
};

export default DashboardPage;