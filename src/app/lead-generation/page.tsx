// app/lead-generation/page.tsx - UPDATED WITH CREDITS DISPLAY
"use client";
import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Tabs,
  message,
  Typography,
  Space,
  Tag,
  Table,
  Input,
  Select,
  Avatar,
  Statistic,
  Row,
  Col,
  Progress,
  Empty,
  Spin
} from 'antd';
import {
  PlusOutlined,
  ThunderboltOutlined,
  TeamOutlined,
  HistoryOutlined,
  SearchOutlined,
  GlobalOutlined,
  DownloadOutlined,
  MailOutlined,
  TrophyOutlined,
  EnvironmentOutlined,

  BankOutlined,
  PhoneOutlined,
  LinkedinOutlined,
  StarOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useTheme } from '../../providers/ThemeProvider';
import { useWorkspaceContext } from '../hooks/useWorkspaceContext';
import CreditsDisplayHeader from '../../components/credits/CreditsDisplayHeader';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

// app/lead-generation/page.tsx - Update interface
interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  title: string;
  company: string;
  industry: string;
  companySize?: string;
  location: string;
  linkedinUrl?: string;
  website?: string;
  score: number;
  apolloId?: string;
  metadata?: {
    companyRevenue?: string;
    technologies?: string[];
    employeeCount?: number;
    founded?: string;
    departments?: string[];
    seniority?: string;
    emailStatus?: string;
    countryCode?: string;
    timezone?: string;
    currency?: string;
  };
  // Additional frontend fields
  generationId?: string;
  generationTitle?: string;
  notes?: string;
  status?: string;
  lastContacted?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface LeadGeneration {
  id: string;
  title: string;
  leadCount: number;
  totalFound: number;
  averageScore: number;
  criteria: any;
  generatedAt: string;
  updatedAt: string;
  createdAt: string;
  content?: string; 
  workspace: {
    id: string;
    name: string;
  };
}

