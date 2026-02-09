// app/lead-generation/page.tsx - UPDATED WITH DARK THEME CARDS
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
  Spin,
  ConfigProvider
} from 'antd';
import {
  PlusOutlined,
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
  StarFilled,
  ArrowRightOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useTheme } from '../../providers/ThemeProvider';
import { useWorkspaceContext } from '../hooks/useWorkspaceContext';
import CreditsDisplayHeader from '../../components/credits/CreditsDisplayHeader';
import type { ColumnsType } from 'antd/es/table';



const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

// --- STYLES & CONSTANTS ---
const BRAND_COLOR = '#5CC49D';
const BRAND_COLOR_HOVER = '#4AB08C';
const FONT_FAMILY = "'Manrope', sans-serif";

const customThemeToken = {
  fontFamily: FONT_FAMILY,
  colorPrimary: BRAND_COLOR,
  borderRadius: 8,
  colorBgContainer: '#ffffff',
};

// --- INTERFACES ---
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

// --- GLOBAL COVERAGE STATS COMPONENT ---
const GlobalCoverageStats = ({ globalCoverage, isDark }: { globalCoverage?: any; isDark: boolean }) => {
  if (!globalCoverage) return null;
  
  return (
    <Card 
      title="Global Coverage" 
      className="mb-6"
      styles={{
        body: { padding: '20px 24px' },
        header: { 
          borderBottom: `1px solid ${isDark ? '#333' : '#f0f0f0'}`,
          padding: '16px 24px'
        }
      }}
      style={{
        backgroundColor: isDark ? '#111' : '#fff',
        border: isDark ? '1px solid #333' : '1px solid #f0f0f0',
        color: isDark ? '#fff' : '#000'
      }}
    >
      <Row gutter={16}>
        <Col span={6}>
          <Statistic
            title={<span style={{ color: isDark ? '#999' : '#666' }}>Countries</span>}
            value={globalCoverage.countries?.length || 0}
            prefix={<GlobalOutlined style={{ color: BRAND_COLOR }} />}
            valueStyle={{ fontWeight: 700, color: isDark ? '#fff' : '#000' }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title={<span style={{ color: isDark ? '#999' : '#666' }}>Regions</span>}
            value={globalCoverage.regions?.length || 0}
            prefix={<EnvironmentOutlined style={{ color: BRAND_COLOR }} />}
            valueStyle={{ fontWeight: 700, color: isDark ? '#fff' : '#000' }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title={<span style={{ color: isDark ? '#999' : '#666' }}>Economic Tiers</span>}
            value={Object.keys(globalCoverage.economicTiers || {}).length}
            prefix={<TrophyOutlined style={{ color: BRAND_COLOR }} />}
            valueStyle={{ fontWeight: 700, color: isDark ? '#fff' : '#000' }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title={<span style={{ color: isDark ? '#999' : '#666' }}>Industries</span>}
            value={globalCoverage.industries?.length || 0}
            prefix={<BankOutlined style={{ color: BRAND_COLOR }} />}
            valueStyle={{ fontWeight: 700, color: isDark ? '#fff' : '#000' }}
          />
        </Col>
      </Row>
    </Card>
  );
};

const LeadGenerationPage = () => {
  const { theme } = useTheme();
  const router = useRouter();
  const { currentWorkspace, getWorkspaceScopedEndpoint } = useWorkspaceContext();
  const isDark = theme === 'dark';

  // State
  const [activeTab, setActiveTab] = useState('leads');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [generations, setGenerations] = useState<LeadGeneration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('All');
  const [selectedScore, setSelectedScore] = useState('All');
  const [currentCredits, setCurrentCredits] = useState(0);
  const [globalCoverage, setGlobalCoverage] = useState<any>(null);

  // --- ACTIONS ---

  const handleViewLead = (lead: Lead) => {
    router.push(`/lead-generation/leads/${lead.id}`);
  };

  const handleContactLead = (lead: Lead) => {
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

  const handleExportGeneration = async (generation: LeadGeneration) => {
    try {
      message.loading('Preparing export...', 1);
      const response = await fetch(`/api/lead-generation/${generation.id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.leads) {
          const leadsToExport = data.data.leads;
          generateCSV(leadsToExport, `${generation.title.replace(/[^a-z0-9]/gi, '_')}_leads.csv`);
        }
      }
    } catch (error) {
      console.error('Error exporting generation:', error);
      message.error('Failed to export leads');
    }
  };

  const handleBulkExport = () => {
    try {
      if (filteredLeads.length === 0) {
        message.warning('No leads to export');
        return;
      }
      generateCSV(filteredLeads, `all_leads_${new Date().toISOString().split('T')[0]}.csv`);
    } catch (error) {
      console.error('Error with bulk export:', error);
      message.error('Failed to export leads');
    }
  };

  const generateCSV = (leadsToExport: Lead[], filename: string) => {
    const csvHeaders = ['Name', 'Email', 'Phone', 'Title', 'Company', 'Industry', 'Location', 'Score', 'LinkedIn'];
    const csvRows = leadsToExport.map((lead: Lead) => [
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
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    message.success(`Exported ${leadsToExport.length} leads to CSV`);
  };

  const handleBulkEmail = () => {
    const leadsWithEmail = filteredLeads.filter(lead => lead.email);
    if (leadsWithEmail.length === 0) {
      message.warning('No leads with email addresses found');
      return;
    }
    const emails = leadsWithEmail.map(lead => lead.email).join(',');
    const subject = encodeURIComponent(`Introduction from ${currentWorkspace?.name || 'Our Company'}`);
    const body = encodeURIComponent(`Hi there,\n\nI hope this email finds you well...`);
    
    if (emails.length > 2000) {
      message.warning('Too many recipients. Try smaller batches.');
      return;
    }
    window.open(`mailto:${emails}?subject=${subject}&body=${body}`);
    message.success(`Opening bulk email to ${leadsWithEmail.length} leads`);
  };
  
  // Load data
  useEffect(() => {
    if (currentWorkspace?.id) {
      loadData();
    }
  }, [currentWorkspace?.id]);
  
  const loadData = async () => {
    try {
      setLoading(true);
      const endpoint = getWorkspaceScopedEndpoint('/api/lead-generation');
      const response = await fetch(endpoint);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const rawGenerations = data.data;
          const processedGenerations: LeadGeneration[] = [];
          const allLeads: Lead[] = [];
          
          // Calculate global coverage
          const coverage = {
            countries: new Set<string>(),
            regions: new Set<string>(),
            economicTiers: new Set<string>(),
            industries: new Set<string>()
          };
          
          for (const gen of rawGenerations) {
            try {
              const metadata = gen.metadata || {};
              const leadCount = metadata.leadCount || 0;
              
              const processedGen: LeadGeneration = {
                id: gen.id,
                title: gen.title,
                leadCount,
                totalFound: metadata.totalFound || 0,
                averageScore: metadata.averageScore || 0,
                criteria: metadata?.criteria || {},
                generatedAt: metadata?.generatedAt || gen.createdAt,
                createdAt: gen.createdAt,
                updatedAt: gen.updatedAt || gen.createdAt,
                content: gen.content,
                workspace: gen.workspace
              };
              
              processedGenerations.push(processedGen);
              
              if (leadCount > 0 && gen.content) {
                let generationContent;
                if (typeof gen.content === 'string') {
                  generationContent = JSON.parse(gen.content);
                } else {
                  generationContent = gen.content;
                }
                
                const leads = Array.isArray(generationContent?.leads) ? generationContent.leads : [];
                
                if (leads.length > 0) {
                  const leadsWithContext = leads.map((lead: any, index: number) => ({
                    ...lead,
                    id: lead.id || `${gen.id}_lead_${index}`,
                    generationId: gen.id,
                    generationTitle: gen.title,
                    score: lead.score || 0,
                    company: lead.company || 'Unknown Company',
                    title: lead.title || 'Unknown Title',
                    createdAt: gen.createdAt,
                    notes: lead.notes || '',
                    status: lead.status || 'new',
                    lastContacted: lead.lastContacted || null,
                    updatedAt: gen.updatedAt || gen.createdAt
                  }));
                  
                  allLeads.push(...leadsWithContext);
                  
                  // Update global coverage stats
                  leadsWithContext.forEach((lead: Lead) => {
                    if (lead.location) {
                      const country = lead.location.split(',').pop()?.trim();
                      if (country) coverage.countries.add(country);
                    }
                    if (lead.industry) coverage.industries.add(lead.industry);
                  });
                }
              }
            } catch (error) {
              console.error(`Error processing generation ${gen.id}`, error);
            }
          }
          
          setGenerations(processedGenerations);
          setLeads(allLeads);
          
          // Set global coverage
          setGlobalCoverage({
            countries: Array.from(coverage.countries),
            regions: Array.from(coverage.regions),
            economicTiers: Array.from(coverage.economicTiers),
            industries: Array.from(coverage.industries)
          });
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      message.error('Failed to load lead data');
    } finally {
      setLoading(false);
    }
  };

  // Filters
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

  const industries = ['All', ...Array.from(new Set(leads.map(lead => lead.industry).filter(Boolean)))];

  // Helpers
  const getScoreColor = (score: number) => {
    if (score >= 80) return BRAND_COLOR; // High score gets brand color
    if (score >= 60) return '#faad14'; // Warning yellow
    return '#ff4d4f'; // Error red
  };

  // --- STATS CARD COMPONENT ---
  const StatCard = ({ title, value, icon, subValue, color = BRAND_COLOR }: any) => {
    const cardBg = isDark ? '#111' : '#fff';
    const textColor = isDark ? '#fff' : '#000';
    const titleColor = isDark ? '#999' : '#666';
    const subTextColor = isDark ? '#888' : '#999';
    
    return (
      <Card 
        bordered={false} 
        className="h-full transition-all duration-300 hover:translate-y-[-2px]"
        styles={{
          body: { padding: '20px 24px' }
        }}
        style={{
          backgroundColor: cardBg,
          border: isDark ? '1px solid #333' : '1px solid #f0f0f0',
          boxShadow: isDark 
            ? '0 4px 6px -1px rgba(0, 0, 0, 0.5)' 
            : '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        }}
      >
        <div className="flex justify-between items-start">
          <div>
            <p 
              className="text-xs font-semibold uppercase tracking-wider mb-1"
              style={{ color: titleColor }}
            >
              {title}
            </p>
            <div className="flex items-baseline gap-2">
              <h3 
                className="text-2xl font-bold m-0" 
                style={{ 
                  fontFamily: FONT_FAMILY,
                  color: textColor 
                }}
              >
                {value}
              </h3>
              {subValue && (
                <span className="text-xs" style={{ color: subTextColor }}>
                  {subValue}
                </span>
              )}
            </div>
          </div>
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ 
              backgroundColor: isDark 
                ? `${color}40`  // 40 hex = 25% opacity in dark
                : `${color}20`, // 20 hex = 12% opacity in light
              color: color 
            }}
          >
            {icon}
          </div>
        </div>
        <Progress 
          percent={100} 
          strokeColor={color} 
          showInfo={false} 
          size="small" 
          className="mt-3" 
          style={{ 
            marginBottom: 0,
            backgroundColor: isDark ? '#333' : '#f5f5f5'
          }} 
          strokeLinecap="butt"
        />
      </Card>
    );
  };

  // --- COLUMNS ---
  const leadColumns: ColumnsType<Lead> = [
    {
      title: 'Contact Profile',
      key: 'contact',
      width: 280,
      render: (_, record) => {
        const getSeniorityInfo = (title: string) => {
          const t = title.toLowerCase();
          if (t.includes('ceo') || t.includes('founder') || t.includes('chief')) 
            return { badge: 'Executive', color: '#000000', bg: BRAND_COLOR };
          if (t.includes('vp') || t.includes('director')) 
            return { badge: 'Leadership', color: '#fff', bg: '#001529' };
          return null;
        };

        const seniority = getSeniorityInfo(record.title);

        return (
          <div className="flex items-center space-x-3">
          <div 
  className="flex items-center justify-center rounded-full"
  style={{
    width: '42px',
    height: '42px',
    backgroundColor: isDark ? '#333' : '#f0f0f0',
    border: `1px solid ${isDark ? '#444' : '#e0e0e0'}`,
    color: isDark ? '#fff' : '#000',
    fontSize: '16px',
    fontWeight: 600,
    fontFamily: FONT_FAMILY
  }}
>
  {record.name.charAt(0).toUpperCase()}
</div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2">
                <span 
                  className="font-bold text-sm truncate" 
                  style={{ 
                    fontFamily: FONT_FAMILY,
                    color: isDark ? '#fff' : '#000'
                  }}
                >
                  {record.name}
                </span>
                {seniority && (
                  <span 
                    className="px-2 py-0.5 text-[10px] uppercase tracking-wide font-bold rounded-full"
                    style={{ color: seniority.color, backgroundColor: seniority.bg }}
                  >
                    {seniority.badge}
                  </span>
                )}
              </div>
              <div 
                className="text-xs truncate mt-0.5"
                style={{ color: isDark ? '#999' : '#666' }}
              >
                {record.title}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      title: 'Organization',
      key: 'company',
      width: 220,
      render: (_, record) => (
        <div>
          <div 
            className="font-semibold text-sm truncate"
            style={{ color: isDark ? '#fff' : '#000' }}
          >
            {record.company}
          </div>
          <div className="flex flex-wrap gap-1 mt-1">
             <Tag 
               bordered={false} 
               className="text-xs m-0"
               style={{
                 backgroundColor: isDark ? '#333' : '#f0f0f0',
                 color: isDark ? '#999' : '#666'
               }}
             >
               {record.industry}
             </Tag>
             {record.companySize && record.companySize !== 'Unknown' && (
                <Tag 
                  bordered={false} 
                  className="text-xs m-0 bg-transparent"
                  style={{ color: isDark ? '#888' : '#999' }}
                >
                  {record.companySize}
                </Tag>
             )}
          </div>
        </div>
      ),
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      width: 150,
      render: (location) => (
        <div 
          className="flex items-center"
          style={{ color: isDark ? '#999' : '#666' }}
        >
          <EnvironmentOutlined className="mr-1.5 text-xs" />
          <span className="text-sm truncate">{location}</span>
        </div>
      ),
    },
    {
      title: 'Channels',
      key: 'contactInfo',
      width: 180,
      render: (_, record) => (
        <div className="flex space-x-2">
          {record.email ? (
            <Tag 
              className="m-0 flex items-center gap-1 border-0 px-2"
              style={{ 
                backgroundColor: isDark ? 'rgba(34, 197, 94, 0.1)' : '#f0f9ff',
                color: isDark ? '#4ade80' : '#0ea5e9'
              }}
            >
               <MailOutlined /> Email
            </Tag>
          ) : (
             <Tag 
               className="m-0 border-0"
               style={{ 
                 backgroundColor: isDark ? '#333' : '#f5f5f5',
                 color: isDark ? '#666' : '#999'
               }}
             >
               No Email
             </Tag>
          )}
          
          {record.linkedinUrl && (
             <a 
               href={record.linkedinUrl} 
               target="_blank" 
               rel="noreferrer" 
               style={{ color: isDark ? '#999' : '#666' }}
               className="hover:text-[#5CC49D] transition-colors"
             >
                <LinkedinOutlined style={{ fontSize: '16px' }} />
             </a>
          )}
          
          {record.phone && (
             <div 
               style={{ color: isDark ? '#999' : '#666' }}
               title={record.phone}
             >
                <PhoneOutlined style={{ fontSize: '16px', color: BRAND_COLOR }} />
             </div>
          )}
        </div>
      ),
    },
    {
      title: 'Fit Score',
      key: 'score',
      width: 120,
      sorter: (a, b) => a.score - b.score,
      render: (_, record) => (
        <div className="w-full">
           <div className="flex items-center justify-between mb-1">
             <span 
               className="font-bold text-xs"
               style={{ color: isDark ? '#fff' : '#000' }}
             >
               {record.score}%
             </span>
           </div>
           <Progress 
             percent={record.score} 
             steps={5} 
             size="small" 
             strokeColor={getScoreColor(record.score)}
             trailColor={isDark ? '#333' : 'rgba(0,0,0,0.06)'}
             showInfo={false}
           />
        </div>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Button 
          type="text"
          size="small"
          className="rounded-full w-8 h-8 flex items-center justify-center"
          style={{
            backgroundColor: isDark ? 'transparent' : 'transparent',
            color: isDark ? '#999' : '#666'
          }}
          onClick={(e) => { e.stopPropagation(); handleViewLead(record); }}
        >
          <ArrowRightOutlined />
        </Button>
      ),
    },
  ];

  const generationColumns: ColumnsType<LeadGeneration> = [
    {
      title: 'Campaign Name',
      dataIndex: 'title',
      key: 'title',
      render: (text) => (
        <span 
          className="font-semibold text-base"
          style={{ color: isDark ? '#fff' : '#000' }}
        >
          {text}
        </span>
      )
    },
    {
      title: 'Results',
      dataIndex: 'leadCount',
      key: 'leadCount',
      render: (count, record) => (
        <div className="flex items-center gap-2">
           <Tag 
             color={BRAND_COLOR} 
             style={{ 
               color: '#000', 
               border: 0, 
               fontWeight: 600 
             }}
           >
             {count} Leads
           </Tag>
           <span className="text-xs" style={{ color: isDark ? '#888' : '#999' }}>
             {record.totalFound} found
           </span>
        </div>
      ),
    },
    {
      title: 'Avg Quality',
      dataIndex: 'averageScore',
      key: 'averageScore',
      render: (score) => (
        <Space size={4}>
          <StarFilled style={{ color: getScoreColor(score), fontSize: '12px' }} />
          <span 
            className="font-semibold"
            style={{ color: isDark ? '#fff' : '#000' }}
          >
            {Math.round(score)}/100
          </span>
        </Space>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => (
        <span style={{ color: isDark ? '#888' : '#999' }}>
          {new Date(date).toLocaleDateString()}
        </span>
      ),
    },
    {
      title: '',
      key: 'actions',
      render: (_, record) => (
        <Space>
           <Button 
             type="link" 
             size="small" 
             style={{ color: BRAND_COLOR }}
             onClick={() => handleExportGeneration(record)}
           >
             Export
           </Button>
           <Button 
             type="text" 
             size="small"
             style={{ color: isDark ? '#fff' : '#000' }}
             onClick={() => router.push(`/lead-generation/campaigns/${record.id}`)}
           >
             View
           </Button>
        </Space>
      ),
    }
  ];

  // --- RENDER ---
  return (
    <>
    <style jsx global>{`
      @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700&display=swap');
      
      body, .ant-typography, .ant-btn, .ant-table {
        font-family: 'Manrope', sans-serif !important;
      }

      .ant-btn-primary {
        background-color: ${BRAND_COLOR} !important;
        border-color: ${BRAND_COLOR} !important;
        color: #000000 !important;
        box-shadow: 0 4px 14px 0 rgba(92, 196, 157, 0.39) !important;
      }
      .ant-btn-primary:hover {
        background-color: ${BRAND_COLOR_HOVER} !important;
        border-color: ${BRAND_COLOR_HOVER} !important;
      }
      
      /* Tabs Customization */
      .ant-tabs-ink-bar {
        background: ${BRAND_COLOR} !important;
        height: 3px !important;
        border-radius: 3px 3px 0 0;
      }
      .ant-tabs-tab.ant-tabs-tab-active .ant-tabs-tab-btn {
        color: ${isDark ? '#fff' : '#000'} !important;
        font-weight: 700;
      }
      .ant-tabs-tab:hover {
        color: ${BRAND_COLOR} !important;
      }
      
      /* Table Customization */
      .ant-table-thead > tr > th {
        background: transparent !important;
        font-weight: 600;
        text-transform: uppercase;
        font-size: 11px;
        letter-spacing: 0.5px;
        color: ${isDark ? '#888' : '#666'} !important;
        border-bottom: 2px solid ${isDark ? '#333' : '#f0f0f0'} !important;
      }
      .ant-table-row {
        cursor: pointer;
        transition: all 0.2s;
      }
      .ant-table-row:hover > td {
        background-color: ${isDark ? '#1a1a1a' : '#f9f9f9'} !important;
      }
      
      .clickable-row {
        cursor: pointer;
      }
      
      /* Compact table rows */
      .compact-table .ant-table-tbody > tr > td {
        padding: 8px 12px !important;
      }
      
      .compact-table .ant-table-row {
        height: 60px !important;
      }
      
      /* Dark theme table adjustments */
      .ant-table {
        background: ${isDark ? '#000' : '#fff'} !important;
        color: ${isDark ? '#fff' : '#000'} !important;
      }
      
      .ant-table-tbody > tr > td {
        border-bottom: 1px solid ${isDark ? '#333' : '#f0f0f0'} !important;
        background: ${isDark ? '#000' : '#fff'} !important;
        color: ${isDark ? '#fff' : '#000'} !important;
      }
      
      /* Input styling for dark theme */
      .ant-input, .ant-select-selector {
        background-color: ${isDark ? '#111' : '#fff'} !important;
        border-color: ${isDark ? '#333' : '#d9d9d9'} !important;
        color: ${isDark ? '#fff' : '#000'} !important;
      }
      
      .ant-input::placeholder, .ant-select-selection-placeholder {
        color: ${isDark ? '#666' : '#bfbfbf'} !important;
      }
      
      /* Card header styling */
      .ant-card-head {
        color: ${isDark ? '#fff' : '#000'} !important;
        border-bottom: 1px solid ${isDark ? '#333' : '#f0f0f0'} !important;
      }
    `}</style>

    <ConfigProvider theme={{ token: customThemeToken }}>
      <div style={{
        backgroundColor: isDark ? '#000000' : '#fafafa',
        minHeight: '100vh',
        padding: '24px 32px'
      }}>
        
        {/* Header Section */}
        <CreditsDisplayHeader onCreditsUpdate={setCurrentCredits} />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 mt-4 gap-4">
          <div>
            <Title 
              level={2} 
              style={{ 
                marginBottom: 0, 
                fontWeight: 800, 
                letterSpacing: '-0.5px',
                color: isDark ? '#fff' : '#000'
              }}
            >
              Lead Generation
            </Title>
            <Text 
              type="secondary" 
              className="text-base"
              style={{ color: isDark ? '#999' : '#666' }}
            >
              Identify, analyze, and connect with high-value prospects.
            </Text>
          </div>
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={() => router.push('/lead-generation/create')}
            style={{ 
              height: '48px', 
              paddingLeft: '24px', 
              paddingRight: '24px', 
              fontSize: '15px',
              backgroundColor: BRAND_COLOR,
              borderColor: BRAND_COLOR
            }}
          >
            Start New Campaign
          </Button>
        </div>

        {/* Global Coverage Stats */}
        {/* {globalCoverage && globalCoverage.countries?.length > 0 && (
          <GlobalCoverageStats globalCoverage={globalCoverage} isDark={isDark} />
        )} */}

        {/* Stats Grid */}
        {/* <Row gutter={[20, 20]} className="mb-8">
          <Col xs={24} sm={12} lg={6}>
            <StatCard 
              title="Total Leads" 
              value={leads.length} 
              icon={<TeamOutlined />} 
              color={BRAND_COLOR}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard 
              title="High Quality Fit" 
              value={leads.filter(l => l.score >= 80).length}
              subValue={`/ ${leads.length}`}
              icon={<StarFilled />}
              color="#faad14"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard 
              title="Verified Emails" 
              value={leads.filter(l => l.email).length} 
              subValue={`/ ${leads.length}`}
              icon={<MailOutlined />} 
              color="#0ea5e9"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard 
              title="Phone Available" 
              value={leads.filter(l => l.phone).length} 
              subValue={`/ ${leads.length}`}
              icon={<PhoneOutlined />} 
              color={BRAND_COLOR} 
            />
          </Col>
        </Row> */}

        {/* Main Content Area */}
        <Card 
          bordered={false}
          className="rounded-xl overflow-hidden"
          styles={{
            body: { padding: 0 }
          }}
          style={{
            backgroundColor: isDark ? '#111' : '#fff',
            border: isDark ? '1px solid #333' : '1px solid #f0f0f0',
            boxShadow: isDark 
              ? '0 4px 6px -1px rgba(0, 0, 0, 0.5)' 
              : '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          }}
        >
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            size="large"
            tabBarStyle={{ 
              padding: '0 24px', 
              marginBottom: 0, 
              marginTop: '12px',
              backgroundColor: isDark ? '#111' : '#fff'
            }}
            items={[
              {
                key: 'leads',
                label: (
                  <span 
                    className="px-2"
                    style={{ color: isDark ? '#fff' : '#000' }}
                  >
                    <TeamOutlined /> All Leads ({filteredLeads.length})
                  </span>
                ),
                children: (
                  <div 
                    className="p-6"
                    style={{ 
                      backgroundColor: isDark ? '#000' : '#fff',
                      color: isDark ? '#fff' : '#000'
                    }}
                  >
                    {/* Toolbar */}
                    <div 
                      className="flex flex-wrap gap-4 mb-6 p-4 rounded-lg border"
                      style={{
                        backgroundColor: isDark ? '#111' : '#f9fafb',
                        borderColor: isDark ? '#333' : '#e5e7eb'
                      }}
                    >
                      <Input
                        placeholder="Search name, company, or title..."
                        prefix={<SearchOutlined className="text-gray-400" />}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        allowClear
                        className="w-full md:w-80 rounded-md"
                        bordered={false}
                        style={{ 
                          backgroundColor: isDark ? '#1a1a1a' : '#fff',
                          color: isDark ? '#fff' : '#000'
                        }}
                      />
                      <Select
                        value={selectedIndustry}
                        onChange={setSelectedIndustry}
                        style={{ width: 180 }}
                        className="rounded-md"
                        dropdownStyle={{ 
                          fontFamily: FONT_FAMILY,
                          backgroundColor: isDark ? '#111' : '#fff'
                        }}
                        bordered={false}
                      >
                         <Option value="All">All Industries</Option>
                         {industries.filter(i => i !== 'All').map(i => (
                           <Option key={i} value={i}>{i}</Option>
                         ))}
                      </Select>
                      <Select
                        value={selectedScore}
                        onChange={setSelectedScore}
                        style={{ width: 160 }}
                        bordered={false}
                      >
                        <Option value="All">All Scores</Option>
                        <Option value="High">High Fit (80+)</Option>
                        <Option value="Medium">Medium (60-79)</Option>
                        <Option value="Low">Low (&lt;60)</Option>
                      </Select>
                      
                      <div className="flex-1 text-right">
                         <Space>
                            <Button 
                            style={{backgroundColor: '#000000'}}
                              icon={<MailOutlined />} 
                              onClick={handleBulkEmail}
                              disabled={filteredLeads.filter(l => l.email).length === 0}
                            >
                              Email Batch
                            </Button>
                            <Button 
                                  style={{backgroundColor: '#000000'}}
                              icon={<DownloadOutlined />} 
                              onClick={handleBulkExport}
                              disabled={filteredLeads.length === 0}
                            >
                              Export
                            </Button>
                         </Space>
                      </div>
                    </div>

                    {/* Table */}
                    {loading ? (
                      <div className="py-24 text-center">

                        <ConfigProvider
  theme={{
    token: {
      colorPrimary: '#5CC49D',
    },
  }}
>
    <Spin size="large" tip="Loading leads..." />
</ConfigProvider>
                    
                      </div>
                    ) : filteredLeads.length > 0 ? (
                      <Table
                        columns={leadColumns}
                        dataSource={filteredLeads}
                        rowKey="id"
                        className="compact-table clickable-rows"
                        scroll={{ 
                          x: 1030,
                          y: 600
                        }}
                        size="small"
                        tableLayout="fixed"
                        pagination={{
                          total: filteredLeads.length,
                          pageSize: 20,
                          showSizeChanger: true,
                          showQuickJumper: true,
                          showTotal: (total, range) => 
                            `${range[0]}-${range[1]} of ${total} leads`,
                        }}
                        onRow={(record) => ({
                          onClick: (event) => {
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
                        description="No leads found matching your criteria" 
                        image={Empty.PRESENTED_IMAGE_SIMPLE} 
                      />
                    )}
                  </div>
                ),
              },
              {
                key: 'history',
                label: (
                  <span 
                    className="px-2"
                    style={{ color: isDark ? '#fff' : '#000' }}
                  >
                    <HistoryOutlined /> Campaign History
                  </span>
                ),
                children: (
                  <div 
                    className="p-6"
                    style={{ 
                      backgroundColor: isDark ? '#000' : '#fff',
                      color: isDark ? '#fff' : '#000'
                    }}
                  >
                    {loading ? (

                      <ConfigProvider
  theme={{
    token: {
      colorPrimary: '#5CC49D',
    },
  }}
>
    <Spin className="w-full py-12" />
</ConfigProvider>

                  
                    ) : generations.length > 0 ? (
                      <Table
                        columns={generationColumns}
                        dataSource={generations}
                        rowKey="id"
                        tableLayout="auto"
                        pagination={{ 
                          pageSize: 10,
                          showSizeChanger: true,
                          showQuickJumper: true
                        }}
                        onRow={(record) => ({
                          onClick: () => router.push(`/lead-generation/campaigns/${record.id}`),
                          style: { cursor: 'pointer' },
                          className: 'clickable-row'
                        })}
                      />
                    ) : (
                      <div 
                        className="text-center py-16 rounded-lg"
                        style={{ backgroundColor: isDark ? '#111' : '#f9fafb' }}
                      >
                        <Empty 
                          description="No campaigns yet" 
                          image={Empty.PRESENTED_IMAGE_SIMPLE} 
                        />
                        <Button 
                          type="primary" 
                          className="mt-4"
                          onClick={() => router.push('/lead-generation/create')}
                          style={{
                            backgroundColor: BRAND_COLOR,
                            borderColor: BRAND_COLOR
                          }}
                        >
                          Create First Campaign
                        </Button>
                      </div>
                    )}
                  </div>
                ),
              },
            ]}
          />
        </Card>
      </div>
    </ConfigProvider>
    </>
  );
};

export default LeadGenerationPage;