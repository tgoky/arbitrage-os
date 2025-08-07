"use client";

import React, { useState } from 'react';
import {
  SearchOutlined,
  SettingOutlined,
  PlusOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  UserOutlined,
  PhoneOutlined,
  // PodcastOutlined,
  // DiscoveryOutlined,
  FileSearchOutlined
} from '@ant-design/icons';
import {
  Button,
  Card,
  Input,
  Select,
  Table,
  Tag,
  Typography,
  Space,
  Progress,
  Badge,
  Avatar
} from 'antd';
import { useGo } from "@refinedev/core";
import { NewCallModal } from './callmodel';

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;

export const SalesCallsAnalyzer = () => {
  const [activeTab, setActiveTab] = useState('all');
    const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
     const go = useGo();

  const [filters, setFilters] = useState({
    type: '',
    status: ''
  });

  const callTypes = [
    { value: 'discovery', label: 'Discovery', icon: <PhoneOutlined />, color: 'blue' },
    { value: 'interview', label: 'Interview', icon: <UserOutlined />, color: 'purple' },
    { value: 'sales', label: 'Sales', icon: <PhoneOutlined />, color: 'green' },
    { value: 'podcast', label: 'Podcast', icon: <PhoneOutlined />, color: 'orange' }
  ];

  const statusOptions = [
    { value: 'active', label: 'Active', color: 'processing' },
    { value: 'completed', label: 'Completed', color: 'success' },
    { value: 'failed', label: 'Failed', color: 'error' },
    { value: 'joining', label: 'Joining', color: 'warning' },
    { value: 'pending', label: 'Pending', color: 'default' },
    { value: 'processing', label: 'Processing', color: 'processing' }
  ];

  const callData = [
    {
      key: '1',
      type: 'discovery',
      title: 'Discovery call with Acme Corp',
      status: 'completed',
      date: '2023-05-15',
      duration: '32:45',
      insights: 'High interest in solution, budget confirmed',
      progress: 100,
      participants: ['Jane Smith', 'John Doe']
    },
    {
      key: '2',
      type: 'sales',
      title: 'Product demo for TechStart',
      status: 'active',
      date: '2023-05-18',
      duration: '45:12',
      insights: 'Technical concerns raised, needs follow-up',
      progress: 65,
      participants: ['Mike Johnson']
    },
    {
      key: '3',
      type: 'interview',
      title: 'Customer interview - SaaS pain points',
      status: 'processing',
      date: '2023-05-20',
      duration: '28:33',
      insights: 'Analyzing transcript...',
      progress: 40,
      participants: ['Sarah Williams']
    },
    {
      key: '4',
      type: 'podcast',
      title: 'Growth strategies podcast recording',
      status: 'pending',
      date: '2023-05-22',
      duration: '',
      insights: 'Scheduled for next week',
      progress: 0,
      participants: ['Alex Turner', 'Host']
    }
  ];

  const filteredData = callData.filter(call => {
    const matchesSearch = call.title.toLowerCase().includes(searchText.toLowerCase()) ||
      call.participants.some(p => p.toLowerCase().includes(searchText.toLowerCase()));
    const matchesType = !filters.type || call.type === filters.type;
    const matchesStatus = !filters.status || call.status === filters.status;
    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <PlayCircleOutlined />;
      case 'completed': return <CheckCircleOutlined />;
      case 'failed': return <CloseCircleOutlined />;
      case 'joining': return <ClockCircleOutlined />;
      case 'processing': return <SyncOutlined spin />;
      default: return <ClockCircleOutlined />;
    }
  };

  const columns = [
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const callType = callTypes.find(t => t.value === type);
        return (
          <Tag icon={callType?.icon} color={callType?.color}>
            {callType?.label}
          </Tag>
        );
      },
      filters: callTypes.map(type => ({
        text: type.label,
        value: type.value
      })),
      onFilter: (value: string, record: any) => record.type === value,
    },
    {
      title: 'Meeting/Call',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: any) => (
        <div>
          <div className="font-medium">{text}</div>
          <div className="text-xs text-gray-500">
            {record.participants.join(', ')}
          </div>
        </div>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusObj = statusOptions.find(s => s.value === status);
        return (
          <Tag icon={getStatusIcon(status)} color={statusObj?.color}>
            {statusObj?.label}
          </Tag>
        );
      },
      filters: statusOptions.map(status => ({
        text: status.label,
        value: status.value
      })),
      onFilter: (value: string, record: any) => record.status === value,
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      sorter: (a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration: string) => duration || '-'
    },
    {
      title: 'Insights',
      dataIndex: 'insights',
      key: 'insights',
      render: (text: string) => (
        <div className="max-w-xs truncate">
          {text}
        </div>
      )
    },
    {
      title: 'Progress',
      dataIndex: 'progress',
      key: 'progress',
      render: (progress: number) => (
        <Progress
          percent={progress}
          size="small"
          status={progress === 100 ? 'success' : 'active'}
        />
      )
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Title level={3} className="mb-1">Sales Calls</Title>
          <Text type="secondary">View and manage your AI-analyzed sales calls</Text>
        </div>
        <Space>PlusOutlined
          <Button 
            icon={<SettingOutlined />}
            onClick={() => go({ to: "/sales-call-analyzer/settings" })}
            // OR using the meta route:
            // onClick={() => go({ to: "settings", type: "path" })}
          >
            Settings
          </Button>
          <Button 
        type="primary" 
        icon={<PlusOutlined />}
        onClick={() => setIsModalVisible(true)}
      >
        New Call
      </Button>
        <NewCallModal 
        visible={isModalVisible} 
        onClose={() => setIsModalVisible(false)} 
      />
        </Space>
      </div>

      {/* Call Type Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {callTypes.map(type => (
          <Card
            key={type.value}
            bordered
            hoverable
            className={`border border-${type.color}-200 hover:border-${type.color}-300`}
            onClick={() => setActiveTab(type.value)}
          >
            <div className="flex items-center">
              <Avatar
                icon={type.icon}
                style={{ backgroundColor: `var(--ant-color-${type.color}-1)` }}
                className="mr-3"
              />
              <div>
                <Text strong className="block capitalize">{type.label} Calls</Text>
                <Text type="secondary">
                  {activeTab === type.value ? (
                    `${callData.filter(c => c.type === type.value).length} calls`
                  ) : (
                    'No progress data yet'
                  )}
                </Text>
                {activeTab !== type.value && (
                  <Text type="secondary" className="block text-xs mt-1">
                    Complete at least 2 calls
                  </Text>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters and Search */}
      {/* Filters and Search */}
<div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
  <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full">
    <div className="flex flex-col md:flex-row gap-4 flex-grow">
      <div>
        <Text strong className="block mb-1">Type</Text>
        <Select
          placeholder="All Types"
          style={{ width: 150 }}
          onChange={value => setFilters({ ...filters, type: value })}
          allowClear
        >
          <Option value="discovery">Discovery</Option>
          <Option value="interview">Interview</Option>
          <Option value="sales">Sales</Option>
          <Option value="podcast">Podcast</Option>
        </Select>
      </div>
      <div>
        <Text strong className="block mb-1">Status</Text>
        <Select
          placeholder="All Statuses"
          style={{ width: 150 }}
          onChange={value => setFilters({ ...filters, status: value })}
          allowClear
        >
          {statusOptions.map(status => (
            <Option key={status.value} value={status.value}>
              {status.label}
            </Option>
          ))}
        </Select>
      </div>
    </div>

    {/* Search Box aligned right */}
    <div className="mt-[6px] md:mt-6 md:ml-auto">
      <Search
        placeholder="Search by name or company..."
        allowClear
        enterButton
        onChange={e => setSearchText(e.target.value)}
        className="min-w-[250px]"
      />
    </div>
  </div>
</div>


      {/* Calls Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="key"
          locale={{
            emptyText: (
              <div className="py-12 text-center">
                <FileSearchOutlined className="text-3xl mb-2 text-gray-400" />
                <Text type="secondary">No sales calls found</Text>
              </div>
            )
          }}
          pagination={{
            showSizeChanger: true,
            showTotal: (total, range) => (
              <Text type="secondary">
                Viewing {range[0]}-{range[1]} of {total} results
              </Text>
            )
          }}
        />
      </Card>
    </div>
  );
};

export default SalesCallsAnalyzer;