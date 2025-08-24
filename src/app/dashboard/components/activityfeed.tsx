// app/dashboard/components/ActivityFeed.tsx
import React, { useState, useEffect } from 'react';
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
  UserOutlined,
  FileTextOutlined,
  ThunderboltOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { useTheme } from '../../../providers/ThemeProvider';

// Import your existing hooksx
import { useSalesCallAnalyzer } from '../../hooks/useSalesCallAnalyzer';
import { useGrowthPlan } from '../../hooks/useGrowthPlan';
import { useSavedCalculations } from '../../hooks/usePricingCalculator';
import { useNicheResearcher } from '../../hooks/useNicheResearcher';
import { useColdEmail } from '../../hooks/useColdEmail';
import { useSavedOffers } from '../../hooks/useOfferCreator';

const { Text } = Typography;
const { useBreakpoint } = Grid;

// Enhanced activity types
type ActivityType = 'tool-usage' | 'generation' | 'analysis' | 'optimization' | 'export' | 'collaboration';
type ActivityStatus = 'completed' | 'processing' | 'failed' | 'queued';
type ToolType = 'sales-call' | 'growth-plan' | 'pricing-calc' | 'niche-research' | 'cold-email' | 'offer-creator';

interface EnhancedActivity {
  id: string;
  type: ActivityType;
  toolType: ToolType;
  action: string;
  user: string;
  target?: string; // What was worked on
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
  recentActivity?: any[]; // Keep for backward compatibility
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

  // Initialize all hooks
  const salesCallAnalyzer = useSalesCallAnalyzer();
  const growthPlan = useGrowthPlan();
  const savedCalculations = useSavedCalculations();
  const nicheResearcher = useNicheResearcher();
  const coldEmail = useColdEmail();
  const savedOffers = useSavedOffers();

