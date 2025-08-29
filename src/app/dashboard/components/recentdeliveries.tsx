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
import { useWorkspaceContext } from '../../hooks/useWorkspaceContext'; // Add workspace context
import { message } from 'antd';

const { Text } = Typography;
const { useBreakpoint } = Grid;

// Define types
type WorkItemType = 'sales-call' | 'growth-plan' | 'pricing-calc' | 'niche-research' | 'cold-email' | 'offer-creator' | 'ad-writer';
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
  const { 
    currentWorkspace, 
    isWorkspaceReady, 
    getWorkspaceScopedEndpoint 
  } = useWorkspaceContext();
  
  const [loading, setLoading] = useState(false);
  const [recentWorkItems, setRecentWorkItems] = useState<RecentWorkItem[]>([]);

  // Fetch recent work items from the unified API with workspace context
const fetchRecentWorkItems = async () => {
  if (!isWorkspaceReady || !currentWorkspace) {
    console.log('Workspace not ready for recent deliverables');
    return;
  }

  setLoading(true);

  try {
    console.log('🔄 Fetching recent work items from unified API for workspace:', currentWorkspace.name);
    
    // Use workspace-scoped endpoint
    const baseUrl = '/api/dashboard/work-items';
    const url = getWorkspaceScopedEndpoint(baseUrl);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Workspace-Id': currentWorkspace.id,
      },
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch recent work items: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('📥 Unified API recent work items response:', data);

    if (data.success && Array.isArray(data.data?.items)) {
      // Filter items to ensure they belong to current workspace and explicitly type as RecentWorkItem[]
      const workspaceItems: RecentWorkItem[] = data.data.items.filter((item: any) => 
        !item.workspace_id || item.workspace_id === currentWorkspace.id
      );
      
      // Sort by creation date (newest first) and limit
      const sortedAndLimitedItems = workspaceItems
        .sort((a: RecentWorkItem, b: RecentWorkItem) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, maxItems);

      setRecentWorkItems(sortedAndLimitedItems);
      console.log(`🎉 Successfully fetched and set ${sortedAndLimitedItems.length} recent work items for workspace: ${currentWorkspace.name}`);
    } else {
      throw new Error(data.error || 'Invalid response format from unified API');
    }
  } catch (error) {
    console.error('💥 Error fetching recent work items from unified API:', error);
    message.error('Failed to load recent AI work');
  } finally {
    setLoading(false);
  }
};


  // Load data when workspace is ready
  useEffect(() => {
    if (isWorkspaceReady) {
      fetchRecentWorkItems();
    }
  }, [currentWorkspace?.id, maxItems, isWorkspaceReady]);

  // Listen for workspace changes
  useEffect(() => {
    const handleWorkspaceChange = () => {
      setRecentWorkItems([]);
      if (isWorkspaceReady) {
        fetchRecentWorkItems();
      }
    };

    window.addEventListener('workspaceChanged', handleWorkspaceChange);
    return () => window.removeEventListener('workspaceChanged', handleWorkspaceChange);
  }, [isWorkspaceReady]);

  // Get icon for work type
  const getTypeIcon = (type: WorkItemType) => {
    const icons: Record<WorkItemType, React.JSX.Element> = {
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

  // Get type color
  const getTypeColor = (type: WorkItemType) => {
    const colors: Record<WorkItemType, string> = {
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

  // Get type display name
  const getTypeName = (type: WorkItemType) => {
    const names: Record<WorkItemType, string> = {
      'sales-call': 'Call Analysis',
      'growth-plan': 'Growth Plan',
      'pricing-calc': 'Pricing Calc',
      'niche-research': 'Research',
      'cold-email': 'Cold Email',
      'offer-creator': 'Offers',
      'ad-writer': 'Ads'
    };
    return names[type] || type;
  };

  // Handle view action with workspace context
  const handleView = (item: RecentWorkItem) => {
    if (!currentWorkspace) return;
    
    // Update view URLs to include workspace context
    const viewUrls: Record<WorkItemType, string> = {
      'sales-call': `/dashboard/${currentWorkspace.slug}/sales-call-analyzer/${item.rawData.id?.split('-')[2] || item.rawData.id}`,
      'growth-plan': `/dashboard/${currentWorkspace.slug}/growth-plans/${item.rawData.id?.split('-')[2] || item.rawData.id}`,
      'pricing-calc': `/dashboard/${currentWorkspace.slug}/pricing-calculator/${item.rawData.id?.split('-')[2] || item.rawData.id}`,
      'niche-research': `/dashboard/${currentWorkspace.slug}/niche-research/${item.rawData.id?.split('-')[2] || item.rawData.id}`,
      'cold-email': `/dashboard/${currentWorkspace.slug}/cold-email/${item.rawData.id?.split('-')[2] || item.rawData.id}`,
      'offer-creator': `/dashboard/${currentWorkspace.slug}/offer-creator/${item.rawData.id?.split('-')[2] || item.rawData.id}`,
      'ad-writer': `/dashboard/${currentWorkspace.slug}/ad-writer/${item.rawData.id?.split('-')[2] || item.rawData.id}`
    };
    
    const url = viewUrls[item.type] || `/dashboard/${currentWorkspace.slug}/submissions?type=${item.type}`;
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

  // Don't render until workspace is ready
  if (!isWorkspaceReady) {
    return (
      <Card
        data-tour="recent-deliverables"
        title="Recent Deliverables"
        styles={getCardStyles()}
        style={{
          backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
          borderColor: theme === 'dark' ? '#374151' : '#f0f0f0',
        }}
      >
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
            Loading workspace...
          </Text>
        </div>
      </Card>
    );
  }

  return (
    <Card
      data-tour="recent-deliverables"
      title="Recent Deliverables"
      styles={getCardStyles()}
      style={{
        backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
        borderColor: theme === 'dark' ? '#374151' : '#f0f0f0',
      }}
      extra={
        <Button
          type="text"
          size="small"
          onClick={() => window.location.href = `/dashboard/${currentWorkspace?.slug}/submissions`}
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
                        <Tag>{item.metadata.emailCount} emails</Tag>
                      )}
                      {item.type === 'growth-plan' && (
                        <Tag>{item.metadata.strategies} strategies</Tag>
                      )}
                      {item.type === 'offer-creator' && (
                        <Tag>{item.metadata.packages} packages</Tag>
                      )}
                      
                      {/* Workspace indicator */}
                      <Tag color="blue" style={{ fontSize: 9 }}>
                        {currentWorkspace?.name}
                      </Tag>
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
            No AI work generated yet in {currentWorkspace?.name}
          </Text>
          <Button
            type="text"
            size="small"
            onClick={() => window.location.href = `/dashboard/${currentWorkspace?.slug}/tools`}
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