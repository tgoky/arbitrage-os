// app/dashboard/components/ActivityFeed.tsx
import React, { useState, useEffect } from 'react';
import { Card, List, Tag, Typography, Button, Grid, Spin, Progress, Badge, message } from 'antd';
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
  UserOutlined,
  FileTextOutlined,
  ThunderboltOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { useTheme } from '../../../providers/ThemeProvider';

// Import only message, remove individual tool hooks
// import { useSalesCallAnalyzer } from '../../hooks/useSalesCallAnalyzer';
// import { useGrowthPlan } from '../../hooks/useGrowthPlan';
// import { useSavedCalculations } from '../../hooks/usePricingCalculator';
// import { useNicheResearcher } from '../../hooks/useNicheResearcher';
// import { useColdEmail } from '../../hooks/useColdEmail';
// import { useSavedOffers } from '../../hooks/useOfferCreator';

const { Text } = Typography;
const { useBreakpoint } = Grid;

// Define types (ensure they match your unified API's WorkItem structure if needed)
// These are already defined in your code, so we keep them
// type ActivityType = 'tool-usage' | 'generation' | 'analysis' | 'optimization' | 'export' | 'collaboration';
// type ActivityStatus = 'completed' | 'processing' | 'failed' | 'queued';
// type ToolType = 'sales-call' | 'growth-plan' | 'pricing-calc' | 'niche-research' | 'cold-email' | 'offer-creator';

interface EnhancedActivity {
  id: string;
  type: 'tool-usage' | 'generation' | 'analysis' | 'optimization' | 'export' | 'collaboration'; // Use ActivityType if defined
  toolType: 'sales-call' | 'growth-plan' | 'pricing-calc' | 'niche-research' | 'cold-email' | 'offer-creator'; // Use ToolType if defined
  action: string;
  user: string;
  target?: string;
  status: 'completed' | 'processing' | 'failed' | 'queued'; // Use ActivityStatus if defined
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
  const [loading, setLoading] = useState(false);
  const [activities, setActivities] = useState<EnhancedActivity[]>([]);

  // Remove individual hook initializations
  // const salesCallAnalyzer = useSalesCallAnalyzer();
  // const growthPlan = useGrowthPlan();
  // const savedCalculations = useSavedCalculations();
  // const nicheResearcher = useNicheResearcher();
  // const coldEmail = useColdEmail();
  // const savedOffers = useSavedOffers();

