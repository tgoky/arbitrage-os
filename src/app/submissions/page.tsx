"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  SearchOutlined,
  EllipsisOutlined,
  FileTextOutlined,
  PhoneOutlined,
  DollarCircleOutlined,
  BulbOutlined,
  RocketOutlined,
  MailOutlined,
  EditOutlined,
  BarChartOutlined,
  CalendarOutlined,
  TagOutlined,
  EyeOutlined,
  DownloadOutlined,
  DeleteOutlined,
  ShareAltOutlined,
  ReloadOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import { 
  Card, 
  Tag, 
  Button, 
  Typography, 
  Space, 
  Avatar, 
  Input,
  Dropdown,
  Menu,
  Pagination,
  Tabs,
  Select,
  DatePicker,
  Row,
  Col,
  Statistic,
  Progress,
  Empty,
  Badge,
  Tooltip,
  Spin,
  message
} from 'antd';
import { useParsed } from "@refinedev/core";

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

// Define proper types
type WorkItemType = 'sales-call' | 'growth-plan' | 'pricing-calc' | 'niche-research' | 'cold-email' | 'offer-creator' | 'ad-writer' | 'n8n-workflow';
type WorkItemStatus = 'completed' | 'processing' | 'failed' | 'draft';

// Unified work item interface
interface WorkItem {
  id: string;
  type: WorkItemType;
  title: string;
  subtitle: string;
  status: WorkItemStatus;
  createdAt: string;
  metadata: Record<string, any>;
  actions: string[];
  rawData: any;
}