const LeadGenerationPage = () => {
  const { theme } = useTheme();
  const router = useRouter();
  const { currentWorkspace, getWorkspaceScopedEndpoint } = useWorkspaceContext();

  // State
  const [activeTab, setActiveTab] = useState('leads');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [generations, setGenerations] = useState<LeadGeneration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('All');
  const [selectedScore, setSelectedScore] = useState('All');
  const [currentCredits, setCurrentCredits] = useState(0);

  const handleViewLead = (lead: Lead) => {
    router.push(`/lead-generation/leads/${lead.id}`);
  };

  const handleContactLead = (lead: Lead) => {
    console.log('Contacting lead:', lead);
    
    if (lead.email) {
      const subject = encodeURIComponent(`Introduction from ${currentWorkspace?.name || 'Our Company'}`);
      const body = encodeURIComponent(`Hi ${lead.name.split(' ')[0]},\n\nI hope this email finds you well. I came across your profile and was impressed by your work at ${lead.company}.\n\nI'd love to connect and discuss how we might be able to help ${lead.company} with [your value proposition].\n\nBest regards,\n[Your Name]`);
      
      window.open(`mailto:${lead.email}?subject=${subject}&body=${body}`);
      message.success(`Opening email to ${lead.name}`);
    } else if (lead.linkedinUrl) {
      window.open(lead.linkedinUrl, '_blank');
      message.success(`Opening LinkedIn profile for ${lead.name}`);
    } else {
      message.warning('No contact information available for this lead');
    }
  };

  const handleViewGenerationDetails = (generation: LeadGeneration) => {
    router.push(`/lead-generation/campaigns/${generation.id}`);
  };

  const handleExportGeneration = async (generation: LeadGeneration) => {
    try {
      console.log('Exporting generation:', generation);
      message.loading('Preparing export...', 1);
      
      const response = await fetch(`/api/lead-generation/${generation.id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.leads) {
          const leads = data.data.leads;
          
          const csvHeaders = ['Name', 'Email', 'Phone', 'Title', 'Company', 'Industry', 'Location', 'Score', 'LinkedIn'];
          const csvRows = leads.map((lead: Lead) => [
            lead.name,
            lead.email || '',
            lead.phone || '',
            lead.title,
            lead.company,
            lead.industry,
            lead.location,
            lead.score.toString(),
            lead.linkedinUrl || ''
          ]);
          
          const csvContent = [
            csvHeaders.join(','),
            ...csvRows.map((row: string[]) => row.map((field: string) => `"${field}"`).join(','))
          ].join('\n');
          
          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
          const link = document.createElement('a');
          const url = URL.createObjectURL(blob);
          link.setAttribute('href', url);
          link.setAttribute('download', `${generation.title.replace(/[^a-z0-9]/gi, '_')}_leads.csv`);
          link.style.visibility = 'hidden';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          message.success(`Exported ${leads.length} leads to CSV`);
        }
      }
    } catch (error) {
      console.error('Error exporting generation:', error);
      message.error('Failed to export leads');
    }
  };

  const handleBulkExport = () => {
    try {
      console.log('Bulk exporting filtered leads');
      message.loading('Preparing bulk export...', 1);
      
      if (filteredLeads.length === 0) {
        message.warning('No leads to export');
        return;
      }
      
      const csvHeaders = ['Name', 'Email', 'Phone', 'Title', 'Company', 'Industry', 'Location', 'Score', 'LinkedIn'];
      const csvRows = filteredLeads.map((lead: Lead) => [
        lead.name,
        lead.email || '',
        lead.phone || '',
        lead.title,
        lead.company,
        lead.industry,
        lead.location,
        lead.score.toString(),
        lead.linkedinUrl || ''
      ]);
      
      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map((row: string[]) => row.map((field: string) => `"${field}"`).join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `all_leads_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      message.success(`Exported ${filteredLeads.length} leads to CSV`);
    } catch (error) {
      console.error('Error with bulk export:', error);
      message.error('Failed to export leads');
    }
  };

  const handleBulkEmail = () => {
    const leadsWithEmail = filteredLeads.filter(lead => lead.email);
    
    if (leadsWithEmail.length === 0) {
      message.warning('No leads with email addresses found');
      return;
    }
    
    const emails = leadsWithEmail.map(lead => lead.email).join(',');
    const subject = encodeURIComponent(`Introduction from ${currentWorkspace?.name || 'Our Company'}`);
    const body = encodeURIComponent(`Hi there,\n\nI hope this email finds you well. I wanted to reach out to introduce our company and discuss potential collaboration opportunities.\n\nBest regards,\n[Your Name]`);
    
    if (emails.length > 2000) {
      message.warning('Too many recipients for bulk email. Consider using smaller batches or an email marketing tool.');
      return;
    }
    
    window.open(`mailto:${emails}?subject=${subject}&body=${body}`);
    message.success(`Opening bulk email to ${leadsWithEmail.length} leads`);
  };
  
  // Load data on component mount
  useEffect(() => {
    if (currentWorkspace?.id) {
      loadData();
    }
  }, [currentWorkspace?.id]);

const loadData = async () => {
  try {
    setLoading(true);
    
    console.log('Loading data for workspace:', currentWorkspace?.id);
    
    const endpoint = getWorkspaceScopedEndpoint('/api/lead-generation');
    console.log('Calling endpoint:', endpoint);
    
    const response = await fetch(endpoint);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Raw API response:', data);
      
      if (data.success && data.data) {
        const rawGenerations = data.data;
        console.log(`Loaded ${rawGenerations.length} raw generations`);
        
        const processedGenerations: LeadGeneration[] = [];
        const allLeads: Lead[] = [];
        
        for (const gen of rawGenerations) {
          try {
            console.log(`Processing generation ${gen.id}:`, {
              title: gen.title,
              hasContent: !!gen.content,
              contentType: typeof gen.content,
            });
            
            // ✅ FIX: Handle both string and object content
            let generationContent;
            if (typeof gen.content === 'string') {
              try {
                generationContent = JSON.parse(gen.content);
              } catch (parseError) {
                console.error(`Failed to parse content string for ${gen.id}:`, parseError);
                continue; // Skip this generation
              }
            } else if (typeof gen.content === 'object' && gen.content !== null) {
              generationContent = gen.content;
            } else {
              console.warn(`Invalid content type for generation ${gen.id}:`, typeof gen.content);
              continue; // Skip this generation
            }
            
            // ✅ FIX: Safely extract leads array
            const leads = Array.isArray(generationContent?.leads) 
              ? generationContent.leads 
              : [];
            
            if (leads.length === 0) {
              console.warn(`No leads found in generation ${gen.id}`);
              // Still create the generation entry even with no leads
            }
            
            const metadata = gen.metadata || {};
            
            // ✅ FIX: Recalculate metrics from actual leads
            const emailCount = leads.filter((lead: any) => 
              lead.email && 
              lead.email !== "email_not_unlocked@domain.com" && 
              !lead.email.includes('example.com')
            ).length;

            const phoneCount = leads.filter((lead: any) => 
              lead.phone && lead.phone.trim() !== ''
            ).length;

            const linkedinCount = leads.filter((lead: any) => 
              lead.linkedinUrl && lead.linkedinUrl.trim() !== ''
            ).length;

            const totalScore = leads.reduce((sum: number, lead: any) => 
              sum + (lead.score || 0), 0);
            const averageScore = leads.length > 0 ? Math.round(totalScore / leads.length) : 0;
            
            const processedGen: LeadGeneration = {
              id: gen.id,
              title: gen.title,
              leadCount: leads.length, // ✅ Use actual leads count
              totalFound: generationContent?.totalFound || leads.length,
              averageScore, // ✅ Use calculated score
              criteria: metadata?.criteria || {},
              generatedAt: metadata?.generatedAt || gen.created_at,
              createdAt: gen.created_at,
              updatedAt: gen.updated_at || gen.created_at,
              content: gen.content,
              workspace: gen.workspace
            };
            
            processedGenerations.push(processedGen);
            
            // ✅ FIX: Add leads with proper IDs
            if (leads.length > 0) {
              const leadsWithContext = leads.map((lead: any, index: number) => ({
                ...lead,
                id: lead.id || `${gen.id}_lead_${index}`,
                generationId: gen.id,
                generationTitle: gen.title,
                notes: lead.notes || '',
                status: lead.status || 'new',
                lastContacted: lead.lastContacted || null,
                createdAt: gen.created_at,
                updatedAt: gen.updated_at || gen.created_at
              }));
              
              allLeads.push(...leadsWithContext);
              console.log(`✅ Added ${leadsWithContext.length} leads from generation ${gen.id}`);
            }
          } catch (parseError) {
            console.error(`Failed to process generation ${gen.id}:`, parseError);
            // Continue to next generation instead of stopping
            continue;
          }
        }
        
        console.log(`📊 Final results:`);
        console.log(`- ${processedGenerations.length} generations processed`);
        console.log(`- ${allLeads.length} total leads extracted`);
        
        setGenerations(processedGenerations);
        setLeads(allLeads);
        
        // ✅ Show appropriate message
        if (processedGenerations.length === 0) {
          message.info('No lead generations found. Create your first campaign!');
        } else if (allLeads.length === 0) {
          message.warning('Generations found but no leads extracted. This may indicate a data format issue.');
        } else {
          message.success(`Loaded ${allLeads.length} leads from ${processedGenerations.length} campaigns`);
        }
        
      } else {
        console.error('API response indicates failure:', data);
        message.error(data.error || 'Failed to load lead data');
      }
    } else {
      const errorText = await response.text();
      console.error('HTTP error response:', response.status, errorText);
      message.error(`Failed to load lead data: ${response.status}`);
    }
  } catch (error) {
    console.error('Error loading data:', error);
    message.error('Failed to load lead data');
  } finally {
    setLoading(false);
  }
};

  // Filter leads based on search and filters
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = !searchTerm || 
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesIndustry = selectedIndustry === 'All' || lead.industry === selectedIndustry;
    
    const matchesScore = selectedScore === 'All' || 
      (selectedScore === 'High' && lead.score >= 80) ||
      (selectedScore === 'Medium' && lead.score >= 60 && lead.score < 80) ||
      (selectedScore === 'Low' && lead.score < 60);
    
    return matchesSearch && matchesIndustry && matchesScore;
  });

  // Get unique industries for filter
  const industries = ['All', ...Array.from(new Set(leads.map(lead => lead.industry)))];

  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return '#52c41a';
    if (score >= 60) return '#faad14';
    return '#ff4d4f';
  };

  // Add to your lead generation page