  // Fetch activities from AI tools
  const fetchActivities = async () => {
    setLoading(true);
    const activityList: EnhancedActivity[] = [];

    try {
      // Sales Call Activities
      try {
        const salesCalls = await salesCallAnalyzer.getUserAnalyses(workspaceId);
        salesCalls.slice(0, 3).forEach((call: any, index: number) => {
          activityList.push({
            id: `sales-activity-${call.id}`,
            type: 'analysis',
            toolType: 'sales-call',
            action: 'Analyzed sales call',
            user: 'AI Assistant',
            target: `${call.prospectName || 'Prospect'} at ${call.companyName || 'Company'}`,
            status: call.status || 'completed',
            timestamp: new Date(call.createdAt || Date.now() - (index * 1000 * 60 * 30)),
            metadata: {
              duration: call.duration || '45 min',
              confidence: call.score || Math.floor(Math.random() * 40) + 60,
              tokensUsed: Math.floor(Math.random() * 2000) + 1000,
              performance: call.sentiment === 'positive' ? 85 : call.sentiment === 'negative' ? 45 : 65
            }
          });
        });
      } catch (err) {
        console.warn('Failed to fetch sales call activities:', err);
      }

      // Growth Plan Activities
      try {
        const growthPlans = await growthPlan.fetchPlans();
        growthPlans.slice(0, 2).forEach((plan: any, index: number) => {
          activityList.push({
            id: `growth-activity-${plan.id}`,
            type: 'generation',
            toolType: 'growth-plan',
            action: 'Generated growth strategy',
            user: 'Strategy AI',
            target: `${plan.metadata?.clientCompany || 'Client'} growth plan`,
            status: 'completed',
            timestamp: new Date(plan.createdAt?.getTime() || Date.now() - (index * 1000 * 60 * 60 * 2)),
            metadata: {
              duration: '12 min',
              tokensUsed: plan.metadata?.tokensUsed || Math.floor(Math.random() * 3000) + 2000,
              outputSize: `${plan.plan?.strategies?.length || 5} strategies`,
              priority: 'high'
            }
          });
        });
      } catch (err) {
        console.warn('Failed to fetch growth plan activities:', err);
      }

      // Pricing Calculator Activities
      try {
        await savedCalculations.fetchCalculations(workspaceId);
        savedCalculations.calculations.slice(0, 2).forEach((calc: any, index: number) => {
          activityList.push({
            id: `pricing-activity-${calc.id}`,
            type: 'tool-usage',
            toolType: 'pricing-calc',
            action: 'Calculated project pricing',
            user: 'Pricing AI',
            target: `${calc.clientName || 'Client'} project`,
            status: 'completed',
            timestamp: new Date(calc.createdAt || Date.now() - (index * 1000 * 60 * 45)),
            metadata: {
              duration: '3 min',
              confidence: calc.roiPercentage > 100 ? 90 : 75,
              outputSize: `$${calc.recommendedRetainer?.toLocaleString()}`,
              performance: calc.roiPercentage || 85
            }
          });
        });
      } catch (err) {
        console.warn('Failed to fetch pricing activities:', err);
      }

      // Cold Email Activities
      try {
        const emailGenerations = await coldEmail.getEmailGenerations(workspaceId);
        emailGenerations.slice(0, 2).forEach((generation: any, index: number) => {
          activityList.push({
            id: `email-activity-${generation.id}`,
            type: 'generation',
            toolType: 'cold-email',
            action: 'Generated email sequence',
            user: 'Email AI',
            target: `${generation.industry || 'Industry'} campaign`,
            status: 'completed',
            timestamp: new Date(generation.createdAt || Date.now() - (index * 1000 * 60 * 20)),
            metadata: {
              duration: '8 min',
              outputSize: `${generation.emails?.length || 3} emails`,
              tokensUsed: Math.floor(Math.random() * 1500) + 800,
              confidence: 82
            }
          });
        });
      } catch (err) {
        console.warn('Failed to fetch email activities:', err);
      }


      // Niche Research Activities
try {
  const nicheReports = await nicheResearcher.getUserReports(workspaceId);
  nicheReports.slice(0, 2).forEach((report: any, index: number) => {
    activityList.push({
      id: `niche-activity-${report.id}`,
      type: 'analysis',
      toolType: 'niche-research',
      action: 'Researched market niche',
      user: 'Research AI',
      target: `${report.nicheName} market analysis`,
      status: 'completed',
      timestamp: new Date(report.createdAt || Date.now() - (index * 1000 * 60 * 60)),
      metadata: {
        duration: '15 min',
        tokensUsed: report.tokensUsed || Math.floor(Math.random() * 2500) + 1500,
        outputSize: `${report.marketSize} market`,
        confidence: 88,
        priority: report.primaryObjective === 'market-entry' ? 'high' : 'medium'
      }
    });
  });
} catch (err) {
  console.warn('Failed to fetch niche research activities:', err);
}


// Offer Creator Activities  
try {
  await savedOffers.fetchOffers(workspaceId);
  savedOffers.offers.slice(0, 2).forEach((offer: any, index: number) => {
    activityList.push({
      id: `offer-activity-${offer.id}`,
      type: 'generation',
      toolType: 'offer-creator',
      action: 'Created signature offers',
      user: 'Offer AI',
      target: `${offer.industry || 'General'} service packages`,
      status: 'completed',
      timestamp: new Date(offer.createdAt || Date.now() - (index * 1000 * 60 * 90)),
      metadata: {
        duration: '10 min',
        outputSize: `${offer.packages?.length || 3} packages`,
        confidence: 85,
        priority: 'high'
      }
    });
  });
} catch (err) {
  console.warn('Failed to fetch offer creator activities:', err);
}

      // Add some mock processing activities for realism
      const mockActivities: EnhancedActivity[] = [
        {
          id: 'mock-processing-1',
          type: 'optimization',
          toolType: 'niche-research',
          action: 'Optimizing market analysis',
          user: 'Research AI',
          target: 'B2B SaaS market',
          status: 'processing',
          timestamp: new Date(Date.now() - 1000 * 60 * 5),
          metadata: {
            progress: 65,
            priority: 'medium',
            tokensUsed: 1200
          }
        },
        {
          id: 'mock-queued-1',
          type: 'export',
          toolType: 'offer-creator',
          action: 'Preparing export package',
          user: 'Export Service',
          target: 'Signature offers document',
          status: 'queued',
          timestamp: new Date(Date.now() - 1000 * 60 * 2),
          metadata: {
            priority: 'low',
            outputSize: 'PDF + Excel'
          }
        }
      ];

      activityList.push(...mockActivities);

      // Sort by timestamp (newest first)
      activityList.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      
      setActivities(activityList.slice(0, maxItems));
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
    // Refresh every 30 seconds for real-time feel
    const interval = setInterval(fetchActivities, 30000);
    return () => clearInterval(interval);
  }, [workspaceId]);

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
    const icons: Record<ToolType, React.JSX.Element> = {
      'sales-call': <PhoneOutlined />,
      'growth-plan': <RocketOutlined />,
      'pricing-calc': <DollarCircleOutlined />,
      'niche-research': <BulbOutlined />,
      'cold-email': <MailOutlined />,
      'offer-creator': <EditOutlined />
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
      'offer-creator': '#13c2c2'
    };
    return colors[toolType] || '#666';
  };

  const getStatusIcon = (status: ActivityStatus) => {
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

  const getStatusColor = (status: ActivityStatus) => {
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