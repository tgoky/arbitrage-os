"use client";

import React, { useState, useMemo } from 'react';
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
  ArrowLeftOutlined,
  EyeOutlined,
  DownloadOutlined,
  DeleteOutlined,
  TeamOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
  CheckCircleFilled,
  ClockCircleFilled,
  CloseCircleFilled,
  FilterOutlined
} from '@ant-design/icons';
import { 
  Card, 
  Tag, 
  Button, 
  Typography, 
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
  Empty,
  Badge,
  Spin,
  message,
  ConfigProvider,
  Divider,
  Modal
} from 'antd';
import { useParsed } from "@refinedev/core";
import { useWorkspaceContext } from '../hooks/useWorkspaceContext';
import { useRouter } from 'next/navigation';
import { useWorkItems } from '../hooks/useDashboardData';
import { useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../providers/ThemeProvider';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

// --- STYLING CONSTANTS ---
const BRAND_COLOR = '#5CC49D'; // Mint Green
const STEEL_COLOR = '#9DA2B3';
const SPACE_BG = '#0B0C10';
const GLASS_BG = 'rgba(255, 255, 255, 0.03)';
const GLASS_BORDER = 'rgba(255, 255, 255, 0.08)';
const GLASS_BG_HOVER = 'rgba(255, 255, 255, 0.06)';

// Define proper types
type WorkItemType = 'sales-call' | 'growth-plan' | 'pricing-calc' | 'niche-research' | 'cold-email' | 'offer-creator' | 'ad-writer' | 'n8n-workflow' | 'proposal' | 'lead-generation';
type WorkItemStatus = 'completed' | 'processing' | 'failed' | 'draft';

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
  const queryClient = useQueryClient();
  const { theme } = useTheme(); 
  const isDark = true; // Forcing premium dark theme

  const { 
    currentWorkspace, 
    isWorkspaceReady,
    getWorkspaceScopedEndpoint 
  } = useWorkspaceContext();

  const {
    data: workItems = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching
  } = useWorkItems(100);

  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [dateRange, setDateRange] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const router = useRouter();

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
        color: BRAND_COLOR, 
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

  const getTypeIcon = (type: WorkItemType) => {
    const icons: Record<WorkItemType, React.JSX.Element> = {
      'sales-call': <PhoneOutlined />,
      'growth-plan': <RocketOutlined />,
      'pricing-calc': <DollarCircleOutlined />,
      'niche-research': <BulbOutlined />,
      'cold-email': <MailOutlined />,
      'offer-creator': <EditOutlined />,
      'ad-writer': <TagOutlined />,
      'n8n-workflow': <ThunderboltOutlined />,
      'proposal': <FileTextOutlined />,        
      'lead-generation': <TeamOutlined />  
    };
    return icons[type] || <FileTextOutlined />;
  };

  const getTypeName = (type: WorkItemType) => {
    const names: Record<WorkItemType, string> = {
      'sales-call': 'Sales Analysis',
      'growth-plan': 'Growth Plan',
      'pricing-calc': 'Pricing Calc',
      'niche-research': 'Niche Research',
      'cold-email': 'Cold Email',
      'offer-creator': 'Offer Creator',
      'ad-writer': 'Ad Copy',
      'n8n-workflow': 'Automation',
      'proposal': 'Proposal',           
      'lead-generation': 'Lead Gen' 
    };
    return names[type] || type;
  };

  const getStatusTag = (status: WorkItemStatus) => {
    const styles = {
      completed: { color: '#52c41a', icon: <CheckCircleFilled />, text: 'Ready' },
      processing: { color: '#1890ff', icon: <Spin size="small" />, text: 'Processing' },
      failed: { color: '#ff4d4f', icon: <CloseCircleFilled />, text: 'Failed' },
      draft: { color: '#faad14', icon: <ClockCircleFilled />, text: 'Draft' },
    };
    const config = styles[status] || styles.completed;

    return (
      <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium" 
            style={{ backgroundColor: `${config.color}20`, color: config.color, border: `1px solid ${config.color}40` }}>
        {config.icon}
        {config.text}
      </span>
    );
  };

  const getTypeColor = (type: WorkItemType) => {
    const colors: Record<WorkItemType, string> = {
      'sales-call': '#722ed1',
      'growth-plan': '#1890ff',
      'pricing-calc': '#52c41a',
      'niche-research': '#fa8c16',
      'cold-email': '#eb2f96',
      'offer-creator': '#13c2c2',
      'ad-writer': '#faad14',
      'n8n-workflow': '#fa541c',
      'proposal': '#9254de',           
      'lead-generation': '#52c41a'   
    };
    return colors[type] || '#666';
  };

  // Full delete functionality with confirmation modal
  const deleteWorkItem = async (item: WorkItem) => {
    if (!currentWorkspace) {
      message.error('No workspace selected');
      return;
    }

    Modal.confirm({
      title: 'Delete Item',
      content: 'Are you sure you want to delete this item? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const response = await fetch(`/api/deliverables/${item.metadata.deliverableId}?workspaceId=${currentWorkspace.id}`, {
            method: 'DELETE',
            credentials: 'include',
            headers: { 'X-Workspace-Id': currentWorkspace.id }
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Delete failed with status ${response.status}`);
          }

          const result = await response.json();
          if (result.success) {
            // Optimistically update the cache
            queryClient.setQueryData(
              ['workItems', currentWorkspace.id, 100],
              (oldData: WorkItem[] | undefined) => oldData?.filter(workItem => workItem.id !== item.id) || []
            );
            message.success('Item deleted successfully');
          } else {
            throw new Error(result.error || 'Delete operation failed');
          }
        } catch (deleteError) {
          console.error('Delete error:', deleteError);
          message.error(deleteError instanceof Error ? deleteError.message : 'Failed to delete item');
          // Invalidate and refetch on error to ensure consistency
          queryClient.invalidateQueries(['workItems', currentWorkspace?.id]);
        }
      }
    });
  };

  // Full export functionality
  const exportWorkItem = async (item: WorkItem) => {
    if (!currentWorkspace) {
      message.error('No workspace selected');
      return;
    }

    try {
      message.loading({ content: 'Preparing export...', key: 'export' });

      // First fetch the deliverable data
      const response = await fetch(`/api/deliverables/${item.metadata.deliverableId}?workspaceId=${currentWorkspace.id}`, {
        credentials: 'include',
        headers: {
          'X-Workspace-Id': currentWorkspace.id
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch item data for export');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch item data');
      }

      // Create export blob
      const exportData = {
        title: item.title,
        type: item.type,
        content: data.data.content,
        metadata: data.data.metadata,
        createdAt: data.data.createdAt,
        updatedAt: data.data.updatedAt
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${item.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);

      message.success({ content: 'Exported successfully', key: 'export' });
    } catch (exportError) {
      console.error('Export error:', exportError);
      message.error({ content: exportError instanceof Error ? exportError.message : 'Failed to export item', key: 'export' });
    }
  };

  const handleAction = async (action: string, item: WorkItem) => {
    if (!currentWorkspace) {
      message.error('No workspace selected');
      return;
    }

    try {
      switch (action) {
        case 'view':
          const viewUrls: Record<WorkItemType, string> = {
            'offer-creator': `/dashboard/${currentWorkspace.slug}/offer-creator/${item.metadata.deliverableId}`,
            'sales-call': `/dashboard/${currentWorkspace.slug}/sales-call-analyzer/${item.metadata.deliverableId}`,
            'growth-plan': `/dashboard/${currentWorkspace.slug}/growth-plans/${item.metadata.deliverableId}`,
            'pricing-calc': `/dashboard/${currentWorkspace.slug}/pricing-calculator/${item.metadata.deliverableId}`,
            'niche-research': `/dashboard/${currentWorkspace.slug}/niche-research/${item.metadata.deliverableId}`,
            'cold-email': `/dashboard/${currentWorkspace.slug}/cold-email/${item.metadata.deliverableId}`,
            'ad-writer': `/dashboard/${currentWorkspace.slug}/ad-writer/${item.metadata.deliverableId}`,
            'n8n-workflow': `/dashboard/${currentWorkspace.slug}/n8n-builder/${item.metadata.deliverableId}`,
            'proposal': `/dashboard/${currentWorkspace.slug}/proposal-creator/${item.metadata.deliverableId}`, 
            'lead-generation': `/dashboard/${currentWorkspace.slug}/lead-generation/${item.metadata.deliverableId}`
          };
          
          const viewUrl = viewUrls[item.type];
          if (viewUrl) {
            window.location.href = viewUrl;
          } else {
            message.warning('View details not available for this item type yet');
          }
          break;

        case 'delete':
          deleteWorkItem(item);
          break;

        case 'export':
          exportWorkItem(item);
          break;

        default:
          message.info(`${action} functionality coming soon!`);
      }
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
      message.error(`Failed to ${action} item`);
    }
  };

  const handleBack = () => router.push(`/dashboard/${currentWorkspace?.slug}`);
  
  const handleRefresh = async () => {
    await queryClient.invalidateQueries(['workItems', currentWorkspace?.id]);
    refetch();
  };

  const createActionMenu = (item: WorkItem) => (
    <Menu 
      onClick={({ key }) => handleAction(key, item)}
      style={{ background: '#1f1f1f', border: '1px solid #333' }}
      theme="dark"
    >
      {item.actions.includes('view') && <Menu.Item key="view" icon={<EyeOutlined />}>View Details</Menu.Item>} 
      {item.actions.includes('export') && <Menu.Item key="export" icon={<DownloadOutlined />}>Export</Menu.Item>}
      <Menu.Divider style={{ borderColor: '#333' }}/>
      <Menu.Item key="delete" icon={<DeleteOutlined />} danger>Delete</Menu.Item>
    </Menu>
  );

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

  const getTabCount = (type: string) => {
    if (type === 'all') return workItems.length;
    return workItems.filter(item => item.type === type).length;
  };

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredItems.slice(startIndex, startIndex + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  // Show loading if workspace is not ready
  if (!isWorkspaceReady) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: SPACE_BG }}>
        <Spin size="large" tip={<span style={{ color: STEEL_COLOR }}>Loading workspace...</span>} />
      </div>
    );
  }

  // Show loading for initial data fetch
  if (isLoading && workItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: SPACE_BG }}>
        <Spin size="large" tip={<span style={{ color: STEEL_COLOR }}>Loading your work...</span>} />
      </div>
    );
  }

  // Show error state
  if (isError && workItems.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: SPACE_BG }}>
        <div style={{ color: '#ff4d4f', marginBottom: 16 }}>
          <FileTextOutlined style={{ fontSize: 48 }} />
        </div>
        <Title level={4} style={{ color: 'white' }}>Failed to Load Work Items</Title>
        <Text style={{ color: STEEL_COLOR, marginBottom: 16 }}>
          {error instanceof Error ? error.message : 'Unknown error occurred'}
        </Text>
        <Button 
          type="primary" 
          onClick={handleRefresh}
          style={{ backgroundColor: BRAND_COLOR, borderColor: BRAND_COLOR, color: '#000' }}
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <ConfigProvider
      theme={{
        token: {
          fontFamily: "'Manrope', sans-serif",
          colorPrimary: BRAND_COLOR,
          colorBgBase: SPACE_BG,
          colorTextBase: '#fff',
          colorBorder: GLASS_BORDER,
          borderRadius: 8,
        },
        components: {
          Input: { colorBgContainer: GLASS_BG, activeBorderColor: BRAND_COLOR, hoverBorderColor: 'rgba(255,255,255,0.2)' },
          Select: { colorBgContainer: GLASS_BG, selectorBg: GLASS_BG, optionSelectedBg: 'rgba(92, 196, 157, 0.2)' },
          DatePicker: { colorBgContainer: GLASS_BG },
          Tabs: { itemColor: STEEL_COLOR, itemSelectedColor: BRAND_COLOR, itemHoverColor: '#fff', inkBarColor: BRAND_COLOR },
          Pagination: { itemActiveBg: GLASS_BG, colorText: STEEL_COLOR, colorPrimary: BRAND_COLOR },
          Badge: { colorText: '#fff' },
          Modal: { contentBg: '#1f1f1f', headerBg: '#1f1f1f', titleColor: '#fff' }
        }
      }}
    >
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&display=swap');
        body { font-family: 'Manrope', sans-serif; background-color: ${SPACE_BG}; }
        .ant-picker { border: 1px solid ${GLASS_BORDER} !important; background: ${GLASS_BG} !important; }
        .ant-picker-input > input { color: white !important; }
        .ant-select-selector { border: 1px solid ${GLASS_BORDER} !important; background: ${GLASS_BG} !important; color: white !important; }
        .ant-card { background: ${GLASS_BG}; border: 1px solid ${GLASS_BORDER}; }
        .custom-tabs .ant-tabs-nav::before { border-bottom: 1px solid rgba(255,255,255,0.1); }
        .ant-modal-content { background: #1f1f1f !important; }
        .ant-modal-header { background: #1f1f1f !important; border-bottom: 1px solid #333 !important; }
        .ant-modal-title { color: white !important; }
        .ant-modal-close-x { color: #999 !important; }
        .ant-modal-body { color: #ccc !important; }
        .ant-modal-footer { border-top: 1px solid #333 !important; }
      `}</style>

      <div className="min-h-screen p-6 pb-20 max-w-[1600px] mx-auto">
        {/* Header Navigation */}
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={handleBack}
            className={`
              group flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300
              bg-white/5 border border-white/10 hover:border-white/20 text-gray-400 hover:text-white
            `}
          >
            <ArrowLeftOutlined className="text-xs transition-transform group-hover:-translate-x-1" />
            <span className="text-sm font-medium font-manrope">Back to Dashboard</span>
          </button>
        </div>

        {/* Title Section */}
        <div className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 tracking-tight font-manrope">
              My Submissions
            </h1>
            <Text style={{ color: STEEL_COLOR, fontSize: '16px' }}>
              Track and manage your AI-generated assets in <span className="text-white font-medium">{currentWorkspace?.name}</span>
            </Text>
          </div>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={handleRefresh} 
            loading={isFetching}
            type="text"
            className="text-gray-400 hover:text-white"
          >
            Refresh Data
          </Button>
        </div>

        {/* Stats Grid */}
        <Row gutter={[16, 16]} className="mb-8">
          {summaryStats.map((stat, index) => (
            <Col xs={24} sm={12} lg={6} key={index}>
              <div 
                className="p-5 rounded-xl border transition-all duration-300 hover:shadow-lg"
                style={{ background: GLASS_BG, borderColor: GLASS_BORDER }}
              >
                <div className="flex justify-between items-start mb-2">
                  <span style={{ color: STEEL_COLOR, fontSize: '13px', fontWeight: 500 }}>{stat.title}</span>
                  <div className="p-2 rounded-lg bg-white/5" style={{ color: stat.color }}>{stat.icon}</div>
                </div>
                <div className="flex items-end gap-3">
                  <span className="text-3xl font-bold text-white">{stat.value.toLocaleString()}</span>
                  {stat.growth !== 0 && (
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${stat.growth > 0 ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'}`}>
                      {stat.growth > 0 ? '+' : ''}{stat.growth}%
                    </span>
                  )}
                </div>
              </div>
            </Col>
          ))}
        </Row>

        {/* Filters Bar */}
        <div className="p-4 rounded-xl mb-8 border flex flex-wrap gap-4 items-center justify-between"
             style={{ background: GLASS_BG, borderColor: GLASS_BORDER }}>
          <div className="flex flex-wrap gap-3 items-center flex-1">
            <Input 
              placeholder="Search submissions..." 
              prefix={<SearchOutlined className="text-gray-500" />} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-xs"
              size="large"
              bordered={false}
              style={{ background: 'rgba(255,255,255,0.05)', color: 'white' }}
              allowClear
            />
            <Divider type="vertical" className="border-gray-700 h-8" />
            <Select value={filterType} onChange={setFilterType} style={{ width: 140 }} size="large" bordered={false}>
              <Option value="all">All Status</Option>
              <Option value="completed">Completed</Option>
              <Option value="processing">Processing</Option>
              <Option value="failed">Failed</Option>
              <Option value="draft">Draft</Option>
            </Select>
            <RangePicker 
              value={dateRange} 
              onChange={setDateRange} 
              style={{ background: 'transparent', border: 'none' }} 
              size="large"
              bordered={false}
            />
          </div>
          <Button 
            type="text" 
            icon={<FilterOutlined />} 
            onClick={() => { setSearchQuery(''); setFilterType('all'); setDateRange(null); }}
            className="text-gray-400 hover:text-white"
          >
            Reset Filters
          </Button>
        </div>

        {/* Content Area */}
        <div className="custom-tabs">
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab}
            size="large"
            tabBarStyle={{ marginBottom: 24, borderBottom: `1px solid ${GLASS_BORDER}` }}
            items={[
              { key: 'all', label: `All (${getTabCount('all')})` },
              { key: 'n8n-workflow', label: `Automation (${getTabCount('n8n-workflow')})` },
              { key: 'sales-call', label: `Sales (${getTabCount('sales-call')})` },
              { key: 'cold-email', label: `Emails (${getTabCount('cold-email')})` },
              { key: 'growth-plan', label: `Strategy (${getTabCount('growth-plan')})` },
              { key: 'offer-creator', label: `Offers (${getTabCount('offer-creator')})` },
              { key: 'lead-generation', label: `Leads (${getTabCount('lead-generation')})` },
              { key: 'pricing-calc', label: `Pricing (${getTabCount('pricing-calc')})` },
              { key: 'niche-research', label: `Research (${getTabCount('niche-research')})` },
              { key: 'ad-writer', label: `Ad Copy (${getTabCount('ad-writer')})` },
              { key: 'proposal', label: `Proposals (${getTabCount('proposal')})` },
            ]}
          />

          {isFetching && workItems.length > 0 ? (
            <div className="py-12 text-center"><Spin /></div>
          ) : filteredItems.length === 0 ? (
            <Empty 
              image={Empty.PRESENTED_IMAGE_SIMPLE} 
              description={
                <span style={{ color: STEEL_COLOR }}>
                  {workItems.length === 0 
                    ? "No work items found. Start by using one of our AI tools!" 
                    : "No items match your current filters"}
                </span>
              } 
              className="py-12"
            />
          ) : (
            <div className="flex flex-col gap-3">
              {paginatedItems.map((item) => (
                <div
                  key={item.id}
                  className="group relative rounded-xl border p-5 transition-all duration-300 hover:shadow-lg cursor-pointer flex items-start gap-5"
                  style={{ background: GLASS_BG, borderColor: GLASS_BORDER }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = getTypeColor(item.type); e.currentTarget.style.background = GLASS_BG_HOVER; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = GLASS_BORDER; e.currentTarget.style.background = GLASS_BG; }}
                  onClick={() => handleAction('view', item)}
                >
                  {/* Icon Box */}
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 transition-colors"
                    style={{ backgroundColor: `${getTypeColor(item.type)}15`, color: getTypeColor(item.type) }}
                  >
                    {getTypeIcon(item.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-lg font-bold text-white truncate font-manrope m-0">{item.title}</h3>
                          {getStatusTag(item.status)}
                        </div>
                        <div className="text-sm truncate mb-3" style={{ color: STEEL_COLOR }}>{item.subtitle || 'No description available'}</div>
                        
                        <div className="flex items-center gap-4 text-xs" style={{ color: '#666' }}>
                          <span className="flex items-center gap-1">
                            <CalendarOutlined /> {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1" style={{ color: getTypeColor(item.type) }}>
                            <TagOutlined /> {getTypeName(item.type)}
                          </span>
                          {/* Workspace tag from metadata */}
                          {item.metadata?.workspace && (
                            <Tag color="blue" className="text-xs border-0" style={{ background: 'rgba(24, 144, 255, 0.15)' }}>
                              {item.metadata.workspace.name}
                            </Tag>
                          )}
                        </div>
                      </div>

                      <div onClick={(e) => e.stopPropagation()}>
                        <Dropdown overlay={createActionMenu(item)} trigger={['click']} placement="bottomRight">
                          <Button type="text" icon={<EllipsisOutlined className="text-xl" />} className="text-gray-400 hover:text-white" />
                        </Dropdown>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {filteredItems.length > 0 && (
            <div className="mt-8 flex justify-center border-t border-gray-800 pt-6">
              <Pagination 
                current={currentPage}
                total={filteredItems.length} 
                pageSize={pageSize}
                onChange={(page) => setCurrentPage(page)}
                showSizeChanger
                showQuickJumper
                showTotal={(total, range) => (
                  <span style={{ color: STEEL_COLOR }}>
                    {range[0]}-{range[1]} of {total} items
                  </span>
                )}
                onShowSizeChange={(_, size) => {
                  setPageSize(size);
                  setCurrentPage(1);
                }}
              />
            </div>
          )}
        </div>
      </div>
    </ConfigProvider>
  );
};

export default IntegratedWorkDashboard;