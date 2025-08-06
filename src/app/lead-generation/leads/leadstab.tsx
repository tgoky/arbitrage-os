// app/lead-generation/components/LeadsTab.tsx
import React from 'react';
import { DownloadOutlined, MailOutlined, SearchOutlined, TeamOutlined } from '@ant-design/icons';
import { Button, Card, Space, Input, Select, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Lead } from '../leads/leads';
import { Typography } from 'antd';



const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

interface LeadsTabProps {
  leads: Lead[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedStatus: string;
  setSelectedStatus: (status: string) => void;
  selectedIndustry: string;
  setSelectedIndustry: (industry: string) => void;
  selectedCompanySize: string;
  setSelectedCompanySize: (size: string) => void;
  filteredLeads: Lead[];
  leadColumns: ColumnsType<Lead>;
}

export const LeadsTab: React.FC<LeadsTabProps> = ({
  leads,
  searchTerm,
  setSearchTerm,
  selectedStatus,
  setSelectedStatus,
  selectedIndustry,
  setSelectedIndustry,
  selectedCompanySize,
  setSelectedCompanySize,
  filteredLeads,
  leadColumns,
}) => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <div>
        <Title level={4} className="mb-1">
          Generated Leads
        </Title>
        <Text type="secondary">
          View and manage your qualified leads
        </Text>
      </div>
      <Space>
        <Button icon={<DownloadOutlined />}>Export</Button>
        <Button type="primary" icon={<MailOutlined />}>
          Bulk Email
        </Button>
      </Space>
    </div>

    <Card>
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Search
            placeholder="Search leads..."
            prefix={<SearchOutlined />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            allowClear
          />
        </div>
        <Space>
          <Select
            placeholder="Status"
            value={selectedStatus}
            onChange={setSelectedStatus}
            style={{ width: 150 }}
          >
            <Option value="All">All Status</Option>
            <Option value="new">New</Option>
            <Option value="contacted">Contacted</Option>
            <Option value="qualified">Qualified</Option>
            <Option value="converted">Converted</Option>
          </Select>
          <Select
            placeholder="Industry"
            value={selectedIndustry}
            onChange={setSelectedIndustry}
            style={{ width: 150 }}
          >
            <Option value="All">All Industries</Option>
            <Option value="Technology">Technology</Option>
            <Option value="Marketing">Marketing</Option>
            <Option value="Finance">Finance</Option>
          </Select>
          <Select
            placeholder="Company Size"
            value={selectedCompanySize}
            onChange={setSelectedCompanySize}
            style={{ width: 150 }}
          >
            <Option value="All">All Sizes</Option>
            <Option value="1-10">1-10 employees</Option>
            <Option value="10-50">10-50 employees</Option>
            <Option value="50-200">50-200 employees</Option>
            <Option value="200-500">200-500 employees</Option>
            <Option value="500+">500+ employees</Option>
          </Select>
        </Space>
      </div>
    </Card>

    <Table
      columns={leadColumns}
      dataSource={filteredLeads}
      rowKey="id"
      pagination={{ pageSize: 10 }}
    />
  </div>
);