const IntegratedWorkDashboard = () => {
  const { params } = useParsed();
  const workspaceId = params?.workspaceId as string | undefined;

  // State
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [dateRange, setDateRange] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [error, setError] = useState<string | null>(null);

  // Unified data fetching function
  const fetchAllWorkItems = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔄 Fetching all work items from unified API...');
      
      // Get auth token from localStorage or cookies
      const getAuthToken = () => {
        // Try to get from localStorage first
        const storedSession = localStorage.getItem('supabase.auth.token');
        if (storedSession) {
          try {
            const session = JSON.parse(storedSession);
            return session.access_token;
          } catch (e) {
            console.warn('Failed to parse stored session');
          }
        }
        
        // Try to get from cookies
        const cookieValue = document.cookie
          .split('; ')
          .find(row => row.startsWith('sb-access-token='))
          ?.split('=')[1];
        
        return cookieValue;
      };

      const token = getAuthToken();
      console.log('🔑 Using auth token:', token ? 'Present' : 'Missing');

      // Construct URL with potential workspaceId query param
      const url = new URL('/api/dashboard/work-items', window.location.origin);
      if (workspaceId) {
        url.searchParams.append('workspaceId', workspaceId);
      }

      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers,
        credentials: 'include' // Include cookies
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📥 Unified API response:', data);

      if (data.success && Array.isArray(data.data?.items)) {
        console.log(`🎉 Successfully fetched ${data.data.items.length} work items from unified API`);
        setWorkItems(data.data.items);
      } else {
        throw new Error(data.error || 'Invalid response format from unified API');
      }
    } catch (error) {
      console.error('💥 Error fetching work items from unified API:', error);
      setError(error instanceof Error ? error.message : 'Failed to load work items');
      message.error('Failed to load work items');
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount and when workspaceId changes
  useEffect(() => {
    fetchAllWorkItems();
  }, [workspaceId]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    
    const thisMonthItems = workItems.filter(item => new Date(item.createdAt) >= thisMonth);
    const lastMonthItems = workItems.filter(item => {
      const date = new Date(item.createdAt);
      return date >= lastMonth && date < thisMonth;
    });
    
    const thisMonthGrowth = lastMonthItems.length > 0 
      ? Math.round(((thisMonthItems.length - lastMonthItems.length) / lastMonthItems.length) * 100)
      : 0;

    const processingItems = workItems.filter(item => item.status === 'processing').length;
    const completedItems = workItems.filter(item => item.status === 'completed').length;

    return [
      { 
        title: 'Total Generated', 
        value: workItems.length, 
        icon: <FileTextOutlined />, 
        color: '#1890ff', 
        growth: 12 
      },
      { 
        title: 'This Month', 
        value: thisMonthItems.length, 
        icon: <CalendarOutlined />, 
        color: '#52c41a', 
        growth: thisMonthGrowth 
      },
      { 
        title: 'In Progress', 
        value: processingItems, 
        icon: <BarChartOutlined />, 
        color: '#faad14', 
        growth: 0 
      },
      { 
        title: 'Completed', 
        value: completedItems, 
        icon: <RocketOutlined />, 
        color: '#13c2c2', 
        growth: 5 
      }
    ];
  }, [workItems]);

  // Get icon for work type
  const getTypeIcon = (type: WorkItemType) => {
    const icons: Record<WorkItemType, React.JSX.Element> = {
      'sales-call': <PhoneOutlined />,
      'growth-plan': <RocketOutlined />,
      'pricing-calc': <DollarCircleOutlined />,
      'niche-research': <BulbOutlined />,
      'cold-email': <MailOutlined />,
      'offer-creator': <EditOutlined />,
      'ad-writer': <TagOutlined />,
      'n8n-workflow': <ThunderboltOutlined /> 
    };
    return icons[type] || <FileTextOutlined />;
  };

  // Get type display name
  const getTypeName = (type: WorkItemType) => {
    const names: Record<WorkItemType, string> = {
      'sales-call': 'Sales Call Analysis',
      'growth-plan': 'Growth Plan',
      'pricing-calc': 'Pricing Calculator',
      'niche-research': 'Niche Research',
      'cold-email': 'Cold Email',
      'offer-creator': 'Offer Creator',
      'ad-writer': 'Ad Copy Writer',
      'n8n-workflow': 'n8n Workflow' 
    };
    return names[type] || type;
  };

  // Get status tag
  const getStatusTag = (status: WorkItemStatus) => {
    const statusConfig: Record<WorkItemStatus, { color: string; text: string }> = {
      completed: { color: 'success', text: 'Completed' },
      processing: { color: 'processing', text: 'Processing' },
      failed: { color: 'error', text: 'Failed' },
      draft: { color: 'default', text: 'Draft' }
    };
    const config = statusConfig[status] || statusConfig.completed;
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // Get type color
  const getTypeColor = (type: WorkItemType) => {
    const colors: Record<WorkItemType, string> = {
      'sales-call': '#722ed1',
      'growth-plan': '#1890ff',
      'pricing-calc': '#52c41a',
      'niche-research': '#fa8c16',
      'cold-email': '#eb2f96',
      'offer-creator': '#13c2c2',
      'ad-writer': '#faad14',
      'n8n-workflow': '#fa541c' 
    };
    return colors[type] || '#666';
  };

  // Handle actions
  const handleAction = async (action: string, item: WorkItem) => {
    try {
      switch (action) {
        case 'view':
          // Navigate to the specific tool's view page
          const viewUrls = {
            'sales-call': `/dashboard/sales-call-analyzer/${item.metadata.deliverableId}`,
            'growth-plan': `/dashboard/growth-plans/${item.metadata.deliverableId}`,
            'pricing-calc': `/dashboard/pricing-calculator/${item.metadata.deliverableId}`,
            'niche-research': `/dashboard/niche-research/${item.metadata.deliverableId}`,
            'cold-email': `/dashboard/cold-email/${item.metadata.deliverableId}`,
            'offer-creator': `/dashboard/offer-creator/${item.metadata.deliverableId}`,
            'ad-writer': `/dashboard/ad-writer/${item.metadata.deliverableId}`,
            'n8n-workflow': `/dashboard/n8n-builder/${item.metadata.deliverableId}`
          };
          
          const viewUrl = viewUrls[item.type];
          if (viewUrl) {
            if (workspaceId) {
              window.location.href = `${viewUrl}?workspaceId=${workspaceId}`;
            } else {
              window.location.href = viewUrl;
            }
          }
          break;

        case 'delete':
          const deleteConfirm = window.confirm('Are you sure you want to delete this item?');
          if (deleteConfirm) {
            // Call delete API
            await fetch(`/api/deliverables/${item.metadata.deliverableId}`, {
              method: 'DELETE',
              credentials: 'include'
            });
            message.success('Item deleted successfully');
            fetchAllWorkItems(); // Refresh data
          }
          break;

        case 'export':
        case 'copy':
        case 'duplicate':
        case 'optimize':
          message.info(`${action} functionality coming soon!`);
          break;

        default:
          message.info(`${action} action not implemented yet`);
      }
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
      message.error(`Failed to ${action} item`);
    }
  };

  // Create action menu
  const createActionMenu = (item: WorkItem) => (
    <Menu onClick={({ key }) => handleAction(key, item)}>
      {item.actions.includes('view') && (
        <Menu.Item key="view" icon={<EyeOutlined />}>
          View Details
        </Menu.Item>
      )}
      {item.actions.includes('edit') && (
        <Menu.Item key="edit" icon={<EditOutlined />}>
          Edit
        </Menu.Item>
      )}
      {item.actions.includes('export') && (
        <Menu.Item key="export" icon={<DownloadOutlined />}>
          Export
        </Menu.Item>
      )}
      {item.actions.includes('copy') && (
        <Menu.Item key="copy" icon={<ShareAltOutlined />}>
          Copy to Clipboard
        </Menu.Item>
      )}
      {item.actions.includes('duplicate') && (
        <Menu.Item key="duplicate" icon={<ShareAltOutlined />}>
          Duplicate
        </Menu.Item>
      )}
      {item.actions.includes('optimize') && (
        <Menu.Item key="optimize" icon={<BarChartOutlined />}>
          Optimize
        </Menu.Item>
      )}
      <Menu.Divider />
      <Menu.Item key="delete" icon={<DeleteOutlined />} danger>
        Delete
      </Menu.Item>
    </Menu>
  );

  // Filter items based on active tab and filters
  const filteredItems = useMemo(() => {
    return workItems.filter(item => {
      if (activeTab !== 'all' && item.type !== activeTab) return false;
      if (filterType !== 'all' && item.status !== filterType) return false;
      if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (dateRange && dateRange[0] && dateRange[1]) {
        const itemDate = new Date(item.createdAt);
        if (itemDate < dateRange[0] || itemDate > dateRange[1]) return false;
      }
      return true;
    });
  }, [workItems, activeTab, filterType, searchQuery, dateRange]);

  // Get tab counts
  const getTabCount = (type: string) => {
    if (type === 'all') return workItems.length;
    return workItems.filter(item => item.type === type).length;
  };

  // Paginated items
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredItems.slice(startIndex, startIndex + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  if (loading && workItems.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
        <p style={{ marginTop: 16 }}>Loading your work...</p>
      </div>
    );
  }

  if (error && workItems.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <div style={{ color: '#ff4d4f', marginBottom: 16 }}>
          <FileTextOutlined style={{ fontSize: 48 }} />
        </div>
        <Title level={4}>Failed to Load Work Items</Title>
        <Text style={{ color: '#666' }}>{error}</Text>
        <div style={{ marginTop: 16 }}>
          <Button type="primary" onClick={fetchAllWorkItems}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2} style={{ margin: 0, color: '#493c3c' }}>
            My Submissions
          </Title>
          <Text style={{ color: '#666666' }}>
            All your AI-generated content, analysis, and deliverables in one place
          </Text>
        </div>
        <Button 
          icon={<ReloadOutlined />} 
          onClick={fetchAllWorkItems} 
          loading={loading}
        >
          Refresh
        </Button>
      </div>

      {/* Summary Stats */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        {summaryStats.map((stat, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card style={{ borderRadius: 8, height: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <Text style={{ fontSize: 12, fontWeight: 500 }}>
                    {stat.title}
                  </Text>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <Text style={{ fontSize: 20, fontWeight: 600 }}>
                      {stat.value.toLocaleString()}
                    </Text>
                    {stat.growth !== 0 && (
                      <Tag 
                        color={stat.growth > 0 ? 'green' : stat.growth < 0 ? 'red' : 'default'}
                        style={{ fontSize: 10, borderRadius: 4 }}
                      >
                        {stat.growth > 0 ? '+' : ''}{stat.growth}%
                      </Tag>
                    )}
                  </div>
                </div>
                <Avatar 
                  icon={stat.icon} 
                  style={{ 
                    backgroundColor: 'transparent',
                    color: stat.color,
                    fontSize: 18
                  }} 
                />
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: 24, borderRadius: 8 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <Search
            placeholder="Search your work..."
            allowClear
            style={{ width: 300 }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            prefix={<SearchOutlined />}
          />
          
          <Select
            value={filterType}
            onChange={setFilterType}
            style={{ width: 120 }}
          >
            <Option value="all">All Status</Option>
            <Option value="completed">Completed</Option>
            <Option value="processing">Processing</Option>
            <Option value="failed">Failed</Option>
            <Option value="draft">Draft</Option>
          </Select>

          <RangePicker
            value={dateRange}
            onChange={setDateRange}
            style={{ width: 240 }}
          />

          <Button type="link" onClick={() => {
            setSearchQuery('');
            setFilterType('all');
            setDateRange(null);
          }}>
            Clear Filters
          </Button>
        </div>
      </Card>

      {/* Content Tabs */}
      <Card style={{ borderRadius: 8 }}>
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          size="large"
        >
          <Tabs.TabPane 
            tab={<Badge count={getTabCount('all')} offset={[8, 0]}>All Work</Badge>} 
            key="all" 
          />
          <Tabs.TabPane 
            tab={<Badge count={getTabCount('sales-call')} offset={[8, 0]}>Call Analysis</Badge>} 
            key="sales-call" 
          />
          <Tabs.TabPane 
            tab={<Badge count={getTabCount('growth-plan')} offset={[8, 0]}>Growth Plans</Badge>} 
            key="growth-plan" 
          />
          <Tabs.TabPane 
            tab={<Badge count={getTabCount('pricing-calc')} offset={[8, 0]}>Pricing</Badge>} 
            key="pricing-calc" 
          />
          <Tabs.TabPane 
            tab={<Badge count={getTabCount('niche-research')} offset={[8, 0]}>Research</Badge>} 
            key="niche-research" 
          />
          <Tabs.TabPane 
            tab={<Badge count={getTabCount('cold-email')} offset={[8, 0]}>Emails</Badge>} 
            key="cold-email" 
          />
          <Tabs.TabPane 
            tab={<Badge count={getTabCount('offer-creator')} offset={[8, 0]}>Offers</Badge>} 
            key="offer-creator" 
          />
        </Tabs>

        {/* Work Items List */}
        <div style={{ marginTop: 24 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Spin size="large" />
              <p style={{ marginTop: 16 }}>Refreshing your work...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <Empty 
              description={workItems.length === 0 ? "No work items found. Start by using one of our AI tools!" : "No items match your current filters"}
              style={{ padding: '40px 0' }}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {paginatedItems.map((item) => (
                <div
                  key={item.id}
                  style={{
                    border: '1px solid #514848',
                    borderRadius: 8,
                    padding: 16,
                    transition: 'all 0.2s',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = getTypeColor(item.type);
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#f0f0f0';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                    {/* Type Icon */}
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: 8,
                      backgroundColor: getTypeColor(item.type) + '15',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: getTypeColor(item.type),
                      fontSize: 16,
                      flexShrink: 0
                    }}>
                      {getTypeIcon(item.type)}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {/* Title and Type */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <Title level={5} style={{ margin: 0 }}>
                              {item.title}
                            </Title>
                            <Tag color={getTypeColor(item.type)} style={{ fontSize: 10 }}>
                              {getTypeName(item.type)}
                            </Tag>
                            {getStatusTag(item.status)}
                          </div>

                          {/* Subtitle */}
                          <Text style={{ color: '#666', display: 'block', marginBottom: 12 }}>
                            {item.subtitle}
                          </Text>

                          {/* Metadata */}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
                            <Text style={{ color: '#999', fontSize: 12 }}>
                              <CalendarOutlined /> {new Date(item.createdAt).toLocaleDateString()}
                            </Text>

                            {/* Type-specific metadata display */}
                            {item.metadata.workspace && (
                              <Tag color="blue" style={{ fontSize: 10 }}>
                                {item.metadata.workspace.name}
                              </Tag>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <Dropdown overlay={createActionMenu(item)} trigger={['click']}>
                          <Button type="text" icon={<EllipsisOutlined />} />
                        </Dropdown>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {filteredItems.length > 0 && (
            <div style={{ 
              marginTop: 24, 
              display: 'flex', 
              justifyContent: 'center',
              borderTop: '1px solid #f0f0f0',
              paddingTop: 24
            }}>
              <Pagination 
                current={currentPage}
                total={filteredItems.length} 
                pageSize={pageSize}
                showSizeChanger 
                showQuickJumper
                showTotal={(total, range) => 
                  `${range[0]}-${range[1]} of ${total} items`
                }
                onChange={setCurrentPage}
                onShowSizeChange={(_, size) => {
                  setPageSize(size);
                  setCurrentPage(1);
                }}
              />
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default IntegratedWorkDashboard;