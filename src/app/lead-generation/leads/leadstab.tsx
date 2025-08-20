// app/lead-generation/components/LeadsTab.tsx
import React from 'react';
import { DownloadOutlined, MailOutlined, SearchOutlined, PhoneOutlined, StarOutlined } from '@ant-design/icons';
import { Button, Card, Space, Input, Select, Avatar, Tag } from 'antd';
import { Typography } from 'antd';
import { Lead } from '../leads/leads';
import { useTheme } from '../../../providers/ThemeProvider';
import { ColumnsType } from 'antd/es/table';

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
}) => {
  const { theme } = useTheme();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'blue';
      case 'contacted': return 'orange';
      case 'qualified': return 'green';
      case 'converted': return 'purple';
      default: return 'default';
    }
  };

  return (
    <div style={{ 
      backgroundColor: theme === 'dark' ? '#000000' : '#ffffff',
      padding: '24px',
      minHeight: '100vh'
    }}>
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

      <div style={{ marginBottom: '24px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <div>
            <Title 
              level={4} 
              style={{ 
                margin: 0,
                marginBottom: '4px',
                color: theme === 'dark' ? '#f9fafb' : '#1a1a1a'
              }}
            >
              Generated Leads
            </Title>
            <Text style={{ color: theme === 'dark' ? '#9ca3af' : '#666666' }}>
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

        <Card
          style={{
            backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
            border: theme === 'dark' ? '1px solid #374151' : '1px solid #e5e7eb',
            marginBottom: '24px'
          }}
          styles={{
            body: {
              backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
              padding: '16px'
            }
          }}
        >
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ flex: 1 }}>
              <Search
                placeholder="Search leads..."
                prefix={<SearchOutlined />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                allowClear
                size="large"
              />
            </div>
            <Space wrap>
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
      </div>

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
                  Lead
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
                  Company
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
                  Contact
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
                  Score
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
              {filteredLeads.map((lead, index) => (
                <tr
                  key={lead.id}
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
                  {/* Lead Column */}
                  <td style={{ 
                    padding: '16px 24px', 
                    fontSize: '14px', 
                    color: theme === 'dark' ? '#e5e7eb' : '#1f2937',
                    verticalAlign: 'middle',
                    borderBottom: theme === 'dark' ? '1px solid #374151' : '1px solid #f3f4f6'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar 
                        src={`https://i.pravatar.cc/150?u=${lead.id}`} 
                        style={{ marginRight: '16px' }}
                      />
                      <div>
                        <div style={{ 
                          fontWeight: 500, 
                          color: theme === 'dark' ? '#f9fafb' : '#1f2937',
                          marginBottom: 2
                        }}>
                          {lead.name}
                        </div>
                        <div style={{ 
                          fontSize: '12px', 
                          color: theme === 'dark' ? '#9ca3af' : '#6b7280'
                        }}>
                          {lead.title}
                        </div>
                      </div>
                    </div>
                  </td>
                  {/* Company Column */}
                  <td style={{ 
                    padding: '16px 24px', 
                    fontSize: '14px', 
                    color: theme === 'dark' ? '#e5e7eb' : '#1f2937',
                    verticalAlign: 'middle',
                    borderBottom: theme === 'dark' ? '1px solid #374151' : '1px solid #f3f4f6'
                  }}>
                    <div>
                      <div style={{ 
                        fontWeight: 500, 
                        color: theme === 'dark' ? '#f9fafb' : '#1f2937',
                        marginBottom: 2
                      }}>
                        {lead.company}
                      </div>
                      <div style={{ 
                        fontSize: '12px', 
                        color: theme === 'dark' ? '#9ca3af' : '#6b7280'
                      }}>
                        {lead.industry}
                      </div>
                    </div>
                  </td>
                  {/* Contact Column */}
                  <td style={{ 
                    padding: '16px 24px', 
                    fontSize: '14px', 
                    color: theme === 'dark' ? '#e5e7eb' : '#1f2937',
                    verticalAlign: 'middle',
                    borderBottom: theme === 'dark' ? '1px solid #374151' : '1px solid #f3f4f6'
                  }}>
                    <Space direction="vertical" size={0}>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 2 }}>
                        <MailOutlined style={{ marginRight: '4px', fontSize: '12px' }} />
                        <span style={{ fontSize: '12px' }}>{lead.email}</span>
                      </div>
                      {lead.phone && (
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <PhoneOutlined style={{ marginRight: '4px', fontSize: '12px' }} />
                          <span style={{ fontSize: '12px' }}>{lead.phone}</span>
                        </div>
                      )}
                    </Space>
                  </td>
                  {/* Score Column */}
                  <td style={{ 
                    padding: '16px 24px', 
                    fontSize: '14px', 
                    color: theme === 'dark' ? '#e5e7eb' : '#1f2937',
                    verticalAlign: 'middle',
                    borderBottom: theme === 'dark' ? '1px solid #374151' : '1px solid #f3f4f6'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <StarOutlined style={{ color: '#faad14', marginRight: '4px' }} />
                      <span>{lead.score}</span>
                    </div>
                  </td>
                  {/* Status Column */}
                  <td style={{ 
                    padding: '16px 24px', 
                    fontSize: '14px', 
                    color: theme === 'dark' ? '#e5e7eb' : '#1f2937',
                    verticalAlign: 'middle',
                    borderBottom: theme === 'dark' ? '1px solid #374151' : '1px solid #f3f4f6'
                  }}>
                    <Tag color={getStatusColor(lead.status)} style={{ textTransform: 'capitalize' }}>
                      {lead.status}
                    </Tag>
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
                      <Button size="small">View</Button>
                      <Button size="small" type="primary">Contact</Button>
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
            Showing {filteredLeads.length} leads
          </Text>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button size="small">Previous</Button>
            <Button size="small">Next</Button>
          </div>
        </div>
      </div>
    </div>
  );
};