// app/dashboard/components/ActivityFeed.tsx
import React, { useMemo } from 'react';
import { Card, List, Tag, Typography, Button, Grid, Spin, Progress, Badge } from 'antd';
import { 
  CheckCircleOutlined, 
  ClockCircleOutlined, 
  ExclamationCircleOutlined, 
  PlayCircleOutlined,
  PhoneOutlined,
  RocketOutlined,
  DollarCircleOutlined,
  BulbOutlined,
  MailOutlined,
  EditOutlined,

  TagOutlined,
  FileTextOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useTheme } from '../../../providers/ThemeProvider';
import { useWorkspaceContext } from '../../hooks/useWorkspaceContext';
import { useWorkItems, WorkItem } from '../../hooks/useDashboardData';

const { Text } = Typography;
const { useBreakpoint } = Grid;

type ToolType = 'sales-call' | 'growth-plan' | 'pricing-calc' | 'niche-research' | 'cold-email' | 'offer-creator' | 'ad-writer' | 'n8n-workflow';
type ActivityStatus = 'completed' | 'processing' | 'failed' | 'queued';

interface EnhancedActivity {
  id: string;
  type: 'tool-usage' | 'generation' | 'analysis' | 'optimization' | 'export' | 'collaboration';
  toolType: ToolType;
  action: string;
  user: string;
  target?: string;
  status: ActivityStatus;
  timestamp: Date;
  metadata: {
    duration?: string;
    tokensUsed?: number;
    confidence?: number;
    outputSize?: string;
    performance?: number;
    collaborators?: string[];
    priority?: 'high' | 'medium' | 'low';
    progress?: number;
  };
}

