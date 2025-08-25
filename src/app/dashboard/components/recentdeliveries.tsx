// app/dashboard/components/RecentDeliverables.tsx
import React, { useState, useEffect } from 'react';
import { Card, List, Button, Typography, Grid, Tag, Spin } from 'antd';
import { 
  FileTextOutlined,
  PhoneOutlined,
  RocketOutlined,
  DollarCircleOutlined,
  BulbOutlined,
  MailOutlined,
  EditOutlined,
  TagOutlined,
  CalendarOutlined,
  EyeOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import { useTheme } from '../../../providers/ThemeProvider';
import { message } from 'antd'; // Import message for error handling

// Remove individual hook imports
// import { useSalesCallAnalyzer } from '../../hooks/useSalesCallAnalyzer';
// import { useGrowthPlan } from '../../hooks/useGrowthPlan';
// import { useSavedCalculations } from '../../hooks/usePricingCalculator';
// import { useNicheResearcher } from '../../hooks/useNicheResearcher';
// import { useColdEmail } from '../../hooks/useColdEmail';
// import { useSavedOffers } from '../../hooks/useOfferCreator';
// import { useAdWriter } from '../../hooks/useAdWriter';

const { Text } = Typography;
const { useBreakpoint } = Grid;

// Define types (keep these as they define the component's internal structure)
type WorkItemType = 'sales-call' | 'growth-plan' | 'pricing-calc' | 'niche-research' | 'cold-email' | 'offer-creator' | 'ad-writer'; // Add 'ad-writer'
type WorkItemStatus = 'completed' | 'processing' | 'failed' | 'draft';

interface RecentWorkItem {
  id: string;
  type: WorkItemType;
  title: string;
  subtitle: string;
  status: WorkItemStatus;
  createdAt: string;
  metadata: Record<string, any>;
  rawData: any;
}

interface RecentDeliverablesProps {
  deliverables?: any[];
  workspaceId?: string;
  maxItems?: number;
}

const RecentDeliverables: React.FC<RecentDeliverablesProps> = ({ 
  deliverables = [], 
  workspaceId,
  maxItems = 6 
}) => {
  const screens = useBreakpoint();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [recentWorkItems, setRecentWorkItems] = useState<RecentWorkItem[]>([]);

  // Remove individual hook initializations
  // const salesCallAnalyzer = useSalesCallAnalyzer();
  // const growthPlan = useGrowthPlan();
  // const savedCalculations = useSavedCalculations();
  // const nicheResearcher = useNicheResearcher();
  // const coldEmail = useColdEmail();
  // const savedOffers = useSavedOffers();

  // Fetch recent work items from the unified API
  const fetchRecentWorkItems = async () => {
    setLoading(true);
    // const items: RecentWorkItem[] = []; // No longer needed

    try {
      console.log('🔄 Fetching recent work items from unified API...');
      // Construct URL with potential workspaceId query param
      const url = new URL('/api/dashboard/work-items', window.location.origin);
      if (workspaceId) {
        url.searchParams.append('workspaceId', workspaceId);
      }
      // Potentially add a limit parameter to the API if supported, or slice client-side

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`Failed to fetch recent work items: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      console.log('📥 Unified API recent work items response:', data);

      if (data.success && Array.isArray(data.data?.items)) {
        // The data from the API already matches the RecentWorkItem structure closely
        // We just need to ensure the type is correct and limit the results
        const apiItems: RecentWorkItem[] = data.data.items;
        
        // Sort by creation date (newest first) and limit
        const sortedAndLimitedItems = apiItems
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, maxItems);

        setRecentWorkItems(sortedAndLimitedItems);
        console.log(`🎉 Successfully fetched and set ${sortedAndLimitedItems.length} recent work items from unified API`);
      } else {
        throw new Error(data.error || 'Invalid response format from unified API');
      }
    } catch (error) {
      console.error('💥 Error fetching recent work items from unified API:', error);
      message.error('Failed to load recent AI work'); // Show user-friendly error
      // Optionally, keep old items or set to empty array
      // setRecentWorkItems([]); 
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    fetchRecentWorkItems();
  }, [workspaceId, maxItems]); // Add maxItems to dependencies if it can change

  // Get icon for work type
  const getTypeIcon = (type: WorkItemType) => {
    const icons: Record<WorkItemType, React.JSX.Element> = {
      'sales-call': <PhoneOutlined />,
      'growth-plan': <RocketOutlined />,
      'pricing-calc': <DollarCircleOutlined />,
      'niche-research': <BulbOutlined />,
      'cold-email': <MailOutlined />,
      'offer-creator': <EditOutlined />,
      'ad-writer': <TagOutlined /> // Add icon for ad-writer
    };
    return icons[type] || <FileTextOutlined />;
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
      'ad-writer': '#faad14' // Add color for ad-writer
    };
    return colors[type] || '#666';
  };

  // Get type display name
  const getTypeName = (type: WorkItemType) => {
    const names: Record<WorkItemType, string> = {
      'sales-call': 'Call Analysis',
      'growth-plan': 'Growth Plan',
      'pricing-calc': 'Pricing Calc',
      'niche-research': 'Research',
      'cold-email': 'Cold Email',
      'offer-creator': 'Offers',
      'ad-writer': 'Ads' // Add name for ad-writer
    };
    return names[type] || type;
  };

  // Handle view action
  const handleView = (item: RecentWorkItem) => {
    // Update view URLs to match your routing
    const viewUrls: Record<WorkItemType, string> = {
      'sales-call': `/sales-call-analyzer/${item.rawData.id?.split('-')[2] || item.rawData.id}`, // Extract ID if prefixed
      'growth-plan': `/growth-plans/${item.rawData.id?.split('-')[2] || item.rawData.id}`,
      'pricing-calc': `/pricing-calculator/${item.rawData.id?.split('-')[2] || item.rawData.id}`,
      'niche-research': `/niche-research/${item.rawData.id?.split('-')[2] || item.rawData.id}`,
      'cold-email': `/cold-email/${item.rawData.id?.split('-')[2] || item.rawData.id}`,
      'offer-creator': `/offer-creator/${item.rawData.id?.split('-')[2] || item.rawData.id}`,
      'ad-writer': `/ad-writer/${item.rawData.id?.split('-')[2] || item.rawData.id}` // Add URL for ad-writer
    };
    // Fallback if rawData.id structure is unexpected or item.type URL isn't defined
    const url = viewUrls[item.type] || `/ai-work-dashboard?type=${item.type}`;
    window.location.href = url;
  };

  const getCardStyles = () => ({
    body: {
      backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
      padding: screens.xs ? '8px' : '12px',
    },
    header: {
      borderBottomColor: theme === 'dark' ? '#374151' : '#f0f0f0',
      backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
      padding: '8px 12px',
    },
  });

  return (
    <Card
      data-tour="recent-deliverables"
      title="Recent AI Work"
      styles={getCardStyles()}
      style={{
        backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
        borderColor: theme === 'dark' ? '#374151' : '#f0f0f0',
      }}
      extra={
        <Button
          type="text"
          size="small"
          onClick={() => window.location.href = '/ai-work-dashboard'}
          style={{
            color: theme === 'dark' ? '#a78bfa' : '#6d28d9',
            padding: 0,
            height: 'auto',
          }}
        >
          View All
        </Button>
      }
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <Spin size="small" />
          <Text
            style={{
              color: theme === 'dark' ? '#9ca3af' : '#666666',
              display: 'block',
              marginTop: 8,
              fontSize: 12,
            }}
          >
            Loading your recent work...
          </Text>
        </div>
      ) : recentWorkItems.length > 0 ? (
        <List
          itemLayout="horizontal"
          dataSource={recentWorkItems}
          style={{
            backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
            borderColor: theme === 'dark' ? '#374151' : '#f0f0f0',
          }}
          renderItem={(item) => (
            <List.Item
              style={{
                borderBottomColor: theme === 'dark' ? '#374151' : '#f0f0f0',
                padding: '8px 0',
                backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
              }}
              actions={[
                <Button
                  type="text"
                  size="small"
                  key="view"
                  icon={<EyeOutlined />}
                  onClick={() => handleView(item)}
                  style={{
                    color: theme === 'dark' ? '#a78bfa' : '#6d28d9',
                    padding: '0 4px',
                    height: 'auto',
                    fontSize: 12,
                  }}
                >
                  View
                </Button>,
                // Optional: Implement export action if needed
                // <Button
                //   type="text"
                //   size="small"
                //   key="export"
                //   icon={<DownloadOutlined />}
                //   style={{
                //     color: theme === 'dark' ? '#a78bfa' : '#6d28d9',
                //     padding: '0 4px',
                //     height: 'auto',
                //     fontSize: 12,
                //   }}
                // >
                //   Export
                // </Button>,
              ]}
            >
              <List.Item.Meta
                avatar={
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 6,
                      backgroundColor: getTypeColor(item.type) + '15',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: getTypeColor(item.type),
                      fontSize: 14,
                    }}
                  >
                    {getTypeIcon(item.type)}
                  </div>
                }
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Text
                      strong
                      style={{
                        color: theme === 'dark' ? '#f9fafb' : '#1a1a1a',
                        fontSize: 13,
                      }}
                    >
                      {item.title}
                    </Text>
                    <Tag 
                      color={getTypeColor(item.type)} 
                      style={{ fontSize: 10, lineHeight: 1.2, padding: '0 4px' }}
                    >
                      {getTypeName(item.type)}
                    </Tag>
                  </div>
                }
                description={
                  <div>
                    <Text
                      style={{
                        color: theme === 'dark' ? '#9ca3af' : '#666666',
                        fontSize: 12,
                        display: 'block',
                        marginBottom: 2,
                      }}
                    >
                      {item.subtitle}
                    </Text>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Text style={{ color: theme === 'dark' ? '#6b7280' : '#999', fontSize: 10 }}>
                        <CalendarOutlined /> {new Date(item.createdAt).toLocaleDateString()}
                      </Text>
                      
                      {/* Type-specific metadata */}
                      {item.type === 'pricing-calc' && item.metadata.hourlyRate && (
                        <Tag color="green">${item.metadata.hourlyRate}/hr</Tag>
                      )}
                      {item.type === 'cold-email' && (
                        <Tag >{item.metadata.emailCount} emails</Tag>
                      )}
                      {item.type === 'growth-plan' && (
                        <Tag >{item.metadata.strategies} strategies</Tag>
                      )}
                      {item.type === 'offer-creator' && (
                        <Tag >{item.metadata.packages} packages</Tag>
                      )}
                      {/* Add metadata display for other types if needed */}
                    </div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      ) : (
        <div
          style={{
            textAlign: 'center',
            padding: '16px 0',
            backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
          }}
        >
          <RocketOutlined
            style={{
              fontSize: 32,
              color: theme === 'dark' ? '#4b5563' : '#d1d5db',
              marginBottom: 8,
            }}
          />
          <Text
            style={{
              color: theme === 'dark' ? '#9ca3af' : '#666666',
              display: 'block',
              marginBottom: 4,
              fontSize: 12,
            }}
          >
            No AI work generated yet
          </Text>
          <Button
            type="text"
            size="small"
            onClick={() => window.location.href = '/tools'}
            style={{
              color: theme === 'dark' ? '#a78bfa' : '#6d28d9',
              padding: 0,
              height: 'auto',
              fontSize: 12,
            }}
          >
            Start using AI tools
          </Button>
        </div>
      )}
    </Card>
  );
};

export default RecentDeliverables;
