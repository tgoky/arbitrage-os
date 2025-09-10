// app/lead-generation/components/LeadColumns.tsx
import React from 'react';
import { MailOutlined, PhoneOutlined, StarOutlined } from '@ant-design/icons';
import { Avatar, Button, Space, Tag, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Lead } from '../leads/leads';

export const leadColumns = (getStatusColor: (status: string) => string): ColumnsType<Lead> => [
  {
    title: 'Lead',
    dataIndex: 'name',
    key: 'name',
    render: (text, record) => (
      <div className="flex items-center">
        <Avatar src={`https://i.pravatar.cc/150?u=${record.id}`} />
        <div className="ml-4">
          <div className="font-medium">{text}</div>
          <div className="text-gray-500">{record.position}</div>
        </div>
      </div>
    ),
  },
  //linting
  {
    title: 'Company',
    dataIndex: 'company',
    key: 'company',
    render: (text, record) => (
      <div>
        <div className="font-medium">{text}</div>
        <div className="text-gray-500">{record.industry}</div>
      </div>
    ),
  },
  {
    title: 'Contact',
    dataIndex: 'email',
    key: 'contact',
    render: (_, record) => (
      <Space direction="vertical" size={0}>
        <div className="flex items-center">
          <MailOutlined className="mr-1" />
          <span>{record.email}</span>
        </div>
        {record.phone && (
          <div className="flex items-center">
            <PhoneOutlined className="mr-1" />
            <span>{record.phone}</span>
          </div>
        )}
      </Space>
    ),
  },
  {
    title: 'Score',
    dataIndex: 'score',
    key: 'score',
    render: (score) => (
      <div className="flex items-center">
        <StarOutlined className="text-yellow-400 mr-1" />
        <span>{score}</span>
      </div>
    ),
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    render: (status) => (
      <Tag color={getStatusColor(status)} className="capitalize">
        {status}
      </Tag>
    ),
  },
  {
    title: 'Actions',
    key: 'actions',
    render: (_, record) => (
      <Space>
        <Button size="small">View</Button>
        <Button size="small" type="primary">Contact</Button>
      </Space>
    ),
  },
];