  // Fetch activities from the unified API
  const fetchActivities = async () => {
    setLoading(true);
    // const activityList: EnhancedActivity[] = []; // No longer needed

    try {
      console.log('🔄 Fetching activities from unified API...');
      // Construct URL with potential workspaceId query param
      const url = new URL('/api/dashboard/work-items', window.location.origin);
      if (workspaceId) {
        url.searchParams.append('workspaceId', workspaceId);
      }

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`Failed to fetch activities: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      console.log('📥 Unified API activities response:', data);

      if (data.success && Array.isArray(data.data?.items)) {
        // Transform WorkItems from the API into EnhancedActivities
        const transformedActivities: EnhancedActivity[] = data.data.items.map((item: any) => {
          // Determine action and metadata based on item.type
          let action = 'Generated item'; // Default
          let metadata: EnhancedActivity['metadata'] = {};
          let user = 'AI Assistant'; // Default user

          switch (item.type) {
            case 'sales-call':
              action = 'Analyzed sales call';
              user = 'AI Assistant';
              metadata = {
                duration: item.metadata.duration || 'N/A',
                confidence: item.metadata.score || Math.floor(Math.random() * 40) + 60,
                tokensUsed: item.metadata.tokensUsed || Math.floor(Math.random() * 2000) + 1000,
                performance: item.metadata.sentiment === 'positive' ? 85 : item.metadata.sentiment === 'negative' ? 45 : 65
              };
              break;
            case 'growth-plan':
              action = 'Generated growth strategy';
              user = 'Strategy AI';
              metadata = {
                duration: '12 min', // Example, could be in item.metadata if saved
                tokensUsed: item.metadata.tokensUsed || Math.floor(Math.random() * 3000) + 2000,
                outputSize: `${item.metadata.strategies || 5} strategies`, // Example
                priority: 'high'
              };
              break;
            case 'pricing-calc':
              action = 'Calculated project pricing';
              user = 'Pricing AI';
              metadata = {
                duration: '3 min', // Example
                confidence: item.metadata.roiPercentage && item.metadata.roiPercentage > 100 ? 90 : 75,
                outputSize: `$${item.metadata.recommendedRetainer?.toLocaleString() || '0'}`,
                performance: item.metadata.roiPercentage || 85
              };
              break;
            case 'cold-email':
              action = 'Generated email sequence';
              user = 'Email AI';
              metadata = {
                duration: '8 min', // Example
                outputSize: `${item.metadata.emailCount || 3} emails`,
                tokensUsed: item.metadata.tokensUsed || Math.floor(Math.random() * 1500) + 800,
                confidence: 82
              };
              break;
            case 'niche-research':
              action = 'Researched market niche';
              user = 'Research AI';
              metadata = {
                duration: '15 min', // Example
                tokensUsed: item.metadata.tokensUsed || Math.floor(Math.random() * 2500) + 1500,
                outputSize: `${item.metadata.marketSize || 'Unknown'} market`,
                confidence: 88,
                priority: item.metadata.primaryObjective === 'market-entry' ? 'high' : 'medium'
              };
              break;
            case 'offer-creator':
              action = 'Created signature offers';
              user = 'Offer AI';
              metadata = {
                duration: '10 min', // Example
                outputSize: `${item.metadata.packages || 3} packages`,
                confidence: 85,
                priority: 'high'
              };
              break;
            default:
              action = `Used ${item.type}`;
              metadata = {};
          }

          return {
            id: `activity-${item.id}`, // Prefix to avoid potential ID clashes if needed
            type: 'generation', // Map WorkItem.type to ActivityType as appropriate
            toolType: item.type, // Direct mapping assuming types align or are handled
            action,
            user,
            target: item.subtitle || item.title, // Use subtitle or title as the target
            status: item.status || 'completed', // Default to completed if not present
            timestamp: new Date(item.createdAt), // Ensure it's a Date object
            metadata
          };
        });

        // Sort by timestamp (newest first)
        transformedActivities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        
        // Limit to maxItems and update state
        setActivities(transformedActivities.slice(0, maxItems));
        console.log(`🎉 Successfully transformed ${transformedActivities.length} activities from unified API`);
      } else {
        throw new Error(data.error || 'Invalid response format from unified API');
      }
    } catch (error) {
      console.error('💥 Error fetching activities from unified API:', error);
      message.error('Failed to load recent activities'); // Show user-friendly error
      // Optionally, keep old activities or set to empty array
      // setActivities([]); 
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
    // Refresh every 30 seconds for real-time feel
    const interval = setInterval(fetchActivities, 30000);
    return () => clearInterval(interval);
  }, [workspaceId, maxItems]); // Add maxItems to dependency array if it can change

  // --- Helper functions like getCardStyles, getToolIcon, etc. remain the same ---
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

  const getToolIcon = (toolType: 'sales-call' | 'growth-plan' | 'pricing-calc' | 'niche-research' | 'cold-email' | 'offer-creator' /* Use ToolType */) => {
    const icons: Record<'sales-call' | 'growth-plan' | 'pricing-calc' | 'niche-research' | 'cold-email' | 'offer-creator', React.JSX.Element> = { // Use ToolType
      'sales-call': <PhoneOutlined />,
      'growth-plan': <RocketOutlined />,
      'pricing-calc': <DollarCircleOutlined />,
      'niche-research': <BulbOutlined />,
      'cold-email': <MailOutlined />,
      'offer-creator': <EditOutlined />
    };
    return icons[toolType] || <FileTextOutlined />;
  };

  const getToolColor = (toolType: 'sales-call' | 'growth-plan' | 'pricing-calc' | 'niche-research' | 'cold-email' | 'offer-creator' /* Use ToolType */) => {
    const colors: Record<'sales-call' | 'growth-plan' | 'pricing-calc' | 'niche-research' | 'cold-email' | 'offer-creator', string> = { // Use ToolType
      'sales-call': '#722ed1',
      'growth-plan': '#1890ff',
      'pricing-calc': '#52c41a',
      'niche-research': '#fa8c16',
      'cold-email': '#eb2f96',
      'offer-creator': '#13c2c2'
    };
    return colors[toolType] || '#666';
  };

  const getStatusIcon = (status: 'completed' | 'processing' | 'failed' | 'queued' /* Use ActivityStatus */) => {
    const iconStyle = {
      fontSize: 16,
      padding: 6,
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

  const getStatusColor = (status: 'completed' | 'processing' | 'failed' | 'queued' /* Use ActivityStatus */) => {
    switch (status) {
      case 'completed':
        return 'green';
      case 'processing':
        return 'blue';
      case 'failed':
        return 'red';
      case 'queued':
        return 'orange';
      default:
        return 'default';
    }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours > 0) {
      return `${hours}h ago`;
    } else if (minutes > 0) {
      return `${minutes}m ago`;
    } else {
      return 'Just now';
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
          🔥 {metadata.tokensUsed.toLocaleString()} tokens
        </span>
      );
    }

    if (metadata.confidence) {
      metadataItems.push(
        <span key="confidence" style={{ color: theme === 'dark' ? '#6b7280' : '#999', fontSize: 10 }}>
          🎯 {metadata.confidence}% confidence
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
          ⚡ {metadata.performance}% score
        </span>
      );
    }

    if (metadata.priority) {
      metadataItems.push(
        <Tag key="priority" color={metadata.priority === 'high' ? 'red' : metadata.priority === 'medium' ? 'orange' : 'default'} style={{ fontSize: 9, padding: '0 4px', margin: 0 }}>
          {metadata.priority}
        </Tag>
      );
    }

    return metadataItems.length > 0 ? (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
        {metadataItems}
      </div>
    ) : null;
  };

  // --- Render function remains largely the same, using the new state and helpers ---
  return (
    <Card
      data-tour="activity-feed"
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          Activity Feed
          {activities.some(a => a.status === 'processing') && (
            <Badge status="processing" />
          )}
        </div>
      }
      styles={getCardStyles()}
      style={{
        backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
        borderColor: theme === 'dark' ? '#374151' : '#f0f0f0',
      }}
      extra={
        <Button
          type="text"
          size="small"
          onClick={() => fetchActivities()}
          loading={loading}
          style={{
            color: theme === 'dark' ? '#a78bfa' : '#6d28d9',
            padding: 0,
            height: 'auto',
          }}
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </Button>
      }
    >
      {loading && activities.length === 0 ? (
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
        <List
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
                      fontSize: 10,
                      padding: '0 4px',
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
                        width: 32,
                        height: 32,
                        borderRadius: 6,
                        backgroundColor: getToolColor(activity.toolType) + '15',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: getToolColor(activity.toolType),
                        fontSize: 14,
                      }}
                    >
                      {getToolIcon(activity.toolType)}
                    </div>
                    <div style={{ 
                      position: 'absolute', 
                      bottom: -2, 
                      right: -2,
                      fontSize: 10
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
                        fontSize: 13,
                        display: 'block',
                        marginBottom: 2,
                      }}
                    >
                      {activity.action}
                    </Text>
                    <Text
                      style={{
                        color: theme === 'dark' ? '#9ca3af' : '#666666',
                        fontSize: 11,
                      }}
                    >
                      by {activity.user} {activity.target && `• ${activity.target}`} • {formatTimeAgo(activity.timestamp)}
                    </Text>
                  </div>
                }
                description={renderMetadata(activity)}
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
            No recent activity
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

export default ActivityFeed;