const GlobalCoverageStats = ({ globalCoverage }: { globalCoverage?: any }) => {
  if (!globalCoverage) return null;
  
  return (
    <Card title="Global Coverage" className="mb-4">
      <Row gutter={16}>
        <Col span={6}>
          <Statistic
            title="Countries"
            value={globalCoverage.countries?.length || 0}
            prefix={<GlobalOutlined />}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="Regions"
            value={globalCoverage.regions?.length || 0}
            prefix={<EnvironmentOutlined />}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="Economic Tiers"
            value={Object.keys(globalCoverage.economicTiers || {}).length}
            prefix={<TrophyOutlined />}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="Industries"
            value={globalCoverage.industries?.length || 0}
            prefix={<BankOutlined />}
          />
        </Col>
      </Row>
    </Card>
  );
};

  // Lead table columns
const leadColumns: ColumnsType<Lead> = [
  {
    title: 'Contact',
    key: 'contact',
    width: 250, // Increased to accommodate badges
    render: (_, record) => {
      // Function to determine if title is senior level
      const getSeniorityInfo = (title: string, metadata?: any) => {
        const titleLower = title.toLowerCase();
        const seniority = metadata?.seniority?.toLowerCase() || '';
        
        // C-Level executives
        if (titleLower.includes('ceo') || titleLower.includes('chief executive')) {
          return { level: 'c-level', badge: 'CEO', color: '#722ed1' };
        }
        if (titleLower.includes('cto') || titleLower.includes('chief technology')) {
          return { level: 'c-level', badge: 'CTO', color: '#722ed1' };
        }
        if (titleLower.includes('cfo') || titleLower.includes('chief financial')) {
          return { level: 'c-level', badge: 'CFO', color: '#722ed1' };
        }
        if (titleLower.includes('coo') || titleLower.includes('chief operating')) {
          return { level: 'c-level', badge: 'COO', color: '#722ed1' };
        }
        if (titleLower.includes('chief') && titleLower.includes('officer')) {
          return { level: 'c-level', badge: 'C-Level', color: '#722ed1' };
        }
        
        // Founders
        if (titleLower.includes('founder') || titleLower.includes('co-founder')) {
          return { level: 'founder', badge: 'Founder', color: '#fa541c' };
        }
        
        // VPs and Directors
        if (titleLower.includes('vp ') || titleLower.includes('vice president')) {
          return { level: 'vp', badge: 'VP', color: '#1890ff' };
        }
        if (titleLower.includes('director') && !titleLower.includes('associate')) {
          return { level: 'director', badge: 'Director', color: '#52c41a' };
        }
        
        // Presidents
        if (titleLower.includes('president') && !titleLower.includes('vice')) {
          return { level: 'president', badge: 'President', color: '#fa541c' };
        }
        
        // Seniority from metadata
        if (seniority.includes('senior') || seniority.includes('lead')) {
          return { level: 'senior', badge: 'Senior', color: '#faad14' };
        }
        
        return null;
      };

      const seniorityInfo = getSeniorityInfo(record.title, record.metadata);

      return (
        <div className="flex items-center space-x-3">
          <Avatar 
            src={`https://i.pravatar.cc/32?u=${record.id}`}
            size={32}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <span className="font-medium text-sm truncate">{record.name}</span>
              {seniorityInfo && (
                <span 
                  className="px-2 py-0.5 text-xs font-medium text-white rounded-full"
                  style={{ backgroundColor: seniorityInfo.color }}
                >
                  {seniorityInfo.badge}
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500 truncate">{record.title}</div>
            {record.metadata?.seniority && (
              <div className="text-xs text-gray-400 truncate">
                {record.metadata.seniority}
              </div>
            )}
          </div>
        </div>
      );
    },
  },
  {
    title: 'Company',
    key: 'company',
    width: 200,
    render: (_, record) => (
      <div>
        <div className="font-medium text-sm truncate">{record.company}</div>
        <div className="text-xs text-gray-500 truncate">{record.industry}</div>
        {/* Only show company size if it exists and isn't "unknown" */}
        {record.companySize && 
         !record.companySize.toLowerCase().includes('unknown') && 
         record.companySize !== 'Unknown' && (
          <Tag  className="mt-1 text-xs">
            {record.companySize}
          </Tag>
        )}
      </div>
    ),
  },
  {
    title: 'Location',
    dataIndex: 'location',
    key: 'location',
    width: 150, // Increased from 120
    render: (location) => (
      <div className="text-sm" title={location}>
        <span className="truncate block">{location}</span>
      </div>
    ),
  },
  {
    title: 'Contact Info',
    key: 'contactInfo',
    width: 200, // Increased from 140 to show full contact details
    render: (_, record) => (
      <div className="space-y-1">
        {record.email && (
          <div className="flex items-center text-xs">
            <MailOutlined className="mr-1 text-green-500 flex-shrink-0" />
            <span className="truncate" title={record.email}>{record.email}</span>
          </div>
        )}
        {record.phone && (
          <div className="flex items-center text-xs">
            <PhoneOutlined className="mr-1 text-blue-500 flex-shrink-0" />
            <span className="truncate" title={record.phone}>{record.phone}</span>
          </div>
        )}
        {record.linkedinUrl && (
          <div className="flex items-center text-xs">
            <LinkedinOutlined className="mr-1 text-purple-500 flex-shrink-0" />
            <span className="truncate" title={record.linkedinUrl}>
              {record.linkedinUrl.replace('https://', '').replace('www.', '')}
            </span>
          </div>
        )}
        {!record.email && !record.phone && !record.linkedinUrl && (
          <span className="text-xs text-gray-400">No contact info</span>
        )}
      </div>
    ),
  },
  {
    title: 'Score',
    key: 'score',
    width: 80, // Compact width for score
    align: 'center',
    render: (_, record) => (
      <div className="flex items-center justify-center">
        <div 
          className="flex items-center justify-center w-12 h-6 rounded text-xs font-bold text-white"
          style={{ backgroundColor: getScoreColor(record.score) }}
        >
          {record.score}
        </div>
      </div>
    ),
    sorter: (a, b) => a.score - b.score,
  },
  {
    title: 'Actions',
    key: 'actions',
    width: 140,
    fixed: 'right' as const, // Keep actions always visible
    render: (_, record) => (
      <Space size="small">
        <Button 
          size="small"
          type="text"
          onClick={() => handleViewLead(record)}
        >
          View
        </Button>
        <Button 
          size="small" 
          type="primary"
          onClick={() => handleContactLead(record)}
        >
          Contact
        </Button>
      </Space>
    ),
  },
];


  // Generation history columns
  const generationColumns: ColumnsType<LeadGeneration> = [
    {
      title: 'Campaign',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Leads Found',
      dataIndex: 'leadCount',
      key: 'leadCount',
      render: (count, record) => (
        <div>
          <div className="font-medium">{count} leads</div>
          <div className="text-sm text-gray-500">
            {record.totalFound} total found
          </div>
        </div>
      ),
    },
    {
      title: 'Avg Score',
      dataIndex: 'averageScore',
      key: 'averageScore',
      render: (score) => (
        <div className="flex items-center">
          <StarOutlined style={{ color: getScoreColor(score) }} className="mr-1" />
          <span style={{ color: getScoreColor(score), fontWeight: 'bold' }}>
            {Math.round(score)}
          </span>
        </div>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            size="small"
            onClick={() => router.push(`/lead-generation/campaigns/${record.id}`)}
          >
            View Details
          </Button>
          <Button 
            size="small" 
            icon={<DownloadOutlined />}
            onClick={() => handleExportGeneration(record)}
          >
            Export
          </Button>
        </Space>
      ),
    }
  ];

  // Tab items
  const tabItems = [
    {
      key: 'leads',
      label: (
        <span>
          <TeamOutlined />
          All Leads ({filteredLeads.length})
        </span>
      ),
      children: (
        <div>
          {/* Filters */}
          <Card className="mb-6">
            <Row gutter={16} align="middle">
              <Col span={8}>
                <Search
                  placeholder="Search leads..."
                  prefix={<SearchOutlined />}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  allowClear
                />
              </Col>
              <Col span={4}>
                <Select
                  value={selectedIndustry}
                  onChange={setSelectedIndustry}
                  style={{ width: '100%' }}
                >
                  {industries.map(industry => (
                    <Option key={industry} value={industry}>{industry}</Option>
                  ))}
                </Select>
              </Col>
              <Col span={4}>
                <Select
                  value={selectedScore}
                  onChange={setSelectedScore}
                  style={{ width: '100%' }}
                >
                  <Option value="All">All Scores</Option>
                  <Option value="High">High (80+)</Option>
                  <Option value="Medium">Medium (60-79)</Option>
                  <Option value="Low">Low (&lt;60)</Option>
                </Select>
              </Col>
              <Col span={8} className="text-right">
                <Space>
                  <Button 
                    icon={<DownloadOutlined />}
                    onClick={handleBulkExport}
                    disabled={filteredLeads.length === 0}
                  >
                    Export ({filteredLeads.length})
                  </Button>
                  <Button 
                    icon={<MailOutlined />}
                    onClick={handleBulkEmail}
                    disabled={filteredLeads.filter(lead => lead.email).length === 0}
                  >
                    Bulk Email ({filteredLeads.filter(lead => lead.email).length})
                  </Button>
                </Space>
              </Col>
            </Row>
          </Card>

          {/* Leads Table */}
       {loading ? (
  <div className="text-center py-12">
    <Spin size="large" />
  </div>
) : filteredLeads.length > 0 ? (
<Table
  columns={leadColumns}
  dataSource={filteredLeads}
  rowKey="id"
  className="lead-generation-table no-vertical-borders"
  scroll={{ 
    x: 1030, // Increased to accommodate wider contact column with badges
    y: 600   
  }}
  pagination={{
    total: filteredLeads.length,
    pageSize: 20,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total, range) => 
      `${range[0]}-${range[1]} of ${total} leads`,
  }}
  size="small" // Changed from "middle" to "small" for more compact rows
  tableLayout="fixed" // Enforces the width constraints
  onRow={(record) => ({
    onClick: (event) => {
      // Don't navigate if user clicked on a button or link
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'BUTTON' || 
        target.closest('button') || 
        target.tagName === 'A' || 
        target.closest('a')
      ) {
        return;
      }
      handleViewLead(record);
    },
    style: { cursor: 'pointer' },
    className: 'clickable-row'
  })}
/>



) : (
  <Empty 
    description="No leads found"
    image={Empty.PRESENTED_IMAGE_SIMPLE}
  />
)}
        </div>
      ),
    },
    {
      key: 'history',
      label: (
        <span>
          <HistoryOutlined />
          Generation History ({generations.length})
        </span>
      ),
      children: (
        <div>
     {loading ? (
  <div className="text-center py-12">
    <Spin size="large" />
  </div>
) : generations.length > 0 ? (
  <Table
    columns={generationColumns}
    dataSource={generations}
    rowKey="id"
    // Removed potential horizontal scroll settings
    // scroll={{ x: 'max-content' }} // Remove this if it exists
    pagination={{
      total: generations.length,
      pageSize: 10,
      showSizeChanger: true,
    }}
    // Add responsive settings
    tableLayout="auto" // Distribute columns based on content
  />
) : (
  <Empty 
    description="No lead generations yet"
    image={Empty.PRESENTED_IMAGE_SIMPLE}
  >
    <Button 
      type="primary" 
      icon={<PlusOutlined />}
      onClick={() => router.push('/lead-generation/create')}
       style={{
    backgroundColor: '#5CC49D',
    borderColor: '#5CC49D',
    color: '#000000',
    fontWeight: '500'
  }}
    >
      Generate Your First Leads
    </Button>
  </Empty>
)}
        </div>
      ),
    },
  ];

  // Calculate stats
  const totalLeads = leads.length;
  const highScoreLeads = leads.filter(lead => lead.score >= 80).length;
  const leadsWithEmail = leads.filter(lead => lead.email).length;
  const leadsWithPhone = leads.filter(lead => lead.phone).length;

  return (
    <div style={{
      backgroundColor: theme === 'dark' ? '#000000' : '#ffffff',
      padding: 24,
      minHeight: '100vh'
    }}>
      {/* Enhanced Credits Header */}
      <CreditsDisplayHeader 
        onCreditsUpdate={setCurrentCredits}
      />

      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <Space align="center">

            <Title level={2} className="mb-0">
                 <span style={{ color: '#5CC49D' }}>a</span>rb
  <span style={{ color: '#5CC49D' }}>i</span>trageOS  Lead Generation
            </Title>
          </Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => router.push('/lead-generation/create')}
            size="large"
                   style={{
    backgroundColor: '#5CC49D',
    borderColor: '#5CC49D',
    color: '#000000',
    fontWeight: '500'
  }}
          >
            Generate New Leads
          </Button>
        </div>
        
        <Text type="secondary">
          Manage and view your generated leads
        </Text>
      </div>

      {/* Stats Cards */}
      <Row gutter={24} className="mb-6">
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Leads"
              value={totalLeads}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
            <Progress
              percent={100} 
              size="small"
              showInfo={false}
              strokeColor="#52c41a"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="High Quality"
              value={highScoreLeads}
              suffix={`/ ${totalLeads}`}
              prefix={<StarOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
            <Progress 
              percent={totalLeads > 0 ? Math.round((highScoreLeads / totalLeads) * 100) : 0} 
              size="small" 
              showInfo={false}
              strokeColor="#52c41a"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="With Email"
              value={leadsWithEmail}
              suffix={`/ ${totalLeads}`}
              prefix={<MailOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
            <Progress 
              percent={totalLeads > 0 ? Math.round((leadsWithEmail / totalLeads) * 100) : 0} 
              size="small" 
              showInfo={false}
              strokeColor="#1890ff"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="With Phone"
              value={leadsWithPhone}
              suffix={`/ ${totalLeads}`}
              prefix={<PhoneOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
            <Progress 
              percent={totalLeads > 0 ? Math.round((leadsWithPhone / totalLeads) * 100) : 0} 
              size="small" 
              showInfo={false}
              strokeColor="#722ed1"
            />
          </Card>
        </Col>
      </Row>

      {/* Main Content */}
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          size="large"
        />
      </Card>
    </div>
  );
};

export default LeadGenerationPage;