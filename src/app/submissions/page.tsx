  // Preview deliverable
"use client";

import React, { useState, useEffect } from 'react';
import { 
  SearchOutlined,
  EyeOutlined,
  DownloadOutlined,
  DeleteOutlined,
  FilterOutlined,
  CalendarOutlined,
  FileTextOutlined,
  DollarOutlined,
  BulbOutlined,
  MailOutlined,
  LineChartOutlined,
  TrophyOutlined,
  AudioOutlined,
  ExperimentOutlined
} from '@ant-design/icons';
import { 
  Card, 
  Tag, 
  Button, 
  Grid, 
  Typography, 
  Space, 
  Input,
  Select,
  Table,
  Modal,
  message,
  Tooltip,
  Popconfirm,
  Badge,
  Empty,
  Spin
} from 'antd';
import { useTheme } from '../../providers/ThemeProvider';
import { formatDistanceToNow } from 'date-fns';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;
const { Search } = Input;
const { Option } = Select;

interface Deliverable {
  id: string;
  title: string;
  type: string;
  content: string;
  metadata: any;
  tags: string[];
  created_at: string;
  updated_at: string;
  workspace: {
    id: string;
    name: string;
  };
}

const SubmissionsPage = () => {
  const screens = useBreakpoint();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [filteredData, setFilteredData] = useState<Deliverable[]>([]);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeliverable, setSelectedDeliverable] = useState<Deliverable | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [currentWorkspace, setCurrentWorkspace] = useState<any>(null);

  // Theme-aware styles
  const getCardStyles = () => ({
    body: {
      backgroundColor: theme === 'dark' ? '#000000' : '#ffffff',
      padding: '16px'
    }
  });

  const getContainerStyles = () => ({
    backgroundColor: theme === 'dark' ? '#000000' : '#ffffff',
    padding: screens.xs ? '16px' : '24px',
    minHeight: '100vh'
  });

    const handlePreview = (deliverable: Deliverable) => {
    setSelectedDeliverable(deliverable);
    setPreviewVisible(true);
  };

  // Deliverable type configurations
  const deliverableTypes = {
    'sales_call_analysis': {
      icon: <AudioOutlined />,
      label: 'Call Analysis',
      color: '#1890ff',
      description: 'AI-generated sales call insights and coaching'
    },
    'pricing_calculation': {
      icon: <DollarOutlined />,
      label: 'Pricing Strategy',
      color: '#52c41a',
      description: 'Strategic pricing recommendations and analysis'
    },
    'signature_offers': {
      icon: <TrophyOutlined />,
      label: 'Signature Offers',
      color: '#722ed1',
      description: 'Custom offer packages and positioning'
    },
    'cold_email_generation': {
      icon: <MailOutlined />,
      label: 'Cold Emails',
      color: '#13c2c2',
      description: 'Personalized email sequences and templates'
    },
    'growth_plan': {
      icon: <LineChartOutlined />,
      label: 'Growth Plans',
      color: '#eb2f96',
      description: 'Comprehensive business growth strategies'
    },
    'niche_research': {
      icon: <ExperimentOutlined />,
      label: 'Niche Research',
      color: '#f5222d',
      description: 'Market opportunity analysis and insights'
    },
    'ad_writer': {
      icon: <BulbOutlined />,
      label: 'Ad Campaigns',
      color: '#fa8c16',
      description: 'High-converting ad copy and creative briefs'
    }
  };

  // Enhanced workspace management
  const ensureWorkspaceExists = async () => {
    try {
      console.log('🏢 Ensuring workspace exists...');
      
      // First try to get existing workspaces
      const workspacesResult = await makeAuthenticatedRequest('/api/workspaces');
      
      if (workspacesResult.success && workspacesResult.data && workspacesResult.data.length > 0) {
        console.log('✅ Found existing workspaces:', workspacesResult.data.length);
        const workspace = workspacesResult.data[0];
        setCurrentWorkspace(workspace);
        localStorage.setItem('currentWorkspaceId', workspace.id);
        return workspace.id;
      } else {
        console.log('📝 No workspaces found, creating default workspace...');
        
        // Create a default workspace
        const createResult = await makeAuthenticatedRequest('/api/workspaces', {
          method: 'POST',
          body: JSON.stringify({
            name: 'Default Workspace',
            description: 'Your main workspace for AI submissions',
            color: 'bg-blue-700'
          })
        });
        
        if (createResult.success) {
          console.log('✅ Created default workspace:', createResult.data.id);
          setCurrentWorkspace(createResult.data);
          localStorage.setItem('currentWorkspaceId', createResult.data.id);
          return createResult.data.id;
        } else {
          throw new Error('Failed to create workspace: ' + createResult.error);
        }
      }
    } catch (error) {
      console.error('❌ Error ensuring workspace:', error);
      
      // Fallback to 'default' if everything fails
      const fallbackId = 'default';
      localStorage.setItem('currentWorkspaceId', fallbackId);
      return fallbackId;
    }
  };

  // Enhanced API call function with better error handling
  const makeAuthenticatedRequest = async (url: string, options: RequestInit = {}) => {
    try {
      console.log(`🔗 Making authenticated request to: ${url}`);
      
      // Get Supabase session for auth
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      
      // Get fresh session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.warn('⚠️ Session error:', sessionError);
      }
      
      if (!session || !session.access_token) {
        console.warn('⚠️ No valid session found, attempting refresh...');
        
        // Try to refresh session
        const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError || !refreshedSession) {
          throw new Error('Authentication session expired. Please sign in again.');
        }
        
        // Use refreshed session
        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${refreshedSession.access_token}`,
          ...options.headers
        };
        
        console.log('✅ Using refreshed session');
        
        const response = await fetch(url, {
          ...options,
          headers
        });
        
        const result = await response.json();
        console.log(`📡 API Response (${response.status}):`, result);
        
        if (!response.ok) {
          throw new Error(result.error || result.message || `HTTP ${response.status}`);
        }
        
        return result;
      } else {
        // Use existing session
        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          ...options.headers
        };
        
        console.log('✅ Using existing session');
        
        const response = await fetch(url, {
          ...options,
          headers
        });
        
        const result = await response.json();
        console.log(`📡 API Response (${response.status}):`, result);
        
        if (!response.ok) {
          throw new Error(result.error || result.message || `HTTP ${response.status}`);
        }
        
        return result;
      }
    } catch (error) {
      console.error(`❌ API request to ${url} failed:`, error);
      throw error;
    }
  };

  // Fetch deliverables using your robust API
  const fetchDeliverables = async () => {
    try {
      setLoading(true);
      console.log('📂 Starting to fetch deliverables...');
      
      // Ensure workspace exists first
      const workspaceId = await ensureWorkspaceExists();
      console.log('🏢 Using workspace:', workspaceId);
      
      const result = await makeAuthenticatedRequest(
        `/api/deliverables?workspaceId=${workspaceId}&limit=100&offset=0`
      );
      
      if (result.success && result.data) {
        console.log('✅ Successfully fetched', result.data.length, 'deliverables');
        setDeliverables(result.data);
        setFilteredData(result.data);
      } else {
        console.warn('⚠️ API returned success=false:', result.error);
        message.error(result.error || 'Failed to load submissions');
      }
    } catch (error) {
      console.error('❌ Error in fetchDeliverables:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load submissions';
      
      // Show user-friendly error messages
      if (errorMessage.includes('Authentication')) {
        message.error('Please sign in again to view your submissions');
      } else if (errorMessage.includes('Rate limit')) {
        message.warning('Too many requests. Please wait a moment and try again.');
      } else {
        message.error(`Failed to load submissions: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Filter and search logic
  useEffect(() => {
    let filtered = deliverables;

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(item => item.type === selectedType);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredData(filtered);
  }, [deliverables, selectedType, searchTerm]);

  // Load data on mount
  useEffect(() => {
    fetchDeliverables();
  }, []);

  // Delete deliverable with your API structure
  const handleDelete = async (id: string) => {
    try {
      const result = await makeAuthenticatedRequest(`/api/deliverables/${id}`, {
        method: 'DELETE'
      });
      
      if (result.success) {
        message.success('Submission deleted successfully');
        setDeliverables(prev => prev.filter(item => item.id !== id));
      } else {
        message.error(result.error || 'Failed to delete submission');
      }
    } catch (error) {
      console.error('Delete error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete submission';
      message.error(errorMessage);
    }
  };

  // Export deliverable with your API structure
  const handleExport = async (deliverable: Deliverable) => {
    try {
      const response = await fetch(`/api/deliverables/${deliverable.id}/export?format=json`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${(await (await import('@/utils/supabase/client')).createClient().auth.getSession()).data.session?.access_token}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${deliverable.title.replace(/[^a-z0-9]/gi, '_')}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
        message.success('Export completed');
      } else {
        const errorResult = await response.json();
        message.error(errorResult.error || 'Failed to export');
      }
    } catch (error) {
      console.error('Export error:', error);
      message.error('Export failed');
    }
  };

  // Render preview content based on type
  const renderPreviewContent = (deliverable: Deliverable) => {
    if (!deliverable) return null;

    try {
      const content = typeof deliverable.content === 'string' 
        ? JSON.parse(deliverable.content) 
        : deliverable.content;

      const metadata = deliverable.metadata || {};

      switch (deliverable.type) {
        case 'sales_call_analysis':
          return (
            <div>
              <h4>Call Analysis Summary</h4>
              <p><strong>Overall Score:</strong> {content.callResults?.analysis?.overallScore || 'N/A'}/100</p>
              <p><strong>Sentiment:</strong> <Tag color={content.callResults?.analysis?.sentiment === 'positive' ? 'green' : 'orange'}>{content.callResults?.analysis?.sentiment || 'N/A'}</Tag></p>
              <p><strong>Duration:</strong> {Math.floor((content.callResults?.duration || 0) / 60)} minutes</p>
              <div>
                <strong>Key Insights:</strong>
                <ul>
                  {content.callResults?.analysis?.keyInsights?.slice(0, 3).map((insight: string, idx: number) => (
                    <li key={idx}>{insight}</li>
                  )) || [<li key={0}>No insights available</li>]}
                </ul>
              </div>
            </div>
          );

        case 'pricing_calculation':
          return (
            <div>
              <h4>Pricing Strategy</h4>
              <p><strong>Client:</strong> {metadata.clientName || 'N/A'}</p>
              <p><strong>Recommended Retainer:</strong> ${content.calculations?.recommendedRetainer?.toLocaleString() || 'N/A'}</p>
              <p><strong>ROI:</strong> {content.calculations?.roiPercentage || 'N/A'}%</p>
              <p><strong>Hourly Rate:</strong> ${content.calculations?.hourlyRate || 'N/A'}</p>
            </div>
          );

        case 'signature_offers':
          return (
            <div>
              <h4>Signature Offers</h4>
              <p><strong>Target Market:</strong> {metadata.targetMarket || 'N/A'}</p>
              <div>
                <strong>Offer Tiers:</strong>
                <ul>
                  <li><strong>Starter:</strong> {content.signatureOffers?.starter?.name || 'N/A'}</li>
                  <li><strong>Core:</strong> {content.signatureOffers?.core?.name || 'N/A'}</li>
                  <li><strong>Premium:</strong> {content.signatureOffers?.premium?.name || 'N/A'}</li>
                </ul>
              </div>
            </div>
          );

        case 'cold_email_generation':
          return (
            <div>
              <h4>Cold Email Campaign</h4>
              <p><strong>Target:</strong> {metadata.targetCompany || 'N/A'}</p>
              <p><strong>Method:</strong> {metadata.method || 'N/A'}</p>
              <p><strong>Tone:</strong> <Tag>{metadata.tone || 'N/A'}</Tag></p>
              <p><strong>Emails Generated:</strong> {metadata.emailCount || 0}</p>
            </div>
          );

        case 'growth_plan':
          return (
            <div>
              <h4>Growth Plan</h4>
              <p><strong>Client:</strong> {metadata.clientCompany || 'N/A'}</p>
              <p><strong>Industry:</strong> {metadata.industry || 'N/A'}</p>
              <p><strong>Timeframe:</strong> {metadata.timeframe === '3m' ? '3 months' : metadata.timeframe === '6m' ? '6 months' : '12 months'}</p>
              <p><strong>Strategy:</strong> {content.executiveSummary?.substring(0, 150) || 'N/A'}...</p>
            </div>
          );

        case 'niche_research':
          return (
            <div>
              <h4>Niche Research</h4>
              <p><strong>Niche:</strong> {content.nicheOverview?.name || 'N/A'}</p>
              <p><strong>Market Size:</strong> {content.marketDemand?.marketSize || 'N/A'}</p>
              <p><strong>Trend:</strong> <Tag color={content.marketDemand?.trend === 'growing' ? 'green' : 'orange'}>{content.marketDemand?.trend || 'N/A'}</Tag></p>
              <p><strong>Entry Barrier:</strong> {content.competitiveLandscape?.barrierToEntry || 'N/A'}</p>
            </div>
          );

        case 'ad_writer':
          return (
            <div>
              <h4>Ad Campaign</h4>
              <p><strong>Business:</strong> {metadata.businessName || 'N/A'}</p>
              <p><strong>Offer:</strong> {metadata.offerName || 'N/A'}</p>
              <p><strong>Tone:</strong> <Tag>{metadata.tone || 'N/A'}</Tag></p>
              <p><strong>Platforms:</strong> {metadata.platforms?.join(', ') || 'N/A'}</p>
            </div>
          );

        default:
          return <p>Preview not available for this content type.</p>;
      }
    } catch (error) {
      return <p>Error loading preview content.</p>;
    }
  };

  // Summary statistics with better error handling
  const getStats = () => {
    try {
      if (!Array.isArray(deliverables) || deliverables.length === 0) {
        return {
          total: 0,
          today: 0,
          thisWeek: 0,
          types: {}
        };
      }

      const typeStats = deliverables.reduce((acc, item) => {
        if (item && item.type) {
          acc[item.type] = (acc[item.type] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      const today = new Date();
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const totalToday = deliverables.filter(item => {
        try {
          if (!item || !item.created_at) return false;
          const itemDate = new Date(item.created_at);
          return itemDate.toDateString() === today.toDateString();
        } catch (error) {
          console.warn('Error parsing date for item:', item?.id, error);
          return false;
        }
      }).length;

      const totalThisWeek = deliverables.filter(item => {
        try {
          if (!item || !item.created_at) return false;
          const itemDate = new Date(item.created_at);
          return itemDate > weekAgo;
        } catch (error) {
          console.warn('Error parsing date for item:', item?.id, error);
          return false;
        }
      }).length;

      return {
        total: deliverables.length,
        today: totalToday,
        thisWeek: totalThisWeek,
        types: typeStats
      };
    } catch (error) {
      console.error('Error calculating stats:', error);
      return {
        total: 0,
        today: 0,
        thisWeek: 0,
        types: {}
      };
    }
  };

  const stats = getStats();

  // Table columns for mobile/desktop view
  const columns = [
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => {
        const config = deliverableTypes[type as keyof typeof deliverableTypes] || {
          icon: <FileTextOutlined />,
          label: type,
          color: '#666'
        };
        return (
          <Space>
            <span style={{ color: config.color }}>{config.icon}</span>
            <Text style={{ fontSize: '12px' }}>{config.label}</Text>
          </Space>
        );
      }
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: Deliverable) => (
        <div>
          <Text strong style={{ fontSize: '14px' }}>{title}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.tags.slice(0, 2).map(tag => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </Text>
        </div>
      )
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created',
      width: 120,
      render: (date: string) => (
        <Tooltip title={new Date(date).toLocaleString()}>
          <Text style={{ fontSize: '12px' }}>
            {formatDistanceToNow(new Date(date), { addSuffix: true })}
          </Text>
        </Tooltip>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: any, record: Deliverable) => (
        <Space size="small">
          <Tooltip title="Preview">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              size="small"
              onClick={() => handlePreview(record)}
            />
          </Tooltip>
          <Tooltip title="Export">
            <Button 
              type="text" 
              icon={<DownloadOutlined />} 
              size="small"
              onClick={() => handleExport(record)}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Popconfirm
              title="Delete this submission?"
              description="This action cannot be undone."
              onConfirm={() => handleDelete(record.id)}
              okText="Delete"
              cancelText="Cancel"
            >
              <Button 
                type="text" 
                icon={<DeleteOutlined />} 
                size="small"
                danger
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      )
    }
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
            AI Submissions
          </Title>
          <Text 
            style={{ 
              color: theme === 'dark' ? '#9ca3af' : '#666666'
            }}
          >
            All your AI-generated content and analysis
          </Text>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: screens.lg ? 'repeat(4, 1fr)' : screens.md ? 'repeat(2, 1fr)' : '1fr',
        gap: 16,
        marginBottom: 24
      }}>
        <Card styles={getCardStyles()}>
          <div style={{ textAlign: 'center' }}>
            <Text style={{ color: theme === 'dark' ? '#9ca3af' : '#666', fontSize: 12 }}>Total</Text>
            <div style={{ fontSize: 24, fontWeight: 600, color: '#1890ff' }}>{stats.total}</div>
          </div>
        </Card>
        <Card styles={getCardStyles()}>
          <div style={{ textAlign: 'center' }}>
            <Text style={{ color: theme === 'dark' ? '#9ca3af' : '#666', fontSize: 12 }}>Today</Text>
            <div style={{ fontSize: 24, fontWeight: 600, color: '#52c41a' }}>{stats.today}</div>
          </div>
        </Card>
        <Card styles={getCardStyles()}>
          <div style={{ textAlign: 'center' }}>
            <Text style={{ color: theme === 'dark' ? '#9ca3af' : '#666', fontSize: 12 }}>This Week</Text>
            <div style={{ fontSize: 24, fontWeight: 600, color: '#722ed1' }}>{stats.thisWeek}</div>
          </div>
        </Card>
        <Card styles={getCardStyles()}>
          <div style={{ textAlign: 'center' }}>
            <Text style={{ color: theme === 'dark' ? '#9ca3af' : '#666', fontSize: 12 }}>Types</Text>
            <div style={{ fontSize: 24, fontWeight: 600, color: '#fa8c16' }}>{Object.keys(stats.types).length}</div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card styles={getCardStyles()} style={{ marginBottom: 24 }}>
        <div style={{ 
          display: 'flex', 
          gap: 16, 
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <Search
            placeholder="Search submissions..."
            allowClear
            style={{ width: 300 }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            prefix={<SearchOutlined />}
          />
          <Select
            value={selectedType}
            onChange={setSelectedType}
            style={{ width: 200 }}
            placeholder="Filter by type"
          >
            <Option value="all">All Types</Option>
            {Object.entries(deliverableTypes).map(([key, config]) => (
              <Option key={key} value={key}>
                <Space>
                  {config.icon}
                  {config.label}
                </Space>
              </Option>
            ))}
          </Select>
        </div>
      </Card>

      {/* Content */}
      <Card 
        styles={getCardStyles()}
        style={{
          borderRadius: '12px',
          border: theme === 'dark' ? '1px solid #374151' : '1px solid #e5e7eb',
        }}
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <Spin size="large" />
            <div style={{ marginTop: 16, color: theme === 'dark' ? '#9ca3af' : '#666' }}>
              Loading your AI submissions...
            </div>
            <div style={{ marginTop: 8, fontSize: '12px', color: theme === 'dark' ? '#6b7280' : '#9ca3af' }}>
              {currentWorkspace ? `From workspace: ${currentWorkspace.name}` : 'Setting up workspace...'}
            </div>
          </div>
        ) : filteredData.length === 0 && deliverables.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <Empty 
              description={
                <div>
                  <div style={{ marginBottom: 8 }}>No AI submissions found</div>
                  <Text type="secondary" style={{ fontSize: '14px' }}>
                    Your submissions from AI tools like Call Analyzer, Pricing Calculator, 
                    Offer Creator, and others will appear here.
                  </Text>
                </div>
              }
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </div>
        ) : filteredData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <Empty 
              description={`No submissions match "${searchTerm || selectedType}"`}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
            <Button 
              type="primary" 
              style={{ marginTop: 16 }}
              onClick={() => {
                setSearchTerm('');
                setSelectedType('all');
              }}
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={filteredData}
            rowKey="id"
            pagination={{
              total: filteredData.length,
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `${range[0]}-${range[1]} of ${total} submissions`
            }}
            size="small"
          />
        )}
      </Card>

      {/* Preview Modal */}
      <Modal
        title={
          <Space>
            {selectedDeliverable && (
              <>
                {deliverableTypes[selectedDeliverable.type as keyof typeof deliverableTypes]?.icon}
                {selectedDeliverable.title}
              </>
            )}
          </Space>
        }
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={[
          <Button key="close" onClick={() => setPreviewVisible(false)}>
            Close
          </Button>,
          <Button 
            key="export" 
            type="primary" 
            icon={<DownloadOutlined />}
            onClick={() => selectedDeliverable && handleExport(selectedDeliverable)}
          >
            Export
          </Button>
        ]}
        width={800}
      >
        {selectedDeliverable && renderPreviewContent(selectedDeliverable)}
      </Modal>
    </div>
  );
};

export default SubmissionsPage;