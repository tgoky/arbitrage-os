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
  ReloadOutlined
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

// Import your existing hooks
import { useSalesCallAnalyzer } from '../../app/hooks/useSalesCallAnalyzer';
import { useGrowthPlan } from '../../app/hooks/useGrowthPlan';
import { useSavedCalculations } from '../../app/hooks/usePricingCalculator';
import { useNicheResearcher } from '../../app/hooks/useNicheResearcher';
import { useColdEmail } from '../../app/hooks/useColdEmail';
import { useSavedOffers } from '../../app/hooks/useOfferCreator';
import { useAdWriter } from '../../app/hooks/useAdWriter';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

// Unified work item interface
interface WorkItem {
  id: string;
  type: 'sales-call' | 'growth-plan' | 'pricing-calc' | 'niche-research' | 'cold-email' | 'offer-creator' | 'ad-writer';
  title: string;
  subtitle: string;
  status: 'completed' | 'processing' | 'failed' | 'draft';
  createdAt: string;
  metadata: Record<string, any>;
  actions: string[];
  rawData: any; // Original data from the respective hook
}

const IntegratedWorkDashboard = ({ workspaceId }: { workspaceId?: string }) => {
  // State
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [dateRange, setDateRange] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Initialize all hooks
  const salesCallAnalyzer = useSalesCallAnalyzer();
  const growthPlan = useGrowthPlan();
  const savedCalculations = useSavedCalculations();
  const nicheResearcher = useNicheResearcher();
  const coldEmail = useColdEmail();
  const savedOffers = useSavedOffers();
  const adWriter = useAdWriter();

  // Unified data fetching function
  const fetchAllWorkItems = async () => {
    setLoading(true);
    const items: WorkItem[] = [];

    try {
      // Fetch Sales Call Analyses
      try {
        const salesCalls = await salesCallAnalyzer.getUserAnalyses(workspaceId);
        salesCalls.forEach((call: any) => {
          items.push({
            id: `sales-call-${call.id}`,
            type: 'sales-call',
            title: call.title || 'Sales Call Analysis',
            subtitle: `${call.prospectName || 'Unknown'} • ${call.companyName || 'Company'}`,
            status: 'completed',
            createdAt: call.createdAt || call.created_at || new Date().toISOString(),
            metadata: {
              duration: call.duration || 'N/A',
              callType: call.callType || 'unknown',
              company: call.companyName,
              prospect: call.prospectName,
              sentiment: call.sentiment || 'neutral',
              score: call.score || null
            },
            actions: ['view', 'export', 'delete'],
            rawData: call
          });
        });
      } catch (err) {
        console.warn('Failed to fetch sales calls:', err);
      }

      // Fetch Growth Plans
      try {
        const growthPlans = await growthPlan.fetchPlans();
        growthPlans.forEach((plan: any) => {
          items.push({
            id: `growth-plan-${plan.id}`,
            type: 'growth-plan',
            title: plan.title || 'Growth Plan',
            subtitle: `${plan.metadata?.clientCompany || 'Company'} • ${plan.metadata?.industry || 'Industry'}`,
            status: 'completed',
            createdAt: plan.createdAt?.toISOString() || plan.created_at || new Date().toISOString(),
            metadata: {
              industry: plan.metadata?.industry,
              timeframe: plan.metadata?.timeframe,
              strategies: plan.plan?.strategies?.length || 0,
              tokensUsed: plan.metadata?.tokensUsed || 0
            },
            actions: ['view', 'export', 'edit', 'delete'],
            rawData: plan
          });
        });
      } catch (err) {
        console.warn('Failed to fetch growth plans:', err);
      }

      // Fetch Pricing Calculations
      try {
        await savedCalculations.fetchCalculations(workspaceId);
        savedCalculations.calculations.forEach((calc: any) => {
          items.push({
            id: `pricing-calc-${calc.id}`,
            type: 'pricing-calc',
            title: calc.title || 'Pricing Calculation',
            subtitle: `${calc.clientName || 'Client'} • $${calc.recommendedRetainer?.toLocaleString() || '0'}`,
            status: 'completed',
            createdAt: calc.createdAt || calc.created_at || new Date().toISOString(),
            metadata: {
              annualSavings: calc.annualSavings,
              recommendedRetainer: calc.recommendedRetainer,
              hourlyRate: calc.hourlyRate,
              roiPercentage: calc.roiPercentage,
              industry: calc.industry
            },
            actions: ['view', 'export', 'duplicate', 'delete'],
            rawData: calc
          });
        });
      } catch (err) {
        console.warn('Failed to fetch pricing calculations:', err);
      }

      // Fetch Niche Research Reports
      try {
        const nicheReports = await nicheResearcher.getUserReports(workspaceId);
        nicheReports.forEach((report: any) => {
          items.push({
            id: `niche-research-${report.id}`,
            type: 'niche-research',
            title: report.title || 'Niche Research Report',
            subtitle: `${report.nicheName} • ${report.marketType}`,
            status: 'completed',
            createdAt: report.createdAt || report.created_at || new Date().toISOString(),
            metadata: {
              nicheName: report.nicheName,
              marketSize: report.marketSize,
              primaryObjective: report.primaryObjective,
              marketType: report.marketType,
              budget: report.budget,
              tokensUsed: report.tokensUsed
            },
            actions: ['view', 'export', 'update', 'delete'],
            rawData: report
          });
        });
      } catch (err) {
        console.warn('Failed to fetch niche research:', err);
      }

      // Fetch Cold Email Generations
      try {
        const emailGenerations = await coldEmail.getEmailGenerations(workspaceId);
        emailGenerations.forEach((generation: any) => {
          items.push({
            id: `cold-email-${generation.id}`,
            type: 'cold-email',
            title: generation.title || 'Cold Email Campaign',
            subtitle: `${generation.emails?.length || 0} emails • ${generation.industry || 'General'}`,
            status: 'completed',
            createdAt: generation.createdAt || generation.created_at || new Date().toISOString(),
            metadata: {
              emailCount: generation.emails?.length || 0,
              industry: generation.industry,
              tone: generation.tone,
              method: generation.method,
              firstName: generation.firstName
            },
            actions: ['view', 'copy', 'optimize', 'delete'],
            rawData: generation
          });
        });
      } catch (err) {
        console.warn('Failed to fetch cold emails:', err);
      }

      // Fetch Offer Creator Results
      try {
        await savedOffers.fetchOffers(workspaceId);
        savedOffers.offers.forEach((offer: any) => {
          items.push({
            id: `offer-creator-${offer.id}`,
            type: 'offer-creator',
            title: offer.title || 'Signature Offers',
            subtitle: `${offer.industry || 'General'} • ${offer.packages?.length || 3} Packages`,
            status: 'completed',
            createdAt: offer.createdAt || offer.created_at || new Date().toISOString(),
            metadata: {
              industry: offer.industry,
              packages: offer.packages?.length || 0,
              priceRange: offer.priceRange,
              deliveryModel: offer.deliveryModel,
              targetMarket: offer.targetMarket
            },
            actions: ['view', 'export', 'optimize', 'delete'],
            rawData: offer
          });
        });
      } catch (err) {
        console.warn('Failed to fetch offers:', err);
      }

      // Sort by creation date (newest first)
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setWorkItems(items);
    } catch (error) {
      console.error('Error fetching work items:', error);
      message.error('Failed to load some work items');
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount
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
  const getTypeIcon = (type: string) => {
    const icons = {
      'sales-call': <PhoneOutlined />,
      'growth-plan': <RocketOutlined />,
      'pricing-calc': <DollarCircleOutlined />,
      'niche-research': <BulbOutlined />,
      'cold-email': <MailOutlined />,
      'offer-creator': <EditOutlined />,
      'ad-writer': <TagOutlined />
    };
    return icons[type] || <FileTextOutlined />;
  };

  // Get type display name
  const getTypeName = (type: string) => {
    const names = {
      'sales-call': 'Sales Call Analysis',
      'growth-plan': 'Growth Plan',
      'pricing-calc': 'Pricing Calculator',
      'niche-research': 'Niche Research',
      'cold-email': 'Cold Email',
      'offer-creator': 'Offer Creator',
      'ad-writer': 'Ad Copy Writer'
    };
    return names[type] || type;
  };

  // Get status tag
  const getStatusTag = (status: string) => {
    const statusConfig = {
      completed: { color: 'success', text: 'Completed' },
      processing: { color: 'processing', text: 'Processing' },
      failed: { color: 'error', text: 'Failed' },
      draft: { color: 'default', text: 'Draft' }
    };
    const config = statusConfig[status] || statusConfig.completed;
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // Get type color
  const getTypeColor = (type: string) => {
    const colors = {
      'sales-call': '#722ed1',
      'growth-plan': '#1890ff',
      'pricing-calc': '#52c41a',
      'niche-research': '#fa8c16',
      'cold-email': '#eb2f96',
      'offer-creator': '#13c2c2',
      'ad-writer': '#faad14'
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
            'sales-call': `/sales-call-analyzer/${item.rawData.id}`,
            'growth-plan': `/growth-plans/${item.rawData.id}`,
            'pricing-calc': `/pricing-calculator/${item.rawData.id}`,
            'niche-research': `/niche-research/${item.rawData.id}`,
            'cold-email': `/cold-email/${item.rawData.id}`,
            'offer-creator': `/offer-creator/${item.rawData.id}`,
            'ad-writer': `/ad-writer/${item.rawData.id}`
          };
          window.location.href = viewUrls[item.type] || '/';
          break;

        case 'delete':
          const deleteConfirm = window.confirm('Are you sure you want to delete this item?');
          if (deleteConfirm) {
            // Call appropriate delete function
            switch (item.type) {
              case 'sales-call':
                await salesCallAnalyzer.deleteAnalysis(item.rawData.id);
                break;
              case 'growth-plan':
                await growthPlan.deletePlan(item.rawData.id);
                break;
              case 'pricing-calc':
                await savedCalculations.deleteCalculation(item.rawData.id);
                break;
              case 'niche-research':
                await nicheResearcher.deleteNicheReport(item.rawData.id);
                break;
              case 'cold-email':
                await coldEmail.deleteEmailGeneration(item.rawData.id);
                break;
              case 'offer-creator':
                await savedOffers.deleteOffer(item.rawData.id);
                break;
            }
            message.success('Item deleted successfully');
            fetchAllWorkItems(); // Refresh data
          }
          break;

        case 'export':
          // Call appropriate export function
          switch (item.type) {
            case 'sales-call':
              await salesCallAnalyzer.exportAnalysis(item.rawData.id);
              break;
            case 'growth-plan':
              await growthPlan.exportPlan(item.rawData.id);
              break;
            case 'niche-research':
              await nicheResearcher.exportNicheReport(item.rawData.id);
              break;
            case 'cold-email':
              await coldEmail.exportEmails(item.rawData.id);
              break;
          }
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

  return (
    <div style={{ padding: '24px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2} style={{ margin: 0, color: '#1a1a1a' }}>
            My AI Generated Work
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
                  <Text style={{ color: '#666', fontSize: 12, fontWeight: 500 }}>
                    {stat.title}
                  </Text>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <Text style={{ fontSize: 20, fontWeight: 600, color: '#1a1a1a' }}>
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
                    border: '1px solid #f0f0f0',
                    borderRadius: 8,
                    padding: 16,
                    backgroundColor: '#fff',
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
                            <Title level={5} style={{ margin: 0, color: '#1a1a1a' }}>
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

                            {/* Type-specific metadata */}
                            {item.type === 'sales-call' && item.metadata.score && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Text style={{ fontSize: 12, color: '#999' }}>Score:</Text>
                                <Progress 
                                  percent={item.metadata.score} 
                                  size="small" 
                                  style={{ width: 60 }}
                                  strokeColor={item.metadata.score >= 80 ? '#52c41a' : item.metadata.score >= 60 ? '#faad14' : '#ff4d4f'}
                                />
                              </div>
                            )}

                            {item.type === 'pricing-calc' && (
                              <>
                                <Tag color="green">${item.metadata.hourlyRate}/hr</Tag>
                                <Tag  color="blue">{item.metadata.roiPercentage}% ROI</Tag>
                              </>
                            )}

                            {item.type === 'niche-research' && (
                              <>
                                <Tag>{item.metadata.marketSize}</Tag>
                                <Tag>{item.metadata.primaryObjective}</Tag>
                              </>
                            )}

                            {item.type === 'cold-email' && (
                              <>
                                <Tag>{item.metadata.emailCount} emails</Tag>
                                <Tag>{item.metadata.tone}</Tag>
                              </>
                            )}

                            {item.type === 'offer-creator' && (
                              <>
                                <Tag >{item.metadata.packages} packages</Tag>
                                <Tag  color="green">{item.metadata.priceRange}</Tag>
                              </>
                            )}

                            {item.type === 'growth-plan' && (
                              <>
                                <Tag >{item.metadata.timeframe}</Tag>
                                <Tag >{item.metadata.strategies} strategies</Tag>
                              </>
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