interface ActivityFeedProps {
  recentActivity?: any[];
  workspaceId?: string;
  maxItems?: number;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ 
  recentActivity = [], 
  workspaceId,
  maxItems = 8 
}) => {
  const screens = useBreakpoint();
  const { theme } = useTheme();
  const { 
    currentWorkspace, 
    isWorkspaceReady, 
  } = useWorkspaceContext();
  
  // Use React Query for work items
  const {
    data: workItems = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching
  } = useWorkItems(maxItems);

    const transformWorkItemToActivity = (item: WorkItem): EnhancedActivity | null => {
    try {
      let action = 'Generated item';
      let metadata: EnhancedActivity['metadata'] = {};
      let user = 'AI Assistant';

      // Map item type to activity details
      switch (item.type) {
        case 'sales-call':
          action = 'Analyzed sales call';
          user = 'Sales AI';
          metadata = {
            duration: item.metadata?.duration || '5-15 min',
            confidence: item.metadata?.score || Math.floor(Math.random() * 40) + 60,
            tokensUsed: item.metadata?.tokensUsed || Math.floor(Math.random() * 2000) + 1000,
            performance: item.metadata?.sentiment === 'positive' ? 85 : item.metadata?.sentiment === 'negative' ? 45 : 65
          };
          break;

        case 'growth-plan':
          action = 'Generated growth strategy';
          user = 'Strategy AI';
          metadata = {
            duration: '10-15 min',
            tokensUsed: item.metadata?.tokensUsed || Math.floor(Math.random() * 3000) + 2000,
            outputSize: `${item.metadata?.strategies || 5} strategies`,
            priority: 'high' as const
          };
          break;

        case 'pricing-calc':
          action = 'Calculated project pricing';
          user = 'Pricing AI';
          metadata = {
            duration: '2-5 min',
            confidence: item.metadata?.roiPercentage && item.metadata?.roiPercentage > 100 ? 90 : 75,
            outputSize: `$${item.metadata?.recommendedRetainer?.toLocaleString() || '0'}`,
            performance: item.metadata?.roiPercentage || 85
          };
          break;

        case 'cold-email':
          action = 'Generated email sequence';
          user = 'Email AI';
          metadata = {
            duration: '5-10 min',
            outputSize: `${item.metadata?.emailCount || 3} emails`,
            tokensUsed: item.metadata?.tokensUsed || Math.floor(Math.random() * 1500) + 800,
            confidence: 82
          };
          break;

        case 'niche-research':
          action = 'Researched market niche';
          user = 'Research AI';
          metadata = {
            duration: '10-20 min',
            tokensUsed: item.metadata?.tokensUsed || Math.floor(Math.random() * 2500) + 1500,
            outputSize: `${item.metadata?.marketSize || 'Market'} analysis`,
            confidence: 88,
            priority: item.metadata?.primaryObjective === 'market-entry' ? 'high' as const : 'medium' as const
          };
          break;

        case 'offer-creator':
          action = 'Created signature offers';
          user = 'Offer AI';
          metadata = {
            duration: '8-12 min',
            outputSize: `${item.metadata?.packages || 3} packages`,
            confidence: 85,
            priority: 'high' as const
          };
          break;

        case 'ad-writer':
          action = 'Generated ad copy';
          user = 'Ad AI';
          metadata = {
            duration: '3-8 min',
            outputSize: `${item.metadata?.adCount || 5} ads`,
            confidence: 80,
            priority: 'medium' as const
          };
          break;

        case 'n8n-workflow':
          action = 'Created automation workflow';
          user = 'Workflow AI';
          metadata = {
            duration: '15-30 min',
            outputSize: `${item.metadata?.nodeCount || 8} nodes`,
            confidence: 88,
            priority: 'high' as const
          };
          break;

          case 'proposal':
  action = 'Generated business proposal';
  user = 'Proposal AI';
  metadata = {
    duration: '15-25 min',
    tokensUsed: item.metadata?.tokensUsed || Math.floor(Math.random() * 5000) + 3000,
    outputSize: `$${item.metadata?.totalValue?.toLocaleString() || '0'}`,
    confidence: item.metadata?.winProbability || 75,
    priority: 'high' as const
  };
  break;

case 'lead-generation':
  action = 'Generated lead list';
  user = 'Apollo AI';
  metadata = {
    duration: '5-15 min',
    tokensUsed: item.metadata?.tokensUsed || item.metadata?.leadCount || 0,
    outputSize: `${item.metadata?.leadCount || 0} leads`,
    confidence: item.metadata?.averageScore || 80,
    priority: item.metadata?.searchStrategy === 'Global Precision' ? 'high' as const : 'medium' as const
  };
  break;

        default:
          action = `Generated ${item.type}`;
          user = 'AI Assistant';
          metadata = {};
      }

      return {
        id: `activity-${item.id}`,
        type: 'generation' as const,
        toolType: item.type as ToolType,
        action,
        user,
        target: item.subtitle || item.title,
        status: (item.status as ActivityStatus) || 'completed',
        timestamp: new Date(item.createdAt),
        metadata
      };

    } catch (error) {
      console.error('Error transforming work item to activity:', error);
      return null;
    }
  };


  // Transform work items to enhanced activities
  const activities = useMemo(() => {
    return workItems.map(item => transformWorkItemToActivity(item)).filter(Boolean) as EnhancedActivity[];
  }, [workItems]);

  // Transform work item to activity

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

  const getToolIcon = (toolType: ToolType) => {
    const icons: Record<ToolType, React.ReactElement> = {
      'sales-call': <PhoneOutlined />,
      'growth-plan': <RocketOutlined />,
      'pricing-calc': <DollarCircleOutlined />,
      'niche-research': <BulbOutlined />,
      'cold-email': <MailOutlined />,
      'offer-creator': <EditOutlined />,
      'ad-writer': <TagOutlined />,
      'n8n-workflow': <FileTextOutlined />
    };
    return icons[toolType] || <FileTextOutlined />;
  };

  const getToolColor = (toolType: ToolType) => {
    const colors: Record<ToolType, string> = {
      'sales-call': '#722ed1',
      'growth-plan': '#1890ff',
      'pricing-calc': '#52c41a',
      'niche-research': '#fa8c16',
      'cold-email': '#eb2f96',
      'offer-creator': '#13c2c2',
      'ad-writer': '#faad14',
      'n8n-workflow': '#fa541c'
    };
    return colors[toolType] || '#666';
  };

  const getStatusIcon = (status: ActivityStatus) => {
    const iconStyle = {
      fontSize: 12,
      padding: 4,
      borderRadius: 4,
      backgroundColor: theme === 'dark' ? '#1f2937' : '#f9fafb',
    };

    switch (status) {
      case 'completed':
        return <CheckCircleOutlined style={{ ...iconStyle, color: '#52c41a' }} />;
      case 'processing':
        return <ClockCircleOutlined style={{ ...iconStyle, color: '#1890ff' }} />;
      case 'failed':
        return <ExclamationCircleOutlined style={{ ...iconStyle, color: '#f5222d' }} />;
      case 'queued':
        return <PlayCircleOutlined style={{ ...iconStyle, color: '#faad14' }} />;
      default:
        return <ClockCircleOutlined style={{ ...iconStyle, color: '#d9d9d9' }} />;
    }
  };

  const getStatusColor = (status: ActivityStatus) => {
    const colors: Record<ActivityStatus, string> = {
      'completed': 'green',
      'processing': 'blue',
      'failed': 'red',
      'queued': 'orange'
    };
    return colors[status] || 'default';
  };

  const formatTimeAgo = (timestamp: Date) => {
    try {
      const now = new Date();
      const diff = now.getTime() - timestamp.getTime();
      const minutes = Math.floor(diff / (1000 * 60));
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      
      if (days > 0) {
        return `${days}d ago`;
      } else if (hours > 0) {
        return `${hours}h ago`;
      } else if (minutes > 0) {
        return `${minutes}m ago`;
      } else {
        return 'Just now';
      }
    } catch (error) {
      return 'Unknown';
    }
  };

  const renderMetadata = (activity: EnhancedActivity) => {
    const { metadata } = activity;
    const metadataItems = [];

    if (metadata.duration) {
      metadataItems.push(
        <span key="duration" style={{ color: theme === 'dark' ? '#6b7280' : '#999', fontSize: 10 }}>
          ⏱ {metadata.duration}
        </span>
      );
    }

    if (metadata.tokensUsed) {
      metadataItems.push(
        <span key="tokens" style={{ color: theme === 'dark' ? '#6b7280' : '#999', fontSize: 10 }}>
          🔥 {metadata.tokensUsed.toLocaleString()}
        </span>
      );
    }

    if (metadata.confidence) {
      metadataItems.push(
        <span key="confidence" style={{ color: theme === 'dark' ? '#6b7280' : '#999', fontSize: 10 }}>
          🎯 {metadata.confidence}%
        </span>
      );
    }

    if (metadata.outputSize) {
      metadataItems.push(
        <span key="output" style={{ color: theme === 'dark' ? '#6b7280' : '#999', fontSize: 10 }}>
          📄 {metadata.outputSize}
        </span>
      );
    }

    if (metadata.performance) {
      metadataItems.push(
        <span key="performance" style={{ color: theme === 'dark' ? '#6b7280' : '#999', fontSize: 10 }}>
          ⚡ {metadata.performance}%
        </span>
      );
    }

    return metadataItems.length > 0 ? (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
        {metadataItems}
        {metadata.priority && (
          <Tag 
            color={metadata.priority === 'high' ? 'red' : metadata.priority === 'medium' ? 'orange' : 'default'} 
            style={{ fontSize: 8, padding: '0 3px', margin: 0, lineHeight: '14px' }}
          >
            {metadata.priority}
          </Tag>
        )}
      </div>
    ) : null;
  };

  // Don't render until workspace is ready
  if (!isWorkspaceReady) {
    return (
      <Card
        data-tour="activity-feed"
        title="Activity Feed"
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

  // Error state
  if (isError) {
    return (
      <Card
        data-tour="activity-feed"
        title="Activity Feed"
        styles={getCardStyles()}
        style={{
          backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
          borderColor: theme === 'dark' ? '#374151' : '#f0f0f0',
        }}
      >
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <Text
            style={{
              color: theme === 'dark' ? '#ef4444' : '#dc2626',
              display: 'block',
              marginBottom: 8,
              fontSize: 12,
            }}
          >
            Failed to load activities: {(error as Error)?.message  || 'Unknown error'}
          </Text>
          <Button
            type="text"
            size="small"
            onClick={() => refetch()}
            style={{
              color: theme === 'dark' ? '#a78bfa' : '#6d28d9',
              padding: 0,
              height: 'auto',
            }}
          >
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card
      data-tour="activity-feed"
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            fontWeight: 600,
            fontSize: '10px',
          }}>
            Activity Feed
          </span>
          {activities.some(a => a.status === 'processing') && (
            <Badge status="processing" />
          )}
        </div>
      }
      styles={getCardStyles()}
      style={{
        backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
        borderColor: theme === 'dark' ? '#374151' : '#f0f0f0',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
      bodyStyle={{
        flex: 1,
        overflow: 'hidden',
        padding: 0,
      }}
      extra={
        <Button
          type="text"
          size="small"
          onClick={() => refetch()}
          loading={isFetching}
          style={{
            color: theme === 'dark' ? '#a78bfa' : '#6d28d9',
            padding: 0,
            height: 'auto',
          }}
        >
          {isFetching ? 'Refreshing...' : 'Refresh'}
        </Button>
      }
    >
      {isLoading ? (
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
            Loading activities...
          </Text>
        </div>
      ) : activities.length > 0 ? (
        <div
          style={{
            height: 'calc(100% - 0px)',
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '0 12px',
            // Custom scrollbar styles
            scrollbarWidth: 'thin',
            scrollbarColor: theme === 'dark' ? '#374151 transparent' : '#d1d5db transparent',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.overflowY = 'scroll';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.overflowY = 'auto';
          }}
        >
          <style>
            {`
              /* Webkit scrollbar styles */
              .activity-feed-scroll::-webkit-scrollbar {
                width: 6px;
              }
              
              .activity-feed-scroll::-webkit-scrollbar-track {
                background: transparent;
              }
              
              .activity-feed-scroll::-webkit-scrollbar-thumb {
                background-color: ${theme === 'dark' ? '#374151' : '#d1d5db'};
                border-radius: 3px;
                transition: background-color 0.2s;
              }
              
              .activity-feed-scroll::-webkit-scrollbar-thumb:hover {
                background-color: ${theme === 'dark' ? '#4b5563' : '#9ca3af'};
              }
              
              .activity-feed-scroll {
                scrollbar-width: thin;
                scrollbar-color: ${theme === 'dark' ? '#374151 transparent' : '#d1d5db transparent'};
              }
            `}
          </style>
          <List
            className="activity-feed-scroll"
            itemLayout="horizontal"
            dataSource={activities}
            style={{
              backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
              borderColor: theme === 'dark' ? '#374151' : '#f0f0f0',
            }}
            renderItem={(activity) => (
              <List.Item
                style={{
                  borderBottomColor: theme === 'dark' ? '#374151' : '#f0f0f0',
                  padding: '8px 0',
                  backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
                }}
                actions={[
                  <div key="status-info" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Tag
                      color={getStatusColor(activity.status)}
                      style={{
                        marginRight: 0,
                        textTransform: 'capitalize',
                        fontSize: 9,
                        padding: '0 3px',
                        lineHeight: '16px'
                      }}
                    >
                      {activity.status}
                    </Tag>
                    {activity.status === 'processing' && activity.metadata.progress && (
                      <Progress 
                        percent={activity.metadata.progress} 
                        size="small" 
                        style={{ width: 40 }}
                        strokeColor="#1890ff"
                      />
                    )}
                  </div>
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <div style={{ position: 'relative' }}>
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 6,
                          backgroundColor: getToolColor(activity.toolType) + '15',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: getToolColor(activity.toolType),
                          fontSize: 12,
                        }}
                      >
                        {getToolIcon(activity.toolType)}
                      </div>
                      <div style={{ 
                        position: 'absolute', 
                        bottom: -2, 
                        right: -2,
                        fontSize: 8
                      }}>
                        {getStatusIcon(activity.status)}
                      </div>
                    </div>
                  }
                  title={
                    <div>
                      <Text
                        strong
                        style={{
                          color: theme === 'dark' ? '#f9fafb' : '#1a1a1a',
                          fontSize: 12,
                          display: 'block',
                          marginBottom: 2,
                        }}
                      >
                        {activity.action}
                      </Text>
                      <Text
                        style={{
                          color: theme === 'dark' ? '#9ca3af' : '#666666',
                          fontSize: 10,
                        }}
                      >
                        by {activity.user} {activity.target && `• ${activity.target.substring(0, 30)}${activity.target.length > 30 ? '...' : ''}`} • {formatTimeAgo(activity.timestamp)}
                      </Text>
                    </div>
                  }
                  description={renderMetadata(activity)}
                />
              </List.Item>
            )}
          />
        </div>
      ) : (
        <div
          style={{
            textAlign: 'center',
            padding: '16px 0',
            backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
          }}
        >
          <ThunderboltOutlined
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
            No recent activity in {currentWorkspace?.name}
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

export default ActivityFeed;